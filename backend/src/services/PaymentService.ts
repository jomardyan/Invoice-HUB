/**
 * PaymentService - Payment processing and gateway integration
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { Payment, PaymentProvider, PaymentStatus } from '@/entities/Payment';
import { Invoice } from '@/entities/Invoice';
import Stripe from 'stripe';
import logger from '@/utils/logger';
import InvoiceService from './InvoiceService';
import WebhookService from './WebhookService';
import { WebhookEvent } from '@/entities/Webhook';

interface CreatePaymentInput {
  invoiceId: string;
  provider: PaymentProvider;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: any;
}

interface StripePaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

interface PaymentRefund {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
}

export class PaymentService {
  private paymentRepository: Repository<Payment>;
  private invoiceRepository: Repository<Invoice>;
  private invoiceService: typeof InvoiceService;
  private stripe: Stripe | null = null;

  constructor() {
    this.paymentRepository = AppDataSource.getRepository(Payment);
    this.invoiceRepository = AppDataSource.getRepository(Invoice);
    this.invoiceService = InvoiceService;

    // Initialize Stripe if API key is available
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-10-29.clover',
      });
      logger.info('Stripe payment gateway initialized');
    } else {
      logger.warn('Stripe API key not configured');
    }
  }

  /**
   * Create a payment record
   */
  async createPayment(tenantId: string, input: CreatePaymentInput): Promise<Payment> {
    try {
      // Verify invoice exists and belongs to tenant
      const invoice = await this.invoiceRepository.findOne({
        where: { id: input.invoiceId, tenantId },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Validate amount doesn't exceed invoice total
      const existingPayments = await this.paymentRepository.find({
        where: {
          invoiceId: input.invoiceId,
          status: PaymentStatus.SUCCEEDED,
        },
      });

      const totalPaid = existingPayments.reduce(
        (sum, p) => sum + Number(p.amount) - Number(p.refundedAmount),
        0
      );

      if (totalPaid + input.amount > Number(invoice.total)) {
        throw new Error('Payment amount exceeds invoice balance');
      }

      const payment = this.paymentRepository.create({
        tenantId,
        invoiceId: input.invoiceId,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency || invoice.currency || 'PLN',
        description: input.description,
        metadata: input.metadata,
        status: PaymentStatus.PENDING,
      });

      await this.paymentRepository.save(payment);
      logger.info('Payment created', { paymentId: payment.id, invoiceId: input.invoiceId });

      return payment;
    } catch (error: any) {
      logger.error('Payment creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create Stripe payment intent
   */
  async createStripePaymentIntent(
    tenantId: string,
    invoiceId: string,
    amount: number
  ): Promise<StripePaymentIntent> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not configured');
      }

      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, tenantId },
        relations: ['customer', 'company'],
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: invoice.currency?.toLowerCase() || 'pln',
        description: `Invoice ${invoice.invoiceNumber}`,
        metadata: {
          tenantId,
          invoiceId,
          invoiceNumber: invoice.invoiceNumber || '',
        },
        receipt_email: invoice.customer?.email,
      });

      // Create payment record
      await this.createPayment(tenantId, {
        invoiceId,
        provider: PaymentProvider.STRIPE,
        amount,
        currency: invoice.currency || 'PLN',
        description: `Stripe payment for invoice ${invoice.invoiceNumber}`,
        metadata: {
          paymentIntentId: paymentIntent.id,
        },
      });

      logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        invoiceId,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      logger.error('Stripe payment intent creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      logger.info('Processing Stripe webhook', { type: event.type });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          logger.debug('Unhandled Stripe event type', { type: event.type });
      }
    } catch (error: any) {
      logger.error('Stripe webhook processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { invoiceId, tenantId } = paymentIntent.metadata;

      if (!invoiceId || !tenantId) {
        logger.warn('Payment intent missing metadata', { paymentIntentId: paymentIntent.id });
        return;
      }

      // Find payment record
      const payment = await this.paymentRepository.findOne({
        where: {
          tenantId,
          invoiceId,
          provider: PaymentProvider.STRIPE,
          metadata: { paymentIntentId: paymentIntent.id },
        },
      });

      if (!payment) {
        logger.warn('Payment record not found for payment intent', {
          paymentIntentId: paymentIntent.id,
        });
        return;
      }

      // Update payment status
      payment.status = PaymentStatus.SUCCEEDED;
      payment.providerPaymentId = paymentIntent.id;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);

      // Record payment in invoice
      await this.invoiceService.recordPayment(
        tenantId,
        invoiceId,
        Number(payment.amount),
        payment.paidAt
      );

      // Trigger webhook
      WebhookService.triggerEvent(tenantId, WebhookEvent.PAYMENT_RECEIVED, {
        paymentId: payment.id,
        invoiceId,
        amount: payment.amount,
        provider: payment.provider,
        paidAt: payment.paidAt,
      }).catch((err) => logger.error('Webhook trigger failed', { error: err.message }));

      logger.info('Payment succeeded', { paymentId: payment.id, invoiceId });
    } catch (error: any) {
      logger.error('Payment success handling failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { invoiceId, tenantId } = paymentIntent.metadata;

      if (!invoiceId || !tenantId) {
        return;
      }

      const payment = await this.paymentRepository.findOne({
        where: {
          tenantId,
          invoiceId,
          provider: PaymentProvider.STRIPE,
          metadata: { paymentIntentId: paymentIntent.id },
        },
      });

      if (!payment) {
        return;
      }

      payment.status = PaymentStatus.FAILED;
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.paymentRepository.save(payment);

      // Trigger webhook
      WebhookService.triggerEvent(tenantId, WebhookEvent.PAYMENT_FAILED, {
        paymentId: payment.id,
        invoiceId,
        amount: payment.amount,
        provider: payment.provider,
        failureReason: payment.failureReason,
      }).catch((err) => logger.error('Webhook trigger failed', { error: err.message }));

      logger.info('Payment failed', { paymentId: payment.id, reason: payment.failureReason });
    } catch (error: any) {
      logger.error('Payment failure handling failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle charge refund
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: {
          providerPaymentId: charge.payment_intent as string,
          provider: PaymentProvider.STRIPE,
        },
      });

      if (!payment) {
        return;
      }

      const refundAmount = charge.amount_refunded / 100; // Convert from cents

      payment.refundedAmount = refundAmount;
      payment.status =
        refundAmount >= Number(payment.amount)
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
      payment.refundedAt = new Date();

      await this.paymentRepository.save(payment);

      logger.info('Payment refunded', {
        paymentId: payment.id,
        refundAmount,
        status: payment.status,
      });
    } catch (error: any) {
      logger.error('Refund handling failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Process refund
   */
  async refundPayment(tenantId: string, input: PaymentRefund): Promise<Payment> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: input.paymentId, tenantId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.SUCCEEDED) {
        throw new Error('Only succeeded payments can be refunded');
      }

      const refundAmount = input.amount || Number(payment.amount);
      const maxRefundable = Number(payment.amount) - Number(payment.refundedAmount);

      if (refundAmount > maxRefundable) {
        throw new Error('Refund amount exceeds refundable balance');
      }

      // Process refund based on provider
      if (payment.provider === PaymentProvider.STRIPE && this.stripe) {
        if (!payment.providerPaymentId) {
          throw new Error('Payment intent ID not found');
        }

        await this.stripe.refunds.create({
          payment_intent: payment.providerPaymentId,
          amount: Math.round(refundAmount * 100),
          reason: input.reason as Stripe.RefundCreateParams.Reason,
        });
      }

      // Update payment record
      payment.refundedAmount = Number(payment.refundedAmount) + refundAmount;
      payment.status =
        payment.refundedAmount >= Number(payment.amount)
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
      payment.refundedAt = new Date();

      await this.paymentRepository.save(payment);

      logger.info('Payment refunded', { paymentId: payment.id, refundAmount });

      return payment;
    } catch (error: any) {
      logger.error('Refund processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(tenantId: string, paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Get payments for an invoice
   */
  async getInvoicePayments(tenantId: string, invoiceId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { invoiceId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all payments for a tenant
   */
  async getPayments(
    tenantId: string,
    options?: {
      status?: PaymentStatus;
      provider?: PaymentProvider;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ payments: Payment[]; total: number }> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('payment.invoice', 'invoice');

    if (options?.status) {
      query.andWhere('payment.status = :status', { status: options.status });
    }

    if (options?.provider) {
      query.andWhere('payment.provider = :provider', { provider: options.provider });
    }

    query.orderBy('payment.createdAt', 'DESC');

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const [payments, total] = await query.getManyAndCount();

    return { payments, total };
  }

  /**
   * Record manual payment (bank transfer, cash, etc.)
   */
  async recordManualPayment(
    tenantId: string,
    invoiceId: string,
    amount: number,
    provider: PaymentProvider,
    description?: string
  ): Promise<Payment> {
    try {
      // Create payment record
      const payment = await this.createPayment(tenantId, {
        invoiceId,
        provider,
        amount,
        description,
      });

      // Mark as succeeded immediately for manual payments
      payment.status = PaymentStatus.SUCCEEDED;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);

      // Record in invoice
      await this.invoiceService.recordPayment(tenantId, invoiceId, amount, payment.paidAt);

      // Trigger webhook
      WebhookService.triggerEvent(tenantId, WebhookEvent.PAYMENT_RECEIVED, {
        paymentId: payment.id,
        invoiceId,
        amount: payment.amount,
        provider: payment.provider,
        paidAt: payment.paidAt,
      }).catch((err) => logger.error('Webhook trigger failed', { error: err.message }));

      logger.info('Manual payment recorded', { paymentId: payment.id, invoiceId });

      return payment;
    } catch (error: any) {
      logger.error('Manual payment recording failed', { error: error.message });
      throw error;
    }
  }
}

export default new PaymentService();
