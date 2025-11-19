import { body, param } from 'express-validator';
import { ExpenseCategory, ExpenseStatus } from '@/entities/Expense';

export const createExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(Object.values(ExpenseCategory)).withMessage('Valid category is required'),
    body('expenseDate').isISO8601().withMessage('Valid expense date is required'),
    body('netAmount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
];

export const listExpensesValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const getExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const updateExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const submitExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const approveExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const rejectExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const payExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
    body('paymentMethod').trim().notEmpty().withMessage('Payment method is required'),
];

export const processOCRValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const deleteExpenseValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('expenseId').isUUID().withMessage('Invalid expense ID'),
];

export const getExpenseStatsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];
