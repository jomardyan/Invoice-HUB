/**
 * Notification Routes
 * Endpoints for managing user notifications and preferences
 */

import { Router, Request, Response } from 'express';
import { param, body, query } from 'express-validator';
import logger from '@/utils/logger';
import NotificationService, { NotificationType } from '@/services/NotificationService';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);
router.use(requireTenant);

// GET: Get user notifications
router.get(
  '/:tenantId/notifications',
  query('unreadOnly').optional().isBoolean().toBoolean(),
  query('type').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { unreadOnly, type, limit } = req.query;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const notifications = await NotificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        type: type as NotificationType,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        status: 'success',
        data: notifications,
      });
    } catch (error: any) {
      logger.error('Error retrieving notifications:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// GET: Get notification statistics
router.get(
  '/:tenantId/notifications/stats',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const stats = await NotificationService.getStatistics(userId);

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error retrieving notification statistics:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// PUT: Mark notification as read
router.put(
  '/:tenantId/notifications/:notificationId/read',
  param('notificationId').isString(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      await NotificationService.markAsRead(notificationId, userId);

      res.json({
        status: 'success',
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// PUT: Mark all notifications as read
router.put(
  '/:tenantId/notifications/mark-all-read',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const count = await NotificationService.markAllAsRead(userId);

      res.json({
        status: 'success',
        message: `Marked ${count} notifications as read`,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// DELETE: Delete notification
router.delete(
  '/:tenantId/notifications/:notificationId',
  param('notificationId').isString(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      await NotificationService.deleteNotification(notificationId, userId);

      res.json({
        status: 'success',
        message: 'Notification deleted',
      });
    } catch (error: any) {
      logger.error('Error deleting notification:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// GET: Get notification preferences
router.get(
  '/:tenantId/notifications/preferences',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const preferences = await NotificationService.getUserPreferences(userId);

      res.json({
        status: 'success',
        data: preferences,
      });
    } catch (error: any) {
      logger.error('Error retrieving notification preferences:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// PUT: Update notification preferences
router.put(
  '/:tenantId/notifications/preferences',
  body('enabled').optional().isBoolean(),
  body('channels').optional().isObject(),
  body('quietHours').optional().isObject(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;
      const updates = req.body;

      const preferences = await NotificationService.updateUserPreferences(userId, updates);

      res.json({
        status: 'success',
        data: preferences,
      });
    } catch (error: any) {
      logger.error('Error updating notification preferences:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

export default router;
