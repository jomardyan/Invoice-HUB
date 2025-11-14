/**
 * Scheduler Routes
 * Admin endpoints for managing scheduled tasks
 */

import { Router, Request, Response } from 'express';
import { param, body } from 'express-validator';
import logger from '@/utils/logger';
import SchedulerService from '@/services/SchedulerService';

const router: Router = Router();

// GET: List all scheduled tasks
router.get('/:tenantId/scheduler/tasks', async (_req: Request, res: Response): Promise<void> => {
  try {
    const tasks = SchedulerService.getAllTasks();

    res.json({
      status: 'success',
      data: tasks.map((task) => ({
        name: task.name,
        schedule: task.schedule,
        enabled: task.enabled,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      })),
    });
  } catch (error: any) {
    logger.error('Error retrieving scheduled tasks:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// GET: Get specific task status
router.get(
  '/:tenantId/scheduler/tasks/:taskName',
  param('taskName').isString(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskName } = req.params;
      const task = SchedulerService.getTaskStatus(taskName);

      if (!task) {
        res.status(404).json({
          status: 'error',
          message: 'Task not found',
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          name: task.name,
          schedule: task.schedule,
          enabled: task.enabled,
          lastRun: task.lastRun,
          nextRun: task.nextRun,
        },
      });
    } catch (error: any) {
      logger.error('Error retrieving task status:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Toggle task enabled/disabled
router.post(
  '/:tenantId/scheduler/tasks/:taskName/toggle',
  param('taskName').isString(),
  body('enabled').isBoolean(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskName } = req.params;
      const { enabled } = req.body;

      await SchedulerService.toggleTask(taskName, enabled);

      res.json({
        status: 'success',
        message: `Task ${taskName} ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      logger.error('Error toggling task:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Manually run a task
router.post(
  '/:tenantId/scheduler/tasks/:taskName/run',
  param('taskName').isString(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskName } = req.params;

      await SchedulerService.runTask(taskName);

      res.json({
        status: 'success',
        message: `Task ${taskName} executed successfully`,
      });
    } catch (error: any) {
      logger.error('Error running task:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

export default router;
