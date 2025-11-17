import { Repository } from 'typeorm';
import { Receipt, ReceiptStatus, ReceiptType } from '../entities/Receipt';
import { AppDataSource } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import QRCode from 'qrcode';

export class ReceiptService {
  private receiptRepository: Repository<Receipt>;

  constructor() {
    this.receiptRepository = AppDataSource.getRepository(Receipt);
  }

  async createReceipt(data: {
    tenantId: string;
    companyId?: string;
    customerId?: string;
    userId?: string;
    receiptType: ReceiptType;
    issueDate: Date;
    description?: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }>;
    currency?: string;
    notes?: string;
    fiscalPrinterNumber?: string;
  }): Promise<Receipt> {
    // Calculate amounts
    let netAmount = 0;
    let vatAmount = 0;
    let grossAmount = 0;

    const processedItems = data.items.map((item) => {
      const itemNetAmount = item.quantity * item.unitPrice;
      const itemVatAmount = (itemNetAmount * item.vatRate) / 100;
      const itemGrossAmount = itemNetAmount + itemVatAmount;

      netAmount += itemNetAmount;
      vatAmount += itemVatAmount;
      grossAmount += itemGrossAmount;

      return {
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        netAmount: itemNetAmount,
        vatAmount: itemVatAmount,
        grossAmount: itemGrossAmount,
      };
    });

    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber(data.tenantId);

    // Generate QR code
    const qrData = {
      receiptNumber,
      date: data.issueDate,
      amount: grossAmount,
      currency: data.currency || 'PLN',
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    const receipt = this.receiptRepository.create({
      ...data,
      receiptNumber,
      netAmount,
      vatAmount,
      grossAmount,
      items: processedItems,
      currency: data.currency || 'PLN',
      status: ReceiptStatus.DRAFT,
      qrCode,
    });

    return await this.receiptRepository.save(receipt);
  }

  async getReceipt(id: string, tenantId: string): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { id, tenantId },
      relations: ['company', 'customer', 'user'],
    });

    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    return receipt;
  }

  async getReceipts(
    tenantId: string,
    filters?: {
      status?: ReceiptStatus;
      receiptType?: ReceiptType;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ receipts: Receipt[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.receiptRepository
      .createQueryBuilder('receipt')
      .where('receipt.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('receipt.company', 'company')
      .leftJoinAndSelect('receipt.customer', 'customer');

    if (filters?.status) {
      query.andWhere('receipt.status = :status', { status: filters.status });
    }

    if (filters?.receiptType) {
      query.andWhere('receipt.receiptType = :receiptType', {
        receiptType: filters.receiptType,
      });
    }

    if (filters?.startDate) {
      query.andWhere('receipt.issueDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('receipt.issueDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const [receipts, total] = await query
      .orderBy('receipt.issueDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { receipts, total };
  }

  async updateReceipt(
    id: string,
    tenantId: string,
    data: Partial<Receipt>
  ): Promise<Receipt> {
    const receipt = await this.getReceipt(id, tenantId);

    Object.assign(receipt, data);
    return await this.receiptRepository.save(receipt);
  }

  async issueReceipt(id: string, tenantId: string): Promise<Receipt> {
    const receipt = await this.getReceipt(id, tenantId);

    if (receipt.status !== ReceiptStatus.DRAFT) {
      throw new AppError('Only draft receipts can be issued', 400);
    }

    receipt.status = ReceiptStatus.ISSUED;
    return await this.receiptRepository.save(receipt);
  }

  async cancelReceipt(id: string, tenantId: string): Promise<Receipt> {
    const receipt = await this.getReceipt(id, tenantId);

    receipt.status = ReceiptStatus.CANCELLED;
    return await this.receiptRepository.save(receipt);
  }

  async deleteReceipt(id: string, tenantId: string): Promise<void> {
    const receipt = await this.getReceipt(id, tenantId);

    if (receipt.status !== ReceiptStatus.DRAFT) {
      throw new AppError('Only draft receipts can be deleted', 400);
    }

    await this.receiptRepository.remove(receipt);
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const lastReceipt = await this.receiptRepository
      .createQueryBuilder('receipt')
      .where('receipt.tenantId = :tenantId', { tenantId })
      .andWhere("receipt.receiptNumber LIKE :pattern", {
        pattern: `RC-${year}-${month}-%`,
      })
      .orderBy('receipt.receiptNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastReceipt) {
      const match = lastReceipt.receiptNumber.match(/-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `RC-${year}-${month}-${String(sequence).padStart(6, '0')}`;
  }

  async getReceiptStats(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalReceipts: number;
    totalAmount: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const query = this.receiptRepository
      .createQueryBuilder('receipt')
      .where('receipt.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('receipt.issueDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('receipt.issueDate <= :endDate', { endDate });
    }

    const receipts = await query.getMany();

    const totalReceipts = receipts.length;
    const totalAmount = receipts.reduce(
      (sum, r) => sum + Number(r.grossAmount),
      0
    );

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    receipts.forEach((receipt) => {
      byType[receipt.receiptType] = (byType[receipt.receiptType] || 0) + 1;
      byStatus[receipt.status] = (byStatus[receipt.status] || 0) + 1;
    });

    return { totalReceipts, totalAmount, byType, byStatus };
  }
}
