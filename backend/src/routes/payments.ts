/**
 * Payment Routes - Payment processing and management endpoints
 */

import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { PaymentsController } from '@/controllers/payments.controller';
import {
  createStripeIntentValidation,
  recordManualPaymentValidation,
  getInvoicePaymentsValidation,
  getPaymentsValidation,
  getPaymentValidation,
  refundPaymentValidation,
} from '@/validators/payments.validation';

const router = Router();

/**
 * POST /payments/:tenantId/invoices/:invoiceId/stripe/intent
 * Create Stripe payment intent
 */
router.post(
  '/:tenantId/invoices/:invoiceId/stripe/intent',
  authMiddleware,
  createStripeIntentValidation,
  asyncHandler(PaymentsController.createStripeIntent)
);

/**
 * POST /payments/:tenantId/invoices/:invoiceId/manual
 * Record manual payment (bank transfer, cash)
 */
router.post(
  '/:tenantId/invoices/:invoiceId/manual',
  authMiddleware,
  recordManualPaymentValidation,
  asyncHandler(PaymentsController.recordManualPayment)
);

/**
 * GET /payments/:tenantId/invoices/:invoiceId
 * Get all payments for an invoice
 */
router.get(
  '/:tenantId/invoices/:invoiceId',
  authMiddleware,
  getInvoicePaymentsValidation,
  asyncHandler(PaymentsController.getInvoicePayments)
);

/**
 * GET /payments/:tenantId
 * Get all payments for a tenant
 */
router.get(
  '/:tenantId',
  authMiddleware,
  getPaymentsValidation,
  asyncHandler(PaymentsController.getPayments)
);

/**
 * GET /payments/:tenantId/:paymentId
 * Get payment by ID
 */
router.get(
  '/:tenantId/:paymentId',
  authMiddleware,
  getPaymentValidation,
  asyncHandler(PaymentsController.getPayment)
);

/**
 * POST /payments/:tenantId/:paymentId/refund
 * Refund a payment
 */
router.post(
  '/:tenantId/:paymentId/refund',
  authMiddleware,
  refundPaymentValidation,
  asyncHandler(PaymentsController.refundPayment)
);

/**
 * POST /payments/webhooks/stripe
 * Stripe webhook endpoint (no auth required)
 */
router.post(
  '/webhooks/stripe',
  asyncHandler(PaymentsController.handleStripeWebhook)
);

export default router;
