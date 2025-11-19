import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ExpenseService } from '../services/ExpenseService';
import { ExpenseCategory, ExpenseStatus } from '../entities/Expense';

const expenseService = new ExpenseService();

export class ExpensesController {
    static async createExpense(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                error: errors.array(),
            });
        }

        const { tenantId } = req.params;
        const expense = await expenseService.createExpense({
            ...req.body,
            tenantId,
        });

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Expense created successfully',
            data: expense,
        });
    }

    static async listExpenses(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        const filters: any = { page, limit };
        if (req.query.status) filters.status = req.query.status as ExpenseStatus;
        if (req.query.category) filters.category = req.query.category as ExpenseCategory;
        if (req.query.userId) filters.userId = req.query.userId as string;
        if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
        if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

        const { expenses, total } = await expenseService.getExpenses(tenantId, filters);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: expenses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }

    static async getExpense(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const expense = await expenseService.getExpense(expenseId, tenantId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: expense,
        });
    }

    static async updateExpense(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const expense = await expenseService.updateExpense(expenseId, tenantId, req.body);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Expense updated successfully',
            data: expense,
        });
    }

    static async submitExpense(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const expense = await expenseService.submitForApproval(expenseId, tenantId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Expense submitted for approval',
            data: expense,
        });
    }

    static async approveExpense(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const userId = (req as any).user?.id || 'system';
        const expense = await expenseService.approveExpense(expenseId, tenantId, userId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Expense approved successfully',
            data: expense,
        });
    }

    static async rejectExpense(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const expense = await expenseService.rejectExpense(expenseId, tenantId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Expense rejected',
            data: expense,
        });
    }

    static async markAsPaid(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const { paymentMethod, paidDate } = req.body;
        const expense = await expenseService.markAsPaid(
            expenseId,
            tenantId,
            paymentMethod,
            paidDate ? new Date(paidDate) : undefined
        );

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Expense marked as paid',
            data: expense,
        });
    }

    static async processOCR(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        const expense = await expenseService.processOCR(expenseId, tenantId, req.body);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'OCR data processed successfully',
            data: expense,
        });
    }

    static async deleteExpense(req: Request, res: Response): Promise<void> {
        const { tenantId, expenseId } = req.params;
        await expenseService.deleteExpense(expenseId, tenantId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Expense deleted successfully',
        });
    }

    static async getExpenseStats(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const stats = await expenseService.getExpenseStats(tenantId, startDate, endDate);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: stats,
        });
    }
}
