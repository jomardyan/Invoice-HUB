/**
 * Webhook Routes - Webhook registration and management endpoints
 */

import { Router } from 'express';
import { param, body, query } from 'express-validator';
import WebhookService from '@/services/WebhookService';
import { WebhookEvent, WebhookStatus } from '@/entities/Webhook';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /webhooks/:tenantId
 * Create a new webhook
 */
router.post(
  '/:tenantId',
  param('tenantId').isUUID(),
  body('url').isURL({ require_protocol: true, protocols: ['http', 'https'] }),
  body('events').isArray({ min: 1 }),
  body('events.*').isIn(Object.values(WebhookEvent)),
  body('description').optional().isString(),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { url, events, description } = req.body;

      const webhook = await WebhookService.createWebhook(tenantId, {
        url,
        events,
        description,
      });

      res.status(201).json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /webhooks/:tenantId
 * Get all webhooks for a tenant
 */
router.get(
  '/:tenantId',
  param('tenantId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const webhooks = await WebhookService.getWebhooks(tenantId);
      res.json(webhooks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /webhooks/:tenantId/:webhookId
 * Get webhook by ID
 */
router.get(
  '/:tenantId/:webhookId',
  param('tenantId').isUUID(),
  param('webhookId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, webhookId } = req.params;
      const webhook = await WebhookService.getWebhookById(tenantId, webhookId);
      res.json(webhook);
    } catch (error: any) {
      const status = error.message === 'Webhook not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * PATCH /webhooks/:tenantId/:webhookId
 * Update webhook
 */
router.patch(
  '/:tenantId/:webhookId',
  param('tenantId').isUUID(),
  param('webhookId').isUUID(),
  body('url').optional().isURL({ require_protocol: true, protocols: ['http', 'https'] }),
  body('events').optional().isArray({ min: 1 }),
  body('events.*').optional().isIn(Object.values(WebhookEvent)),
  body('description').optional().isString(),
  body('status').optional().isIn(Object.values(WebhookStatus)),
  async (req: any, res: any) => {
    try {
      const { tenantId, webhookId } = req.params;
      const updates = req.body;

      const webhook = await WebhookService.updateWebhook(tenantId, webhookId, updates);
      res.json(webhook);
    } catch (error: any) {
      const status = error.message === 'Webhook not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * DELETE /webhooks/:tenantId/:webhookId
 * Delete webhook
 */
router.delete(
  '/:tenantId/:webhookId',
  param('tenantId').isUUID(),
  param('webhookId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, webhookId } = req.params;
      await WebhookService.deleteWebhook(tenantId, webhookId);
      res.status(204).send();
    } catch (error: any) {
      const status = error.message === 'Webhook not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * POST /webhooks/:tenantId/:webhookId/regenerate-secret
 * Regenerate webhook secret
 */
router.post(
  '/:tenantId/:webhookId/regenerate-secret',
  param('tenantId').isUUID(),
  param('webhookId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, webhookId } = req.params;
      const webhook = await WebhookService.regenerateSecret(tenantId, webhookId);
      res.json(webhook);
    } catch (error: any) {
      const status = error.message === 'Webhook not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * GET /webhooks/:tenantId/:webhookId/deliveries
 * Get delivery history for a webhook
 */
router.get(
  '/:tenantId/:webhookId/deliveries',
  param('tenantId').isUUID(),
  param('webhookId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req: any, res: any) => {
    try {
      const { tenantId, webhookId } = req.params;
      const { limit } = req.query;

      const deliveries = await WebhookService.getDeliveryHistory(
        tenantId,
        webhookId,
        limit ? parseInt(limit) : 50
      );

      res.json(deliveries);
    } catch (error: any) {
      const status = error.message === 'Webhook not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * POST /webhooks/:tenantId/test
 * Test webhook delivery (for testing purposes)
 */
router.post(
  '/:tenantId/test',
  param('tenantId').isUUID(),
  body('event').isIn(Object.values(WebhookEvent)),
  body('data').isObject(),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { event, data } = req.body;

      await WebhookService.triggerEvent(tenantId, event, data);
      res.json({ message: 'Webhook event triggered successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
