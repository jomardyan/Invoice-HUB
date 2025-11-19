import { Request, Response } from 'express';
import PaymentService from '../services/PaymentService';
import Stripe from 'stripe';
import logger from '../utils/logger';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
    : null;

export class PaymentsController {
    static async createStripeIntent(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const { amount } = req.body;

        const result = await PaymentService.createStripePaymentIntent(tenantId, invoiceId, amount);
        res.json(result);
    }

    static async recordManualPayment(req: Request, res: Response): Promise<void> {
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
    }

    static async getInvoicePayments(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const payments = await PaymentService.getInvoicePayments(tenantId, invoiceId);
        res.json(payments);
    }

    static async getPayments(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { status, provider, limit, offset } = req.query;

        const result = await PaymentService.getPayments(tenantId, {
            status: status as string,
            provider: provider as string,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        res.json(result);
    }

    static async getPayment(req: Request, res: Response): Promise<void> {
        const { tenantId, paymentId } = req.params;

        try {
            const payment = await PaymentService.getPaymentById(tenantId, paymentId);
            res.json(payment);
        } catch (error: any) {
            const status = error.message === 'Payment not found' ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    static async refundPayment(req: Request, res: Response): Promise<void> {
        const { tenantId, paymentId } = req.params;
        const { amount, reason } = req.body;

        const payment = await PaymentService.refundPayment(tenantId, {
            paymentId,
            amount,
            reason,
        });

        res.json(payment);
    }

    static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
        if (!stripe) {
            res.status(400).json({ error: 'Stripe not configured' });
        }

        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            logger.error('Stripe webhook secret not configured');
            res.status(400).json({ error: 'Webhook not configured' });
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
        } catch (err: any) {
            logger.error('Stripe webhook signature verification failed', { error: err.message });
            res.status(400).json({ error: 'Webhook signature verification failed' });
        }

        await PaymentService.handleStripeWebhook(event);
        res.json({ received: true });
    }
}
