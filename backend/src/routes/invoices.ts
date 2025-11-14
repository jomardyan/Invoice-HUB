import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { InvoiceService, InvoiceCreateInput, InvoiceUpdateInput } from '@/services/InvoiceService';
import { InvoiceType, InvoiceStatus } from '@/entities/Invoice';
import ExportService, { ExportFormat } from '@/services/ExportService';
import logger from '@/utils/logger';

const router: Router = Router();
const invoiceService = new InvoiceService();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Validation
const createInvoiceValidation = [
  body('companyId').isUUID().withMessage('Invalid company ID'),
  body('customerId').isUUID().withMessage('Invalid customer ID'),
  body('invoiceType').isIn(Object.values(InvoiceType)).withMessage('Invalid invoice type'),
  body('issueDate').isISO8601().toDate().withMessage('Invalid issue date'),
  body('dueDate').isISO8601().toDate().withMessage('Invalid due date'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*').custom(async (_value: unknown, { req }: any) => {
    const items = req.body.items;
    if (!Array.isArray(items)) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description) throw new Error(`Item ${i + 1}: Description is required`);
      if (typeof item.quantity !== 'number' || item.quantity <= 0)
        throw new Error(`Item ${i + 1}: Invalid quantity`);
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0)
        throw new Error(`Item ${i + 1}: Invalid unit price`);
      if (typeof item.vatRate !== 'number' || item.vatRate < 0 || item.vatRate > 100)
        throw new Error(`Item ${i + 1}: Invalid VAT rate`);
    }
  }),
  body('notes').optional().isString(),
  body('termsAndConditions').optional().isString(),
  body('paymentMethod').optional().isString(),
  body('internalNotes').optional().isString(),
];

// POST: Create invoice
router.post(
  '/:tenantId/invoices',
  ...createInvoiceValidation,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
      }

      const { tenantId } = req.params;
      const input: InvoiceCreateInput = req.body;

      const invoice = await invoiceService.createInvoice(tenantId, input);

      res.status(201).json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error creating invoice:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// GET: List invoices with filters
router.get(
  '/:tenantId/invoices',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(Object.values(InvoiceStatus)),
  query('companyId').optional().isUUID(),
  query('customerId').optional().isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { page = 1, limit = 50, status, companyId, customerId, startDate, endDate } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (companyId) filters.companyId = companyId;
      if (customerId) filters.customerId = customerId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await invoiceService.listInvoices(tenantId, filters, page, limit);

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
    } catch (error: any) {
      logger.error('Error listing invoices:', error);
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// GET: Get single invoice
router.get(
  '/:tenantId/invoices/:invoiceId',
  param('invoiceId').isUUID(),
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
      }

      const { tenantId, invoiceId } = req.params;

      const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
      if (!invoice) {
        return res.status(404).json({
          status: 'error',
          message: 'Invoice not found',
        });
      }

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error retrieving invoice:', error);
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// PUT: Update invoice
router.put(
  '/:tenantId/invoices/:invoiceId',
  param('invoiceId').isUUID(),
  body('issueDate').optional().isISO8601().toDate(),
  body('dueDate').optional().isISO8601().toDate(),
  body('items').optional().isArray({ min: 1 }),
  body('notes').optional().isString(),
  body('termsAndConditions').optional().isString(),
  body('paymentMethod').optional().isString(),
  body('internalNotes').optional().isString(),
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
      }

      const { tenantId, invoiceId } = req.params;
      const input: InvoiceUpdateInput = req.body;

      const invoice = await invoiceService.updateInvoice(tenantId, invoiceId, input);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error updating invoice:', error);
      res.status(error.message.includes('not found') ? 404 : error.message.includes('DRAFT') ? 400 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Mark invoice as pending
router.post(
  '/:tenantId/invoices/:invoiceId/mark-pending',
  param('invoiceId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;

      const invoice = await invoiceService.markAsPending(tenantId, invoiceId);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error marking invoice as pending:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Approve invoice
router.post(
  '/:tenantId/invoices/:invoiceId/approve',
  param('invoiceId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;

      const invoice = await invoiceService.approveInvoice(tenantId, invoiceId);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error approving invoice:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Mark invoice as sent
router.post(
  '/:tenantId/invoices/:invoiceId/send',
  param('invoiceId').isUUID(),
  body('sentDate').optional().isISO8601().toDate(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const { sentDate } = req.body;

      const invoice = await invoiceService.markAsSent(tenantId, invoiceId, sentDate);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error marking invoice as sent:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Mark invoice as viewed
router.post(
  '/:tenantId/invoices/:invoiceId/mark-viewed',
  param('invoiceId').isUUID(),
  body('viewedDate').optional().isISO8601().toDate(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const { viewedDate } = req.body;

      const invoice = await invoiceService.markAsViewed(tenantId, invoiceId, viewedDate);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error marking invoice as viewed:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Record payment
router.post(
  '/:tenantId/invoices/:invoiceId/payment',
  param('invoiceId').isUUID(),
  body('paidAmount').isFloat({ min: 0.01 }).withMessage('Paid amount must be greater than 0'),
  body('paymentDate').optional().isISO8601().toDate(),
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
      }

      const { tenantId, invoiceId } = req.params;
      const { paidAmount, paymentDate } = req.body;

      const invoice = await invoiceService.recordPayment(tenantId, invoiceId, paidAmount, paymentDate);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error recording payment:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// DELETE: Cancel invoice
router.delete(
  '/:tenantId/invoices/:invoiceId',
  param('invoiceId').isUUID(),
  body('reason').optional().isString(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const { reason } = req.body;

      const invoice = await invoiceService.cancelInvoice(tenantId, invoiceId, reason);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Error cancelling invoice:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// GET: Invoice statistics
router.get(
  '/:tenantId/companies/:companyId/invoice-stats',
  param('companyId').isUUID(),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  async (req: any, res: any) => {
    try {
      const { tenantId, companyId } = req.params;
      const { startDate, endDate } = req.query;

      const stats = await invoiceService.getCompanyInvoiceStats(tenantId, companyId, startDate, endDate);

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error retrieving invoice statistics:', error);
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Send payment reminder for specific invoice
router.post(
  '/:tenantId/invoices/:invoiceId/send-reminder',
  param('invoiceId').isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;

      await invoiceService.sendPaymentReminder(tenantId, invoiceId);

      res.json({
        status: 'success',
        message: 'Payment reminder sent successfully',
      });
    } catch (error: any) {
      logger.error('Error sending payment reminder:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Send reminders for all overdue invoices
router.post(
  '/:tenantId/invoices/send-overdue-reminders',
  query('companyId').optional().isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { companyId } = req.query;

      const sentCount = await invoiceService.sendOverdueReminders(tenantId, companyId);

      res.json({
        status: 'success',
        message: `Sent ${sentCount} payment reminders`,
        data: { sentCount },
      });
    } catch (error: any) {
      logger.error('Error sending overdue reminders:', error);
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// GET: Export single invoice
router.get(
  '/:tenantId/invoices/:invoiceId/export',
  param('invoiceId').isUUID(),
  query('format').isIn(Object.values(ExportFormat)),
  async (req: any, res: any) => {
    try {
      const { tenantId, invoiceId } = req.params;
      const { format } = req.query;

      const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
      if (!invoice) {
        return res.status(404).json({
          status: 'error',
          message: 'Invoice not found',
        });
      }

      const result = await ExportService.exportInvoice(invoice, format as ExportFormat);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error || 'Export failed',
        });
      }

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error: any) {
      logger.error('Error exporting invoice:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

// POST: Export multiple invoices
router.post(
  '/:tenantId/invoices/export',
  query('format').isIn(Object.values(ExportFormat)),
  body('invoiceIds').isArray(),
  body('invoiceIds.*').isUUID(),
  async (req: any, res: any) => {
    try {
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
        return res.status(404).json({
          status: 'error',
          message: 'No invoices found',
        });
      }

      const result = await ExportService.exportInvoices(invoices, format as ExportFormat);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error || 'Export failed',
        });
      }

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error: any) {
      logger.error('Error exporting invoices:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
);

export default router;
