/**
 * Payment Routes - Payment processing and management endpoints
 */

import { Router } from 'express';
import { param, body, query } from 'express-validator';
import PaymentService from '@/services/PaymentService';
import { PaymentProvider, PaymentStatus } from '@/entities/Payment';
import { authMiddleware } from '@/middleware/auth';
import Stripe from 'stripe';
import logger from '@/utils/logger';

const router = Router();

// Initialize Stripe for webhook verification
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null;

/**
 * POST /payments/:tenantId/invoices/:invoiceId/stripe/intent
 * Create Stripe payment intent
 */
router.post(
  '/:tenantId/invoices/:invoiceId/stripe/intent',
  authMiddleware,
  param('tenantId').isUUID(),
  param('invoiceId').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const { amount } = req.body;

      const result = await PaymentService.createStripePaymentIntent(tenantId, invoiceId, amount);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /payments/:tenantId/invoices/:invoiceId/manual
 * Record manual payment (bank transfer, cash)
 */
router.post(
  '/:tenantId/invoices/:invoiceId/manual',
  authMiddleware,
  param('tenantId').isUUID(),
  param('invoiceId').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  body('provider').isIn(Object.values(PaymentProvider)),
  body('description').optional().isString(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const { amount, provider, description } = req.body;

      const payment = await PaymentService.recordManualPayment(
        tenantId,
        invoiceId,
        amount,
        provider,
        description
      );

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /payments/:tenantId/invoices/:invoiceId
 * Get all payments for an invoice
 */
router.get(
  '/:tenantId/invoices/:invoiceId',
  authMiddleware,
  param('tenantId').isUUID(),
  param('invoiceId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const payments = await PaymentService.getInvoicePayments(tenantId, invoiceId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /payments/:tenantId
 * Get all payments for a tenant
 */
router.get(
  '/:tenantId',
  authMiddleware,
  param('tenantId').isUUID(),
  query('status').optional().isIn(Object.values(PaymentStatus)),
  query('provider').optional().isIn(Object.values(PaymentProvider)),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { status, provider, limit, offset } = req.query;

      const result = await PaymentService.getPayments(tenantId, {
        status,
        provider,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /payments/:tenantId/:paymentId
 * Get payment by ID
 */
router.get(
  '/:tenantId/:paymentId',
  authMiddleware,
  param('tenantId').isUUID(),
  param('paymentId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, paymentId } = req.params;
      const payment = await PaymentService.getPaymentById(tenantId, paymentId);
      res.json(payment);
    } catch (error: any) {
      const status = error.message === 'Payment not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * POST /payments/:tenantId/:paymentId/refund
 * Refund a payment
 */
router.post(
  '/:tenantId/:paymentId/refund',
  authMiddleware,
  param('tenantId').isUUID(),
  param('paymentId').isUUID(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().isString(),
  async (req: any, res: any) => {
    try {
      const { tenantId, paymentId } = req.params;
      const { amount, reason } = req.body;

      const payment = await PaymentService.refundPayment(tenantId, {
        paymentId,
        amount,
        reason,
      });

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /payments/webhooks/stripe
 * Stripe webhook endpoint (no auth required)
 */
router.post(
  '/webhooks/stripe',
  async (req: any, res: any) => {
    try {
      if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
      }

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.error('Stripe webhook secret not configured');
        return res.status(400).json({ error: 'Webhook not configured' });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        logger.error('Stripe webhook signature verification failed', { error: err.message });
        return res.status(400).json({ error: 'Webhook signature verification failed' });
      }

      // Process the event
      await PaymentService.handleStripeWebhook(event);

      res.json({ received: true });
    } catch (error: any) {
      logger.error('Stripe webhook processing failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
