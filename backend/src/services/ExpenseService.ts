import { Repository } from 'typeorm';
import { Expense, ExpenseStatus, ExpenseCategory } from '../entities/Expense';
import { AppDataSource } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ExpenseService {
  private expenseRepository: Repository<Expense>;

  constructor() {
    this.expenseRepository = AppDataSource.getRepository(Expense);
  }

  async createExpense(data: {
    tenantId: string;
    companyId?: string;
    userId?: string;
    description: string;
    category: ExpenseCategory;
    expenseDate: Date;
    netAmount: number;
    vatRate?: number;
    currency?: string;
    vendor?: string;
    invoiceNumber?: string;
    receiptUrl?: string;
    notes?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
  }): Promise<Expense> {
    const vatRate = data.vatRate || 0;
    const vatAmount = (data.netAmount * vatRate) / 100;
    const grossAmount = data.netAmount + vatAmount;

    const expenseNumber = await this.generateExpenseNumber(data.tenantId);

    const expense = this.expenseRepository.create({
      ...data,
      expenseNumber,
      vatAmount,
      grossAmount,
      currency: data.currency || 'PLN',
      status: ExpenseStatus.DRAFT,
    });

    return await this.expenseRepository.save(expense);
  }

  async getExpense(id: string, tenantId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, tenantId },
      relations: ['company', 'user'],
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    return expense;
  }

  async getExpenses(
    tenantId: string,
    filters?: {
      status?: ExpenseStatus;
      category?: ExpenseCategory;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ expenses: Expense[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('expense.company', 'company')
      .leftJoinAndSelect('expense.user', 'user');

    if (filters?.status) {
      query.andWhere('expense.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      query.andWhere('expense.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.userId) {
      query.andWhere('expense.userId = :userId', { userId: filters.userId });
    }

    if (filters?.startDate) {
      query.andWhere('expense.expenseDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('expense.expenseDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const [expenses, total] = await query
      .orderBy('expense.expenseDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { expenses, total };
  }

  async updateExpense(
    id: string,
    tenantId: string,
    data: Partial<Expense>
  ): Promise<Expense> {
    const expense = await this.getExpense(id, tenantId);

    // Recalculate amounts if netAmount or vatRate changed
    if (data.netAmount !== undefined || data.vatRate !== undefined) {
      const netAmount = data.netAmount || expense.netAmount;
      const vatRate = data.vatRate !== undefined ? data.vatRate : expense.vatRate || 0;
      data.vatAmount = (Number(netAmount) * vatRate) / 100;
      data.grossAmount = Number(netAmount) + data.vatAmount;
    }

    Object.assign(expense, data);
    return await this.expenseRepository.save(expense);
  }

  async submitForApproval(id: string, tenantId: string): Promise<Expense> {
    const expense = await this.getExpense(id, tenantId);

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new AppError('Only draft expenses can be submitted for approval', 400);
    }

    expense.status = ExpenseStatus.PENDING_APPROVAL;
    return await this.expenseRepository.save(expense);
  }

  async approveExpense(
    id: string,
    tenantId: string,
    approvedBy: string
  ): Promise<Expense> {
    const expense = await this.getExpense(id, tenantId);

    if (expense.status !== ExpenseStatus.PENDING_APPROVAL) {
      throw new AppError('Only pending expenses can be approved', 400);
    }

    expense.status = ExpenseStatus.APPROVED;
    expense.approvedBy = approvedBy;
    expense.approvedAt = new Date();

    return await this.expenseRepository.save(expense);
  }

  async rejectExpense(id: string, tenantId: string): Promise<Expense> {
    const expense = await this.getExpense(id, tenantId);

    if (expense.status !== ExpenseStatus.PENDING_APPROVAL) {
      throw new AppError('Only pending expenses can be rejected', 400);
    }

    expense.status = ExpenseStatus.REJECTED;
    return await this.expenseRepository.save(expense);
  }

  async markAsPaid(
    id: string,
    tenantId: string,
    paymentMethod: string,
    paidDate?: Date
  ): Promise<Expense> {
    const expense = await this.getExpense(id, tenantId);

    expense.status = ExpenseStatus.PAID;
    expense.isPaid = true;
    expense.paidDate = paidDate || new Date();
    expense.paymentMethod = paymentMethod;

    return await this.expenseRepository.save(expense);
  }

  async processOCR(
    id: string,
    tenantId: string,
    ocrData: {
      vendor?: string;
      amount?: number;
      date?: string;
      invoiceNumber?: string;
      vatNumber?: string;
      confidence?: number;
      rawText?: string;
    }
  ): Promise<Expense> {
    const expense = await this.getExpense(id, tenantId);

    expense.ocrData = ocrData;

    // Auto-fill fields based on OCR data if they're empty
    if (ocrData.vendor && !expense.vendor) {
      expense.vendor = ocrData.vendor;
    }
    if (ocrData.invoiceNumber && !expense.invoiceNumber) {
      expense.invoiceNumber = ocrData.invoiceNumber;
    }
    if (ocrData.amount && !expense.netAmount) {
      expense.netAmount = ocrData.amount;
      expense.grossAmount = ocrData.amount;
    }
    if (ocrData.date && !expense.expenseDate) {
      expense.expenseDate = new Date(ocrData.date);
    }

    return await this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string, tenantId: string): Promise<void> {
    const expense = await this.getExpense(id, tenantId);

    if (expense.status === ExpenseStatus.PAID) {
      throw new AppError('Paid expenses cannot be deleted', 400);
    }

    await this.expenseRepository.remove(expense);
  }

  private async generateExpenseNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const lastExpense = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.tenantId = :tenantId', { tenantId })
      .andWhere("expense.expenseNumber LIKE :pattern", {
        pattern: `EXP-${year}-${month}-%`,
      })
      .orderBy('expense.expenseNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastExpense && lastExpense.expenseNumber) {
      const match = lastExpense.expenseNumber.match(/-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `EXP-${year}-${month}-${String(sequence).padStart(6, '0')}`;
  }

  async getExpenseStats(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    byCategory: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
    pendingApproval: number;
    approved: number;
    paid: number;
  }> {
    const query = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('expense.expenseDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('expense.expenseDate <= :endDate', { endDate });
    }

    const expenses = await query.getMany();

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.grossAmount), 0);

    const byCategory: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};
    let pendingApproval = 0;
    let approved = 0;
    let paid = 0;

    expenses.forEach((expense) => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = { count: 0, amount: 0 };
      }
      byCategory[expense.category].count++;
      byCategory[expense.category].amount += Number(expense.grossAmount);

      byStatus[expense.status] = (byStatus[expense.status] || 0) + 1;

      if (expense.status === ExpenseStatus.PENDING_APPROVAL) pendingApproval++;
      if (expense.status === ExpenseStatus.APPROVED) approved++;
      if (expense.status === ExpenseStatus.PAID) paid++;
    });

    return {
      totalExpenses,
      totalAmount,
      byCategory,
      byStatus,
      pendingApproval,
      approved,
      paid,
    };
  }
}
