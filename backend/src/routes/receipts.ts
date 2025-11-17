import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { ReceiptService } from '../services/ReceiptService';
import { ReceiptType, ReceiptStatus } from '../entities/Receipt';
import logger from '../utils/logger';

const router: Router = Router();
const receiptService = new ReceiptService();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create receipt
router.post(
  '/:tenantId/receipts',
  [
    param('tenantId').isUUID(),
    body('receiptType')
      .isIn(Object.values(ReceiptType))
      .withMessage('Valid receipt type is required'),
    body('issueDate').isISO8601().withMessage('Valid issue date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.name').trim().notEmpty(),
    body('items.*.quantity').isFloat({ min: 0.01 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    body('items.*.vatRate').isFloat({ min: 0, max: 100 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Validation failed',
          error: errors.array(),
        });
        return;
      }

      const { tenantId } = req.params;
      const receipt = await receiptService.createReceipt({
        ...req.body,
        tenantId,
      });

      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Receipt created successfully',
        data: receipt,
      });
    } catch (error) {
      logger.error('Create receipt error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create receipt';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get receipts
router.get(
  '/:tenantId/receipts',
  [param('tenantId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filters: any = { page, limit };
      if (req.query.status) filters.status = req.query.status as ReceiptStatus;
      if (req.query.receiptType)
        filters.receiptType = req.query.receiptType as ReceiptType;
      if (req.query.startDate)
        filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate)
        filters.endDate = new Date(req.query.endDate as string);

      const { receipts, total } = await receiptService.getReceipts(
        tenantId,
        filters
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: receipts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Get receipts error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch receipts';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get receipt by ID
router.get(
  '/:tenantId/receipts/:receiptId',
  [param('tenantId').isUUID(), param('receiptId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, receiptId } = req.params;
      const receipt = await receiptService.getReceipt(receiptId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: receipt,
      });
    } catch (error) {
      logger.error('Get receipt error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch receipt';
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;

      res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: errorMessage,
      });
    }
  }
);

// Update receipt
router.put(
  '/:tenantId/receipts/:receiptId',
  [param('tenantId').isUUID(), param('receiptId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, receiptId } = req.params;
      const receipt = await receiptService.updateReceipt(
        receiptId,
        tenantId,
        req.body
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Receipt updated successfully',
        data: receipt,
      });
    } catch (error) {
      logger.error('Update receipt error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update receipt';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Issue receipt
router.post(
  '/:tenantId/receipts/:receiptId/issue',
  [param('tenantId').isUUID(), param('receiptId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, receiptId } = req.params;
      const receipt = await receiptService.issueReceipt(receiptId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Receipt issued successfully',
        data: receipt,
      });
    } catch (error) {
      logger.error('Issue receipt error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to issue receipt';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Cancel receipt
router.post(
  '/:tenantId/receipts/:receiptId/cancel',
  [param('tenantId').isUUID(), param('receiptId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, receiptId } = req.params;
      const receipt = await receiptService.cancelReceipt(receiptId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Receipt cancelled successfully',
        data: receipt,
      });
    } catch (error) {
      logger.error('Cancel receipt error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel receipt';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Delete receipt
router.delete(
  '/:tenantId/receipts/:receiptId',
  [param('tenantId').isUUID(), param('receiptId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, receiptId } = req.params;
      await receiptService.deleteReceipt(receiptId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Receipt deleted successfully',
      });
    } catch (error) {
      logger.error('Delete receipt error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete receipt';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get receipt stats
router.get(
  '/:tenantId/receipts-stats',
  [param('tenantId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const stats = await receiptService.getReceiptStats(
        tenantId,
        startDate,
        endDate
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: stats,
      });
    } catch (error) {
      logger.error('Get receipt stats error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch receipt stats';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

export default router;
