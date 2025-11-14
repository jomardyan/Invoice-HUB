import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { Invoice, InvoiceStatus, InvoiceType } from '@/entities/Invoice';
import { InvoiceItem } from '@/entities/InvoiceItem';
import { Company } from '@/entities/Company';
import { Customer } from '@/entities/Customer';
import { TaxCalculationService } from './TaxCalculationService';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface InvoiceCreateInput {
  companyId: string;
  customerId: string;
  invoiceType: InvoiceType;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItemInput[];
  notes?: string;
  termsAndConditions?: string;
  paymentMethod?: string;
  internalNotes?: string;
}

export interface InvoiceItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent?: number;
}

export interface InvoiceUpdateInput {
  issueDate?: Date;
  dueDate?: Date;
  items?: InvoiceItemInput[];
  notes?: string;
  termsAndConditions?: string;
  paymentMethod?: string;
  internalNotes?: string;
}

export interface InvoiceNumberSeriesConfig {
  pattern: string; // e.g., "INV-{YYYY}-{MM}-{000001}"
  nextNumber: number;
  resetFrequency: 'never' | 'yearly' | 'monthly';
  lastResetDate: Date;
}

export class InvoiceService {
  private invoiceRepository: Repository<Invoice>;
  private invoiceItemRepository: Repository<InvoiceItem>;
  private companyRepository: Repository<Company>;
  private customerRepository: Repository<Customer>;
  private taxService: TaxCalculationService;

  constructor() {
    this.invoiceRepository = AppDataSource.getRepository(Invoice);
    this.invoiceItemRepository = AppDataSource.getRepository(InvoiceItem);
    this.companyRepository = AppDataSource.getRepository(Company);
    this.customerRepository = AppDataSource.getRepository(Customer);
    this.taxService = new TaxCalculationService();
  }

  /**
   * Create a new invoice
   */
  async createInvoice(tenantId: string, input: InvoiceCreateInput): Promise<Invoice> {
    try {
      // Verify company and customer belong to tenant
      const company = await this.companyRepository.findOne({
        where: { id: input.companyId, tenantId },
      });
      if (!company) throw new Error('Company not found');

      const customer = await this.customerRepository.findOne({
        where: { id: input.customerId, tenantId },
      });
      if (!customer) throw new Error('Customer not found');

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Create invoice
      const invoice = this.invoiceRepository.create();
      invoice.id = uuidv4();
      invoice.tenantId = tenantId;
      invoice.companyId = input.companyId;
      invoice.customerId = input.customerId;
      invoice.createdById = tenantId; // Will be updated with actual user ID from auth context
      invoice.invoiceNumber = invoiceNumber;
      invoice.type = input.invoiceType;
      invoice.status = InvoiceStatus.DRAFT;
      invoice.issueDate = input.issueDate;
      invoice.dueDate = input.dueDate;
      invoice.notes = input.notes || '';
      invoice.termsAndConditions = input.termsAndConditions || '';
      invoice.currency = 'PLN';

      // Process line items
      const items: InvoiceItem[] = [];
      let totalNetAmount = 0;
      let totalTaxAmount = 0;

      for (const itemInput of input.items) {
        const taxCalc = this.taxService.calculateLineTax({
          netAmount: itemInput.unitPrice * itemInput.quantity,
          vatRate: itemInput.vatRate,
          discountPercent: itemInput.discountPercent || 0,
        });

        const item = this.invoiceItemRepository.create();
        item.id = uuidv4();
        item.invoiceId = invoice.id;
        item.description = itemInput.description;
        item.quantity = itemInput.quantity;
        item.unitPrice = itemInput.unitPrice;
        item.netAmount = taxCalc.taxableAmount;
        item.vatRate = itemInput.vatRate;
        item.taxAmount = taxCalc.taxAmount;
        item.grossAmount = taxCalc.grossAmount;
        item.discountPercent = itemInput.discountPercent || 0;
        item.lineNumber = items.length + 1;

        items.push(item);
        totalNetAmount += taxCalc.netAmount;
        totalTaxAmount += taxCalc.taxAmount;
      }

      invoice.items = items;
      invoice.subtotal = Math.round(totalNetAmount * 100) / 100;
      invoice.taxAmount = Math.round(totalTaxAmount * 100) / 100;
      invoice.total = Math.round((totalNetAmount + totalTaxAmount) * 100) / 100;
      invoice.createdAt = new Date();
      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Invoice created: ${invoiceNumber}`, { tenantId, invoiceId: saved.id });

      return saved;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, tenantId },
        relations: ['items', 'company', 'customer'],
      });
      return invoice || null;
    } catch (error) {
      logger.error('Error retrieving invoice:', error);
      throw error;
    }
  }

  /**
   * List invoices with pagination and filters
   */
  async listInvoices(
    tenantId: string,
    filters: {
      companyId?: string;
      customerId?: string;
      status?: InvoiceStatus;
      startDate?: Date;
      endDate?: Date;
      invoiceType?: InvoiceType;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    try {
      let query = this.invoiceRepository.createQueryBuilder('invoice').where('invoice.tenantId = :tenantId', {
        tenantId,
      });

      if (filters.companyId) {
        query = query.andWhere('invoice.companyId = :companyId', { companyId: filters.companyId });
      }

      if (filters.customerId) {
        query = query.andWhere('invoice.customerId = :customerId', { customerId: filters.customerId });
      }

      if (filters.status) {
        query = query.andWhere('invoice.status = :status', { status: filters.status });
      }

      if (filters.invoiceType) {
        query = query.andWhere('invoice.invoiceType = :invoiceType', { invoiceType: filters.invoiceType });
      }

      if (filters.startDate) {
        query = query.andWhere('invoice.issueDate >= :startDate', { startDate: filters.startDate });
      }

      if (filters.endDate) {
        query = query.andWhere('invoice.issueDate <= :endDate', { endDate: filters.endDate });
      }

      const total = await query.getCount();
      const skip = (page - 1) * limit;

      const data = await query
        .leftJoinAndSelect('invoice.items', 'items')
        .leftJoinAndSelect('invoice.company', 'company')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .orderBy('invoice.issueDate', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      return { data, total, page, limit };
    } catch (error) {
      logger.error('Error listing invoices:', error);
      throw error;
    }
  }

  /**
   * Update invoice (only allowed in DRAFT status)
   */
  async updateInvoice(tenantId: string, invoiceId: string, input: InvoiceUpdateInput): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new Error('Can only update invoices in DRAFT status');
      }

      if (input.issueDate) invoice.issueDate = input.issueDate;
      if (input.dueDate) invoice.dueDate = input.dueDate;
      if (input.notes !== undefined) invoice.notes = input.notes;
      if (input.termsAndConditions !== undefined) invoice.termsAndConditions = input.termsAndConditions;
      if (input.internalNotes !== undefined) invoice.metadata = invoice.metadata || {};
      if (input.internalNotes !== undefined) (invoice.metadata as any).internalNotes = input.internalNotes;

      // Update items if provided
      if (input.items) {
        await this.invoiceItemRepository.delete({ invoiceId });
        invoice.items = [];

        let totalNetAmount = 0;
        let totalTaxAmount = 0;

        for (const itemInput of input.items) {
          const taxCalc = this.taxService.calculateLineTax({
            netAmount: itemInput.unitPrice * itemInput.quantity,
            vatRate: itemInput.vatRate,
            discountPercent: itemInput.discountPercent || 0,
          });

          const item = this.invoiceItemRepository.create();
          item.id = uuidv4();
          item.invoiceId = invoice.id;
          item.description = itemInput.description;
          item.quantity = itemInput.quantity;
          item.unitPrice = itemInput.unitPrice;
          item.netAmount = taxCalc.taxableAmount;
          item.vatRate = itemInput.vatRate;
          item.taxAmount = taxCalc.taxAmount;
          item.grossAmount = taxCalc.grossAmount;
          item.discountPercent = itemInput.discountPercent || 0;
          item.lineNumber = invoice.items.length + 1;

          invoice.items.push(item);
          totalNetAmount += taxCalc.netAmount;
          totalTaxAmount += taxCalc.taxAmount;
        }

        invoice.subtotal = Math.round(totalNetAmount * 100) / 100;
        invoice.taxAmount = Math.round(totalTaxAmount * 100) / 100;
        invoice.total = Math.round((totalNetAmount + totalTaxAmount) * 100) / 100;
      }

      invoice.updatedAt = new Date();
      const saved = await this.invoiceRepository.save(invoice);

      logger.info(`Invoice updated: ${invoice.invoiceNumber}`, { tenantId, invoiceId });
      return saved;
    } catch (error) {
      logger.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Transition invoice to PENDING status
   */
  async markAsPending(tenantId: string, invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new Error('Can only mark DRAFT invoices as pending');
      }

      invoice.status = InvoiceStatus.PENDING;
      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Invoice marked as pending: ${invoice.invoiceNumber}`, { tenantId, invoiceId });

      return saved;
    } catch (error) {
      logger.error('Error marking invoice as pending:', error);
      throw error;
    }
  }

  /**
   * Approve invoice (PENDING -> APPROVED)
   */
  async approveInvoice(tenantId: string, invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if (invoice.status !== InvoiceStatus.PENDING) {
        throw new Error('Can only approve PENDING invoices');
      }

      invoice.status = InvoiceStatus.APPROVED;
      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Invoice approved: ${invoice.invoiceNumber}`, { tenantId, invoiceId });

      return saved;
    } catch (error) {
      logger.error('Error approving invoice:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as sent to customer
   */
  async markAsSent(tenantId: string, invoiceId: string, sentDate?: Date): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if (![InvoiceStatus.APPROVED, InvoiceStatus.SENT].includes(invoice.status)) {
        throw new Error('Can only send APPROVED or already SENT invoices');
      }

      invoice.status = InvoiceStatus.SENT;
      invoice.sentAt = sentDate || new Date();
      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Invoice marked as sent: ${invoice.invoiceNumber}`, { tenantId, invoiceId });

      return saved;
    } catch (error) {
      logger.error('Error marking invoice as sent:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as viewed by customer
   */
  async markAsViewed(tenantId: string, invoiceId: string, viewedDate?: Date): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if (![InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.PAID].includes(invoice.status)) {
        throw new Error('Can only mark SENT or already VIEWED invoices as viewed');
      }

      invoice.status = InvoiceStatus.VIEWED;
      invoice.viewedAt = viewedDate || new Date();
      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Invoice marked as viewed: ${invoice.invoiceNumber}`, { tenantId, invoiceId });

      return saved;
    } catch (error) {
      logger.error('Error marking invoice as viewed:', error);
      throw error;
    }
  }

  /**
   * Record payment for invoice
   */
  async recordPayment(
    tenantId: string,
    invoiceId: string,
    paidAmount: number,
    paymentDate?: Date
  ): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Track paid amount as part of metadata for now (until separate payment tracking added)
      const currentPaidAmount = ((invoice.metadata as any)?.paidAmount ?? 0) as number;
      const newPaidAmount = currentPaidAmount + paidAmount;

      if (newPaidAmount > invoice.total) {
        throw new Error('Payment amount exceeds invoice total');
      }

      invoice.metadata = invoice.metadata || {};
      (invoice.metadata as any).paidAmount = newPaidAmount;

      const remainingAmount = invoice.total - newPaidAmount;

      if (remainingAmount === 0) {
        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = paymentDate || new Date();
      }

      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Payment recorded for invoice: ${invoice.invoiceNumber}`, { tenantId, invoiceId, paidAmount });

      return saved;
    } catch (error) {
      logger.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(tenantId: string, invoiceId: string, reason?: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if ([InvoiceStatus.PAID, InvoiceStatus.CANCELLED].includes(invoice.status)) {
        throw new Error('Cannot cancel PAID or already CANCELLED invoices');
      }

      invoice.status = InvoiceStatus.CANCELLED;
      invoice.cancelReason = reason || '';
      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Invoice cancelled: ${invoice.invoiceNumber}`, { tenantId, invoiceId });

      return saved;
    } catch (error) {
      logger.error('Error cancelling invoice:', error);
      throw error;
    }
  }

  /**
   * Generate invoice number using pattern
   * Pattern example: "INV-{YYYY}-{MM}-{000001}"
   */
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const number = Math.floor(Math.random() * 1000000);
    const paddedNumber = String(number).padStart(6, '0');

    return `INV-${year}-${month}-${paddedNumber}`;
  }

  /**
   * Get invoice statistics for a company
   */
  async getCompanyInvoiceStats(
    tenantId: string,
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<InvoiceStats> {
    try {
      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.tenantId = :tenantId AND invoice.companyId = :companyId', { tenantId, companyId });

      if (startDate) {
        query = query.andWhere('invoice.issueDate >= :startDate', { startDate });
      }

      if (endDate) {
        query = query.andWhere('invoice.issueDate <= :endDate', { endDate });
      }

      const invoices = await query.getMany();

      const stats: InvoiceStats = {
        totalInvoices: invoices.length,
        totalNetAmount: 0,
        totalTaxAmount: 0,
        totalGrossAmount: 0,
        totalPaidAmount: 0,
        totalOutstandingAmount: 0,
        byStatus: {
          [InvoiceStatus.DRAFT]: 0,
          [InvoiceStatus.PENDING]: 0,
          [InvoiceStatus.APPROVED]: 0,
          [InvoiceStatus.SENT]: 0,
          [InvoiceStatus.VIEWED]: 0,
          [InvoiceStatus.PAID]: 0,
          [InvoiceStatus.OVERDUE]: 0,
          [InvoiceStatus.CANCELLED]: 0,
          [InvoiceStatus.CORRECTED]: 0,
        },
      };

      invoices.forEach((inv) => {
        const paid = ((inv.metadata as any)?.paidAmount ?? 0) as number;
        const outstanding = inv.total - paid;

        stats.totalNetAmount += Number(inv.subtotal);
        stats.totalTaxAmount += Number(inv.taxAmount);
        stats.totalGrossAmount += Number(inv.total);
        stats.totalPaidAmount += paid;
        stats.totalOutstandingAmount += outstanding;
        stats.byStatus[inv.status]++;
      });

      return stats;
    } catch (error) {
      logger.error('Error calculating invoice statistics:', error);
      throw error;
    }
  }
}

export interface InvoiceStats {
  totalInvoices: number;
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  byStatus: Record<InvoiceStatus, number>;
}

export default new InvoiceService();
