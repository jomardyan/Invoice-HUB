# Invoice-HUB API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Production URL:** `https://api.invoice-hub.com/api/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Monitoring](#health--monitoring)
3. [Companies](#companies)
4. [Customers](#customers)
5. [Products](#products)
6. [Invoices](#invoices)
7. [Payments](#payments)
8. [Templates](#templates)
9. [Notifications](#notifications)
10. [Reports](#reports)
11. [Webhooks](#webhooks)
12. [Scheduler](#scheduler)
13. [Allegro Integration](#allegro-integration)
14. [Error Handling](#error-handling)

---

## Authentication

All endpoints except authentication routes require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register

Create a new user account and tenant.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "companyName": "ACME Corp"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["owner"],
      "tenantId": "uuid"
    },
    "tenant": {
      "id": "uuid",
      "name": "ACME Corp",
      "subdomain": "acme-corp"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### Login

Authenticate an existing user.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["owner"],
      "tenantId": "uuid"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### Refresh Token

Refresh access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

### Logout

Invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## Health & Monitoring

### Health Check

Basic health endpoint for load balancers.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T15:47:12.354Z"
}
```

### Liveness Probe

Kubernetes liveness probe.

**Endpoint:** `GET /health/live`

**Response:** `200 OK`
```json
{
  "status": "alive",
  "timestamp": "2025-11-14T15:47:12.354Z"
}
```

### Readiness Probe

Kubernetes readiness probe - checks database and Redis.

**Endpoint:** `GET /health/ready`

**Response:** `200 OK` or `503 Service Unavailable`
```json
{
  "status": "ready",
  "timestamp": "2025-11-14T15:47:12.354Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

### Detailed Health

Comprehensive health check with metrics.

**Endpoint:** `GET /health/detailed`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "uptime": 12.841535463,
  "memory": {
    "rss": 657141760,
    "heapTotal": 553709568,
    "heapUsed": 512860032,
    "external": 9418640
  },
  "metrics": {
    "totalRequests": 4,
    "totalErrors": 0,
    "errorRate": 0,
    "averageResponseTime": "1.56",
    "medianResponseTime": "1.56",
    "p95ResponseTime": "2.55",
    "p99ResponseTime": "2.55"
  },
  "timestamp": "2025-11-14T15:47:12.390Z",
  "environment": "development"
}
```

### Metrics

Application performance metrics.

**Endpoint:** `GET /health/metrics`

**Response:** `200 OK`
```json
{
  "timestamp": "2025-11-14T15:47:12.397Z",
  "uptime": 12.849637239,
  "memory": {
    "heapUsed": "489MB",
    "heapTotal": "528MB",
    "external": "9MB",
    "rss": "627MB"
  },
  "requests": 5,
  "errors": 0,
  "errorRate": "0.00%",
  "responseTime": {
    "average": "1.41ms",
    "median": "1.05ms",
    "p95": "2.55ms",
    "p99": "2.55ms"
  }
}
```

---

## Companies

Manage company/seller information.

### Create Company

**Endpoint:** `POST /:tenantId/companies`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "ACME Corporation",
  "nip": "1234567890",
  "address": "ul. Testowa 123",
  "postalCode": "00-001",
  "city": "Warsaw",
  "country": "PL",
  "email": "contact@acme.com",
  "phone": "+48123456789",
  "bankAccount": "PL12345678901234567890123456",
  "vatEu": "PL1234567890"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "ACME Corporation",
    "nip": "1234567890",
    "vatEu": "PL1234567890",
    "address": "ul. Testowa 123",
    "postalCode": "00-001",
    "city": "Warsaw",
    "country": "PL",
    "email": "contact@acme.com",
    "phone": "+48123456789",
    "bankAccount": "PL12345678901234567890123456",
    "isActive": true,
    "createdAt": "2025-11-14T15:47:12.537Z",
    "updatedAt": "2025-11-14T15:47:12.537Z"
  }
}
```

### List Companies

**Endpoint:** `GET /:tenantId/companies`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by name, NIP, or email

**Response:** `200 OK`
```json
{
  "status": "success",
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "ACME Corporation",
      "nip": "1234567890",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

### Get Company by ID

**Endpoint:** `GET /:tenantId/companies/:id`

**Response:** `200 OK`
```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "ACME Corporation",
    ...
  }
}
```

### Update Company

**Endpoint:** `PUT /:tenantId/companies/:id`

**Request Body:** (partial update supported)
```json
{
  "name": "Updated Company Name",
  "email": "newemail@acme.com"
}
```

**Response:** `200 OK`

### Delete Company

**Endpoint:** `DELETE /:tenantId/companies/:id`

**Response:** `204 No Content`

---

## Customers

Manage customer/buyer information.

### Create Customer

**Endpoint:** `POST /:tenantId/customers`

**Request Body:**
```json
{
  "name": "Client Corp",
  "type": "business",
  "email": "client@example.com",
  "phone": "+48987654321",
  "nip": "9876543210",
  "billingAddress": "ul. Klienta 456",
  "billingPostalCode": "02-002",
  "billingCity": "Krakow",
  "billingCountry": "PL",
  "paymentTermDays": 30
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "type": "business",
    "name": "Client Corp",
    "email": "client@example.com",
    "phone": "+48987654321",
    "nip": "9876543210",
    "billingAddress": "ul. Klienta 456",
    "billingPostalCode": "02-002",
    "billingCity": "Krakow",
    "billingCountry": "PL",
    "paymentTermDays": 30,
    "creditLimit": "0.00",
    "isActive": true,
    "createdAt": "2025-11-14T15:47:12.614Z",
    "updatedAt": "2025-11-14T15:47:12.614Z"
  }
}
```

### List Customers

**Endpoint:** `GET /:tenantId/customers`

**Query Parameters:**
- `page`, `limit`, `search`
- `type`: Filter by customer type (business/individual)

**Response:** `200 OK` (similar structure to companies)

### Get Customer by ID

**Endpoint:** `GET /:tenantId/customers/:id`

### Update Customer

**Endpoint:** `PUT /:tenantId/customers/:id`

### Delete Customer

**Endpoint:** `DELETE /:tenantId/customers/:id`

---

## Products

Manage product catalog.

### Create Product

**Endpoint:** `POST /:tenantId/products`

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Widget Pro",
  "description": "Premium widget",
  "category": "Electronics",
  "price": 99.99,
  "vatRate": 23,
  "unit": "pcs"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "sku": "PROD-001",
    "name": "Widget Pro",
    "description": "Premium widget",
    "category": "Electronics",
    "price": "99.99",
    "currency": "PLN",
    "vatRate": "23.00",
    "unit": "pcs",
    "isActive": true,
    "createdAt": "2025-11-14T15:47:12.664Z",
    "updatedAt": "2025-11-14T15:47:12.664Z"
  }
}
```

### List Products

**Endpoint:** `GET /:tenantId/products`

**Query Parameters:**
- `page`, `limit`, `search`
- `category`: Filter by category
- `active`: Filter by active status

### Get Product by ID

**Endpoint:** `GET /:tenantId/products/:id`

### Update Product

**Endpoint:** `PUT /:tenantId/products/:id`

### Delete Product

**Endpoint:** `DELETE /:tenantId/products/:id`

---

## Invoices

Complete invoice lifecycle management.

### Create Invoice

**Endpoint:** `POST /:tenantId/invoices`

**Request Body:**
```json
{
  "companyId": "uuid",
  "customerId": "uuid",
  "type": "standard",
  "issueDate": "2025-11-14",
  "dueDate": "2025-11-28",
  "paymentTermDays": 30,
  "currency": "PLN",
  "notes": "Thank you for your business",
  "items": [
    {
      "description": "Widget Pro",
      "quantity": 5,
      "unitPrice": 99.99,
      "vatRate": 23,
      "lineNumber": 1
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "companyId": "uuid",
    "customerId": "uuid",
    "invoiceNumber": "INV-2025-11-642345",
    "type": "standard",
    "status": "draft",
    "issueDate": "2025-11-14",
    "dueDate": "2025-11-28",
    "paymentTermDays": 30,
    "currency": "PLN",
    "subtotal": "499.95",
    "taxAmount": "114.99",
    "discountAmount": "0.00",
    "total": "614.94",
    "notes": "Thank you for your business",
    "items": [
      {
        "id": "uuid",
        "description": "Widget Pro",
        "quantity": "5.000",
        "unit": "pcs",
        "unitPrice": "99.99",
        "vatRate": "23.00",
        "netAmount": "499.95",
        "taxAmount": "114.99",
        "grossAmount": "614.94",
        "lineNumber": 1
      }
    ],
    "createdAt": "2025-11-14T15:47:12.715Z",
    "updatedAt": "2025-11-14T15:47:12.715Z"
  }
}
```

### List Invoices

**Endpoint:** `GET /:tenantId/invoices`

**Query Parameters:**
- `page`, `limit`
- `status`: Filter by status (draft, pending, approved, sent, viewed, paid, overdue, cancelled)
- `type`: Filter by type (standard, proforma, corrective, advance, final)
- `customerId`: Filter by customer
- `companyId`: Filter by company
- `startDate`, `endDate`: Filter by issue date range

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2025-11-642345",
      "company": { /* full company object */ },
      "customer": { /* full customer object */ },
      "status": "draft",
      "total": "614.94",
      "items": [ /* invoice items */ ],
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Invoice by ID

**Endpoint:** `GET /:tenantId/invoices/:id`

**Response:** `200 OK` (full invoice with company, customer, and items)

### Update Invoice

**Endpoint:** `PUT /:tenantId/invoices/:id`

**Note:** Only draft invoices can be updated.

### Delete Invoice

**Endpoint:** `DELETE /:tenantId/invoices/:id`

### Invoice Status Transitions

#### Mark as Pending

**Endpoint:** `PATCH /:tenantId/invoices/:id/pending`

**Response:** `200 OK`

#### Approve Invoice

**Endpoint:** `PATCH /:tenantId/invoices/:id/approve`

**Response:** `200 OK`

#### Send Invoice

**Endpoint:** `POST /:tenantId/invoices/:id/send`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "subject": "Invoice INV-2025-11-642345",
  "message": "Please find attached your invoice."
}
```

**Response:** `200 OK`

#### Mark as Paid

**Endpoint:** `PATCH /:tenantId/invoices/:id/paid`

**Request Body:**
```json
{
  "paidAt": "2025-11-15T10:30:00Z",
  "paymentMethod": "bank_transfer",
  "transactionId": "TXN123456"
}
```

**Response:** `200 OK`

#### Cancel Invoice

**Endpoint:** `PATCH /:tenantId/invoices/:id/cancel`

**Request Body:**
```json
{
  "reason": "Customer request"
}
```

**Response:** `200 OK`

### Generate PDF

**Endpoint:** `GET /:tenantId/invoices/:id/pdf`

**Response:** `200 OK` (PDF file)

---

## Payments

Track and manage payments.

### Create Payment

**Endpoint:** `POST /:tenantId/payments`

**Request Body:**
```json
{
  "invoiceId": "uuid",
  "amount": 614.94,
  "method": "bank_transfer",
  "transactionId": "TXN123456",
  "paidAt": "2025-11-15T10:30:00Z",
  "notes": "Payment received"
}
```

**Response:** `201 Created`

### List Payments

**Endpoint:** `GET /:tenantId/payments`

**Query Parameters:**
- `invoiceId`: Filter by invoice
- `customerId`: Filter by customer
- `method`: Filter by payment method
- `startDate`, `endDate`: Filter by payment date

### Get Payment by ID

**Endpoint:** `GET /:tenantId/payments/:id`

---

## Templates

Manage invoice and email templates.

### Create Template

**Endpoint:** `POST /:tenantId/templates`

**Request Body:**
```json
{
  "name": "Standard Invoice Template",
  "type": "invoice",
  "subject": "Invoice {{invoiceNumber}}",
  "body": "<h1>Invoice {{invoiceNumber}}</h1><p>Total: {{total}}</p>",
  "variables": ["invoiceNumber", "total"],
  "isDefault": false
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Standard Invoice Template",
    "type": "invoice",
    "subject": "Invoice {{invoiceNumber}}",
    "body": "<h1>Invoice {{invoiceNumber}}</h1><p>Total: {{total}}</p>",
    "variables": ["invoiceNumber", "total"],
    "isDefault": false,
    "settings": {
      "paperSize": "A4",
      "orientation": "portrait",
      "margin": "20mm"
    },
    "createdAt": "2025-11-14T15:47:12.884Z",
    "updatedAt": "2025-11-14T15:47:12.884Z"
  }
}
```

### List Templates

**Endpoint:** `GET /:tenantId/templates`

**Query Parameters:**
- `type`: Filter by type (invoice, email, sms)

### Get Template by ID

**Endpoint:** `GET /:tenantId/templates/:id`

### Update Template

**Endpoint:** `PUT /:tenantId/templates/:id`

### Delete Template

**Endpoint:** `DELETE /:tenantId/templates/:id`

### Set Default Template

**Endpoint:** `PATCH /:tenantId/templates/:id/default`

---

## Notifications

Manage user notifications.

### Get User Notifications

**Endpoint:** `GET /:tenantId/notifications`

**Query Parameters:**
- `page`, `limit`
- `isRead`: Filter by read status
- `type`: Filter by notification type

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "invoice_paid",
      "title": "Invoice Paid",
      "message": "Invoice INV-2025-11-642345 has been paid",
      "isRead": false,
      "metadata": {
        "invoiceId": "uuid",
        "amount": 614.94
      },
      "createdAt": "2025-11-14T15:47:12.884Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

### Mark Notification as Read

**Endpoint:** `PATCH /:tenantId/notifications/:id/read`

### Mark All as Read

**Endpoint:** `PATCH /:tenantId/notifications/mark-all-read`

### Delete Notification

**Endpoint:** `DELETE /:tenantId/notifications/:id`

---

## Reports

Business intelligence and analytics.

### Dashboard Metrics

**Endpoint:** `GET /:tenantId/reports/dashboard`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "revenue": {
      "total": 5000.00,
      "thisMonth": 614.94,
      "lastMonth": 1200.00,
      "growth": 25.5
    },
    "invoices": {
      "total": 50,
      "draft": 5,
      "pending": 10,
      "paid": 30,
      "overdue": 5
    },
    "customers": {
      "total": 20,
      "active": 18,
      "new": 3
    },
    "recentActivity": []
  }
}
```

### Sales Report

**Endpoint:** `GET /:tenantId/reports/sales`

**Query Parameters:**
- `startDate`, `endDate`: Date range
- `groupBy`: Group by (day, week, month, year)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "totalRevenue": 5000.00,
    "totalInvoices": 50,
    "paidInvoices": 30,
    "unpaidInvoices": 15,
    "overdueInvoices": 5,
    "averageInvoiceValue": 100.00,
    "totalTaxCollected": 1150.00,
    "revenueByMonth": [
      {
        "month": "November",
        "year": 2025,
        "revenue": 614.94,
        "invoiceCount": 1,
        "averageValue": 614.94
      }
    ]
  }
}
```

### Tax Report

**Endpoint:** `GET /:tenantId/reports/tax`

**Query Parameters:**
- `startDate`, `endDate`: Date range
- `format`: Export format (json, pdf, xml)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "period": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "totalNetAmount": 4347.83,
    "totalTaxAmount": 1000.00,
    "totalGrossAmount": 5347.83,
    "taxByRate": [
      {
        "rate": 23,
        "netAmount": 3000.00,
        "taxAmount": 690.00,
        "grossAmount": 3690.00,
        "invoiceCount": 20
      },
      {
        "rate": 8,
        "netAmount": 1347.83,
        "taxAmount": 107.83,
        "grossAmount": 1455.66,
        "invoiceCount": 10
      }
    ],
    "invoiceCount": 30
  }
}
```

### Customer Report

**Endpoint:** `GET /:tenantId/reports/customers/:customerId`

**Response:** Total revenue, invoice count, payment history for a customer.

### Export Report

**Endpoint:** `GET /:tenantId/reports/export`

**Query Parameters:**
- `type`: Report type (sales, tax, customers)
- `format`: Export format (pdf, xlsx, csv, xml)
- `startDate`, `endDate`

**Response:** File download

---

## Webhooks

Webhook subscription management.

### Create Webhook

**Endpoint:** `POST /:tenantId/webhooks`

**Request Body:**
```json
{
  "url": "https://webhook.site/your-endpoint",
  "events": ["invoice.created", "invoice.paid"],
  "description": "Production webhook"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "url": "https://webhook.site/your-endpoint",
    "events": ["invoice.created", "invoice.paid"],
    "status": "active",
    "secret": "whsec_...",
    "description": "Production webhook",
    "successCount": 0,
    "failureCount": 0,
    "createdAt": "2025-11-14T15:47:12.851Z",
    "updatedAt": "2025-11-14T15:47:12.851Z"
  }
}
```

### List Webhooks

**Endpoint:** `GET /:tenantId/webhooks`

**Response:** `200 OK` (array of webhooks)

### Get Webhook by ID

**Endpoint:** `GET /:tenantId/webhooks/:id`

### Update Webhook

**Endpoint:** `PUT /:tenantId/webhooks/:id`

### Delete Webhook

**Endpoint:** `DELETE /:tenantId/webhooks/:id`

### Webhook Deliveries

**Endpoint:** `GET /:tenantId/webhooks/:id/deliveries`

**Response:** List of webhook delivery attempts with status and response.

### Retry Webhook Delivery

**Endpoint:** `POST /:tenantId/webhooks/:webhookId/deliveries/:deliveryId/retry`

### Webhook Events

Available webhook events:
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

### Webhook Payload Example

```json
{
  "id": "evt_...",
  "event": "invoice.paid",
  "timestamp": "2025-11-14T15:47:12.851Z",
  "data": {
    "invoice": {
      "id": "uuid",
      "invoiceNumber": "INV-2025-11-642345",
      "status": "paid",
      "total": 614.94,
      ...
    }
  }
}
```

### Webhook Signature Verification

All webhook requests include a signature header:
```
X-Webhook-Signature: sha256=...
```

Verify using HMAC SHA-256 with your webhook secret.

---

## Scheduler

Manage automated tasks and schedules.

### List Scheduled Jobs

**Endpoint:** `GET /:tenantId/scheduler/jobs`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "overdue-invoices",
      "name": "Mark Overdue Invoices",
      "schedule": "0 0 * * *",
      "nextRun": "2025-11-15T00:00:00Z",
      "lastRun": "2025-11-14T00:00:00Z",
      "enabled": true
    },
    {
      "id": "payment-reminders",
      "name": "Send Payment Reminders",
      "schedule": "0 9 * * *",
      "nextRun": "2025-11-15T09:00:00Z",
      "enabled": true
    }
  ]
}
```

### Trigger Job Manually

**Endpoint:** `POST /:tenantId/scheduler/jobs/:jobId/trigger`

### Enable/Disable Job

**Endpoint:** `PATCH /:tenantId/scheduler/jobs/:jobId/toggle`

---

## Allegro Integration

Polish marketplace integration.

### Connect Allegro Account

**Endpoint:** `POST /:tenantId/allegro/connect`

**Request Body:**
```json
{
  "clientId": "your-allegro-client-id",
  "clientSecret": "your-allegro-client-secret",
  "sandbox": false
}
```

### Get Authorization URL

**Endpoint:** `GET /:tenantId/allegro/auth-url`

**Response:** OAuth authorization URL

### Handle OAuth Callback

**Endpoint:** `POST /:tenantId/allegro/callback`

**Request Body:**
```json
{
  "code": "oauth-code"
}
```

### Sync Allegro Orders

**Endpoint:** `POST /:tenantId/allegro/sync-orders`

**Query Parameters:**
- `startDate`, `endDate`: Date range to sync

### Allegro Webhook Receiver

**Endpoint:** `POST /allegro/webhook`

**Note:** This endpoint receives webhooks from Allegro.

---

## Error Handling

All API errors follow a consistent format:

### Error Response Structure

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Common Error Messages

**Authentication Errors:**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

**Validation Errors:**
```json
{
  "status": "error",
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Rate Limit:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

**Not Found:**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Invoice not found"
}
```

---

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Authentication endpoints:** 10 requests per minute
- **Standard endpoints:** 100 requests per minute
- **Bulk operations:** 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876543
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

## Filtering & Searching

List endpoints support filtering and searching:

**Query Parameters:**
- `search`: Full-text search across relevant fields
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (asc/desc)
- Entity-specific filters (e.g., `status`, `type`, `customerId`)

**Example:**
```
GET /api/v1/:tenantId/invoices?status=paid&sortBy=issueDate&sortOrder=desc&search=ACME
```

---

## Webhooks Best Practices

1. **Verify signatures** to ensure webhooks are from Invoice-HUB
2. **Respond quickly** (within 5 seconds) to avoid retries
3. **Handle duplicates** - use event IDs to deduplicate
4. **Implement retries** - we retry failed webhooks up to 3 times
5. **Use HTTPS** - webhook URLs must use HTTPS in production

---

## Testing

Use the Swagger UI for interactive API testing:

**Development:** `http://localhost:3000/api-docs`  
**Swagger JSON:** `http://localhost:3000/api-docs.json`

---

## Support

For API support:
- **Email:** support@invoice-hub.com
- **Documentation:** https://docs.invoice-hub.com
- **Status:** https://status.invoice-hub.com

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0.0
