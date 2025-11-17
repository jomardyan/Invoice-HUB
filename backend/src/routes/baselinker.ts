import { Router, Request, Response } from 'express';
import BaseLinkerService from '@/services/BaseLinkerService';
import { authMiddleware } from '@/middleware/auth';
import logger from '@/utils/logger';

const router = Router();
const baselinkerService = new BaseLinkerService();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /baselinker/connect
 * Create a new BaseLinker integration with API token
 */
router.post('/connect', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, userId, apiToken } = req.body;

    if (!tenantId || !userId || !apiToken) {
      res.status(400).json({ error: 'Missing required parameters: tenantId, userId, apiToken' });
      return;
    }

    const integration = await baselinkerService.createIntegration(
      tenantId,
      userId,
      apiToken
    );

    res.json({
      success: true,
      integration: {
        id: integration.id,
        isActive: integration.isActive,
      },
    });
  } catch (error) {
    logger.error(`[BaseLinker Routes] Connection failed: ${error}`);
    res.status(500).json({ error: 'Failed to connect to BaseLinker' });
  }
});

/**
 * GET /baselinker/status/:integrationId
 * Get integration status and sync history
 */
router.get('/status/:integrationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationId } = req.params;

    const status = await baselinkerService.getIntegrationStatus(integrationId);

    if (!status) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    res.json({
      id: status.id,
      isActive: status.isActive,
      lastSyncAt: status.lastSyncAt,
      syncErrorCount: status.syncErrorCount,
      lastSyncError: status.lastSyncError,
    });
  } catch (error) {
    logger.error(`[BaseLinker Routes] Status retrieval failed: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve integration status' });
  }
});

/**
 * POST /baselinker/sync
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

    const result = await baselinkerService.syncOrdersWithRetry(
      integrationId,
      companyId,
      tenantId
    );

    res.json(result);
  } catch (error) {
    logger.error(`[BaseLinker Routes] Sync failed: ${error}`);
    res.status(500).json({ error: 'Failed to synchronize orders' });
  }
});

/**
 * POST /baselinker/deactivate/:integrationId
 * Deactivate an integration
 */
router.post('/deactivate/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    await baselinkerService.deactivateIntegration(integrationId);

    res.json({ success: true, message: 'Integration deactivated' });
  } catch (error) {
    logger.error(`[BaseLinker Routes] Deactivation failed: ${error}`);
    res.status(500).json({ error: 'Failed to deactivate integration' });
  }
});

/**
 * GET /baselinker/settings/:integrationId
 * Get integration settings
 */
router.get('/settings/:integrationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationId } = req.params;

    const integration = await baselinkerService.getIntegrationStatus(integrationId);

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    const settings = baselinkerService.getSettingsWithDefaults(integration.settings || {});

    res.json({ settings });
  } catch (error) {
    logger.error(`[BaseLinker Routes] Settings retrieval failed: ${error}`);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * GET /baselinker/integrations/:tenantId
 * Get all integrations for a tenant
 */
router.get('/integrations/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      res.status(400).json({ error: 'Missing tenantId parameter' });
      return;
    }

    const integrations = await baselinkerService.getIntegrationsByTenant(tenantId);

    const formattedIntegrations = integrations.map((integration) => ({
      id: integration.id,
      isActive: integration.isActive,
      lastSyncAt: integration.lastSyncAt,
      syncErrorCount: integration.syncErrorCount,
      lastSyncError: integration.lastSyncError,
    }));

    res.json(formattedIntegrations);
  } catch (error) {
    logger.error(`[BaseLinker Routes] Failed to fetch integrations: ${error}`);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

/**
 * PUT /baselinker/settings/:integrationId
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

    const updatedSettings = await baselinkerService.updateSettings(integrationId, settings);

    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    logger.error(`[BaseLinker Routes] Settings update failed: ${error}`);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
