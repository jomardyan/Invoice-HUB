import { Router } from 'express';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { InvoicesController } from '@/controllers/invoices.controller';
import {
  createInvoiceValidation,
  listInvoicesValidation,
  getInvoiceValidation,
  updateInvoiceValidation,
  markPendingValidation,
  approveInvoiceValidation,
  markSentValidation,
  markViewedValidation,
  recordPaymentValidation,
  cancelInvoiceValidation,
  invoiceStatsValidation,
  sendReminderValidation,
  sendOverdueRemindersValidation,
  exportInvoiceValidation,
  exportInvoicesValidation,
} from '@/validators/invoices.validation';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// POST: Create invoice
router.post(
  '/:tenantId/invoices',
  ...createInvoiceValidation,
  asyncHandler(InvoicesController.createInvoice)
);

// GET: List invoices with filters
router.get(
  '/:tenantId/invoices',
  ...listInvoicesValidation,
  asyncHandler(InvoicesController.listInvoices)
);

// GET: Get single invoice
router.get(
  '/:tenantId/invoices/:invoiceId',
  ...getInvoiceValidation,
  asyncHandler(InvoicesController.getInvoice)
);

// PUT: Update invoice
router.put(
  '/:tenantId/invoices/:invoiceId',
  ...updateInvoiceValidation,
  asyncHandler(InvoicesController.updateInvoice)
);

// POST: Mark invoice as pending
router.post(
  '/:tenantId/invoices/:invoiceId/mark-pending',
  ...markPendingValidation,
  asyncHandler(InvoicesController.markAsPending)
);

// POST: Approve invoice
router.post(
  '/:tenantId/invoices/:invoiceId/approve',
  ...approveInvoiceValidation,
  asyncHandler(InvoicesController.approveInvoice)
);

// POST: Mark invoice as sent
router.post(
  '/:tenantId/invoices/:invoiceId/send',
  ...markSentValidation,
  asyncHandler(InvoicesController.markAsSent)
);

// POST: Mark invoice as viewed
router.post(
  '/:tenantId/invoices/:invoiceId/mark-viewed',
  ...markViewedValidation,
  asyncHandler(InvoicesController.markAsViewed)
);

// POST: Record payment
router.post(
  '/:tenantId/invoices/:invoiceId/payment',
  ...recordPaymentValidation,
  asyncHandler(InvoicesController.recordPayment)
);

// DELETE: Cancel invoice
router.delete(
  '/:tenantId/invoices/:invoiceId',
  ...cancelInvoiceValidation,
  asyncHandler(InvoicesController.cancelInvoice)
);

// GET: Invoice statistics
router.get(
  '/:tenantId/companies/:companyId/invoice-stats',
  ...invoiceStatsValidation,
  asyncHandler(InvoicesController.getInvoiceStats)
);

// POST: Send payment reminder for specific invoice
router.post(
  '/:tenantId/invoices/:invoiceId/send-reminder',
  ...sendReminderValidation,
  asyncHandler(InvoicesController.sendPaymentReminder)
);

// POST: Send reminders for all overdue invoices
router.post(
  '/:tenantId/invoices/send-overdue-reminders',
  ...sendOverdueRemindersValidation,
  asyncHandler(InvoicesController.sendOverdueReminders)
);

// GET: Export single invoice
router.get(
  '/:tenantId/invoices/:invoiceId/export',
  ...exportInvoiceValidation,
  asyncHandler(InvoicesController.exportInvoice)
);

// POST: Export multiple invoices
router.post(
  '/:tenantId/invoices/export',
  ...exportInvoicesValidation,
  asyncHandler(InvoicesController.exportInvoices)
);

export default router;
