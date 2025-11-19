import { Router } from 'express';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ExpensesController } from '../controllers/expenses.controller';
import {
  createExpenseValidation,
  listExpensesValidation,
  getExpenseValidation,
  updateExpenseValidation,
  submitExpenseValidation,
  approveExpenseValidation,
  rejectExpenseValidation,
  payExpenseValidation,
  processOCRValidation,
  deleteExpenseValidation,
  getExpenseStatsValidation,
} from '../validators/expenses.validation';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create expense
router.post('/:tenantId/expenses', createExpenseValidation, asyncHandler(ExpensesController.createExpense));

// Get expenses
router.get('/:tenantId/expenses', listExpensesValidation, asyncHandler(ExpensesController.listExpenses));

// Get expense by ID
router.get('/:tenantId/expenses/:expenseId', getExpenseValidation, asyncHandler(ExpensesController.getExpense));

// Update expense
router.put('/:tenantId/expenses/:expenseId', updateExpenseValidation, asyncHandler(ExpensesController.updateExpense));

// Submit for approval
router.post('/:tenantId/expenses/:expenseId/submit', submitExpenseValidation, asyncHandler(ExpensesController.submitExpense));

// Approve expense
router.post('/:tenantId/expenses/:expenseId/approve', approveExpenseValidation, asyncHandler(ExpensesController.approveExpense));

// Reject expense
router.post('/:tenantId/expenses/:expenseId/reject', rejectExpenseValidation, asyncHandler(ExpensesController.rejectExpense));

// Mark as paid
router.post('/:tenantId/expenses/:expenseId/pay', payExpenseValidation, asyncHandler(ExpensesController.markAsPaid));

// Process OCR
router.post('/:tenantId/expenses/:expenseId/ocr', processOCRValidation, asyncHandler(ExpensesController.processOCR));

// Delete expense
router.delete('/:tenantId/expenses/:expenseId', deleteExpenseValidation, asyncHandler(ExpensesController.deleteExpense));

// Get expense stats
router.get('/:tenantId/expenses-stats', getExpenseStatsValidation, asyncHandler(ExpensesController.getExpenseStats));

export default router;
