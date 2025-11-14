/**
 * SchedulerService - Automated task scheduling service
 * Handles recurring tasks like payment reminders, invoice numbering, cleanup
 */

import logger from '@/utils/logger';
import InvoiceService from './InvoiceService';
import { AppDataSource } from '@/config/database';
import { Tenant } from '@/entities/Tenant';

interface ScheduledTask {
  name: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  handler: () => Promise<void>;
}

class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private running = false;

  /**
   * Initialize the scheduler with default tasks
   */
  async initialize(): Promise<void> {
    logger.info('Initializing SchedulerService...');

    // Register default tasks
    this.registerTask({
      name: 'send-overdue-reminders',
      schedule: '0 9 * * *', // Daily at 9 AM
      enabled: true,
      handler: this.sendOverdueReminders.bind(this),
    });

    this.registerTask({
      name: 'cleanup-old-drafts',
      schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
      enabled: true,
      handler: this.cleanupOldDrafts.bind(this),
    });

    this.registerTask({
      name: 'update-overdue-status',
      schedule: '0 * * * *', // Every hour
      enabled: true,
      handler: this.updateOverdueStatus.bind(this),
    });

    logger.info(`Registered ${this.tasks.size} scheduled tasks`);
  }

  /**
   * Register a new scheduled task
   */
  registerTask(task: ScheduledTask): void {
    this.tasks.set(task.name, task);
    logger.info(`Registered task: ${task.name}`, { schedule: task.schedule });
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.running = true;
    logger.info('Starting scheduler...');

    // Start all enabled tasks
    for (const [name, task] of this.tasks) {
      if (task.enabled) {
        this.startTask(name);
      }
    }

    logger.info('Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    logger.info('Stopping scheduler...');

    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.info(`Stopped task: ${name}`);
    }

    this.intervals.clear();
    logger.info('Scheduler stopped');
  }

  /**
   * Start a specific task
   */
  private startTask(name: string): void {
    const task = this.tasks.get(name);
    if (!task) {
      logger.warn(`Task not found: ${name}`);
      return;
    }

    // Parse cron schedule (simplified - for production use node-cron)
    const intervalMs = this.parseSchedule(task.schedule);

    const interval = setInterval(async () => {
      try {
        logger.info(`Running scheduled task: ${name}`);
        task.lastRun = new Date();
        await task.handler();
        task.nextRun = new Date(Date.now() + intervalMs);
        logger.info(`Task completed: ${name}`, { nextRun: task.nextRun });
      } catch (error: any) {
        logger.error(`Task failed: ${name}`, { error: error.message });
      }
    }, intervalMs);

    this.intervals.set(name, interval);

    // Run immediately on start
    task.handler().catch((error: any) => {
      logger.error(`Initial task run failed: ${name}`, { error: error.message });
    });

    logger.info(`Started task: ${name}`, { intervalMs });
  }

  /**
   * Parse cron schedule to milliseconds (simplified version)
   * For production, use node-cron or node-schedule library
   */
  private parseSchedule(schedule: string): number {
    // Simple mapping for common schedules
    const schedules: Record<string, number> = {
      '0 * * * *': 60 * 60 * 1000, // Every hour
      '0 9 * * *': 24 * 60 * 60 * 1000, // Daily at 9 AM
      '0 2 * * 0': 7 * 24 * 60 * 60 * 1000, // Weekly on Sunday
      '*/15 * * * *': 15 * 60 * 1000, // Every 15 minutes
      '*/5 * * * *': 5 * 60 * 1000, // Every 5 minutes
    };

    return schedules[schedule] || 60 * 60 * 1000; // Default to 1 hour
  }

  /**
   * Task: Send overdue payment reminders
   */
  private async sendOverdueReminders(): Promise<void> {
    try {
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find({ where: { isActive: true } });

      let totalSent = 0;

      for (const tenant of tenants) {
        try {
          const sentCount = await InvoiceService.sendOverdueReminders(tenant.id);
          totalSent += sentCount;
          logger.info(`Sent overdue reminders for tenant ${tenant.id}`, { sentCount });
        } catch (error: any) {
          logger.error(`Error sending reminders for tenant ${tenant.id}`, { error: error.message });
        }
      }

      logger.info(`Overdue reminders task completed`, { totalSent, tenantCount: tenants.length });
    } catch (error: any) {
      logger.error('Error in sendOverdueReminders task', { error: error.message });
      throw error;
    }
  }

  /**
   * Task: Cleanup old draft invoices (older than 30 days)
   */
  private async cleanupOldDrafts(): Promise<void> {
    try {
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find({ where: { isActive: true } });

      let totalDeleted = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const tenant of tenants) {
        try {
          // Delete old draft invoices
          const invoiceRepository = AppDataSource.getRepository('Invoice');
          const result = await invoiceRepository
            .createQueryBuilder()
            .delete()
            .where('tenantId = :tenantId', { tenantId: tenant.id })
            .andWhere('status = :status', { status: 'DRAFT' })
            .andWhere('createdAt < :date', { date: thirtyDaysAgo })
            .execute();

          totalDeleted += result.affected || 0;
          logger.info(`Cleaned up old drafts for tenant ${tenant.id}`, { deleted: result.affected });
        } catch (error: any) {
          logger.error(`Error cleaning drafts for tenant ${tenant.id}`, { error: error.message });
        }
      }

      logger.info(`Draft cleanup task completed`, { totalDeleted, tenantCount: tenants.length });
    } catch (error: any) {
      logger.error('Error in cleanupOldDrafts task', { error: error.message });
      throw error;
    }
  }

  /**
   * Task: Update invoice status to OVERDUE
   */
  private async updateOverdueStatus(): Promise<void> {
    try {
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenants = await tenantRepository.find({ where: { isActive: true } });

      let totalUpdated = 0;
      const now = new Date();

      for (const tenant of tenants) {
        try {
          const invoiceRepository = AppDataSource.getRepository('Invoice');
          const result = await invoiceRepository
            .createQueryBuilder()
            .update()
            .set({ status: 'OVERDUE' })
            .where('tenantId = :tenantId', { tenantId: tenant.id })
            .andWhere('status IN (:...statuses)', { statuses: ['SENT', 'VIEWED'] })
            .andWhere('dueDate < :now', { now })
            .execute();

          totalUpdated += result.affected || 0;
          logger.info(`Updated overdue invoices for tenant ${tenant.id}`, { updated: result.affected });
        } catch (error: any) {
          logger.error(`Error updating overdue status for tenant ${tenant.id}`, { error: error.message });
        }
      }

      logger.info(`Overdue status update completed`, { totalUpdated, tenantCount: tenants.length });
    } catch (error: any) {
      logger.error('Error in updateOverdueStatus task', { error: error.message });
      throw error;
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(name: string): ScheduledTask | undefined {
    return this.tasks.get(name);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Enable/disable a task
   */
  async toggleTask(name: string, enabled: boolean): Promise<void> {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task not found: ${name}`);
    }

    task.enabled = enabled;

    if (enabled && this.running) {
      this.startTask(name);
    } else if (!enabled) {
      const interval = this.intervals.get(name);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(name);
        logger.info(`Disabled task: ${name}`);
      }
    }
  }

  /**
   * Manually run a task
   */
  async runTask(name: string): Promise<void> {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task not found: ${name}`);
    }

    logger.info(`Manually running task: ${name}`);
    await task.handler();
    logger.info(`Manual task completed: ${name}`);
  }
}

// Export singleton instance
export default new SchedulerService();
