import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import config from '@/config';
import { AllegroIntegration } from '@/entities/AllegroIntegration';
import { Invoice, InvoiceType } from '@/entities/Invoice';
import { Customer, CustomerType } from '@/entities/Customer';
import { Product } from '@/entities/Product';
import { InvoiceService, InvoiceCreateInput, InvoiceItemInput } from './InvoiceService';
import { encryptionService } from '@/utils/encryption';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import RedisClient from '@/config/redis';

export interface AllegroOrder {
  id: string;
  number: string;
  buyerLogin: string;
  buyerEmail: string;
  totalPrice: number;
  lineItems: AllegroLineItem[];
  delivery: {
    address: {
      firstName: string;
      lastName: string;
      street: string;
      zipCode: string;
      city: string;
      countryCode: string;
    };
  };
  createdAt: string;
  status: string;
}

export interface AllegroLineItem {
  id: string;
  offer: {
    id: string;
    title: string;
  };
  quantity: number;
  price: number;
}

export interface AllegroTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface AllegroOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}

export interface AllegroSyncResult {
  success: boolean;
  ordersProcessed: number;
  invoicesCreated: number;
  errors: string[];
}

export interface AllegroSettings {
  autoGenerateInvoices?: boolean;
  invoiceTemplateId?: string;
  syncFrequencyMinutes?: number;
  autoMarkAsPaid?: boolean;
  autoCreateCustomer?: boolean;
  autoCreateProduct?: boolean;
  defaultVatRate?: number;
}

export class AllegroService {
  private allegroRepository: Repository<AllegroIntegration>;
  private invoiceRepository: Repository<Invoice>;
  private customerRepository: Repository<Customer>;
  private productRepository: Repository<Product>;
  private invoiceService: InvoiceService;
  private apiClient: AxiosInstance;
  private readonly ALLEGRO_API_URL = config.allegro.apiUrl;
  private readonly ALLEGRO_AUTH_URL = `${this.ALLEGRO_API_URL}/auth/oauth/authorize`;
  private readonly ALLEGRO_TOKEN_URL = `${this.ALLEGRO_API_URL}/auth/oauth/token`;
  private readonly ORDERS_ENDPOINT = '/order/checkout-forms';
  private readonly MAX_RETRIES = 6;
  private readonly RETRY_DELAYS = [1000, 60000, 300000, 900000, 3600000, 14400000]; // 1s, 1m, 5m, 15m, 1h, 4h
  private readonly IDEMPOTENCY_KEY_PREFIX = 'allegro:order:';

  constructor() {
    this.allegroRepository = AppDataSource.getRepository(AllegroIntegration);
    this.invoiceRepository = AppDataSource.getRepository(Invoice);
    this.customerRepository = AppDataSource.getRepository(Customer);
    this.productRepository = AppDataSource.getRepository(Product);
    this.invoiceService = new InvoiceService();

    this.apiClient = axios.create({
      baseURL: this.ALLEGRO_API_URL,
      timeout: 10000,
    });
  }

  /**
   * Initialize OAuth 2.0 authorization flow
   */
  getAuthorizationUrl(tenantId: string): string {
    const state = Buffer.from(JSON.stringify({ tenantId, timestamp: Date.now() })).toString(
      'base64'
    );
    const params = new URLSearchParams({
      client_id: config.allegro.clientId,
      response_type: 'code',
      redirect_uri: config.allegro.redirectUri,
      state,
    });

    return `${this.ALLEGRO_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    tenantId: string,
    userId: string,
    code: string
  ): Promise<AllegroIntegration> {
    try {
      logger.info(`[Allegro] Exchanging authorization code for tenant: ${tenantId}`);

      const response = await axios.post<AllegroTokenResponse>(
        this.ALLEGRO_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          code,
          client_id: config.allegro.clientId,
          client_secret: config.allegro.clientSecret,
          redirect_uri: config.allegro.redirectUri,
        },
        { timeout: 10000 }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Fetch Allegro user info
      const userInfo = await this.fetchAllegroUserInfo(access_token);

      // Encrypt tokens before storing
      const encryptedAccessToken = encryptionService.encrypt(access_token);
      const encryptedRefreshToken = encryptionService.encrypt(refresh_token || '');

      // Check if integration already exists for this user
      let integration = await this.allegroRepository.findOne({
        where: { tenantId, userId, allegroUserId: userInfo.userId },
      });

      if (!integration) {
        integration = this.allegroRepository.create({
          id: uuidv4(),
          tenantId,
          userId,
          allegroUserId: userInfo.userId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
          isActive: true,
          syncErrorCount: 0,
        });
      } else {
        integration.accessToken = encryptedAccessToken;
        integration.refreshToken = encryptedRefreshToken;
        integration.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
        integration.isActive = true;
      }

      await this.allegroRepository.save(integration);

      logger.info(
        `[Allegro] Successfully authenticated Allegro user: ${userInfo.userId} for tenant: ${tenantId}`
      );

      return integration;
    } catch (error) {
      logger.error(
        `[Allegro] Failed to exchange authorization code: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw new Error(`Failed to authenticate with Allegro: ${error}`);
    }
  }

  /**
   * Fetch Allegro user information
   */
  private async fetchAllegroUserInfo(accessToken: string): Promise<{ userId: string }> {
    try {
      const response = await this.apiClient.get('/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
        },
      });

      return { userId: response.data.data.id };
    } catch (error) {
      logger.error(`[Allegro] Failed to fetch user info: ${error}`);
      throw new Error('Failed to fetch Allegro user information');
    }
  }

  /**
   * Refresh access token if expired or close to expiration
   */
  async refreshTokenIfNeeded(integration: AllegroIntegration): Promise<string> {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (integration.tokenExpiresAt > oneHourFromNow) {
      // Token still valid for >1 hour
      return encryptionService.decrypt(integration.accessToken);
    }

    try {
      logger.info(`[Allegro] Refreshing token for integration: ${integration.id}`);

      const refreshToken = encryptionService.decrypt(integration.refreshToken);
      const response = await axios.post<AllegroTokenResponse>(
        this.ALLEGRO_TOKEN_URL,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: config.allegro.clientId,
          client_secret: config.allegro.clientSecret,
        },
        { timeout: 10000 }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Update integration
      integration.accessToken = encryptionService.encrypt(access_token);
      if (refresh_token) {
        integration.refreshToken = encryptionService.encrypt(refresh_token);
      }
      integration.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      await this.allegroRepository.save(integration);

      logger.info(`[Allegro] Token refreshed successfully for integration: ${integration.id}`);

      return access_token;
    } catch (error) {
      logger.error(`[Allegro] Failed to refresh token: ${error}`);
      integration.isActive = false;
      await this.allegroRepository.save(integration);
      throw new Error('Failed to refresh Allegro access token');
    }
  }

  /**
   * Fetch orders from Allegro API
   */
  async fetchOrders(
    integrationId: string,
    _companyId: string,
    limit: number = 100
  ): Promise<AllegroOrder[]> {
    try {
      const integration = await this.allegroRepository.findOne({
        where: { id: integrationId },
      });

      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive');
      }

      // Refresh token if needed
      const accessToken = await this.refreshTokenIfNeeded(integration);

      logger.info(`[Allegro] Fetching orders for integration: ${integrationId}`);

      const response = await this.apiClient.get(this.ORDERS_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
        },
        params: {
          limit,
          status: ['SENT', 'PROCESSING'], // Only fetch new and processing orders
        },
      });

      const orders: AllegroOrder[] = response.data.data.map((order: any) => ({
        id: order.id,
        number: order.attributes.number,
        buyerLogin: order.attributes.buyer.login,
        buyerEmail: order.attributes.buyer.email,
        totalPrice: order.attributes.totalPrice.amount,
        lineItems: order.attributes.lineItems.map((item: any) => ({
          id: item.id,
          offer: {
            id: item.offer.id,
            title: item.offer.title,
          },
          quantity: item.quantity,
          price: item.originalPrice.amount,
        })),
        delivery: {
          address: {
            firstName: order.attributes.delivery.address.firstName,
            lastName: order.attributes.delivery.address.lastName,
            street: order.attributes.delivery.address.street,
            zipCode: order.attributes.delivery.address.zipCode,
            city: order.attributes.delivery.address.city,
            countryCode: order.attributes.delivery.address.countryCode,
          },
        },
        createdAt: order.attributes.createdAt,
        status: order.attributes.status,
      }));

      logger.info(`[Allegro] Fetched ${orders.length} orders for integration: ${integrationId}`);

      return orders;
    } catch (error) {
      logger.error(`[Allegro] Failed to fetch orders: ${error}`);
      throw error;
    }
  }

  /**
   * Detect duplicate order (by Allegro order ID)
   */
  private async isDuplicateOrder(
    tenantId: string,
    allegroOrderId: string
  ): Promise<boolean> {
    const cacheKey = `${this.IDEMPOTENCY_KEY_PREFIX}${allegroOrderId}`;
    const cached = await (RedisClient.getInstance().getClient().get(cacheKey));

    if (cached) {
      return true;
    }

    // Check database for invoice with this Allegro order ID
    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        tenantId,
        externalOrderId: allegroOrderId,
      },
    });

    return !!existingInvoice;
  }

  /**
   * Cache order as processed
   */
  private async cacheProcessedOrder(allegroOrderId: string): Promise<void> {
    const cacheKey = `${this.IDEMPOTENCY_KEY_PREFIX}${allegroOrderId}`;
    await RedisClient.getInstance().getClient().setEx(cacheKey, 86400, '1'); // Cache for 24 hours
  }

  /**
   * Auto-generate invoice from Allegro order
   */
  async autoGenerateInvoiceFromOrder(
    tenantId: string,
    allegroCompanyId: string,
    order: AllegroOrder
  ): Promise<Invoice | null> {
    try {
      // Check for duplicate order
      if (await this.isDuplicateOrder(tenantId, order.id)) {
        logger.warn(
          `[Allegro] Duplicate order detected (already processed): ${order.id} for tenant: ${tenantId}`
        );
        return null;
      }

      logger.info(`[Allegro] Processing order: ${order.number} for tenant: ${tenantId}`);

      // Find or create customer from Allegro buyer
      let customer = await this.customerRepository.findOne({
        where: {
          tenantId,
          externalOrderId: order.buyerLogin,
        },
      });

      if (!customer) {
        customer = new Customer();
        customer.id = uuidv4();
        customer.tenantId = tenantId;
        customer.companyId = allegroCompanyId;
        customer.name = `${order.delivery.address.firstName} ${order.delivery.address.lastName}`;
        customer.email = order.buyerEmail;
        customer.externalOrderId = order.buyerLogin; // Store Allegro username
        customer.billingAddress = order.delivery.address.street;
        customer.billingPostalCode = order.delivery.address.zipCode;
        customer.billingCity = order.delivery.address.city;
        customer.billingCountry = order.delivery.address.countryCode;
        customer.type = CustomerType.INDIVIDUAL;
        customer.isActive = true;

        await this.customerRepository.save(customer);
        logger.info(`[Allegro] Created customer from Allegro buyer: ${order.buyerLogin}`);
      }

      // Map order items to invoice items
      const invoiceItems: InvoiceItemInput[] = await Promise.all(
        order.lineItems.map(async (lineItem) => {
          // Try to find matching product by Allegro offer ID
          let product = await this.productRepository.findOne({
            where: {
              tenantId,
              externalProductId: lineItem.offer.id,
            },
          });

          if (!product) {
            // Create product if not found
            product = new Product();
            product.id = uuidv4();
            product.tenantId = tenantId;
            product.companyId = allegroCompanyId;
            product.sku = `ALLEGRO-${lineItem.offer.id}`;
            product.name = lineItem.offer.title;
            product.description = lineItem.offer.title;
            product.externalProductId = lineItem.offer.id;
            product.unitPrice = lineItem.price;
            product.vatRate = 23; // Default Polish VAT rate
            product.price = lineItem.price;
            product.isActive = true;

            await this.productRepository.save(product);
            logger.info(`[Allegro] Created product from Allegro offer: ${lineItem.offer.id}`);
          }

          return {
            productId: product.id,
            description: lineItem.offer.title,
            quantity: lineItem.quantity,
            unitPrice: lineItem.price,
            vatRate: product.vatRate || 23,
          };
        })
      );

      // Create invoice
      const invoiceInput: InvoiceCreateInput = {
        companyId: allegroCompanyId,
        customerId: customer.id,
        invoiceType: InvoiceType.STANDARD,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        items: invoiceItems,
        notes: `Auto-generated from Allegro order #${order.number}`,
      };

      const invoice = await this.invoiceService.createInvoice(tenantId, invoiceInput);

      // Link invoice to Allegro order
      invoice.externalOrderId = order.id;
      await this.invoiceRepository.save(invoice);

      // Cache processed order
      await this.cacheProcessedOrder(order.id);

      logger.info(
        `[Allegro] Invoice ${invoice.invoiceNumber} created from order ${order.number}`
      );

      return invoice;
    } catch (error) {
      logger.error(
        `[Allegro] Failed to generate invoice from order ${order.number}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  /**
   * Sync orders and auto-generate invoices with retry logic
   */
  async syncOrdersWithRetry(
    integrationId: string,
    companyId: string,
    tenantId: string
  ): Promise<AllegroSyncResult> {
    const result: AllegroSyncResult = {
      success: true,
      ordersProcessed: 0,
      invoicesCreated: 0,
      errors: [],
    };

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const orders = await this.fetchOrders(integrationId, companyId, 100);
        const integration = await this.allegroRepository.findOne({
          where: { id: integrationId },
        });

        if (!integration) {
          throw new Error('Integration not found');
        }

        result.ordersProcessed = orders.length;

        for (const order of orders) {
          try {
            const invoice = await this.autoGenerateInvoiceFromOrder(tenantId, companyId, order);

            if (invoice) {
              result.invoicesCreated++;
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Order ${order.number}: ${errorMsg}`);
            logger.error(`[Allegro] Failed to process order ${order.number}: ${errorMsg}`);
          }
        }

        // Reset error count on success
        if (result.errors.length === 0) {
          integration.syncErrorCount = 0;
          integration.lastSyncAt = new Date();
        } else {
          integration.syncErrorCount++;
          integration.lastSyncError = result.errors[0];

          // Disable integration if too many errors
          if (integration.syncErrorCount >= 5) {
            integration.isActive = false;
            logger.warn(
              `[Allegro] Integration ${integrationId} disabled due to repeated sync failures`
            );
          }
        }

        await this.allegroRepository.save(integration);

        logger.info(
          `[Allegro] Sync completed. Processed: ${result.ordersProcessed}, Invoices created: ${result.invoicesCreated}, Errors: ${result.errors.length}`
        );

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Sync attempt ${attempt + 1}: ${errorMsg}`);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          logger.warn(
            `[Allegro] Sync failed (attempt ${attempt + 1}/${this.MAX_RETRIES}), retrying in ${delay}ms: ${errorMsg}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          result.success = false;
          logger.error(
            `[Allegro] Sync failed after ${this.MAX_RETRIES} attempts: ${errorMsg}`
          );
        }
      }
    }

    return result;
  }

  /**
   * Get integration status and sync history
   */
  async getIntegrationStatus(integrationId: string): Promise<AllegroIntegration | null> {
    return this.allegroRepository.findOne({ where: { id: integrationId } });
  }

  /**
   * Deactivate integration
   */
  async deactivateIntegration(integrationId: string): Promise<void> {
    const integration = await this.allegroRepository.findOne({ where: { id: integrationId } });

    if (integration) {
      integration.isActive = false;
      await this.allegroRepository.save(integration);
      logger.info(`[Allegro] Integration ${integrationId} deactivated`);
    }
  }

  /**
   * Get integration settings
   */
  async getSettings(integrationId: string): Promise<AllegroSettings | null> {
    const integration = await this.allegroRepository.findOne({ where: { id: integrationId } });
    return integration?.settings || null;
  }

  /**
   * Update integration settings
   */
  async updateSettings(integrationId: string, settings: Partial<AllegroSettings>): Promise<AllegroSettings> {
    const integration = await this.allegroRepository.findOne({ where: { id: integrationId } });

    if (!integration) {
      throw new Error('Integration not found');
    }

    integration.settings = {
      ...integration.settings,
      ...settings,
    };

    await this.allegroRepository.save(integration);
    logger.info(`[Allegro] Settings updated for integration: ${integrationId}`);

    return integration.settings as AllegroSettings;
  }

  /**
   * Get settings with defaults
   */
  async getSettingsWithDefaults(integrationId: string): Promise<AllegroSettings> {
    const settings = await this.getSettings(integrationId);

    return {
      autoGenerateInvoices: settings?.autoGenerateInvoices ?? true,
      invoiceTemplateId: settings?.invoiceTemplateId,
      syncFrequencyMinutes: settings?.syncFrequencyMinutes ?? 60,
      autoMarkAsPaid: settings?.autoMarkAsPaid ?? false,
      autoCreateCustomer: settings?.autoCreateCustomer ?? true,
      autoCreateProduct: settings?.autoCreateProduct ?? true,
      defaultVatRate: settings?.defaultVatRate ?? 23,
    };
  }

  /**
   * Get all integrations for a tenant
   */
  async getIntegrationsByTenant(tenantId: string): Promise<AllegroIntegration[]> {
    try {
      const integrationRepo = AppDataSource.getRepository(AllegroIntegration);
      const integrations = await integrationRepo.find({
        where: { tenant: { id: tenantId } },
        relations: ['tenant', 'company'],
      });
      return integrations;
    } catch (error) {
      logger.error(`[Allegro] Failed to fetch integrations for tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

export default AllegroService;
