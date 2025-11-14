import { AppDataSource } from '@/config/database';
import { Customer, CustomerType } from '@/entities/Customer';
import { Tenant } from '@/entities/Tenant';
import logger from '@/utils/logger';

export interface CustomerCreateInput {
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  nip?: string;
  vatEu?: string;
  billingAddress?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  shippingCountry?: string;
  creditLimit?: number;
  paymentTermDays?: number;
  tags?: string[];
  preferences?: {
    preferredLanguage?: string;
    preferredCurrency?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
  notes?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  type?: CustomerType;
  email?: string;
  phone?: string;
  nip?: string;
  vatEu?: string;
  billingAddress?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  shippingCountry?: string;
  creditLimit?: number;
  paymentTermDays?: number;
  tags?: string[];
  preferences?: Record<string, any>;
  notes?: string;
}

export class CustomerService {
  private customerRepository = AppDataSource.getRepository(Customer);
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async createCustomer(tenantId: string, input: CustomerCreateInput): Promise<Customer> {
    try {
      // Check if tenant exists
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check for duplicate email if provided
      if (input.email) {
        const existing = await this.customerRepository.findOne({
          where: { tenantId, email: input.email },
        });

        if (existing) {
          throw new Error('Customer with this email already exists');
        }
      }

      const customer = this.customerRepository.create({
        tenantId,
        name: input.name,
        type: input.type || CustomerType.INDIVIDUAL,
        email: input.email,
        phone: input.phone,
        nip: input.nip,
        vatEu: input.vatEu,
        billingAddress: input.billingAddress,
        billingPostalCode: input.billingPostalCode,
        billingCity: input.billingCity,
        billingCountry: input.billingCountry || 'PL',
        shippingAddress: input.shippingAddress,
        shippingPostalCode: input.shippingPostalCode,
        shippingCity: input.shippingCity,
        shippingCountry: input.shippingCountry,
        creditLimit: input.creditLimit || 0,
        paymentTermDays: input.paymentTermDays || 30,
        tags: input.tags,
        preferences: input.preferences,
        notes: input.notes,
        isActive: true,
      }) as Customer;

      const saved = await this.customerRepository.save(customer);
      logger.info(`Customer created: ${saved.id} for tenant ${tenantId}`);

      return saved;
    } catch (error) {
      logger.error('Customer creation error:', error);
      throw error;
    }
  }

  async getCustomerById(tenantId: string, customerId: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });
  }

  async listCustomers(
    tenantId: string,
    skip: number = 0,
    take: number = 50,
    type?: CustomerType
  ): Promise<[Customer[], number]> {
    const where: any = { tenantId, isActive: true };
    if (type) where.type = type;

    return await this.customerRepository.findAndCount({
      where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async searchCustomers(tenantId: string, query: string): Promise<Customer[]> {
    return await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId })
      .andWhere('customer.isActive = true')
      .andWhere(
        '(customer.name ILIKE :query OR customer.email ILIKE :query OR customer.nip ILIKE :query)',
        { query: `%${query}%` }
      )
      .limit(20)
      .getMany();
  }

  async updateCustomer(
    tenantId: string,
    customerId: string,
    input: CustomerUpdateInput
  ): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Check for duplicate email if changing it
      if (input.email && input.email !== customer.email) {
        const existing = await this.customerRepository.findOne({
          where: { tenantId, email: input.email },
        });

        if (existing) {
          throw new Error('Customer with this email already exists');
        }

        customer.email = input.email;
      }

      if (input.name !== undefined) customer.name = input.name;
      if (input.type !== undefined) customer.type = input.type;
      if (input.phone !== undefined) customer.phone = input.phone;
      if (input.nip !== undefined) customer.nip = input.nip;
      if (input.vatEu !== undefined) customer.vatEu = input.vatEu;
      if (input.billingAddress !== undefined) customer.billingAddress = input.billingAddress;
      if (input.billingPostalCode !== undefined) customer.billingPostalCode = input.billingPostalCode;
      if (input.billingCity !== undefined) customer.billingCity = input.billingCity;
      if (input.billingCountry !== undefined) customer.billingCountry = input.billingCountry;
      if (input.shippingAddress !== undefined) customer.shippingAddress = input.shippingAddress;
      if (input.shippingPostalCode !== undefined) customer.shippingPostalCode = input.shippingPostalCode;
      if (input.shippingCity !== undefined) customer.shippingCity = input.shippingCity;
      if (input.shippingCountry !== undefined) customer.shippingCountry = input.shippingCountry;
      if (input.creditLimit !== undefined) customer.creditLimit = input.creditLimit;
      if (input.paymentTermDays !== undefined) customer.paymentTermDays = input.paymentTermDays;
      if (input.tags !== undefined) customer.tags = input.tags;
      if (input.preferences !== undefined) customer.preferences = input.preferences;
      if (input.notes !== undefined) customer.notes = input.notes;

      const updated = await this.customerRepository.save(customer);
      logger.info(`Customer updated: ${customerId}`);

      return updated;
    } catch (error) {
      logger.error('Customer update error:', error);
      throw error;
    }
  }

  async deleteCustomer(tenantId: string, customerId: string): Promise<void> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      customer.isActive = false;
      await this.customerRepository.save(customer);
      logger.info(`Customer deactivated: ${customerId}`);
    } catch (error) {
      logger.error('Customer deletion error:', error);
      throw error;
    }
  }

  async addCustomerTag(tenantId: string, customerId: string, tag: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const tags = customer.tags || [];
      if (!tags.includes(tag)) {
        tags.push(tag);
        customer.tags = tags;
        await this.customerRepository.save(customer);
      }

      return customer;
    } catch (error) {
      logger.error('Add customer tag error:', error);
      throw error;
    }
  }

  async removeCustomerTag(tenantId: string, customerId: string, tag: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const tags = customer.tags || [];
      customer.tags = tags.filter((t) => t !== tag);
      await this.customerRepository.save(customer);

      return customer;
    } catch (error) {
      logger.error('Remove customer tag error:', error);
      throw error;
    }
  }
}

export default new CustomerService();
