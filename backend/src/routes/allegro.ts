import { Router, Request, Response } from 'express';
import AllegroService from '@/services/AllegroService';
import logger from '@/utils/logger';

const router = Router();
const allegroService = new AllegroService();

/**
 * GET /allegro/auth/authorize
 * Initiate OAuth 2.0 authorization flow
 */
router.get('/auth/authorize', (req: Request, res: Response): void => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      res.status(400).json({ error: 'Missing tenantId parameter' });
      return;
    }

    const authUrl = allegroService.getAuthorizationUrl(tenantId as string);
    res.json({ authUrl });
  } catch (error) {
    logger.error(`[Allegro Routes] Authorization URL generation failed: ${error}`);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * POST /allegro/auth/callback
 * Handle OAuth 2.0 callback and exchange code for tokens
 */
router.post('/auth/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, userId, code } = req.body;

    if (!tenantId || !userId || !code) {
      res.status(400).json({ error: 'Missing required parameters: tenantId, userId, code' });
      return;
    }

    const integration = await allegroService.exchangeCodeForTokens(
      tenantId,
      userId,
      code as string
    );

    res.json({
      success: true,
      integration: {
        id: integration.id,
        allegroUserId: integration.allegroUserId,
        isActive: integration.isActive,
      },
    });
  } catch (error) {
    logger.error(`[Allegro Routes] Callback handling failed: ${error}`);
    res.status(500).json({ error: 'Failed to authenticate with Allegro' });
  }
});

/**
 * GET /allegro/status/:integrationId
 * Get integration status and sync history
 */
router.get('/status/:integrationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationId } = req.params;

    const status = await allegroService.getIntegrationStatus(integrationId);

    if (!status) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    res.json({
      id: status.id,
      allegroUserId: status.allegroUserId,
      isActive: status.isActive,
      lastSyncAt: status.lastSyncAt,
      syncErrorCount: status.syncErrorCount,
      lastSyncError: status.lastSyncError,
    });
  } catch (error) {
    logger.error(`[Allegro Routes] Status retrieval failed: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve integration status' });
  }
});

/**
 * POST /allegro/sync
 * Manually trigger order synchronization and invoice generation
 */
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationId, companyId, tenantId } = req.body;

    if (!integrationId || !companyId || !tenantId) {
      res
        .status(400)
        .json({ error: 'Missing required parameters: integrationId, companyId, tenantId' });
      return;
    }

    const result = await allegroService.syncOrdersWithRetry(
      integrationId,
      companyId,
      tenantId
    );

    res.json(result);
  } catch (error) {
    logger.error(`[Allegro Routes] Sync failed: ${error}`);
    res.status(500).json({ error: 'Failed to synchronize orders' });
  }
});

/**
 * POST /allegro/deactivate/:integrationId
 * Deactivate an integration
 */
router.post('/deactivate/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    await allegroService.deactivateIntegration(integrationId);

    res.json({ success: true, message: 'Integration deactivated' });
  } catch (error) {
    logger.error(`[Allegro Routes] Deactivation failed: ${error}`);
    res.status(500).json({ error: 'Failed to deactivate integration' });
  }
});

/**
 * POST /allegro/webhook
 * Handle webhooks from Allegro (order status changes, etc.)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { event, orderId, integrationId, companyId, tenantId } = req.body;

    logger.info(`[Allegro Routes] Webhook received: ${event} for order: ${orderId}`);

    // Validate webhook signature (if provided)
    // TODO: Implement webhook signature verification

    // Handle different event types
    switch (event) {
      case 'order.created':
      case 'order.updated':
        // Trigger sync for this order
        await allegroService.syncOrdersWithRetry(integrationId, companyId, tenantId);
        break;

      case 'order.cancelled':
        // Handle order cancellation
        logger.info(`[Allegro Routes] Order cancelled: ${orderId}`);
        break;

      default:
        logger.warn(`[Allegro Routes] Unknown event type: ${event}`);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error(`[Allegro Routes] Webhook handling failed: ${error}`);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

/**
 * GET /allegro/settings/:integrationId
 * Get integration settings
 */
router.get('/settings/:integrationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationId } = req.params;

    const settings = await allegroService.getSettingsWithDefaults(integrationId);

    res.json({ settings });
  } catch (error) {
    logger.error(`[Allegro Routes] Settings retrieval failed: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * PUT /allegro/settings/:integrationId
 * Update integration settings
 */
router.put('/settings/:integrationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationId } = req.params;
    const { settings } = req.body;

    if (!settings) {
      res.status(400).json({ error: 'Missing settings in request body' });
      return;
    }

    const updatedSettings = await allegroService.updateSettings(integrationId, settings);

    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    logger.error(`[Allegro Routes] Settings update failed: ${error}`);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
