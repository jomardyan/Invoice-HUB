import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { ExpenseService } from '../services/ExpenseService';
import { ExpenseCategory, ExpenseStatus } from '../entities/Expense';
import logger from '../utils/logger';

const router: Router = Router();
const expenseService = new ExpenseService();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create expense
router.post(
  '/:tenantId/expenses',
  [
    param('tenantId').isUUID(),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(Object.values(ExpenseCategory))
      .withMessage('Valid category is required'),
    body('expenseDate')
      .isISO8601()
      .withMessage('Valid expense date is required'),
    body('netAmount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
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
      const expense = await expenseService.createExpense({
        ...req.body,
        tenantId,
      });

      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Expense created successfully',
        data: expense,
      });
    } catch (error) {
      logger.error('Create expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create expense';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get expenses
router.get(
  '/:tenantId/expenses',
  [param('tenantId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filters: any = { page, limit };
      if (req.query.status) filters.status = req.query.status as ExpenseStatus;
      if (req.query.category)
        filters.category = req.query.category as ExpenseCategory;
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.startDate)
        filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate)
        filters.endDate = new Date(req.query.endDate as string);

      const { expenses, total } = await expenseService.getExpenses(
        tenantId,
        filters
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: expenses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Get expenses error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch expenses';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get expense by ID
router.get(
  '/:tenantId/expenses/:expenseId',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const expense = await expenseService.getExpense(expenseId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: expense,
      });
    } catch (error) {
      logger.error('Get expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch expense';
      const statusCode =
        error instanceof Error && error.message.includes('not found') ? 404 : 400;

      res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: errorMessage,
      });
    }
  }
);

// Update expense
router.put(
  '/:tenantId/expenses/:expenseId',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const expense = await expenseService.updateExpense(
        expenseId,
        tenantId,
        req.body
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Expense updated successfully',
        data: expense,
      });
    } catch (error) {
      logger.error('Update expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update expense';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Submit for approval
router.post(
  '/:tenantId/expenses/:expenseId/submit',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const expense = await expenseService.submitForApproval(expenseId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Expense submitted for approval',
        data: expense,
      });
    } catch (error) {
      logger.error('Submit expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit expense';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Approve expense
router.post(
  '/:tenantId/expenses/:expenseId/approve',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const userId = (req as any).user?.id || 'system';
      const expense = await expenseService.approveExpense(
        expenseId,
        tenantId,
        userId
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Expense approved successfully',
        data: expense,
      });
    } catch (error) {
      logger.error('Approve expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to approve expense';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Reject expense
router.post(
  '/:tenantId/expenses/:expenseId/reject',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const expense = await expenseService.rejectExpense(expenseId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Expense rejected',
        data: expense,
      });
    } catch (error) {
      logger.error('Reject expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject expense';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Mark as paid
router.post(
  '/:tenantId/expenses/:expenseId/pay',
  [
    param('tenantId').isUUID(),
    param('expenseId').isUUID(),
    body('paymentMethod').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const { paymentMethod, paidDate } = req.body;
      const expense = await expenseService.markAsPaid(
        expenseId,
        tenantId,
        paymentMethod,
        paidDate ? new Date(paidDate) : undefined
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Expense marked as paid',
        data: expense,
      });
    } catch (error) {
      logger.error('Mark expense as paid error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to mark expense as paid';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Process OCR
router.post(
  '/:tenantId/expenses/:expenseId/ocr',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      const expense = await expenseService.processOCR(
        expenseId,
        tenantId,
        req.body
      );

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'OCR data processed successfully',
        data: expense,
      });
    } catch (error) {
      logger.error('Process OCR error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process OCR data';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Delete expense
router.delete(
  '/:tenantId/expenses/:expenseId',
  [param('tenantId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, expenseId } = req.params;
      await expenseService.deleteExpense(expenseId, tenantId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      logger.error('Delete expense error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete expense';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get expense stats
router.get(
  '/:tenantId/expenses-stats',
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

      const stats = await expenseService.getExpenseStats(
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
      logger.error('Get expense stats error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch expense stats';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

export default router;
