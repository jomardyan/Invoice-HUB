import { AppDataSource } from '@/config/database';
import { Tenant, SubscriptionTier, SubscriptionStatus } from '@/entities/Tenant';
import logger from '@/utils/logger';

export interface TenantCreateInput {
  name: string;
  description?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface TenantUpdateInput {
  name?: string;
  description?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings?: Record<string, any>;
}

export class TenantService {
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['users', 'companies'],
    });
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return await this.tenantRepository.findOne({
      where: { name: slug },
    });
  }

  async updateTenant(tenantId: string, input: TenantUpdateInput): Promise<Tenant> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      if (input.name) {
        tenant.name = input.name;
      }

      if (input.description !== undefined) {
        tenant.description = input.description;
      }

      if (input.branding) {
        tenant.branding = { ...tenant.branding, ...input.branding };
      }

      if (input.settings) {
        tenant.settings = { ...tenant.settings, ...input.settings };
      }

      const updated = await this.tenantRepository.save(tenant);
      logger.info(`Tenant updated: ${tenantId}`);

      return updated;
    } catch (error) {
      logger.error('Tenant update error:', error);
      throw error;
    }
  }

  async incrementInvoiceCount(tenantId: string): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.invoicesThisMonth = (tenant.invoicesThisMonth || 0) + 1;
      await this.tenantRepository.save(tenant);
    } catch (error) {
      logger.error('Invoice count increment error:', error);
      throw error;
    }
  }

  async checkInvoiceQuota(tenantId: string): Promise<boolean> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Free tier has 100 invoices per month
      return (tenant.invoicesThisMonth || 0) < tenant.invoiceQuotaPerMonth;
    } catch (error) {
      logger.error('Invoice quota check error:', error);
      throw error;
    }
  }

  async resetMonthlyQuota(tenantId: string): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.invoicesThisMonth = 0;
      await this.tenantRepository.save(tenant);
      logger.info(`Monthly quota reset for tenant: ${tenantId}`);
    } catch (error) {
      logger.error('Monthly quota reset error:', error);
      throw error;
    }
  }

  async updateSubscription(
    tenantId: string,
    tier: SubscriptionTier,
    status: SubscriptionStatus,
    expiresAt?: Date
  ): Promise<Tenant> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.subscriptionTier = tier;
      tenant.subscriptionStatus = status;

      if (expiresAt) {
        tenant.subscriptionExpiresAt = expiresAt;
      }

      // Update invoice quota based on tier
      const quotas: Record<SubscriptionTier, number> = {
        [SubscriptionTier.FREE]: 100,
        [SubscriptionTier.BASIC]: 1000,
        [SubscriptionTier.PROFESSIONAL]: 10000,
        [SubscriptionTier.ENTERPRISE]: 999999,
      };

      tenant.invoiceQuotaPerMonth = quotas[tier];

      const updated = await this.tenantRepository.save(tenant);
      logger.info(`Subscription updated for tenant: ${tenantId} - ${tier}`);

      return updated;
    } catch (error) {
      logger.error('Subscription update error:', error);
      throw error;
    }
  }

  async deactivateTenant(tenantId: string): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.isActive = false;
      await this.tenantRepository.save(tenant);
      logger.info(`Tenant deactivated: ${tenantId}`);
    } catch (error) {
      logger.error('Tenant deactivation error:', error);
      throw error;
    }
  }
}

export default new TenantService();
