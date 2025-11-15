/**
 * NotificationService - In-app notification management
 * Handles user notifications, preferences, and delivery tracking
 */


import logger from '@/utils/logger';
import EmailService from './EmailService';
import SMSService from './SMSService';

export enum NotificationType {
  INVOICE_CREATED = 'invoice_created',
  INVOICE_SENT = 'invoice_sent',
  INVOICE_VIEWED = 'invoice_viewed',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_OVERDUE = 'invoice_overdue',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM_ALERT = 'system_alert',
  ACCOUNT_ACTIVITY = 'account_activity',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationType]?: NotificationChannel[];
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  enabled: boolean;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  read: boolean;
  readAt?: Date;
  deliveredChannels: NotificationChannel[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  expiresAt?: Date;
}

export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();

  /**
   * Create and send a notification
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    try {
      const notificationId = this.generateId();

      // Get user preferences
      const prefs = await this.getUserPreferences(input.userId);
      const channels = input.channels || this.getChannelsForType(input.type, prefs);

      const notification: Notification = {
        id: notificationId,
        tenantId: input.tenantId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        priority: input.priority || NotificationPriority.NORMAL,
        channels,
        read: false,
        deliveredChannels: [],
        createdAt: new Date(),
        expiresAt: input.expiresAt,
      };

      // Store in-app notification
      this.notifications.set(notificationId, notification);

      // Deliver through requested channels
      await this.deliverNotification(notification, prefs);

      logger.info('Notification created', {
        id: notificationId,
        type: input.type,
        userId: input.userId,
        channels,
      });

      return notification;
    } catch (error: any) {
      logger.error('Failed to create notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Deliver notification through configured channels
   */
  private async deliverNotification(
    notification: Notification,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      logger.info('Skipping notification delivery due to quiet hours', {
        id: notification.id,
        userId: notification.userId,
      });
      return;
    }

    const deliveryPromises: Promise<void>[] = [];

    for (const channel of notification.channels) {
      switch (channel) {
        case NotificationChannel.IN_APP:
          // Already stored in memory
          notification.deliveredChannels.push(channel);
          break;

        case NotificationChannel.EMAIL:
          deliveryPromises.push(this.deliverViaEmail(notification));
          break;

        case NotificationChannel.SMS:
          deliveryPromises.push(this.deliverViaSMS(notification));
          break;

        case NotificationChannel.PUSH:
          deliveryPromises.push(this.deliverViaPush(notification));
          break;
      }
    }

    // Wait for all deliveries (don't fail if one channel fails)
    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver notification via email
   */
  private async deliverViaEmail(notification: Notification): Promise<void> {
    try {
      // Get user email from database
      const user = await this.getUserById(notification.userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Send email notification
      await EmailService.sendEmail({
        to: user.email,
        subject: notification.title,
        html: this.formatEmailBody(notification),
        text: notification.message,
        priority: notification.priority === NotificationPriority.URGENT ? 'high' : 'normal',
      });

      notification.deliveredChannels.push(NotificationChannel.EMAIL);
      logger.info('Notification delivered via email', { id: notification.id });
    } catch (error: any) {
      logger.error('Failed to deliver notification via email', {
        id: notification.id,
        error: error.message,
      });
    }
  }

  /**
   * Deliver notification via SMS
   */
  private async deliverViaSMS(notification: Notification): Promise<void> {
    try {
      const user = await this.getUserById(notification.userId);
      if (!user || !user.phone) {
        throw new Error('User phone not found');
      }

      // Send SMS (truncate message to 160 chars)
      const message = notification.message.length > 160 
        ? notification.message.substring(0, 157) + '...'
        : notification.message;

      await SMSService.sendSMS({
        to: user.phone,
        message,
        priority: notification.priority === NotificationPriority.URGENT ? 'high' : 'normal',
      });

      notification.deliveredChannels.push(NotificationChannel.SMS);
      logger.info('Notification delivered via SMS', { id: notification.id });
    } catch (error: any) {
      logger.error('Failed to deliver notification via SMS', {
        id: notification.id,
        error: error.message,
      });
    }
  }

  /**
   * Deliver notification via push (placeholder)
   */
  private async deliverViaPush(notification: Notification): Promise<void> {
    try {
      // TODO: Implement push notification delivery (Firebase, OneSignal, etc.)
      logger.info('Push notification delivery not implemented', { id: notification.id });
    } catch (error: any) {
      logger.error('Failed to deliver notification via push', {
        id: notification.id,
        error: error.message,
      });
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      type?: NotificationType;
      limit?: number;
    }
  ): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values()).filter(
      n => n.userId === userId
    );

    if (options?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (options?.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    notification.read = true;
    notification.readAt = new Date();

    logger.info('Notification marked as read', { id: notificationId, userId });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;

    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        count++;
      }
    }

    logger.info('All notifications marked as read', { userId, count });
    return count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    this.notifications.delete(notificationId);
    logger.info('Notification deleted', { id: notificationId, userId });
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let prefs = this.preferences.get(userId);

    if (!prefs) {
      // Create default preferences
      prefs = {
        userId,
        enabled: true,
        channels: {
          [NotificationType.INVOICE_SENT]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          [NotificationType.INVOICE_PAID]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          [NotificationType.INVOICE_OVERDUE]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
          [NotificationType.PAYMENT_REMINDER]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          [NotificationType.PAYMENT_RECEIVED]: [NotificationChannel.IN_APP],
          [NotificationType.SYSTEM_ALERT]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
      this.preferences.set(userId, prefs);
    }

    return prefs;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const prefs = await this.getUserPreferences(userId);
    const updated = { ...prefs, ...updates, userId };
    this.preferences.set(userId, updated);

    logger.info('Notification preferences updated', { userId });
    return updated;
  }

  /**
   * Get channels for notification type based on user preferences
   */
  private getChannelsForType(
    type: NotificationType,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    if (!preferences.enabled) {
      return [NotificationChannel.IN_APP]; // Always show in-app even if disabled
    }

    return preferences.channels[type] || [NotificationChannel.IN_APP];
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = preferences.quietHours;

    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime < end;
    }
  }

  /**
   * Format notification for email body
   */
  private formatEmailBody(notification: Notification): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        ${notification.data ? `<pre>${JSON.stringify(notification.data, null, 2)}</pre>` : ''}
        <p style="color: #666; font-size: 12px;">
          Sent: ${notification.createdAt.toLocaleString()}
        </p>
      </div>
    `;
  }

  /**
   * Get user by ID (mock - replace with actual user repository)
   */
  private async getUserById(_userId: string): Promise<{ email?: string; phone?: string } | null> {
    // TODO: Implement actual user lookup from database
    // const userRepository = AppDataSource.getRepository('User');
    // return await userRepository.findOne({ where: { id: userId } });
    return { email: 'user@example.com', phone: '+48123456789' };
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const now = new Date();
    let deleted = 0;

    for (const [id, notification] of this.notifications) {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info('Cleaned up expired notifications', { count: deleted });
    }

    return deleted;
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    const userNotifications = Array.from(this.notifications.values()).filter(
      n => n.userId === userId
    );

    const stats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    for (const notification of userNotifications) {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    }

    return stats;
  }
}

// Export singleton instance
export default new NotificationService();
