import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { InvoiceService, InvoiceCreateInput, InvoiceUpdateInput } from '../services/InvoiceService';
import ExportService, { ExportFormat } from '../services/ExportService';

const invoiceService = new InvoiceService();

export class InvoicesController {
    static async createInvoice(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', errors: errors.array() });
        }

        const { tenantId } = req.params;
        const input: InvoiceCreateInput = {
            ...req.body,
            createdById: (req as any).user?.id,
        };

        const invoice = await invoiceService.createInvoice(tenantId, input);

        res.status(201).json({
            status: 'success',
            data: invoice,
        });
    }

    static async listInvoices(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { page = 1, limit = 50, status, companyId, customerId, startDate, endDate } = req.query;

        const filters: any = {};
        if (status) filters.status = status;
        if (companyId) filters.companyId = companyId;
        if (customerId) filters.customerId = customerId;
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const result = await invoiceService.listInvoices(tenantId, filters, Number(page), Number(limit));

        res.json({
            status: 'success',
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / result.limit),
            },
        });
    }

    static async getInvoice(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', errors: errors.array() });
        }

        const { tenantId, invoiceId } = req.params;

        const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
        if (!invoice) {
            res.status(404).json({
                status: 'error',
                message: 'Invoice not found',
            });
        }

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async updateInvoice(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', errors: errors.array() });
        }

        const { tenantId, invoiceId } = req.params;
        const input: InvoiceUpdateInput = req.body;

        const invoice = await invoiceService.updateInvoice(tenantId, invoiceId, input);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async markAsPending(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;

        const invoice = await invoiceService.markAsPending(tenantId, invoiceId);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async approveInvoice(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;

        const invoice = await invoiceService.approveInvoice(tenantId, invoiceId);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async markAsSent(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const { sentDate } = req.body;

        const invoice = await invoiceService.markAsSent(tenantId, invoiceId, sentDate);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async markAsViewed(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const { viewedDate } = req.body;

        const invoice = await invoiceService.markAsViewed(tenantId, invoiceId, viewedDate);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async recordPayment(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', errors: errors.array() });
        }

        const { tenantId, invoiceId } = req.params;
        const { paidAmount, paymentDate } = req.body;

        const invoice = await invoiceService.recordPayment(tenantId, invoiceId, paidAmount, paymentDate);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async cancelInvoice(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const { reason } = req.body;

        const invoice = await invoiceService.cancelInvoice(tenantId, invoiceId, reason);

        res.json({
            status: 'success',
            data: invoice,
        });
    }

    static async getInvoiceStats(req: Request, res: Response): Promise<void> {
        const { tenantId, companyId } = req.params;
        const { startDate, endDate } = req.query;

        const stats = await invoiceService.getCompanyInvoiceStats(
            tenantId,
            companyId,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined
        );

        res.json({
            status: 'success',
            data: stats,
        });
    }

    static async sendPaymentReminder(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;

        await invoiceService.sendPaymentReminder(tenantId, invoiceId);

        res.json({
            status: 'success',
            message: 'Payment reminder sent successfully',
        });
    }

    static async sendOverdueReminders(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { companyId } = req.query;

        const sentCount = await invoiceService.sendOverdueReminders(tenantId, companyId as string);

        res.json({
            status: 'success',
            message: `Sent ${sentCount} payment reminders`,
            data: { sentCount },
        });
    }

    static async exportInvoice(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const { format } = req.query;

        const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
        if (!invoice) {
            res.status(404).json({
                status: 'error',
                message: 'Invoice not found',
            });
        }

        const result = await ExportService.exportInvoice(invoice, format as ExportFormat);

        if (!result.success) {
            res.status(500).json({
                status: 'error',
                message: result.error || 'Export failed',
            });
        }

        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename = "${result.filename}"`);
        res.send(result.buffer);
    }

    static async exportInvoices(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { format } = req.query;
        const { invoiceIds } = req.body;

        const invoices = [];
        for (const id of invoiceIds) {
            const invoice = await invoiceService.getInvoiceById(tenantId, id);
            if (invoice) {
                invoices.push(invoice);
            }
        }

        if (invoices.length === 0) {
            res.status(404).json({
                status: 'error',
                message: 'No invoices found',
            });
        }

        const result = await ExportService.exportInvoices(invoices, format as ExportFormat);

        if (!result.success) {
            res.status(500).json({
                status: 'error',
                message: result.error || 'Export failed',
            });
        }

        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename = "${result.filename}"`);
        res.send(result.buffer);
    }
}
