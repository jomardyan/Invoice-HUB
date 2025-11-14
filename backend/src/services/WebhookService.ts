/**
 * WebhookService - Webhook registration, delivery, and management
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { Webhook, WebhookEvent, WebhookStatus } from '@/entities/Webhook';
import { WebhookDelivery, DeliveryStatus } from '@/entities/WebhookDelivery';
import logger from '@/utils/logger';
import crypto from 'crypto';
import axios from 'axios';

interface CreateWebhookInput {
  url: string;
  events: WebhookEvent[];
  description?: string;
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  tenantId: string;
}

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // 1min, 5min, 15min, 1h, 2h

class WebhookService {
  private webhookRepository: Repository<Webhook>;
  private deliveryRepository: Repository<WebhookDelivery>;

  constructor() {
    this.webhookRepository = AppDataSource.getRepository(Webhook);
    this.deliveryRepository = AppDataSource.getRepository(WebhookDelivery);
  }

  /**
   * Register a new webhook
   */
  async createWebhook(tenantId: string, input: CreateWebhookInput): Promise<Webhook> {
    try {
      // Generate secret for signature verification
      const secret = this.generateSecret();

      const webhook = this.webhookRepository.create({
        tenantId,
        url: input.url,
        events: input.events,
        description: input.description,
        secret,
        status: WebhookStatus.ACTIVE,
      });

      await this.webhookRepository.save(webhook);
      logger.info('Webhook created', { webhookId: webhook.id, tenantId, url: input.url });

      return webhook;
    } catch (error: any) {
      logger.error('Webhook creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all webhooks for a tenant
   */
  async getWebhooks(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(tenantId: string, webhookId: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId, tenantId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    tenantId: string,
    webhookId: string,
    updates: Partial<CreateWebhookInput & { status: WebhookStatus }>
  ): Promise<Webhook> {
    const webhook = await this.getWebhookById(tenantId, webhookId);

    if (updates.url) webhook.url = updates.url;
    if (updates.events) webhook.events = updates.events;
    if (updates.description !== undefined) webhook.description = updates.description;
    if (updates.status) webhook.status = updates.status;

    await this.webhookRepository.save(webhook);
    logger.info('Webhook updated', { webhookId, tenantId });

    return webhook;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    const webhook = await this.getWebhookById(tenantId, webhookId);
    await this.webhookRepository.remove(webhook);
    logger.info('Webhook deleted', { webhookId, tenantId });
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(tenantId: string, webhookId: string): Promise<Webhook> {
    const webhook = await this.getWebhookById(tenantId, webhookId);
    webhook.secret = this.generateSecret();
    await this.webhookRepository.save(webhook);
    logger.info('Webhook secret regenerated', { webhookId, tenantId });
    return webhook;
  }

  /**
   * Trigger webhook for an event
   */
  async triggerEvent(tenantId: string, event: WebhookEvent, data: any): Promise<void> {
    try {
      // Find all active webhooks subscribed to this event
      const webhooks = await this.webhookRepository.find({
        where: {
          tenantId,
          status: WebhookStatus.ACTIVE,
        },
      });

      const subscribedWebhooks = webhooks.filter((webhook) =>
        webhook.events.includes(event)
      );

      if (subscribedWebhooks.length === 0) {
        logger.debug('No webhooks subscribed to event', { event, tenantId });
        return;
      }

      // Create payload
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        tenantId,
      };

      // Queue delivery for each webhook
      const deliveryPromises = subscribedWebhooks.map((webhook) =>
        this.queueDelivery(webhook, event, payload)
      );

      await Promise.all(deliveryPromises);

      logger.info('Webhook event triggered', {
        event,
        tenantId,
        webhookCount: subscribedWebhooks.length,
      });
    } catch (error: any) {
      logger.error('Webhook event trigger failed', { error: error.message, event, tenantId });
      throw error;
    }
  }

  /**
   * Queue a webhook delivery
   */
  private async queueDelivery(
    webhook: Webhook,
    event: string,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      const delivery = this.deliveryRepository.create({
        webhookId: webhook.id,
        event,
        payload,
        status: DeliveryStatus.PENDING,
        attempts: 0,
      });

      await this.deliveryRepository.save(delivery);

      // Update webhook last triggered timestamp
      webhook.lastTriggeredAt = new Date();
      await this.webhookRepository.save(webhook);

      // Attempt immediate delivery
      await this.attemptDelivery(webhook, delivery);
    } catch (error: any) {
      logger.error('Webhook delivery queuing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(webhook: Webhook, delivery: WebhookDelivery): Promise<void> {
    try {
      delivery.attempts += 1;
      delivery.status = DeliveryStatus.RETRYING;
      await this.deliveryRepository.save(delivery);

      // Generate signature
      const signature = this.generateSignature(delivery.payload, webhook.secret!);

      // Send HTTP request
      const response = await axios.post(webhook.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Delivery-ID': delivery.id,
        },
        timeout: 10000, // 10 seconds
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      // Update delivery based on response
      delivery.responseStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000);

      if (response.status >= 200 && response.status < 300) {
        // Success
        delivery.status = DeliveryStatus.SUCCESS;
        delivery.deliveredAt = new Date();

        // Update webhook stats
        webhook.successCount += 1;
        webhook.lastSuccessAt = new Date();

        logger.info('Webhook delivery successful', {
          webhookId: webhook.id,
          deliveryId: delivery.id,
          status: response.status,
        });
      } else {
        // Failure
        delivery.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        await this.handleDeliveryFailure(webhook, delivery);
      }

      await this.deliveryRepository.save(delivery);
      await this.webhookRepository.save(webhook);
    } catch (error: any) {
      delivery.errorMessage = error.message;
      await this.handleDeliveryFailure(webhook, delivery);
      await this.deliveryRepository.save(delivery);
      await this.webhookRepository.save(webhook);

      logger.error('Webhook delivery failed', {
        webhookId: webhook.id,
        deliveryId: delivery.id,
        error: error.message,
      });
    }
  }

  /**
   * Handle delivery failure with retry logic
   */
  private async handleDeliveryFailure(webhook: Webhook, delivery: WebhookDelivery): Promise<void> {
    webhook.failureCount += 1;
    webhook.lastFailureAt = new Date();

    if (delivery.attempts < MAX_RETRY_ATTEMPTS) {
      // Schedule retry
      const retryDelay = RETRY_DELAYS[delivery.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      delivery.nextRetryAt = new Date(Date.now() + retryDelay * 1000);
      delivery.status = DeliveryStatus.RETRYING;

      logger.info('Webhook delivery scheduled for retry', {
        webhookId: webhook.id,
        deliveryId: delivery.id,
        attempt: delivery.attempts,
        nextRetry: delivery.nextRetryAt,
      });

      // TODO: Queue retry job in background (Bull/Redis queue)
    } else {
      // Max retries reached
      delivery.status = DeliveryStatus.FAILED;

      // Suspend webhook if too many failures
      if (webhook.failureCount > 10 && webhook.successCount === 0) {
        webhook.status = WebhookStatus.SUSPENDED;
        logger.warn('Webhook suspended due to failures', { webhookId: webhook.id });
      }
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(): Promise<void> {
    try {
      const now = new Date();
      const failedDeliveries = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .leftJoinAndSelect('delivery.webhook', 'webhook')
        .where('delivery.status = :status', { status: DeliveryStatus.RETRYING })
        .andWhere('delivery.nextRetryAt <= :now', { now })
        .andWhere('delivery.attempts < :maxAttempts', { maxAttempts: MAX_RETRY_ATTEMPTS })
        .andWhere('webhook.status = :webhookStatus', { webhookStatus: WebhookStatus.ACTIVE })
        .getMany();

      logger.info('Retrying failed webhook deliveries', { count: failedDeliveries.length });

      for (const delivery of failedDeliveries) {
        await this.attemptDelivery(delivery.webhook, delivery);
      }
    } catch (error: any) {
      logger.error('Webhook retry process failed', { error: error.message });
    }
  }

  /**
   * Get delivery history for a webhook
   */
  async getDeliveryHistory(
    tenantId: string,
    webhookId: string,
    limit: number = 50
  ): Promise<WebhookDelivery[]> {
    await this.getWebhookById(tenantId, webhookId); // Verify ownership

    return this.deliveryRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate webhook signature (HMAC-SHA256)
   */
  private generateSignature(payload: any, secret: string): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Generate random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default new WebhookService();
