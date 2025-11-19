import { Router } from 'express';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { KSeFController } from '../controllers/ksef.controller';
import {
  createConfigValidation,
  getConfigValidation,
  updateConfigValidation,
  deleteConfigValidation,
  submitInvoiceValidation,
  getSubmissionValidation,
  listSubmissionsValidation,
  getStatsValidation,
  listSessionsValidation,
  terminateCurrentSessionValidation,
  terminateSessionValidation,
  createInteractiveSessionValidation,
  getSessionStatusValidation,
  getSessionUPOValidation,
  createBatchSessionValidation,
  closeBatchSessionValidation,
  uploadBatchInvoiceValidation,
  queryInvoiceMetadataValidation,
  getInvoiceByKsefNumberValidation,
  createExportValidation,
  getExportStatusValidation,
} from '../validators/ksef.validation';

const router: Router = Router();

router.use(authMiddleware);
router.use(requireTenant);

// Configuration Management
router.post('/:tenantId/ksef/config', createConfigValidation, asyncHandler(KSeFController.createConfig));
router.get('/:tenantId/ksef/config', getConfigValidation, asyncHandler(KSeFController.getConfig));
router.put('/:tenantId/ksef/config', updateConfigValidation, asyncHandler(KSeFController.updateConfig));
router.delete('/:tenantId/ksef/config', deleteConfigValidation, asyncHandler(KSeFController.deleteConfig));

// Basic Invoice Submission
router.post('/:tenantId/ksef/submit/:invoiceId', submitInvoiceValidation, asyncHandler(KSeFController.submitInvoice));
router.get('/:tenantId/ksef/submissions/:submissionId', getSubmissionValidation, asyncHandler(KSeFController.getSubmission));
router.get('/:tenantId/ksef/submissions', listSubmissionsValidation, asyncHandler(KSeFController.listSubmissions));
router.get('/:tenantId/ksef/stats', getStatsValidation, asyncHandler(KSeFController.getStats));

// Phase 1: Session Management
router.get('/:tenantId/ksef/sessions', listSessionsValidation, asyncHandler(KSeFController.listSessions));
router.delete('/:tenantId/ksef/sessions/current', terminateCurrentSessionValidation, asyncHandler(KSeFController.terminateCurrentSession));
router.delete('/:tenantId/ksef/sessions/:sessionReference', terminateSessionValidation, asyncHandler(KSeFController.terminateSession));

// Phase 1: Interactive Session (Online)
router.post('/:tenantId/ksef/sessions/interactive', createInteractiveSessionValidation, asyncHandler(KSeFController.createInteractiveSession));
router.get('/:tenantId/ksef/sessions/:sessionReference/status', getSessionStatusValidation, asyncHandler(KSeFController.getSessionStatus));
router.get('/:tenantId/ksef/sessions/:sessionReference/upo', getSessionUPOValidation, asyncHandler(KSeFController.getSessionUPO));

// Phase 1: Batch Session
router.post('/:tenantId/ksef/sessions/batch', createBatchSessionValidation, asyncHandler(KSeFController.createBatchSession));
router.post('/:tenantId/ksef/sessions/batch/:sessionReference/close', closeBatchSessionValidation, asyncHandler(KSeFController.closeBatchSession));
router.post('/:tenantId/ksef/sessions/batch/:sessionReference/invoices', uploadBatchInvoiceValidation, asyncHandler(KSeFController.uploadBatchInvoice));

// Phase 1: Invoice Query & Retrieval
router.post('/:tenantId/ksef/invoices/query', queryInvoiceMetadataValidation, asyncHandler(KSeFController.queryInvoiceMetadata));
router.get('/:tenantId/ksef/invoices/:ksefNumber', getInvoiceByKsefNumberValidation, asyncHandler(KSeFController.getInvoiceByKsefNumber));

// Phase 1: Invoice Export
router.post('/:tenantId/ksef/exports', createExportValidation, asyncHandler(KSeFController.createExport));
router.get('/:tenantId/ksef/exports/:exportReference', getExportStatusValidation, asyncHandler(KSeFController.getExportStatus));

export default router;
