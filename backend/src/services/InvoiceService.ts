import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { Invoice, InvoiceStatus, InvoiceType } from '@/entities/Invoice';
import { InvoiceItem } from '@/entities/InvoiceItem';
import { Company } from '@/entities/Company';
import { Customer } from '@/entities/Customer';
import { TaxCalculationService } from './TaxCalculationService';
import EmailService from './EmailService';
import SMSService from './SMSService';
import NotificationService, { NotificationType, NotificationPriority } from './NotificationService';
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
  async markAsSent(tenantId: string, invoiceId: string, sentDate?: Date, sendEmail: boolean = true): Promise<Invoice> {
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

      // Send email notification if enabled
      if (sendEmail && invoice.customer && invoice.customer.email) {
        try {
          await EmailService.sendInvoiceEmail(invoice.customer.email, {
            invoiceNumber: invoice.invoiceNumber || '',
            companyName: invoice.company?.name || 'Invoice Hub',
            customerName: invoice.customer.name,
            totalAmount: Number(invoice.total),
            dueDate: invoice.dueDate,
            invoiceUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}`,
          });
          logger.info(`Invoice email sent: ${invoice.invoiceNumber}`, { tenantId, invoiceId });
        } catch (emailError: any) {
          logger.error(`Failed to send invoice email: ${invoice.invoiceNumber}`, { error: emailError.message });
          // Don't fail the operation if email fails
        }
      }

      // Send SMS notification if customer has phone
      if (invoice.customer && (invoice.customer as any).phone) {
        try {
          await SMSService.sendInvoiceSentSMS(
            (invoice.customer as any).phone,
            invoice.invoiceNumber || '',
            invoice.company?.name || 'Invoice Hub'
          );
          logger.info(`Invoice SMS sent: ${invoice.invoiceNumber}`, { tenantId, invoiceId });
        } catch (smsError: any) {
          logger.error(`Failed to send invoice SMS: ${invoice.invoiceNumber}`, { error: smsError.message });
        }
      }

      // Create in-app notification for company users
      try {
        await NotificationService.createNotification({
          tenantId,
          userId: 'company-owner-id', // TODO: Get actual company owner user ID
          type: NotificationType.INVOICE_SENT,
          title: 'Invoice Sent',
          message: `Invoice ${invoice.invoiceNumber} has been sent to ${invoice.customer?.name}`,
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer?.name,
            amount: Number(invoice.total),
          },
          priority: NotificationPriority.NORMAL,
        });
      } catch (notifError: any) {
        logger.error(`Failed to create notification: ${invoice.invoiceNumber}`, { error: notifError.message });
      }

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
      const fullyPaid = remainingAmount === 0;

      if (fullyPaid) {
        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = paymentDate || new Date();
      }

      invoice.updatedAt = new Date();

      const saved = await this.invoiceRepository.save(invoice);
      logger.info(`Payment recorded for invoice: ${invoice.invoiceNumber}`, { tenantId, invoiceId, paidAmount });

      // Send notifications if fully paid
      if (fullyPaid) {
        // Send SMS to customer
        if (invoice.customer && (invoice.customer as any).phone) {
          try {
            await SMSService.sendPaymentReceivedSMS(
              (invoice.customer as any).phone,
              invoice.invoiceNumber || '',
              Number(invoice.total),
              invoice.company?.name || 'Invoice Hub'
            );
            logger.info(`Payment confirmation SMS sent: ${invoice.invoiceNumber}`);
          } catch (smsError: any) {
            logger.error(`Failed to send payment SMS: ${invoice.invoiceNumber}`, { error: smsError.message });
          }
        }

        // Create in-app notification
        try {
          await NotificationService.createNotification({
            tenantId,
            userId: 'company-owner-id', // TODO: Get actual company owner user ID
            type: NotificationType.INVOICE_PAID,
            title: 'Invoice Paid',
            message: `Invoice ${invoice.invoiceNumber} has been fully paid by ${invoice.customer?.name}`,
            data: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerName: invoice.customer?.name,
              amount: Number(invoice.total),
              paidDate: invoice.paidAt,
            },
            priority: NotificationPriority.NORMAL,
          });
        } catch (notifError: any) {
          logger.error(`Failed to create payment notification: ${invoice.invoiceNumber}`, { error: notifError.message });
        }
      }

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

  /**
   * Send payment reminder for overdue invoices
   */
  async sendPaymentReminder(tenantId: string, invoiceId: string): Promise<void> {
    try {
      const invoice = await this.getInvoiceById(tenantId, invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error('Cannot send reminder for paid invoice');
      }

      if (!invoice.customer || !invoice.customer.email) {
        throw new Error('Customer email not available');
      }

      const now = new Date();
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Send email reminder
      await EmailService.sendPaymentReminder(invoice.customer.email, {
        invoiceNumber: invoice.invoiceNumber || '',
        companyName: invoice.company?.name || 'Invoice Hub',
        customerName: invoice.customer.name,
        totalAmount: Number(invoice.total),
        dueDate: invoice.dueDate,
        daysOverdue: Math.max(0, daysOverdue),
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}/pay`,
      });

      // Send SMS reminder if customer has phone
      if ((invoice.customer as any).phone) {
        try {
          await SMSService.sendPaymentReminderSMS((invoice.customer as any).phone, {
            customerName: invoice.customer.name,
            invoiceNumber: invoice.invoiceNumber || '',
            totalAmount: Number(invoice.total),
            dueDate: invoice.dueDate,
            companyName: invoice.company?.name || 'Invoice Hub',
          });
          logger.info(`Payment reminder SMS sent: ${invoice.invoiceNumber}`, { tenantId, invoiceId });
        } catch (smsError: any) {
          logger.error(`Failed to send reminder SMS: ${invoice.invoiceNumber}`, { error: smsError.message });
        }
      }

      // Create in-app notification
      try {
        await NotificationService.createNotification({
          tenantId,
          userId: 'company-owner-id', // TODO: Get actual company owner user ID
          type: NotificationType.PAYMENT_REMINDER,
          title: 'Payment Reminder Sent',
          message: `Payment reminder sent to ${invoice.customer.name} for invoice ${invoice.invoiceNumber}`,
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer.name,
            daysOverdue,
          },
          priority: daysOverdue > 7 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
        });
      } catch (notifError: any) {
        logger.error(`Failed to create reminder notification: ${invoice.invoiceNumber}`, { error: notifError.message });
      }

      logger.info(`Payment reminder sent: ${invoice.invoiceNumber}`, { tenantId, invoiceId, daysOverdue });
    } catch (error) {
      logger.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * Send payment reminders for all overdue invoices
   */
  async sendOverdueReminders(tenantId: string, companyId?: string): Promise<number> {
    try {
      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .leftJoinAndSelect('invoice.company', 'company')
        .where('invoice.tenantId = :tenantId', { tenantId })
        .andWhere('invoice.status IN (:...statuses)', {
          statuses: [InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE],
        })
        .andWhere('invoice.dueDate < :now', { now: new Date() });

      if (companyId) {
        query = query.andWhere('invoice.companyId = :companyId', { companyId });
      }

      const overdueInvoices = await query.getMany();
      let sentCount = 0;

      for (const invoice of overdueInvoices) {
        try {
          await this.sendPaymentReminder(tenantId, invoice.id);
          sentCount++;

          // Update status to OVERDUE if not already
          if (invoice.status !== InvoiceStatus.OVERDUE) {
            invoice.status = InvoiceStatus.OVERDUE;
            await this.invoiceRepository.save(invoice);
          }
        } catch (error: any) {
          logger.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}`, {
            error: error.message,
          });
        }
      }

      logger.info(`Sent ${sentCount} overdue payment reminders`, { tenantId, companyId });
      return sentCount;
    } catch (error) {
      logger.error('Error sending overdue reminders:', error);
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
