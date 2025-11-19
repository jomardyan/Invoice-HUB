import { Request, Response } from 'express';
import AllegroService from '../services/AllegroService';
import logger from '../utils/logger';

const allegroService = new AllegroService();

export class AllegroController {
    static async getAuthUrl(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.query;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId parameter' });
            return;
        }

        const authUrl = allegroService.getAuthorizationUrl(tenantId as string);
        res.json({ authUrl });
    }

    static async handleCallback(req: Request, res: Response): Promise<void> {
        const { tenantId, userId, code } = req.body;

        if (!tenantId || !userId || !code) {
            res.status(400).json({ error: 'Missing required parameters: tenantId, userId, code' });
            return;
        }

        const integration = await allegroService.exchangeCodeForTokens(tenantId, userId, code as string);

        res.json({
            success: true,
            integration: {
                id: integration.id,
                allegroUserId: integration.allegroUserId,
                isActive: integration.isActive,
            },
        });
    }

    static async getStatus(req: Request, res: Response): Promise<void> {
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
    }

    static async sync(req: Request, res: Response): Promise<void> {
        const { integrationId, companyId, tenantId } = req.body;

        if (!integrationId || !companyId || !tenantId) {
            res.status(400).json({ error: 'Missing required parameters: integrationId, companyId, tenantId' });
            return;
        }

        const result = await allegroService.syncOrdersWithRetry(integrationId, companyId, tenantId);
        res.json(result);
    }

    static async deactivate(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;

        await allegroService.deactivateIntegration(integrationId);
        res.json({ success: true, message: 'Integration deactivated' });
    }

    static async handleWebhook(req: Request, res: Response): Promise<void> {
        const { event, orderId, integrationId, companyId, tenantId } = req.body;

        logger.info(`[Allegro Routes] Webhook received: ${event} for order: ${orderId}`);

        switch (event) {
            case 'order.created':
            case 'order.updated':
                await allegroService.syncOrdersWithRetry(integrationId, companyId, tenantId);
                break;
            case 'order.cancelled':
                logger.info(`[Allegro Routes] Order cancelled: ${orderId}`);
                break;
            default:
                logger.warn(`[Allegro Routes] Unknown event type: ${event}`);
        }

        res.json({ success: true });
    }

    static async getSettings(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;

        const settings = await allegroService.getSettingsWithDefaults(integrationId);
        res.json({ settings });
    }

    static async getIntegrations(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId parameter' });
            return;
        }

        const integrations = await allegroService.getIntegrationsByTenant(tenantId);

        const formattedIntegrations = integrations.map((integration) => ({
            id: integration.id,
            allegroUserId: integration.allegroUserId,
            isActive: integration.isActive,
            lastSyncAt: integration.lastSyncAt,
            syncErrorCount: integration.syncErrorCount,
            lastSyncError: integration.lastSyncError,
        }));

        res.json(formattedIntegrations);
    }

    static async updateSettings(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;
        const { settings } = req.body;

        if (!settings) {
            res.status(400).json({ error: 'Missing settings in request body' });
            return;
        }

        const updatedSettings = await allegroService.updateSettings(integrationId, settings);
        res.json({ success: true, settings: updatedSettings });
    }
}
