import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { KSeFService } from '../services/KSeFService';
import { KSeFStatus } from '../entities/KSeFIntegration';

const ksefService = new KSeFService();

export class KSeFController {
    // Configuration Management
    static async createConfig(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', statusCode: 400, message: 'Validation failed', error: errors.array() });
        }

        const { tenantId } = req.params;
        const config = await ksefService.createConfiguration({ ...req.body, tenantId });
        res.status(201).json({ status: 'success', statusCode: 201, message: 'KSeF configuration created', data: config });
    }

    static async getConfig(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const config = await ksefService.getConfiguration(tenantId);
        res.status(200).json({ status: 'success', statusCode: 200, data: config });
    }

    static async updateConfig(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const config = await ksefService.updateConfiguration(tenantId, req.body);
        res.status(200).json({ status: 'success', statusCode: 200, message: 'KSeF configuration updated', data: config });
    }

    static async deleteConfig(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        await ksefService.deleteConfiguration(tenantId);
        res.status(200).json({ status: 'success', statusCode: 200, message: 'KSeF configuration deleted' });
    }

    // Invoice Submission
    static async submitInvoice(req: Request, res: Response): Promise<void> {
        const { tenantId, invoiceId } = req.params;
        const submission = await ksefService.submitInvoice(invoiceId, tenantId);
        res.status(201).json({ status: 'success', statusCode: 201, message: 'Invoice submitted to KSeF', data: submission });
    }

    static async getSubmission(req: Request, res: Response): Promise<void> {
        const { tenantId, submissionId } = req.params;
        const submission = await ksefService.getSubmission(submissionId, tenantId);
        res.status(200).json({ status: 'success', statusCode: 200, data: submission });
    }

    static async listSubmissions(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const filters: any = { page, limit };
        if (req.query.status) filters.status = req.query.status as KSeFStatus;

        const { submissions, total } = await ksefService.getSubmissions(tenantId, filters);
        res.status(200).json({ status: 'success', statusCode: 200, data: submissions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    static async getStats(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const stats = await ksefService.getStats(tenantId);
        res.status(200).json({ status: 'success', statusCode: 200, data: stats });
    }

    // Phase 1: Session Management
    static async listSessions(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const continuationToken = req.query.continuationToken as string;

        const result = await ksefService.listActiveSessions(tenantId, { pageSize, continuationToken });
        res.status(200).json({ status: 'success', statusCode: 200, data: result });
    }

    static async terminateCurrentSession(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        await ksefService.terminateCurrentSession(tenantId);
        res.status(204).send();
    }

    static async terminateSession(req: Request, res: Response): Promise<void> {
        const { tenantId, sessionReference } = req.params;
        await ksefService.terminateSession(tenantId, sessionReference);
        res.status(204).send();
    }

    // Phase 1: Interactive Session (Online)
    static async createInteractiveSession(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { invoice } = req.body;

        const result = await ksefService.sendInteractiveInvoice(tenantId, invoice);
        res.status(202).json({ status: 'success', statusCode: 202, message: 'Invoice sent to interactive session', data: result });
    }

    static async getSessionStatus(req: Request, res: Response): Promise<void> {
        const { tenantId, sessionReference } = req.params;
        const status = await ksefService.getSessionStatus(tenantId, sessionReference);
        res.status(200).json({ status: 'success', statusCode: 200, data: status });
    }

    static async getSessionUPO(req: Request, res: Response): Promise<void> {
        const { tenantId, sessionReference } = req.params;
        const upo = await ksefService.getSessionUPO(tenantId, sessionReference);
        res.status(200).json({ status: 'success', statusCode: 200, data: upo });
    }

    // Phase 1: Batch Session
    static async createBatchSession(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { invoiceSchema, packageInfo } = req.body;

        const result = await ksefService.openBatchSession(tenantId, { invoiceSchema, packageInfo });
        res.status(201).json({ status: 'success', statusCode: 201, message: 'Batch session opened', data: result });
    }

    static async closeBatchSession(req: Request, res: Response): Promise<void> {
        const { tenantId, sessionReference } = req.params;
        await ksefService.closeBatchSession(tenantId, sessionReference);
        res.status(204).send();
    }

    static async uploadBatchInvoice(req: Request, res: Response): Promise<void> {
        const { tenantId, sessionReference } = req.params;
        const invoiceData = req.body;

        const result = await ksefService.uploadBatchInvoice(tenantId, sessionReference, invoiceData);
        res.status(201).json({ status: 'success', statusCode: 201, data: result });
    }

    // Phase 1: Invoice Query
    static async queryInvoiceMetadata(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const criteria = req.body;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const pageOffset = parseInt(req.query.pageOffset as string) || 0;

        const result = await ksefService.queryInvoiceMetadata(tenantId, criteria, { pageSize, pageOffset });
        res.status(200).json({ status: 'success', statusCode: 200, data: result });
    }

    static async getInvoiceByKsefNumber(req: Request, res: Response): Promise<void> {
        const { tenantId, ksefNumber } = req.params;
        const invoice = await ksefService.getInvoiceByKsefNumber(tenantId, ksefNumber);
        res.status(200).json({ status: 'success', statusCode: 200, data: invoice });
    }

    // Phase 1: Invoice Export
    static async createExport(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const { criteria, encryptionKey } = req.body;

        const result = await ksefService.createInvoiceExport(tenantId, criteria, encryptionKey);
        res.status(202).json({ status: 'success', statusCode: 202, message: 'Export initiated', data: result });
    }

    static async getExportStatus(req: Request, res: Response): Promise<void> {
        const { tenantId, exportReference } = req.params;
        const status = await ksefService.getExportStatus(tenantId, exportReference);
        res.status(200).json({ status: 'success', statusCode: 200, data: status });
    }
}
