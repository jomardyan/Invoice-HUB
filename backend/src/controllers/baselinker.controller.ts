import { Request, Response } from 'express';
import BaseLinkerService from '../services/BaseLinkerService';
import logger from '../utils/logger';

const baselinkerService = new BaseLinkerService();

export class BaseLinkerController {
    static async connect(req: Request, res: Response): Promise<void> {
        const { tenantId, userId, apiToken } = req.body;

        if (!tenantId || !userId || !apiToken) {
            res.status(400).json({ error: 'Missing required parameters: tenantId, userId, apiToken' });
        }

        const integration = await baselinkerService.createIntegration(tenantId, userId, apiToken);

        res.json({
            success: true,
            integration: {
                id: integration.id,
                isActive: integration.isActive,
            },
        });
    }

    static async getStatus(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;

        const status = await baselinkerService.getIntegrationStatus(integrationId);

        if (!status) {
            res.status(404).json({ error: 'Integration not found' });
        }

        res.json({
            id: status.id,
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
        }

        const result = await baselinkerService.syncOrdersWithRetry(integrationId, companyId, tenantId);
        res.json(result);
    }

    static async deactivate(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;

        await baselinkerService.deactivateIntegration(integrationId);
        res.json({ success: true, message: 'Integration deactivated' });
    }

    static async getSettings(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;

        const integration = await baselinkerService.getIntegrationStatus(integrationId);

        if (!integration) {
            res.status(404).json({ error: 'Integration not found' });
        }

        const settings = baselinkerService.getSettingsWithDefaults(integration.settings || {});
        res.json({ settings });
    }

    static async getIntegrations(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId parameter' });
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
    }

    static async updateSettings(req: Request, res: Response): Promise<void> {
        const { integrationId } = req.params;
        const { settings } = req.body;

        if (!settings) {
            res.status(400).json({ error: 'Missing settings in request body' });
        }

        const updatedSettings = await baselinkerService.updateSettings(integrationId, settings);
        res.json({ success: true, settings: updatedSettings });
    }
}
