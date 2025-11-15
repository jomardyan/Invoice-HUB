/**
 * ReportingService - Business intelligence and analytics
 * Sales reports, tax reports, customer analytics, revenue tracking
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { Invoice, InvoiceStatus } from '@/entities/Invoice';
import logger from '@/utils/logger';

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface SalesReport {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  totalTaxCollected: number;
  revenueByMonth: MonthlyRevenue[];
  revenueByStatus: StatusRevenue[];
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  invoiceCount: number;
  averageValue: number;
}

export interface StatusRevenue {
  status: InvoiceStatus;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface TaxReport {
  period: DateRangeFilter;
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  taxByRate: TaxRateBreakdown[];
  invoiceCount: number;
}

export interface TaxRateBreakdown {
  vatRate: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  invoiceCount: number;
}

export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  totalInvoices: number;
  totalRevenue: number;
  averageInvoiceValue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  lastInvoiceDate: Date | null;
  paymentRate: number;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  invoiceCount: number;
}

export interface DashboardMetrics {
  currentMonth: {
    revenue: number;
    invoiceCount: number;
    paidInvoices: number;
    overdueInvoices: number;
  };
  lastMonth: {
    revenue: number;
    invoiceCount: number;
  };
  growthRate: number;
  outstandingAmount: number;
  averagePaymentTime: number;
  topCustomers: CustomerAnalytics[];
  topProducts: ProductAnalytics[];
  recentActivity: {
    date: Date;
    type: string;
    description: string;
  }[];
}

export class ReportingService {
  private invoiceRepository: Repository<Invoice>;

  constructor() {
    this.invoiceRepository = AppDataSource.getRepository(Invoice);
  }

  /**
   * Generate sales report for given period
   */
  async generateSalesReport(
    tenantId: string,
    dateRange: DateRangeFilter,
    companyId?: string
  ): Promise<SalesReport> {
    try {
      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.tenantId = :tenantId', { tenantId })
        .andWhere('invoice.issueDate BETWEEN :startDate AND :endDate', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

      if (companyId) {
        query = query.andWhere('invoice.companyId = :companyId', { companyId });
      }

      const invoices = await query.getMany();

      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const totalTaxCollected = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);
      const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID).length;
      const unpaidInvoices = invoices.filter(inv => 
        [InvoiceStatus.SENT, InvoiceStatus.VIEWED].includes(inv.status)
      ).length;
      const overdueInvoices = invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE).length;

      // Revenue by month
      const monthlyMap = new Map<string, { revenue: number; count: number }>();
      for (const invoice of invoices) {
        const issueDate = new Date(invoice.issueDate);
        const key = `${issueDate.getFullYear()}-${issueDate.getMonth() + 1}`;
        const existing = monthlyMap.get(key) || { revenue: 0, count: 0 };
        monthlyMap.set(key, {
          revenue: existing.revenue + Number(invoice.total),
          count: existing.count + 1,
        });
      }

      const revenueByMonth: MonthlyRevenue[] = Array.from(monthlyMap.entries()).map(
        ([key, data]) => {
          const [year, month] = key.split('-').map(Number);
          return {
            month: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
            year,
            revenue: data.revenue,
            invoiceCount: data.count,
            averageValue: data.count > 0 ? data.revenue / data.count : 0,
          };
        }
      );

      // Revenue by status
      const statusMap = new Map<InvoiceStatus, { count: number; amount: number }>();
      for (const invoice of invoices) {
        const existing = statusMap.get(invoice.status) || { count: 0, amount: 0 };
        statusMap.set(invoice.status, {
          count: existing.count + 1,
          amount: existing.amount + Number(invoice.total),
        });
      }

      const revenueByStatus: StatusRevenue[] = Array.from(statusMap.entries()).map(
        ([status, data]) => ({
          status,
          count: data.count,
          totalAmount: data.amount,
          percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0,
        })
      );

      logger.info('Sales report generated', { tenantId, invoiceCount: invoices.length });

      return {
        totalRevenue,
        totalInvoices: invoices.length,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        totalTaxCollected,
        revenueByMonth,
        revenueByStatus,
      };
    } catch (error: any) {
      logger.error('Error generating sales report', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate tax report (JPK_VAT format compatible)
   */
  async generateTaxReport(
    tenantId: string,
    dateRange: DateRangeFilter,
    companyId?: string
  ): Promise<TaxReport> {
    try {
      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.items', 'items')
        .where('invoice.tenantId = :tenantId', { tenantId })
        .andWhere('invoice.issueDate BETWEEN :startDate AND :endDate', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
        .andWhere('invoice.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED });

      if (companyId) {
        query = query.andWhere('invoice.companyId = :companyId', { companyId });
      }

      const invoices = await query.getMany();

      const totalNetAmount = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
      const totalTaxAmount = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);
      const totalGrossAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      // Group by VAT rate
      const taxRateMap = new Map<number, {
        netAmount: number;
        taxAmount: number;
        grossAmount: number;
        count: number;
      }>();

      for (const invoice of invoices) {
        for (const item of invoice.items || []) {
          const rate = item.vatRate;
          const existing = taxRateMap.get(rate) || {
            netAmount: 0,
            taxAmount: 0,
            grossAmount: 0,
            count: 0,
          };

          taxRateMap.set(rate, {
            netAmount: existing.netAmount + Number(item.netAmount),
            taxAmount: existing.taxAmount + Number(item.taxAmount),
            grossAmount: existing.grossAmount + Number(item.grossAmount),
            count: existing.count + 1,
          });
        }
      }

      const taxByRate: TaxRateBreakdown[] = Array.from(taxRateMap.entries())
        .map(([rate, data]) => ({
          vatRate: rate,
          netAmount: data.netAmount,
          taxAmount: data.taxAmount,
          grossAmount: data.grossAmount,
          invoiceCount: data.count,
        }))
        .sort((a, b) => b.vatRate - a.vatRate);

      logger.info('Tax report generated', { tenantId, invoiceCount: invoices.length });

      return {
        period: dateRange,
        totalNetAmount,
        totalTaxAmount,
        totalGrossAmount,
        taxByRate,
        invoiceCount: invoices.length,
      };
    } catch (error: any) {
      logger.error('Error generating tax report', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(
    tenantId: string,
    dateRange?: DateRangeFilter,
    limit: number = 10
  ): Promise<CustomerAnalytics[]> {
    try {
      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .where('invoice.tenantId = :tenantId', { tenantId });

      if (dateRange) {
        query = query.andWhere('invoice.issueDate BETWEEN :startDate AND :endDate', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
      }

      const invoices = await query.getMany();

      // Group by customer
      const customerMap = new Map<string, {
        name: string;
        invoices: Invoice[];
      }>();

      for (const invoice of invoices) {
        if (!invoice.customer) continue;

        const existing = customerMap.get(invoice.customer.id) || {
          name: invoice.customer.name,
          invoices: [],
        };

        existing.invoices.push(invoice);
        customerMap.set(invoice.customer.id, existing);
      }

      // Calculate analytics
      const analytics: CustomerAnalytics[] = Array.from(customerMap.entries()).map(
        ([customerId, data]) => {
          const totalInvoices = data.invoices.length;
          const totalRevenue = data.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
          const paidInvoices = data.invoices.filter(inv => inv.status === InvoiceStatus.PAID).length;
          const unpaidInvoices = data.invoices.filter(inv =>
            [InvoiceStatus.SENT, InvoiceStatus.VIEWED].includes(inv.status)
          ).length;
          const overdueInvoices = data.invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE).length;

          const lastInvoice = data.invoices.reduce((latest, inv) =>
            inv.issueDate > latest ? inv.issueDate : latest, new Date(0)
          );

          return {
            customerId,
            customerName: data.name,
            totalInvoices,
            totalRevenue,
            averageInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
            paidInvoices,
            unpaidInvoices,
            overdueInvoices,
            lastInvoiceDate: lastInvoice.getTime() > 0 ? lastInvoice : null,
            paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
          };
        }
      );

      // Sort by total revenue and limit
      const sorted = analytics.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit);

      logger.info('Customer analytics generated', { tenantId, customerCount: sorted.length });

      return sorted;
    } catch (error: any) {
      logger.error('Error generating customer analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(
    tenantId: string,
    dateRange?: DateRangeFilter,
    limit: number = 10
  ): Promise<ProductAnalytics[]> {
    try {
      let query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .where('invoice.tenantId = :tenantId', { tenantId });

      if (dateRange) {
        query = query.andWhere('invoice.issueDate BETWEEN :startDate AND :endDate', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
      }

      const invoices = await query.getMany();

      // Group by product
      const productMap = new Map<string, {
        name: string;
        sku: string;
        quantity: number;
        revenue: number;
        invoices: Set<string>;
        prices: number[];
      }>();

      for (const invoice of invoices) {
        for (const item of invoice.items || []) {
          if (!item.product) continue;

          const existing = productMap.get(item.product.id) || {
            name: item.product.name,
            sku: item.product.sku || item.sku || '',
            quantity: 0,
            revenue: 0,
            invoices: new Set<string>(),
            prices: [] as number[],
          };

          existing.quantity += Number(item.quantity);
          existing.revenue += Number(item.grossAmount);
          existing.invoices.add(invoice.id);
          existing.prices.push(Number(item.unitPrice));

          productMap.set(item.product.id, existing);
        }
      }

      // Calculate analytics
      const analytics: ProductAnalytics[] = Array.from(productMap.entries()).map(
        ([productId, data]) => ({
          productId,
          productName: data.name,
          sku: data.sku,
          totalQuantitySold: data.quantity,
          totalRevenue: data.revenue,
          averagePrice: data.prices.length > 0
            ? data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length
            : 0,
          invoiceCount: data.invoices.size,
        })
      );

      // Sort by revenue and limit
      const sorted = analytics.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit);

      logger.info('Product analytics generated', { tenantId, productCount: sorted.length });

      return sorted;
    } catch (error: any) {
      logger.error('Error generating product analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(tenantId: string, companyId?: string): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month metrics
      const currentMonthReport = await this.generateSalesReport(
        tenantId,
        { startDate: currentMonthStart, endDate: now },
        companyId
      );

      // Last month metrics
      const lastMonthReport = await this.generateSalesReport(
        tenantId,
        { startDate: lastMonthStart, endDate: lastMonthEnd },
        companyId
      );

      // Growth rate
      const growthRate = lastMonthReport.totalRevenue > 0
        ? ((currentMonthReport.totalRevenue - lastMonthReport.totalRevenue) / lastMonthReport.totalRevenue) * 100
        : 0;

      // Outstanding amount (unpaid + overdue)
      let outstandingQuery = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.tenantId = :tenantId', { tenantId })
        .andWhere('invoice.status IN (:...statuses)', {
          statuses: [InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE],
        });

      if (companyId) {
        outstandingQuery = outstandingQuery.andWhere('invoice.companyId = :companyId', { companyId });
      }

      const outstandingInvoices = await outstandingQuery.getMany();
      const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      // Top customers
      const topCustomers = await this.getCustomerAnalytics(tenantId, undefined, 5);

      // Top products
      const topProducts = await this.getProductAnalytics(tenantId, undefined, 5);

      logger.info('Dashboard metrics generated', { tenantId });

      return {
        currentMonth: {
          revenue: currentMonthReport.totalRevenue,
          invoiceCount: currentMonthReport.totalInvoices,
          paidInvoices: currentMonthReport.paidInvoices,
          overdueInvoices: currentMonthReport.overdueInvoices,
        },
        lastMonth: {
          revenue: lastMonthReport.totalRevenue,
          invoiceCount: lastMonthReport.totalInvoices,
        },
        growthRate,
        outstandingAmount,
        averagePaymentTime: 0, // TODO: Calculate from payment dates
        topCustomers,
        topProducts,
        recentActivity: [], // TODO: Implement activity tracking
      };
    } catch (error: any) {
      logger.error('Error generating dashboard metrics', { error: error.message });
      throw error;
    }
  }
}

export default new ReportingService();
