import { body, param, query } from 'express-validator';
import { PaymentProvider, PaymentStatus } from '@/entities/Payment';

export const createStripeIntentValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
];

export const recordManualPaymentValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('provider').isIn(Object.values(PaymentProvider)).withMessage('Invalid payment provider'),
    body('description').optional().isString(),
];

export const getInvoicePaymentsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
];

export const getPaymentsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    query('status').optional().isIn(Object.values(PaymentStatus)).withMessage('Invalid payment status'),
    query('provider').optional().isIn(Object.values(PaymentProvider)).withMessage('Invalid payment provider'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be positive'),
];

export const getPaymentValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('paymentId').isUUID().withMessage('Invalid payment ID'),
];

export const refundPaymentValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('paymentId').isUUID().withMessage('Invalid payment ID'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
    body('reason').optional().isString(),
];
