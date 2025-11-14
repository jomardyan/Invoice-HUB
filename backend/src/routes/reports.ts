/**
 * Reporting Routes - Business intelligence and analytics endpoints
 */

import { Router } from 'express';
import { param, query, body } from 'express-validator';
import ReportingService, { DateRangeFilter } from '@/services/ReportingService';
import ExportService from '@/services/ExportService';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /reports/:tenantId/sales
 * Generate sales report for given period
 */
router.get(
  '/:tenantId/sales',
  param('tenantId').isUUID(),
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('companyId').optional().isUUID(),
  query('format').optional().isIn(['json', 'excel', 'csv']),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate, companyId, format } = req.query;

      const dateRange: DateRangeFilter = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      const report = await ReportingService.generateSalesReport(
        tenantId,
        dateRange,
        companyId
      );

      // Export if format specified
      if (format && format !== 'json') {
        const exportData = {
          title: 'Sales Report',
          period: `${dateRange.startDate.toISOString().split('T')[0]} - ${dateRange.endDate.toISOString().split('T')[0]}`,
          data: report,
        };

        if (format === 'excel') {
          // Export as Excel
          const buffer = await ExportService.exportDataToExcel(exportData);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.xlsx"`);
          return res.send(buffer);
        } else if (format === 'csv') {
          // Export as CSV
          const buffer = await ExportService.exportDataToCSV(exportData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.csv"`);
          return res.send(buffer);
        }
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /reports/:tenantId/tax
 * Generate tax report (JPK_VAT compatible)
 */
router.get(
  '/:tenantId/tax',
  param('tenantId').isUUID(),
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('companyId').optional().isUUID(),
  query('format').optional().isIn(['json', 'xml', 'excel']),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate, companyId, format } = req.query;

      const dateRange: DateRangeFilter = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      const report = await ReportingService.generateTaxReport(
        tenantId,
        dateRange,
        companyId
      );

      // Export if format specified
      if (format && format !== 'json') {
        if (format === 'xml') {
          // Export as XML for tax authorities
          const xml = ExportService.exportTaxReportToXML(report);
          res.setHeader('Content-Type', 'application/xml');
          res.setHeader('Content-Disposition', `attachment; filename="tax-report-${Date.now()}.xml"`);
          return res.send(xml);
        } else if (format === 'excel') {
          const exportData = {
            title: 'Tax Report (JPK_VAT)',
            period: `${dateRange.startDate.toISOString().split('T')[0]} - ${dateRange.endDate.toISOString().split('T')[0]}`,
            data: report,
          };
          const buffer = await ExportService.exportDataToExcel(exportData);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="tax-report-${Date.now()}.xlsx"`);
          return res.send(buffer);
        }
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /reports/:tenantId/customers
 * Get customer analytics
 */
router.get(
  '/:tenantId/customers',
  param('tenantId').isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate, limit } = req.query;

      let dateRange: DateRangeFilter | undefined;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };
      }

      const analytics = await ReportingService.getCustomerAnalytics(
        tenantId,
        dateRange,
        limit ? parseInt(limit) : 10
      );

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /reports/:tenantId/products
 * Get product analytics
 */
router.get(
  '/:tenantId/products',
  param('tenantId').isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate, limit } = req.query;

      let dateRange: DateRangeFilter | undefined;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };
      }

      const analytics = await ReportingService.getProductAnalytics(
        tenantId,
        dateRange,
        limit ? parseInt(limit) : 10
      );

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /reports/:tenantId/dashboard
 * Get dashboard metrics
 */
router.get(
  '/:tenantId/dashboard',
  param('tenantId').isUUID(),
  query('companyId').optional().isUUID(),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { companyId } = req.query;

      const metrics = await ReportingService.getDashboardMetrics(tenantId, companyId);

      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /reports/:tenantId/custom
 * Generate custom report with filters
 */
router.post(
  '/:tenantId/custom',
  param('tenantId').isUUID(),
  body('reportType').isIn(['sales', 'tax', 'customers', 'products']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('companyId').optional().isUUID(),
  body('customerId').optional().isUUID(),
  body('productId').optional().isUUID(),
  body('groupBy').optional().isIn(['day', 'week', 'month', 'quarter', 'year']),
  body('format').optional().isIn(['json', 'excel', 'csv', 'xml']),
  async (req: any, res: any) => {
    try {
      const { tenantId } = req.params;
      const { reportType, startDate, endDate, companyId, format } = req.body;

      const dateRange: DateRangeFilter = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      let report: any;

      switch (reportType) {
        case 'sales':
          report = await ReportingService.generateSalesReport(tenantId, dateRange, companyId);
          break;
        case 'tax':
          report = await ReportingService.generateTaxReport(tenantId, dateRange, companyId);
          break;
        case 'customers':
          report = await ReportingService.getCustomerAnalytics(tenantId, dateRange);
          break;
        case 'products':
          report = await ReportingService.getProductAnalytics(tenantId, dateRange);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      // Export if format specified
      if (format && format !== 'json') {
        const exportData = {
          title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
          period: `${dateRange.startDate.toISOString().split('T')[0]} - ${dateRange.endDate.toISOString().split('T')[0]}`,
          data: report,
        };

        if (format === 'excel') {
          const buffer = await ExportService.exportDataToExcel(exportData);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${Date.now()}.xlsx"`);
          return res.send(buffer);
        } else if (format === 'csv') {
          const buffer = await ExportService.exportDataToCSV(exportData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${Date.now()}.csv"`);
          return res.send(buffer);
        } else if (format === 'xml' && reportType === 'tax') {
          const xml = ExportService.exportTaxReportToXML(report);
          res.setHeader('Content-Type', 'application/xml');
          res.setHeader('Content-Disposition', `attachment; filename="tax-report-${Date.now()}.xml"`);
          return res.send(xml);
        }
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
