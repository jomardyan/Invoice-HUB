import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { AllegroController } from '@/controllers/allegro.controller';
import {
  authorizeValidation,
  callbackValidation,
  getStatusValidation,
  syncValidation,
  deactivateValidation,
  getSettingsValidation,
  getIntegrationsValidation,
  updateSettingsValidation,
} from '@/validators/allegro.validation';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Initiate OAuth 2.0 authorization flow
router.get('/auth/authorize', authorizeValidation, asyncHandler(AllegroController.getAuthUrl));

// Handle OAuth 2.0 callback
router.post('/auth/callback', callbackValidation, asyncHandler(AllegroController.handleCallback));

// Get integration status
router.get('/status/:integrationId', getStatusValidation, asyncHandler(AllegroController.getStatus));

// Manually trigger order synchronization
router.post('/sync', syncValidation, asyncHandler(AllegroController.sync));

// Deactivate integration
router.post('/deactivate/:integrationId', deactivateValidation, asyncHandler(AllegroController.deactivate));

// Handle webhooks
router.post('/webhook', asyncHandler(AllegroController.handleWebhook));

// Get integration settings
router.get('/settings/:integrationId', getSettingsValidation, asyncHandler(AllegroController.getSettings));

// Get all integrations for tenant
router.get('/integrations/:tenantId', getIntegrationsValidation, asyncHandler(AllegroController.getIntegrations));

// Update integration settings
router.put('/settings/:integrationId', updateSettingsValidation, asyncHandler(AllegroController.updateSettings));

export default router;
