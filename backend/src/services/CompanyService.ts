import { AppDataSource } from '@/config/database';
import { Company } from '@/entities/Company';
import { Tenant } from '@/entities/Tenant';
import logger from '@/utils/logger';

export interface CompanyCreateInput {
  name: string;
  nip: string;
  vatEu?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  swift?: string;
  logoUrl?: string;
  defaultInvoiceSettings?: {
    paymentTermDays?: number;
    defaultCurrency?: string;
    taxRate?: number;
    invoicePrefix?: string;
    invoiceNumberFormat?: string;
  };
}

export interface CompanyUpdateInput {
  name?: string;
  vatEu?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  swift?: string;
  logoUrl?: string;
  defaultInvoiceSettings?: Record<string, any>;
}

export class CompanyService {
  private companyRepository = AppDataSource.getRepository(Company);
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async createCompany(tenantId: string, input: CompanyCreateInput): Promise<Company> {
    try {
      // Check if tenant exists
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check for duplicate NIP within tenant
      const existing = await this.companyRepository.findOne({
        where: { tenantId, nip: input.nip },
      });

      if (existing) {
        throw new Error('Company with this NIP already exists in your account');
      }

      const company = this.companyRepository.create({
        tenantId,
        name: input.name,
        nip: input.nip,
        vatEu: input.vatEu,
        address: input.address,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country || 'PL',
        email: input.email,
        phone: input.phone,
        website: input.website,
        bankName: input.bankName,
        bankAccount: input.bankAccount,
        swift: input.swift,
        logoUrl: input.logoUrl,
        defaultInvoiceSettings: input.defaultInvoiceSettings,
        isActive: true,
      }) as Company;

      const saved = await this.companyRepository.save(company);
      logger.info(`Company created: ${saved.id} for tenant ${tenantId}`);

      return saved;
    } catch (error) {
      logger.error('Company creation error:', error);
      throw error;
    }
  }

  async getCompanyById(tenantId: string, companyId: string): Promise<Company | null> {
    return await this.companyRepository.findOne({
      where: { id: companyId, tenantId },
    });
  }

  async getCompanyByNip(tenantId: string, nip: string): Promise<Company | null> {
    return await this.companyRepository.findOne({
      where: { tenantId, nip },
    });
  }

  async listCompanies(tenantId: string, skip: number = 0, take: number = 50): Promise<[Company[], number]> {
    return await this.companyRepository.findAndCount({
      where: { tenantId, isActive: true },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async updateCompany(
    tenantId: string,
    companyId: string,
    input: CompanyUpdateInput
  ): Promise<Company> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId, tenantId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // NIP cannot be changed
      if (input.name) company.name = input.name;
      if (input.vatEu !== undefined) company.vatEu = input.vatEu;
      if (input.address !== undefined) company.address = input.address;
      if (input.postalCode !== undefined) company.postalCode = input.postalCode;
      if (input.city !== undefined) company.city = input.city;
      if (input.country !== undefined) company.country = input.country;
      if (input.email !== undefined) company.email = input.email;
      if (input.phone !== undefined) company.phone = input.phone;
      if (input.website !== undefined) company.website = input.website;
      if (input.bankName !== undefined) company.bankName = input.bankName;
      if (input.bankAccount !== undefined) company.bankAccount = input.bankAccount;
      if (input.swift !== undefined) company.swift = input.swift;
      if (input.logoUrl !== undefined) company.logoUrl = input.logoUrl;
      if (input.defaultInvoiceSettings !== undefined) {
        company.defaultInvoiceSettings = input.defaultInvoiceSettings;
      }

      const updated = await this.companyRepository.save(company);
      logger.info(`Company updated: ${companyId}`);

      return updated;
    } catch (error) {
      logger.error('Company update error:', error);
      throw error;
    }
  }

  async deleteCompany(tenantId: string, companyId: string): Promise<void> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId, tenantId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      company.isActive = false;
      await this.companyRepository.save(company);
      logger.info(`Company deactivated: ${companyId}`);
    } catch (error) {
      logger.error('Company deletion error:', error);
      throw error;
    }
  }
}

export default new CompanyService();
