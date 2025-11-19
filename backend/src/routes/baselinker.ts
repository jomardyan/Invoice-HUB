import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { BaseLinkerController } from '@/controllers/baselinker.controller';
import {
  connectValidation,
  getStatusValidation,
  syncValidation,
  deactivateValidation,
  getSettingsValidation,
  getIntegrationsValidation,
  updateSettingsValidation,
} from '@/validators/baselinker.validation';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create integration with API token
router.post('/connect', connectValidation, asyncHandler(BaseLinkerController.connect));

// Get integration status
router.get('/status/:integrationId', getStatusValidation, asyncHandler(BaseLinkerController.getStatus));

// Manually trigger order synchronization
router.post('/sync', syncValidation, asyncHandler(BaseLinkerController.sync));

// Deactivate integration
router.post('/deactivate/:integrationId', deactivateValidation, asyncHandler(BaseLinkerController.deactivate));

// Get integration settings
router.get('/settings/:integrationId', getSettingsValidation, asyncHandler(BaseLinkerController.getSettings));

// Get all integrations for tenant
router.get('/integrations/:tenantId', getIntegrationsValidation, asyncHandler(BaseLinkerController.getIntegrations));

// Update integration settings
router.put('/settings/:integrationId', updateSettingsValidation, asyncHandler(BaseLinkerController.updateSettings));

export default router;
