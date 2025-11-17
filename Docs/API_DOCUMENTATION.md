# Invoice-HUB API Documentation

## Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.invoice-hub.com/api/v1`

## Interactive API Documentation
Access the Swagger UI at: `/api-docs`
Download OpenAPI JSON spec at: `/api-docs.json`

## Authentication

All API endpoints (except `/auth/register` and `/auth/login`) require JWT authentication.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Endpoints

#### POST /auth/register
Register a new user and tenant.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "Acme Corp"
}
```

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

**Response (201):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", ... },
    "tenant": { "id": "uuid", "name": "Acme Corp", ... },
    "accessToken": "jwt.token.here",
    "refreshToken": "refresh.token.here"
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tenantId": "uuid"
}
```

**Response (200):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", ... },
    "tenant": { "id": "uuid", "name": "Acme Corp", ... },
    "accessToken": "jwt.token.here",
    "refreshToken": "refresh.token.here"
  }
}
```

## Companies

#### GET /:tenantId/companies
Get all companies for a tenant.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "My Company Ltd",
    "nip": "1234567890",
    "address": "123 Main St",
    "city": "Warsaw",
    "postalCode": "00-001",
    "email": "company@example.com",
    "phone": "+48123456789",
    "bankAccount": "PL12345678901234567890123456"
  }
]
```

#### POST /:tenantId/companies
Create a new company.

**Request Body:**
```json
{
  "name": "My Company Ltd",
  "nip": "1234567890",
  "address": "123 Main St",
  "city": "Warsaw",
  "postalCode": "00-001",
  "country": "Poland",
  "email": "company@example.com",
  "phone": "+48123456789",
  "bankAccount": "PL12345678901234567890123456",
  "bankName": "PKO BP"
}
```

## Customers

#### GET /:tenantId/customers
Get all customers for a tenant.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name or email

#### POST /:tenantId/customers
Create a new customer.

**Request Body:**
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+48123456789",
  "nip": "1234567890",
  "billingAddress": "456 Customer St",
  "city": "Krakow",
  "postalCode": "30-001",
  "country": "Poland",
  "customerType": "company"
}
```

## Products

#### GET /:tenantId/products
Get all products for a tenant.

#### POST /:tenantId/products
Create a new product.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "sku": "PROD-001",
  "price": 100.00,
  "vatRate": 23,
  "unit": "pcs",
  "category": "Electronics"
}
```

**VAT Rates:**
- `23` - Standard rate (23%)
- `8` - Reduced rate (8%)
- `5` - Reduced rate (5%)
- `0` - Zero-rated (0%)
- `-1` - Exempt (ZW)

## Invoices

#### POST /:tenantId/invoices
Create a new invoice.

**Request Body:**
```json
{
  "companyId": "uuid",
  "customerId": "uuid",
  "invoiceType": "standard",
  "issueDate": "2025-11-14",
  "dueDate": "2025-12-14",
  "items": [
    {
      "productId": "uuid",
      "description": "Product/Service",
      "quantity": 1,
      "unitPrice": 100.00,
      "vatRate": 23,
      "discountPercent": 0
    }
  ],
  "notes": "Optional notes",
  "termsAndConditions": "Payment terms"
}
```

**Invoice Types:**
- `standard` - Regular invoice
- `proforma` - Proforma invoice
- `corrective` - Correction invoice
- `advance` - Advance payment invoice
- `final` - Final invoice

**Invoice Statuses:**
- `draft` - Created but not finalized
- `pending` - Waiting for approval
- `approved` - Approved and ready to send
- `sent` - Sent to customer
- `viewed` - Viewed by customer
- `paid` - Fully paid
- `overdue` - Past due date
- `cancelled` - Cancelled

#### GET /:tenantId/invoices/:invoiceId/export
Export invoice in various formats.

**Query Parameters:**
- `format`: `pdf`, `excel`, `xml`, `json`, `csv`

**Response:** Binary file download

#### POST /:tenantId/invoices/export
Export multiple invoices.

**Request Body:**
```json
{
  "invoiceIds": ["uuid1", "uuid2"],
  "format": "excel"
}
```

#### PUT /:tenantId/invoices/:invoiceId/send
Mark invoice as sent and optionally send via email.

**Request Body:**
```json
{
  "sendEmail": true,
  "sentDate": "2025-11-14T10:00:00Z"
}
```

#### POST /:tenantId/invoices/:invoiceId/payment
Record a payment for an invoice.

**Request Body:**
```json
{
  "paidAmount": 123.00,
  "paymentDate": "2025-11-14"
}
```

## Reports

#### GET /reports/:tenantId/sales
Generate sales report.

**Query Parameters:**
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date
- `companyId` (optional): Filter by company
- `format` (optional): `json`, `excel`, `csv`

**Response (200):**
```json
{
  "totalRevenue": 10000.00,
  "totalInvoices": 50,
  "paidInvoices": 40,
  "unpaidInvoices": 8,
  "overdueInvoices": 2,
  "averageInvoiceValue": 200.00,
  "totalTaxCollected": 2300.00,
  "revenueByMonth": [...],
  "revenueByStatus": [...]
}
```

#### GET /reports/:tenantId/tax
Generate tax report (JPK_VAT compatible).

**Query Parameters:**
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date
- `companyId` (optional): Filter by company
- `format` (optional): `json`, `xml`, `excel`

#### GET /reports/:tenantId/customers
Get customer analytics.

**Query Parameters:**
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range
- `limit` (optional): Number of top customers (default: 10)

#### GET /reports/:tenantId/dashboard
Get dashboard metrics.

**Query Parameters:**
- `companyId` (optional): Filter by company

**Response (200):**
```json
{
  "currentMonth": {
    "revenue": 5000.00,
    "invoiceCount": 25,
    "paidInvoices": 20,
    "overdueInvoices": 2
  },
  "lastMonth": {
    "revenue": 4500.00,
    "invoiceCount": 22
  },
  "growthRate": 11.11,
  "outstandingAmount": 1500.00,
  "topCustomers": [...],
  "topProducts": [...]
}
```

## Webhooks

#### POST /webhooks/:tenantId
Register a new webhook.

**Request Body:**
```json
{
  "url": "https://example.com/webhook",
  "events": ["invoice.created", "invoice.paid"],
  "description": "Payment tracking webhook"
}
```

**Available Events:**
- `invoice.created`
- `invoice.updated`
- `invoice.sent`
- `invoice.viewed`
- `invoice.paid`
- `invoice.overdue`
- `invoice.cancelled`
- `customer.created`
- `customer.updated`
- `payment.received`
- `payment.failed`

**Response (201):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "url": "https://example.com/webhook",
  "events": ["invoice.created", "invoice.paid"],
  "status": "active",
  "secret": "webhook_secret_for_signature_verification",
  "description": "Payment tracking webhook",
  "successCount": 0,
  "failureCount": 0,
  "createdAt": "2025-11-14T10:00:00Z"
}
```

#### GET /webhooks/:tenantId/:webhookId/deliveries
Get delivery history for a webhook.

**Query Parameters:**
- `limit` (optional): Number of deliveries (default: 50, max: 100)

### Webhook Payload Example

When an event occurs, Invoice-HUB sends a POST request to your webhook URL:

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: hmac_sha256_signature
X-Webhook-Event: invoice.created
X-Webhook-Delivery-ID: uuid
```

**Body:**
```json
{
  "event": "invoice.created",
  "timestamp": "2025-11-14T10:00:00Z",
  "tenantId": "uuid",
  "data": {
    "invoiceId": "uuid",
    "invoiceNumber": "INV-2025-001",
    "customerId": "uuid",
    "total": 123.00,
    "status": "draft"
  }
}
```

### Webhook Signature Verification

Verify webhook authenticity using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Templates

#### GET /:tenantId/templates
Get all invoice templates.

#### POST /:tenantId/templates
Create a custom template.

**Request Body:**
```json
{
  "name": "Custom Template",
  "type": "standard",
  "subject": "Invoice {{invoiceNumber}}",
  "body": "Dear {{customerName}},\n\nPlease find attached invoice {{invoiceNumber}} for {{total}} {{currency}}.\n\nThank you!"
}
```

**Template Variables:**
- `{{invoiceNumber}}`
- `{{customerName}}`
- `{{companyName}}`
- `{{total}}`
- `{{currency}}`
- `{{dueDate}}`
- `{{issueDate}}`

**Template Conditionals:**
```
{{#if isPaid}}
Payment received - Thank you!
{{else}}
Payment due: {{dueDate}}
{{/if}}
```

**Template Loops:**
```
{{#each items}}
- {{description}}: {{quantity}} x {{unitPrice}}
{{/each}}
```

## Notifications

#### GET /:tenantId/notifications
Get user notifications.

**Query Parameters:**
- `unreadOnly` (optional): `true` to show only unread

#### PATCH /:tenantId/notifications/:notificationId/read
Mark notification as read.

## Scheduler

#### GET /:tenantId/scheduler/tasks
Get all scheduled tasks.

#### POST /:tenantId/scheduler/tasks/:taskId/run
Run a scheduled task immediately.

## Error Responses

All error responses follow this format:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes per IP
- General API endpoints: 100 requests per 15 minutes per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1731589200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Per-Page: 20
X-Total-Pages: 8
```

## Postman Collection

Import the Postman collection for easy API testing:
`/api-docs.json` can be imported directly into Postman.

## Support

For API support, contact: support@invoice-hub.com

---

## Receipts & E-Receipts

#### POST /:tenantId/receipts
Create a new receipt.

**Request Body:**
```json
{
  "receiptType": "standard",
  "issueDate": "2025-11-17",
  "companyId": "uuid",
  "customerId": "uuid",
  "items": [
    {
      "name": "Product/Service",
      "quantity": 1,
      "unitPrice": 100.00,
      "vatRate": 23
    }
  ],
  "notes": "Optional notes"
}
```

**Receipt Types:**
- `standard` - Regular receipt
- `e_receipt` - Electronic receipt
- `fiscal` - Fiscal printer receipt

**Receipt Statuses:**
- `draft` - Created but not issued
- `issued` - Issued to customer
- `sent` - Sent to customer
- `cancelled` - Cancelled

#### GET /:tenantId/receipts
Get all receipts with optional filters.

**Query Parameters:**
- `status`: Filter by receipt status
- `receiptType`: Filter by receipt type
- `startDate`: Filter by date range (start)
- `endDate`: Filter by date range (end)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### GET /:tenantId/receipts/:receiptId
Get receipt details by ID.

#### PUT /:tenantId/receipts/:receiptId
Update receipt.

#### POST /:tenantId/receipts/:receiptId/issue
Issue a draft receipt.

#### POST /:tenantId/receipts/:receiptId/cancel
Cancel a receipt.

#### DELETE /:tenantId/receipts/:receiptId
Delete a draft receipt.

#### GET /:tenantId/receipts-stats
Get receipt statistics.

**Query Parameters:**
- `startDate`: Filter by date range (start)
- `endDate`: Filter by date range (end)

---

## Expense Management

#### POST /:tenantId/expenses
Create a new expense.

**Request Body:**
```json
{
  "description": "Office supplies",
  "category": "office_supplies",
  "expenseDate": "2025-11-17",
  "netAmount": 100.00,
  "vatRate": 23,
  "vendor": "Supplier Name",
  "invoiceNumber": "INV-001",
  "receiptUrl": "https://...",
  "notes": "Optional notes"
}
```

**Expense Categories:**
- `office_supplies` - Office supplies
- `utilities` - Utilities
- `rent` - Rent
- `transportation` - Transportation
- `meals` - Meals
- `equipment` - Equipment
- `software` - Software
- `marketing` - Marketing
- `professional_services` - Professional services
- `insurance` - Insurance
- `taxes` - Taxes
- `other` - Other

**Expense Statuses:**
- `draft` - Created but not submitted
- `pending_approval` - Waiting for approval
- `approved` - Approved
- `rejected` - Rejected
- `paid` - Paid

#### GET /:tenantId/expenses
Get all expenses with optional filters.

**Query Parameters:**
- `status`: Filter by expense status
- `category`: Filter by expense category
- `userId`: Filter by user
- `startDate`: Filter by date range (start)
- `endDate`: Filter by date range (end)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### GET /:tenantId/expenses/:expenseId
Get expense details by ID.

#### PUT /:tenantId/expenses/:expenseId
Update expense.

#### POST /:tenantId/expenses/:expenseId/submit
Submit expense for approval.

#### POST /:tenantId/expenses/:expenseId/approve
Approve an expense.

#### POST /:tenantId/expenses/:expenseId/reject
Reject an expense.

#### POST /:tenantId/expenses/:expenseId/pay
Mark expense as paid.

**Request Body:**
```json
{
  "paymentMethod": "bank_transfer",
  "paidDate": "2025-11-17"
}
```

#### POST /:tenantId/expenses/:expenseId/ocr
Process OCR data for expense.

**Request Body:**
```json
{
  "vendor": "Extracted vendor name",
  "amount": 123.00,
  "date": "2025-11-17",
  "invoiceNumber": "INV-001",
  "confidence": 0.95,
  "rawText": "OCR raw text"
}
```

#### DELETE /:tenantId/expenses/:expenseId
Delete an expense (only if not paid).

#### GET /:tenantId/expenses-stats
Get expense statistics.

**Query Parameters:**
- `startDate`: Filter by date range (start)
- `endDate`: Filter by date range (end)

---

## Warehouse & Inventory Management

#### POST /:tenantId/warehouses
Create a new warehouse.

**Request Body:**
```json
{
  "code": "WH-001",
  "name": "Main Warehouse",
  "type": "main",
  "address": "123 Storage St",
  "city": "Warsaw",
  "postalCode": "00-001",
  "country": "Poland",
  "managerId": "uuid",
  "contactEmail": "warehouse@company.com",
  "contactPhone": "+48123456789"
}
```

**Warehouse Types:**
- `main` - Main warehouse
- `branch` - Branch warehouse
- `virtual` - Virtual/dropshipping warehouse
- `consignment` - Consignment warehouse

#### GET /:tenantId/warehouses
Get all warehouses.

**Query Parameters:**
- `type`: Filter by warehouse type
- `isActive`: Filter by active status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### GET /:tenantId/warehouses/:warehouseId
Get warehouse details.

#### PUT /:tenantId/warehouses/:warehouseId
Update warehouse.

#### DELETE /:tenantId/warehouses/:warehouseId
Delete warehouse (only if no stock).

#### POST /:tenantId/warehouses/:warehouseId/stock
Add stock to warehouse.

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 100,
  "location": "A-1-5",
  "minStockLevel": 10,
  "maxStockLevel": 500
}
```

#### GET /:tenantId/warehouses/:warehouseId/stock
Get warehouse stock.

**Query Parameters:**
- `lowStock`: Filter low stock items (true/false)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

#### GET /:tenantId/warehouses/alerts/low-stock
Get low stock alerts across all warehouses.

#### GET /:tenantId/warehouses/reports/stock
Get stock report summary.

---

## Department Management

#### POST /:tenantId/departments
Create a new department.

**Request Body:**
```json
{
  "name": "Sales",
  "description": "Sales department",
  "code": "SALES",
  "managerId": "uuid",
  "budgetLimits": {
    "monthly": 10000,
    "yearly": 120000,
    "currency": "PLN"
  }
}
```

#### GET /:tenantId/departments
Get all departments.

**Query Parameters:**
- `isActive`: Filter by active status
- `managerId`: Filter by manager
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### GET /:tenantId/departments/:departmentId
Get department details.

#### PUT /:tenantId/departments/:departmentId
Update department.

#### DELETE /:tenantId/departments/:departmentId
Deactivate department.

#### GET /:tenantId/departments-stats
Get department statistics.

---

## KSeF Integration (National e-Invoicing System)

#### POST /:tenantId/ksef/config
Create KSeF configuration.

**Request Body:**
```json
{
  "nip": "1234567890",
  "token": "ksef_api_token",
  "isEnabled": true,
  "autoSubmit": false,
  "environment": "production",
  "settings": {
    "testMode": false,
    "emailNotifications": true,
    "autoRetry": true,
    "maxRetries": 3
  }
}
```

#### GET /:tenantId/ksef/config
Get KSeF configuration.

#### PUT /:tenantId/ksef/config
Update KSeF configuration.

#### DELETE /:tenantId/ksef/config
Delete KSeF configuration.

#### POST /:tenantId/ksef/submit/:invoiceId
Submit invoice to KSeF.

**Response (201):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Invoice submitted to KSeF",
  "data": {
    "id": "uuid",
    "invoiceId": "uuid",
    "status": "pending",
    "submittedAt": "2025-11-17T10:00:00Z"
  }
}
```

**KSeF Statuses:**
- `pending` - Queued for submission
- `submitted` - Submitted to KSeF
- `accepted` - Accepted by KSeF
- `rejected` - Rejected by KSeF
- `error` - Submission error

#### GET /:tenantId/ksef/submissions/:submissionId
Get submission status.

#### GET /:tenantId/ksef/submissions
Get all submissions.

**Query Parameters:**
- `status`: Filter by submission status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### GET /:tenantId/ksef/stats
Get KSeF statistics.

---

## Support

For API support, contact: support@invoice-hub.com
