/**
 * ExportService - Multi-format export engine
 * Supports PDF, Excel, XML/eFaktura, JSON, CSV exports
 */

import ExcelJS from 'exceljs';
import logger from '@/utils/logger';
import { Invoice } from '@/entities/Invoice';
import { TemplateService } from './TemplateService';

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  XML = 'xml',
  EFAKTURA = 'efaktura',
  JSON = 'json',
  CSV = 'csv',
}

export interface ExportOptions {
  format: ExportFormat;
  includeItems?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  success: boolean;
  buffer?: Buffer;
  filename: string;
  mimeType: string;
  error?: string;
}

export class ExportService {
  /**
   * Export single invoice
   */
  async exportInvoice(invoice: Invoice, format: ExportFormat): Promise<ExportResult> {
    try {
      switch (format) {
        case ExportFormat.PDF:
          return await this.exportInvoiceToPDF(invoice);
        case ExportFormat.EXCEL:
          return await this.exportInvoiceToExcel(invoice);
        case ExportFormat.XML:
        case ExportFormat.EFAKTURA:
          return await this.exportInvoiceToXML(invoice);
        case ExportFormat.JSON:
          return await this.exportInvoiceToJSON(invoice);
        case ExportFormat.CSV:
          return await this.exportInvoiceToCSV(invoice);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error: any) {
      logger.error('Export failed', { error: error.message, format });
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error.message,
      };
    }
  }

  /**
   * Export multiple invoices
   */
  async exportInvoices(invoices: Invoice[], format: ExportFormat): Promise<ExportResult> {
    try {
      switch (format) {
        case ExportFormat.EXCEL:
          return await this.exportInvoicesToExcel(invoices);
        case ExportFormat.JSON:
          return await this.exportInvoicesToJSON(invoices);
        case ExportFormat.CSV:
          return await this.exportInvoicesToCSV(invoices);
        default:
          throw new Error(`Batch export not supported for format: ${format}`);
      }
    } catch (error: any) {
      logger.error('Batch export failed', { error: error.message, format });
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error.message,
      };
    }
  }

  /**
   * Export invoice to PDF (HTML to PDF conversion)
   */
  private async exportInvoiceToPDF(invoice: Invoice): Promise<ExportResult> {
    try {
      // Get invoice template
      const templateService = new TemplateService();
      const template = await templateService.getDefaultTemplate(invoice.tenantId, 'invoice');

      if (!template) {
        throw new Error('Invoice template not found');
      }

      // Render HTML from template (simplified for now - full template integration pending)
      const htmlContent = `
        <html>
        <body>
          <h1>Invoice ${invoice.invoiceNumber}</h1>
          <p>From: ${invoice.company?.name || ''}</p>
          <p>To: ${invoice.customer?.name || ''}</p>
          <p>Total: ${Number(invoice.total).toFixed(2)} PLN</p>
        </body>
        </html>
      `;
      const rendered = { content: htmlContent };

      // For production, use Puppeteer for HTML to PDF:
      // const browser = await puppeteer.launch({ headless: true });
      // const page = await browser.newPage();
      // await page.setContent(rendered.content);
      // const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      // await browser.close();

      // Mock PDF generation for now
      const pdfBuffer = Buffer.from(rendered.content);

      logger.info('Invoice exported to PDF', { invoiceId: invoice.id });

      return {
        success: true,
        buffer: pdfBuffer,
        filename: `invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
      };
    } catch (error: any) {
      logger.error('PDF export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export single invoice to Excel
   */
  private async exportInvoiceToExcel(invoice: Invoice): Promise<ExportResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice');

      // Set column widths
      worksheet.columns = [
        { key: 'description', width: 40 },
        { key: 'quantity', width: 12 },
        { key: 'unitPrice', width: 15 },
        { key: 'vatRate', width: 12 },
        { key: 'netAmount', width: 15 },
        { key: 'vatAmount', width: 15 },
        { key: 'grossAmount', width: 15 },
      ];

      // Add invoice header
      worksheet.addRow(['INVOICE', invoice.invoiceNumber]);
      worksheet.addRow(['Issue Date:', invoice.issueDate.toLocaleDateString('pl-PL')]);
      worksheet.addRow(['Due Date:', invoice.dueDate.toLocaleDateString('pl-PL')]);
      worksheet.addRow([]);

      // Company details
      worksheet.addRow(['SELLER']);
      worksheet.addRow([invoice.company?.name || '']);
      worksheet.addRow([invoice.company?.address || '']);
      worksheet.addRow([`NIP: ${invoice.company?.nip || ''}`]);
      worksheet.addRow([]);

      // Customer details
      worksheet.addRow(['BUYER']);
      worksheet.addRow([invoice.customer?.name || '']);
      worksheet.addRow([invoice.customer?.billingAddress || '']);
      worksheet.addRow([`NIP: ${invoice.customer?.nip || ''}`]);
      worksheet.addRow([]);

      // Items header
      const headerRow = worksheet.addRow([
        'Description',
        'Quantity',
        'Unit Price',
        'VAT Rate',
        'Net Amount',
        'VAT Amount',
        'Gross Amount',
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add items
      for (const item of invoice.items || []) {
        worksheet.addRow([
          item.description,
          item.quantity,
          Number(item.unitPrice).toFixed(2),
          `${item.vatRate}%`,
          Number(item.netAmount).toFixed(2),
          Number(item.taxAmount).toFixed(2),
          Number(item.grossAmount).toFixed(2),
        ]);
      }

      // Add totals
      worksheet.addRow([]);
      worksheet.addRow(['', '', '', '', 'Subtotal:', '', Number(invoice.subtotal).toFixed(2)]);
      worksheet.addRow(['', '', '', '', 'VAT:', '', Number(invoice.taxAmount).toFixed(2)]);
      const totalRow = worksheet.addRow(['', '', '', '', 'TOTAL:', '', Number(invoice.total).toFixed(2)]);
      totalRow.font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();

      logger.info('Invoice exported to Excel', { invoiceId: invoice.id });

      return {
        success: true,
        buffer: Buffer.from(buffer),
        filename: `invoice_${invoice.invoiceNumber}_${Date.now()}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error: any) {
      logger.error('Excel export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export multiple invoices to Excel
   */
  private async exportInvoicesToExcel(invoices: Invoice[]): Promise<ExportResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoices');

      // Set column widths
      worksheet.columns = [
        { key: 'invoiceNumber', width: 20 },
        { key: 'issueDate', width: 15 },
        { key: 'dueDate', width: 15 },
        { key: 'customer', width: 30 },
        { key: 'status', width: 15 },
        { key: 'subtotal', width: 15 },
        { key: 'tax', width: 15 },
        { key: 'total', width: 15 },
      ];

      // Add header
      const headerRow = worksheet.addRow([
        'Invoice Number',
        'Issue Date',
        'Due Date',
        'Customer',
        'Status',
        'Subtotal',
        'VAT',
        'Total',
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add invoice rows
      for (const invoice of invoices) {
        worksheet.addRow([
          invoice.invoiceNumber,
          invoice.issueDate.toLocaleDateString('pl-PL'),
          invoice.dueDate.toLocaleDateString('pl-PL'),
          invoice.customer?.name || '',
          invoice.status,
          Number(invoice.subtotal).toFixed(2),
          Number(invoice.taxAmount).toFixed(2),
          Number(invoice.total).toFixed(2),
        ]);
      }

      // Add summary row
      worksheet.addRow([]);
      const totalSubtotal = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
      const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);
      const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      const summaryRow = worksheet.addRow([
        'TOTAL',
        '',
        '',
        '',
        '',
        totalSubtotal.toFixed(2),
        totalTax.toFixed(2),
        totalAmount.toFixed(2),
      ]);
      summaryRow.font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();

      logger.info('Invoices exported to Excel', { count: invoices.length });

      return {
        success: true,
        buffer: Buffer.from(buffer),
        filename: `invoices_export_${Date.now()}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error: any) {
      logger.error('Excel batch export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export invoice to XML (eFaktura format for Polish tax authorities)
   */
  private async exportInvoiceToXML(invoice: Invoice): Promise<ExportResult> {
    try {
      // eFaktura XML structure (simplified version)
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Faktura xmlns="http://www.mf.gov.pl/schematy/SF/DefinicjeWspolne/2021/06/09/DefinicjeWspolne">
  <Naglowek>
    <KodFormularza kodSystemowy="FA(1)" wersjaSchemy="1-0">FA</KodFormularza>
    <WariantFormularza>1</WariantFormularza>
    <DataWytworzeniaFa>${new Date().toISOString()}</DataWytworzeniaFa>
    <SystemInfo>Invoice-HUB v1.0</SystemInfo>
  </Naglowek>
  <Podmiot1>
    <DaneIdentyfikacyjne>
      <NIP>${invoice.company?.nip || ''}</NIP>
      <Nazwa>${this.escapeXml(invoice.company?.name || '')}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <AdresL1>${this.escapeXml(invoice.company?.address || '')}</AdresL1>
    </Adres>
  </Podmiot1>
  <Podmiot2>
    <DaneIdentyfikacyjne>
      <NIP>${invoice.customer?.nip || ''}</NIP>
      <Nazwa>${this.escapeXml(invoice.customer?.name || '')}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <AdresL1>${this.escapeXml(invoice.customer?.billingAddress || '')}</AdresL1>
    </Adres>
  </Podmiot2>
  <Fa>
    <P_1>${invoice.issueDate.toISOString().split('T')[0]}</P_1>
    <P_2A>${invoice.invoiceNumber}</P_2A>
    <P_6>${invoice.dueDate.toISOString().split('T')[0]}</P_6>
    <P_13_1>${Number(invoice.subtotal).toFixed(2)}</P_13_1>
    <P_14_1>${Number(invoice.taxAmount).toFixed(2)}</P_14_1>
    <P_15>${Number(invoice.total).toFixed(2)}</P_15>
    <RodzajFaktury>VAT</RodzajFaktury>
    <FaWiersz>${this.generateXMLItems(invoice.items || [])}</FaWiersz>
  </Fa>
</Faktura>`;

      const buffer = Buffer.from(xml, 'utf-8');

      logger.info('Invoice exported to XML/eFaktura', { invoiceId: invoice.id });

      return {
        success: true,
        buffer,
        filename: `invoice_${invoice.invoiceNumber}_${Date.now()}.xml`,
        mimeType: 'application/xml',
      };
    } catch (error: any) {
      logger.error('XML export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate XML items section
   */
  private generateXMLItems(items: any[]): string {
    return items
      .map((item, index) => {
        return `
    <FaPozycja>
      <NrWierszaFa>${index + 1}</NrWierszaFa>
      <P_7>${this.escapeXml(item.description)}</P_7>
      <P_8A>${item.quantity}</P_8A>
      <P_9A>${Number(item.unitPrice).toFixed(2)}</P_9A>
      <P_11>${Number(item.netAmount).toFixed(2)}</P_11>
      <P_11A>${Number(item.vatAmount).toFixed(2)}</P_11A>
      <P_12>${item.vatRate}</P_12>
    </FaPozycja>`;
      })
      .join('');
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Export invoice to JSON
   */
  private async exportInvoiceToJSON(invoice: Invoice): Promise<ExportResult> {
    try {
      const data = {
        invoice: {
          id: invoice.id,
          number: invoice.invoiceNumber,
          status: invoice.status,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          company: {
            name: invoice.company?.name,
            address: invoice.company?.address,
            nip: invoice.company?.nip,
          },
          customer: {
            name: invoice.customer?.name,
            address: invoice.customer?.billingAddress,
            nip: invoice.customer?.nip,
          },
          items: invoice.items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            vatRate: item.vatRate,
            netAmount: Number(item.netAmount),
            taxAmount: Number(item.taxAmount),
            grossAmount: Number(item.grossAmount),
          })),
          totals: {
            subtotal: Number(invoice.subtotal),
            tax: Number(invoice.taxAmount),
            total: Number(invoice.total),
          },
          notes: invoice.notes,
        },
        exportDate: new Date().toISOString(),
        exportedBy: 'Invoice-HUB',
      };

      const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');

      logger.info('Invoice exported to JSON', { invoiceId: invoice.id });

      return {
        success: true,
        buffer,
        filename: `invoice_${invoice.invoiceNumber}_${Date.now()}.json`,
        mimeType: 'application/json',
      };
    } catch (error: any) {
      logger.error('JSON export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export multiple invoices to JSON
   */
  private async exportInvoicesToJSON(invoices: Invoice[]): Promise<ExportResult> {
    try {
      const data = {
        invoices: invoices.map(invoice => ({
          id: invoice.id,
          number: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          customer: invoice.customer?.name,
          status: invoice.status,
          subtotal: Number(invoice.subtotal),
          tax: Number(invoice.taxAmount),
          total: Number(invoice.total),
        })),
        totalCount: invoices.length,
        exportDate: new Date().toISOString(),
      };

      const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');

      logger.info('Invoices exported to JSON', { count: invoices.length });

      return {
        success: true,
        buffer,
        filename: `invoices_export_${Date.now()}.json`,
        mimeType: 'application/json',
      };
    } catch (error: any) {
      logger.error('JSON batch export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export invoice to CSV
   */
  private async exportInvoiceToCSV(invoice: Invoice): Promise<ExportResult> {
    try {
      const headers = [
        'Invoice Number',
        'Issue Date',
        'Due Date',
        'Company',
        'Customer',
        'Description',
        'Quantity',
        'Unit Price',
        'VAT Rate',
        'Net Amount',
        'VAT Amount',
        'Gross Amount',
      ];

      const rows: string[][] = [];
      rows.push(headers);

      for (const item of invoice.items || []) {
        rows.push([
          invoice.invoiceNumber || '',
          invoice.issueDate.toLocaleDateString('pl-PL'),
          invoice.dueDate.toLocaleDateString('pl-PL'),
          invoice.company?.name || '',
          invoice.customer?.name || '',
          item.description,
          item.quantity.toString(),
          Number(item.unitPrice).toFixed(2),
          `${item.vatRate}%`,
          Number(item.netAmount).toFixed(2),
          Number(item.taxAmount).toFixed(2),
          Number(item.grossAmount).toFixed(2),
        ]);
      }

      const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      logger.info('Invoice exported to CSV', { invoiceId: invoice.id });

      return {
        success: true,
        buffer,
        filename: `invoice_${invoice.invoiceNumber}_${Date.now()}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error: any) {
      logger.error('CSV export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export multiple invoices to CSV
   */
  private async exportInvoicesToCSV(invoices: Invoice[]): Promise<ExportResult> {
    try {
      const headers = [
        'Invoice Number',
        'Issue Date',
        'Due Date',
        'Customer',
        'Status',
        'Subtotal',
        'VAT',
        'Total',
      ];

      const rows: string[][] = [];
      rows.push(headers);

      for (const invoice of invoices) {
        rows.push([
          invoice.invoiceNumber || '',
          invoice.issueDate.toLocaleDateString('pl-PL'),
          invoice.dueDate.toLocaleDateString('pl-PL'),
          invoice.customer?.name || '',
          invoice.status,
          Number(invoice.subtotal).toFixed(2),
          Number(invoice.taxAmount).toFixed(2),
          Number(invoice.total).toFixed(2),
        ]);
      }

      const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      logger.info('Invoices exported to CSV', { count: invoices.length });

      return {
        success: true,
        buffer,
        filename: `invoices_export_${Date.now()}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error: any) {
      logger.error('CSV batch export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export generic data to Excel (for reports)
   */
  async exportDataToExcel(data: any): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Add title
      worksheet.addRow([data.title || 'Report']);
      worksheet.getRow(1).font = { bold: true, size: 16 };
      
      if (data.period) {
        worksheet.addRow([`Period: ${data.period}`]);
      }
      
      worksheet.addRow([]); // Empty row

      // Convert data to rows
      const reportData = data.data;
      if (Array.isArray(reportData)) {
        // Array of objects - create table
        if (reportData.length > 0) {
          const headers = Object.keys(reportData[0]);
          worksheet.addRow(headers);
          const headerRow = worksheet.lastRow;
          if (headerRow) {
            headerRow.font = { bold: true };
            headerRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' },
            };
          }

          reportData.forEach((item: any) => {
            const values = headers.map(h => item[h]);
            worksheet.addRow(values);
          });
        }
      } else if (typeof reportData === 'object') {
        // Object - create key-value pairs
        Object.entries(reportData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            worksheet.addRow([key]);
            if (value.length > 0 && typeof value[0] === 'object') {
              const headers = Object.keys(value[0]);
              worksheet.addRow(['', ...headers]);
              value.forEach((item: any) => {
                const values = headers.map(h => item[h]);
                worksheet.addRow(['', ...values]);
              });
            }
          } else if (typeof value === 'object' && value !== null) {
            worksheet.addRow([key]);
            Object.entries(value).forEach(([subKey, subValue]) => {
              worksheet.addRow(['', subKey, subValue]);
            });
          } else {
            worksheet.addRow([key, value]);
          }
        });
      }

      // Auto-fit columns
      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: false }, (cell: any) => {
          const cellValue = cell.value?.toString() || '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      logger.info('Data exported to Excel');
      return Buffer.from(buffer);
    } catch (error: any) {
      logger.error('Excel data export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export generic data to CSV (for reports)
   */
  async exportDataToCSV(data: any): Promise<Buffer> {
    try {
      const rows: string[][] = [];
      
      // Add title
      rows.push([data.title || 'Report']);
      if (data.period) {
        rows.push([`Period: ${data.period}`]);
      }
      rows.push([]); // Empty row

      const reportData = data.data;
      if (Array.isArray(reportData) && reportData.length > 0) {
        // Array of objects
        const headers = Object.keys(reportData[0]);
        rows.push(headers);
        
        reportData.forEach((item: any) => {
          const values = headers.map(h => String(item[h] || ''));
          rows.push(values);
        });
      } else if (typeof reportData === 'object') {
        // Object - key-value pairs
        Object.entries(reportData).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            rows.push([key]);
            const headers = Object.keys(value[0]);
            rows.push(['', ...headers]);
            value.forEach((item: any) => {
              const values = headers.map(h => String(item[h] || ''));
              rows.push(['', ...values]);
            });
          } else {
            rows.push([key, String(value)]);
          }
        });
      }

      const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const buffer = Buffer.from(csv, 'utf-8');
      
      logger.info('Data exported to CSV');
      return buffer;
    } catch (error: any) {
      logger.error('CSV data export failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export tax report to XML (JPK_VAT format)
   */
  exportTaxReportToXML(report: any): string {
    try {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<TaxReport>\n';
      xml += `  <Period>\n`;
      xml += `    <StartDate>${report.period.startDate.toISOString().split('T')[0]}</StartDate>\n`;
      xml += `    <EndDate>${report.period.endDate.toISOString().split('T')[0]}</EndDate>\n`;
      xml += `  </Period>\n`;
      xml += `  <Summary>\n`;
      xml += `    <TotalNetAmount>${report.totalNetAmount.toFixed(2)}</TotalNetAmount>\n`;
      xml += `    <TotalTaxAmount>${report.totalTaxAmount.toFixed(2)}</TotalTaxAmount>\n`;
      xml += `    <TotalGrossAmount>${report.totalGrossAmount.toFixed(2)}</TotalGrossAmount>\n`;
      xml += `    <InvoiceCount>${report.invoiceCount}</InvoiceCount>\n`;
      xml += `  </Summary>\n`;
      xml += `  <TaxRateBreakdown>\n`;
      
      for (const rate of report.taxByRate) {
        xml += `    <Rate>\n`;
        xml += `      <VATRate>${rate.vatRate}</VATRate>\n`;
        xml += `      <NetAmount>${rate.netAmount.toFixed(2)}</NetAmount>\n`;
        xml += `      <TaxAmount>${rate.taxAmount.toFixed(2)}</TaxAmount>\n`;
        xml += `      <GrossAmount>${rate.grossAmount.toFixed(2)}</GrossAmount>\n`;
        xml += `      <InvoiceCount>${rate.invoiceCount}</InvoiceCount>\n`;
        xml += `    </Rate>\n`;
      }
      
      xml += `  </TaxRateBreakdown>\n`;
      xml += '</TaxReport>';

      logger.info('Tax report exported to XML');
      return xml;
    } catch (error: any) {
      logger.error('XML tax report export failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export default new ExportService();
