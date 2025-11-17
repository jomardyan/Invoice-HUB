import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import config from '@/config';
import { BaseLinkerIntegration } from '@/entities/BaseLinkerIntegration';
import { Invoice, InvoiceType } from '@/entities/Invoice';
import { Customer, CustomerType } from '@/entities/Customer';
import { Product } from '@/entities/Product';
import { InvoiceService, InvoiceCreateInput, InvoiceItemInput } from './InvoiceService';
import { encryptionService } from '@/utils/encryption';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import RedisClient from '@/config/redis';

export interface BaseLinkerOrder {
  order_id: number;
  shop_order_id: string;
  external_order_id: string;
  order_source: string;
  order_source_id: number;
  order_status_id: number;
  date_add: number;
  confirmed: boolean;
  user_login: string;
  phone: string;
  email: string;
  delivery_fullname: string;
  delivery_company: string;
  delivery_address: string;
  delivery_postcode: string;
  delivery_city: string;
  delivery_country_code: string;
  currency: string;
  payment_method: string;
  payment_done: number;
  products: BaseLinkerProduct[];
}

export interface BaseLinkerProduct {
  storage_id: number;
  order_product_id: number;
  product_id: string;
  variant_id: string;
  name: string;
  sku: string;
  ean: string;
  quantity: number;
  price_brutto: number;
  tax_rate: number;
  weight: number;
}

export interface BaseLinkerSyncResult {
  success: boolean;
  ordersProcessed: number;
  invoicesCreated: number;
  errors: string[];
}

export interface BaseLinkerSettings {
  autoGenerateInvoices?: boolean;
  invoiceTemplateId?: string;
  syncFrequencyMinutes?: number;
  autoMarkAsPaid?: boolean;
  autoCreateCustomer?: boolean;
  autoCreateProduct?: boolean;
  defaultVatRate?: number;
  orderSources?: number[];
}

export class BaseLinkerService {
  private baselinkerRepository: Repository<BaseLinkerIntegration>;
  private customerRepository: Repository<Customer>;
  private productRepository: Repository<Product>;
  private invoiceService: InvoiceService;
  private apiClient: AxiosInstance;
  private readonly BASELINKER_API_URL = config.baselinker.apiUrl;
  private readonly MAX_RETRIES = 6;
  private readonly RETRY_DELAYS = [1000, 60000, 300000, 900000, 3600000, 14400000]; // 1s, 1m, 5m, 15m, 1h, 4h
  private readonly IDEMPOTENCY_KEY_PREFIX = 'baselinker:order:';

  constructor() {
    this.baselinkerRepository = AppDataSource.getRepository(BaseLinkerIntegration);
    this.customerRepository = AppDataSource.getRepository(Customer);
    this.productRepository = AppDataSource.getRepository(Product);
    this.invoiceService = new InvoiceService();

    this.apiClient = axios.create({
      baseURL: this.BASELINKER_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Create a new BaseLinker integration with API token
   */
  async createIntegration(
    tenantId: string,
    userId: string,
    apiToken: string
  ): Promise<BaseLinkerIntegration> {
    try {
      logger.info(`[BaseLinker] Creating integration for tenant: ${tenantId}`);

      // Verify token by making a test API call
      await this.verifyApiToken(apiToken);

      // Encrypt token before storing
      const encryptedToken = encryptionService.encrypt(apiToken);

      // Check if integration already exists for this user
      let integration = await this.baselinkerRepository.findOne({
        where: { tenantId, userId },
      });

      if (!integration) {
        integration = this.baselinkerRepository.create({
          id: uuidv4(),
          tenantId,
          userId,
          apiToken: encryptedToken,
          isActive: true,
          syncErrorCount: 0,
        });
      } else {
        integration.apiToken = encryptedToken;
        integration.isActive = true;
      }

      await this.baselinkerRepository.save(integration);

      logger.info(`[BaseLinker] Successfully created integration for tenant: ${tenantId}`);

      return integration;
    } catch (error) {
      logger.error(
        `[BaseLinker] Failed to create integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw new Error(`Failed to create BaseLinker integration: ${error}`);
    }
  }

  /**
   * Verify API token is valid
   */
  private async verifyApiToken(apiToken: string): Promise<boolean> {
    try {
      const response = await this.apiClient.post('', new URLSearchParams({
        token: apiToken,
        method: 'getInventories',
      }));

      if (response.data.status === 'ERROR') {
        throw new Error(response.data.error_message || 'Invalid API token');
      }

      return true;
    } catch (error) {
      logger.error(`[BaseLinker] API token verification failed: ${error}`);
      throw new Error('Invalid BaseLinker API token');
    }
  }

  /**
   * Fetch orders from BaseLinker API
   */
  async fetchOrders(
    integrationId: string,
    _companyId: string,
    limit: number = 100
  ): Promise<BaseLinkerOrder[]> {
    try {
      const integration = await this.baselinkerRepository.findOne({
        where: { id: integrationId },
      });

      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive');
      }

      const apiToken = encryptionService.decrypt(integration.apiToken);

      logger.info(`[BaseLinker] Fetching orders for integration: ${integrationId}`);

      // Get orders from the last 30 days with status "new" or "processing"
      const dateFrom = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      const params = new URLSearchParams({
        token: apiToken,
        method: 'getOrders',
        parameters: JSON.stringify({
          date_from: dateFrom,
          status_id: [11100, 11200], // New and processing orders
          get_unconfirmed_orders: true,
          limit,
        }),
      });

      const response = await this.apiClient.post('', params);

      if (response.data.status === 'ERROR') {
        throw new Error(response.data.error_message || 'Failed to fetch orders');
      }

      const orders: BaseLinkerOrder[] = response.data.orders || [];

      logger.info(`[BaseLinker] Fetched ${orders.length} orders`);

      return orders;
    } catch (error) {
      logger.error(`[BaseLinker] Failed to fetch orders: ${error}`);
      throw error;
    }
  }

  /**
   * Synchronize orders with retry logic
   */
  async syncOrdersWithRetry(
    integrationId: string,
    companyId: string,
    tenantId: string
  ): Promise<BaseLinkerSyncResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.RETRY_DELAYS[attempt - 1];
          logger.info(
            `[BaseLinker] Retrying sync (attempt ${attempt + 1}/${this.MAX_RETRIES}) after ${delay}ms`
          );
          await this.delay(delay);
        }

        const result = await this.syncOrders(integrationId, companyId, tenantId);

        // Reset error count on success
        await this.baselinkerRepository.update(integrationId, {
          syncErrorCount: 0,
          lastSyncError: undefined,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`[BaseLinker] Sync attempt ${attempt + 1} failed: ${lastError.message}`);

        // Update error count
        const integration = await this.baselinkerRepository.findOne({
          where: { id: integrationId },
        });

        if (integration) {
          integration.syncErrorCount = (integration.syncErrorCount || 0) + 1;
          integration.lastSyncError = lastError.message;

          // Deactivate after 5 consecutive failures
          if (integration.syncErrorCount >= 5) {
            integration.isActive = false;
            logger.error(
              `[BaseLinker] Integration ${integrationId} deactivated after 5 failures`
            );
          }

          await this.baselinkerRepository.save(integration);
        }
      }
    }

    throw new Error(`Sync failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  /**
   * Synchronize orders and generate invoices
   */
  private async syncOrders(
    integrationId: string,
    companyId: string,
    tenantId: string
  ): Promise<BaseLinkerSyncResult> {
    const result: BaseLinkerSyncResult = {
      success: true,
      ordersProcessed: 0,
      invoicesCreated: 0,
      errors: [],
    };

    try {
      // Get integration settings
      const integration = await this.baselinkerRepository.findOne({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      const settings = this.getSettingsWithDefaults(integration.settings || {});

      // Fetch orders
      const orders = await this.fetchOrders(integrationId, companyId);

      logger.info(`[BaseLinker] Processing ${orders.length} orders`);

      for (const order of orders) {
        try {
          // Check idempotency
          const idempotencyKey = `${this.IDEMPOTENCY_KEY_PREFIX}${order.order_id}`;
          const redis = RedisClient.getInstance();
          const processed = await redis.get(idempotencyKey);

          if (processed) {
            logger.info(`[BaseLinker] Order ${order.order_id} already processed, skipping`);
            continue;
          }

          result.ordersProcessed++;

          // Create/update customer if enabled
          let customer: Customer | null = null;
          if (settings.autoCreateCustomer) {
            customer = await this.createOrUpdateCustomer(order, companyId, tenantId);
          }

          // Create/update products if enabled
          if (settings.autoCreateProduct) {
            await this.createOrUpdateProducts(order, companyId, tenantId, settings.defaultVatRate);
          }

          // Generate invoice if enabled
          if (settings.autoGenerateInvoices && customer) {
            await this.generateInvoice(order, customer, companyId, tenantId, settings);
            result.invoicesCreated++;
          }

          // Mark as processed (24h expiry)
          await redis.set(idempotencyKey, '1', 86400);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`[BaseLinker] Failed to process order ${order.order_id}: ${errorMessage}`);
          result.errors.push(`Order ${order.order_id}: ${errorMessage}`);
        }
      }

      // Update last sync time
      await this.baselinkerRepository.update(integrationId, {
        lastSyncAt: new Date(),
      });

      logger.info(
        `[BaseLinker] Sync completed: ${result.ordersProcessed} processed, ${result.invoicesCreated} invoices created, ${result.errors.length} errors`
      );

      return result;
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      logger.error(`[BaseLinker] Sync failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Create or update customer from BaseLinker order
   */
  private async createOrUpdateCustomer(
    order: BaseLinkerOrder,
    companyId: string,
    tenantId: string
  ): Promise<Customer> {
    try {
      // Try to find existing customer by email
      let customer = order.email
        ? await this.customerRepository.findOne({
            where: { email: order.email, companyId, tenantId },
          })
        : null;

      if (!customer) {
        // Create new customer
        customer = this.customerRepository.create({
          id: uuidv4(),
          tenantId,
          companyId,
          name: order.delivery_fullname || order.delivery_company || 'Unknown Customer',
          email: order.email || '',
          phone: order.phone || '',
          type: CustomerType.INDIVIDUAL,
          billingAddress: order.delivery_address || '',
          billingCity: order.delivery_city || '',
          billingPostalCode: order.delivery_postcode || '',
          billingCountry: order.delivery_country_code || 'PL',
          isActive: true,
        });

        await this.customerRepository.save(customer);
        logger.info(`[BaseLinker] Created customer: ${customer.name}`);
      }

      return customer;
    } catch (error) {
      logger.error(`[BaseLinker] Failed to create/update customer: ${error}`);
      throw error;
    }
  }

  /**
   * Create or update products from BaseLinker order
   */
  private async createOrUpdateProducts(
    order: BaseLinkerOrder,
    companyId: string,
    tenantId: string,
    defaultVatRate: number = 23
  ): Promise<void> {
    try {
      for (const item of order.products) {
        // Try to find existing product by SKU or product ID
        let product = await this.productRepository.findOne({
          where: [
            { sku: item.sku, companyId, tenantId },
            { name: item.name, companyId, tenantId },
          ],
        });

        if (!product) {
          // Create new product
          product = this.productRepository.create({
            id: uuidv4(),
            tenantId,
            companyId,
            name: item.name,
            sku: item.sku || item.product_id,
            description: '',
            price: item.price_brutto,
            vatRate: item.tax_rate || defaultVatRate,
            unit: 'pcs',
            isActive: true,
          });

          await this.productRepository.save(product);
          logger.info(`[BaseLinker] Created product: ${product.name}`);
        }
      }
    } catch (error) {
      logger.error(`[BaseLinker] Failed to create/update products: ${error}`);
      throw error;
    }
  }

  /**
   * Generate invoice from BaseLinker order
   */
  private async generateInvoice(
    order: BaseLinkerOrder,
    customer: Customer,
    companyId: string,
    tenantId: string,
    settings: BaseLinkerSettings
  ): Promise<Invoice> {
    try {
      // Map order items to invoice items
      const items: InvoiceItemInput[] = await Promise.all(
        order.products.map(async (item) => {
          // Find product
          const product = await this.productRepository.findOne({
            where: [
              { sku: item.sku, companyId, tenantId },
              { name: item.name, companyId, tenantId },
            ],
          });

          return {
            productId: product?.id || undefined,
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.price_brutto,
            vatRate: item.tax_rate || settings.defaultVatRate || 23,
            discountPercent: 0,
          };
        })
      );

      const invoiceData: InvoiceCreateInput = {
        companyId,
        customerId: customer.id,
        invoiceType: InvoiceType.STANDARD,
        issueDate: new Date(order.date_add * 1000),
        dueDate: new Date(order.date_add * 1000 + 14 * 24 * 60 * 60 * 1000), // 14 days
        items,
        notes: `BaseLinker Order: ${order.shop_order_id || order.external_order_id || order.order_id}`,
        internalNotes: `BaseLinker Order ID: ${order.order_id}`,
        paymentMethod: order.payment_method || 'transfer',
      };

      const invoice = await this.invoiceService.createInvoice(tenantId, invoiceData);

      logger.info(
        `[BaseLinker] Generated invoice ${invoice.invoiceNumber} for order ${order.order_id}`
      );

      return invoice;
    } catch (error) {
      logger.error(`[BaseLinker] Failed to generate invoice: ${error}`);
      throw error;
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(integrationId: string): Promise<BaseLinkerIntegration | null> {
    return this.baselinkerRepository.findOne({
      where: { id: integrationId },
    });
  }

  /**
   * Get all integrations for a tenant
   */
  async getIntegrationsByTenant(tenantId: string): Promise<BaseLinkerIntegration[]> {
    return this.baselinkerRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Deactivate integration
   */
  async deactivateIntegration(integrationId: string): Promise<void> {
    await this.baselinkerRepository.update(integrationId, {
      isActive: false,
    });

    logger.info(`[BaseLinker] Integration ${integrationId} deactivated`);
  }

  /**
   * Get settings with defaults
   */
  getSettingsWithDefaults(settings: Partial<BaseLinkerSettings>): BaseLinkerSettings {
    return {
      autoGenerateInvoices: settings.autoGenerateInvoices ?? true,
      invoiceTemplateId: settings.invoiceTemplateId,
      syncFrequencyMinutes: settings.syncFrequencyMinutes ?? 60,
      autoMarkAsPaid: settings.autoMarkAsPaid ?? false,
      autoCreateCustomer: settings.autoCreateCustomer ?? true,
      autoCreateProduct: settings.autoCreateProduct ?? true,
      defaultVatRate: settings.defaultVatRate ?? 23,
      orderSources: settings.orderSources,
    };
  }

  /**
   * Update integration settings
   */
  async updateSettings(
    integrationId: string,
    settings: Partial<BaseLinkerSettings>
  ): Promise<BaseLinkerSettings> {
    const integration = await this.baselinkerRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const updatedSettings = {
      ...integration.settings,
      ...settings,
    };

    await this.baselinkerRepository.update(integrationId, {
      settings: updatedSettings,
    });

    logger.info(`[BaseLinker] Settings updated for integration: ${integrationId}`);

    return this.getSettingsWithDefaults(updatedSettings);
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default BaseLinkerService;
