import { body, param, query } from 'express-validator';
import { InvoiceType, InvoiceStatus } from '../entities/Invoice';
import { ExportFormat } from '../services/ExportService';

export const createInvoiceValidation = [
    body('companyId').isUUID().withMessage('Invalid company ID'),
    body('customerId').isUUID().withMessage('Invalid customer ID'),
    body('invoiceType').isIn(Object.values(InvoiceType)).withMessage('Invalid invoice type'),
    body('issueDate').isISO8601().toDate().withMessage('Invalid issue date'),
    body('dueDate').isISO8601().toDate().withMessage('Invalid due date'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*').custom(async (_value: unknown, { req }: any) => {
        const items = req.body.items;
        if (!Array.isArray(items)) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.description) throw new Error(`Item ${i + 1}: Description is required`);
            if (typeof item.quantity !== 'number' || item.quantity <= 0)
                throw new Error(`Item ${i + 1}: Invalid quantity`);
            if (typeof item.unitPrice !== 'number' || item.unitPrice < 0)
                throw new Error(`Item ${i + 1}: Invalid unit price`);
            if (typeof item.vatRate !== 'number' || item.vatRate < 0 || item.vatRate > 100)
                throw new Error(`Item ${i + 1}: Invalid VAT rate`);
        }
    }),
    body('notes').optional().isString(),
    body('termsAndConditions').optional().isString(),
    body('paymentMethod').optional().isString(),
    body('internalNotes').optional().isString(),
];

export const listInvoicesValidation = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(Object.values(InvoiceStatus)),
    query('companyId').optional().isUUID(),
    query('customerId').optional().isUUID(),
];

export const getInvoiceValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
];

export const updateInvoiceValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('issueDate').optional().isISO8601().toDate(),
    body('dueDate').optional().isISO8601().toDate(),
    body('items').optional().isArray({ min: 1 }),
    body('notes').optional().isString(),
    body('termsAndConditions').optional().isString(),
    body('paymentMethod').optional().isString(),
    body('internalNotes').optional().isString(),
];

export const markPendingValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
];

export const approveInvoiceValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
];

export const markSentValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('sentDate').optional().isISO8601().toDate(),
];

export const markViewedValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('viewedDate').optional().isISO8601().toDate(),
];

export const recordPaymentValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('paidAmount').isFloat({ min: 0.01 }).withMessage('Paid amount must be greater than 0'),
    body('paymentDate').optional().isISO8601().toDate(),
];

export const cancelInvoiceValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('reason').optional().isString(),
];

export const invoiceStatsValidation = [
    param('companyId').isUUID().withMessage('Invalid company ID'),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
];

export const sendReminderValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
];

export const sendOverdueRemindersValidation = [
    query('companyId').optional().isUUID(),
];

export const exportInvoiceValidation = [
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    query('format').isIn(Object.values(ExportFormat)).withMessage('Invalid export format'),
];

export const exportInvoicesValidation = [
    query('format').isIn(Object.values(ExportFormat)).withMessage('Invalid export format'),
    body('invoiceIds').isArray().withMessage('invoiceIds must be an array'),
    body('invoiceIds.*').isUUID().withMessage('Invalid invoice ID in list'),
];
