import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { KSeFService } from '../services/KSeFService';
import { KSeFStatus } from '../entities/KSeFIntegration';
import logger from '../utils/logger';

const router: Router = Router();
const ksefService = new KSeFService();

router.use(authMiddleware);
router.use(requireTenant);

// Create KSeF configuration
router.post('/:tenantId/ksef/config', [
  param('tenantId').isUUID(),
  body('nip').trim().notEmpty(),
  body('token').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', statusCode: 400, message: 'Validation failed', error: errors.array() });
      return;
    }

    const { tenantId } = req.params;
    const config = await ksefService.createConfiguration({ ...req.body, tenantId });
    res.status(201).json({ status: 'success', statusCode: 201, message: 'KSeF configuration created', data: config });
  } catch (error) {
    logger.error('Create KSeF config error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get KSeF configuration
router.get('/:tenantId/ksef/config', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const config = await ksefService.getConfiguration(tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: config });
  } catch (error) {
    logger.error('Get KSeF config error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', statusCode, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Update KSeF configuration
router.put('/:tenantId/ksef/config', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const config = await ksefService.updateConfiguration(tenantId, req.body);
    res.status(200).json({ status: 'success', statusCode: 200, message: 'KSeF configuration updated', data: config });
  } catch (error) {
    logger.error('Update KSeF config error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Delete KSeF configuration
router.delete('/:tenantId/ksef/config', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    await ksefService.deleteConfiguration(tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, message: 'KSeF configuration deleted' });
  } catch (error) {
    logger.error('Delete KSeF config error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Submit invoice to KSeF
router.post('/:tenantId/ksef/submit/:invoiceId', [
  param('tenantId').isUUID(),
  param('invoiceId').isUUID(),
], async (req: Request, res: Response) => {
  try {
    const { tenantId, invoiceId } = req.params;
    const submission = await ksefService.submitInvoice(invoiceId, tenantId);
    res.status(201).json({ status: 'success', statusCode: 201, message: 'Invoice submitted to KSeF', data: submission });
  } catch (error) {
    logger.error('Submit to KSeF error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get submission status
router.get('/:tenantId/ksef/submissions/:submissionId', [
  param('tenantId').isUUID(),
  param('submissionId').isUUID(),
], async (req: Request, res: Response) => {
  try {
    const { tenantId, submissionId } = req.params;
    const submission = await ksefService.getSubmission(submissionId, tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: submission });
  } catch (error) {
    logger.error('Get submission error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', statusCode, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get all submissions
router.get('/:tenantId/ksef/submissions', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const filters: any = { page, limit };
    if (req.query.status) filters.status = req.query.status as KSeFStatus;

    const { submissions, total } = await ksefService.getSubmissions(tenantId, filters);
    res.status(200).json({ status: 'success', statusCode: 200, data: submissions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Get submissions error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get KSeF stats
router.get('/:tenantId/ksef/stats', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const stats = await ksefService.getStats(tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: stats });
  } catch (error) {
    logger.error('Get KSeF stats error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
