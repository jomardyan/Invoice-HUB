/**
 * Swagger/OpenAPI Configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Invoice-HUB API',
      version: '1.0.0',
      description: 'Complete invoicing platform with multi-tenant support, automated workflows, and integrations',
      contact: {
        name: 'Invoice-HUB Support',
        email: 'support@invoice-hub.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
      {
        url: `https://api.invoice-hub.com/api/${config.apiVersion}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            subdomain: { type: 'string' },
            settings: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            nip: { type: 'string', description: 'Tax identification number (NIP)' },
            address: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string', default: 'Poland' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            website: { type: 'string' },
            vatEu: { type: 'string', nullable: true },
            bankAccount: { type: 'string' },
            bankName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            nip: { type: 'string', nullable: true },
            billingAddress: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string', default: 'Poland' },
            customerType: { 
              type: 'string', 
              enum: ['company', 'individual'],
              default: 'individual'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            sku: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            vatRate: { type: 'number', enum: [23, 8, 5, 0, -1] },
            unit: { type: 'string', default: 'pcs' },
            category: { type: 'string' },
            active: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            companyId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            type: {
              type: 'string',
              enum: ['standard', 'proforma', 'corrective', 'advance', 'final'],
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'approved', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
            },
            issueDate: { type: 'string', format: 'date' },
            dueDate: { type: 'string', format: 'date' },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            subtotal: { type: 'number', format: 'decimal' },
            taxAmount: { type: 'number', format: 'decimal' },
            total: { type: 'number', format: 'decimal' },
            currency: { type: 'string', default: 'PLN' },
            notes: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/InvoiceItem' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InvoiceItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            quantity: { type: 'number' },
            unitPrice: { type: 'number', format: 'decimal' },
            netAmount: { type: 'number', format: 'decimal' },
            vatRate: { type: 'number' },
            taxAmount: { type: 'number', format: 'decimal' },
            grossAmount: { type: 'number', format: 'decimal' },
            discountPercent: { type: 'number', default: 0 },
            lineNumber: { type: 'number' },
          },
        },
        Webhook: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            url: { type: 'string', format: 'uri' },
            events: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'invoice.created',
                  'invoice.updated',
                  'invoice.sent',
                  'invoice.viewed',
                  'invoice.paid',
                  'invoice.overdue',
                  'invoice.cancelled',
                  'customer.created',
                  'customer.updated',
                  'payment.received',
                  'payment.failed',
                ],
              },
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              default: 'active',
            },
            secret: { type: 'string' },
            description: { type: 'string', nullable: true },
            successCount: { type: 'number' },
            failureCount: { type: 'number' },
            lastTriggeredAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SalesReport: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number', format: 'decimal' },
            totalInvoices: { type: 'number' },
            paidInvoices: { type: 'number' },
            unpaidInvoices: { type: 'number' },
            overdueInvoices: { type: 'number' },
            averageInvoiceValue: { type: 'number', format: 'decimal' },
            totalTaxCollected: { type: 'number', format: 'decimal' },
            revenueByMonth: { type: 'array', items: { type: 'object' } },
            revenueByStatus: { type: 'array', items: { type: 'object' } },
          },
        },
        TaxReport: {
          type: 'object',
          properties: {
            period: {
              type: 'object',
              properties: {
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
              },
            },
            totalNetAmount: { type: 'number', format: 'decimal' },
            totalTaxAmount: { type: 'number', format: 'decimal' },
            totalGrossAmount: { type: 'number', format: 'decimal' },
            taxByRate: { type: 'array', items: { type: 'object' } },
            invoiceCount: { type: 'number' },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Companies', description: 'Company management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Invoices', description: 'Invoice operations' },
      { name: 'Templates', description: 'Invoice templates' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Reports', description: 'Business intelligence and analytics' },
      { name: 'Webhooks', description: 'Webhook subscriptions' },
      { name: 'Scheduler', description: 'Automated tasks' },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to API route files
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
