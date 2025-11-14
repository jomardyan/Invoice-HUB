# Invoice-HUB API Summary

**Version:** 1.0.0  
**Last Updated:** November 14, 2025

## API Documentation Files

1. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - Comprehensive endpoint documentation with examples
2. **[openapi.yaml](./openapi.yaml)** - OpenAPI 3.0 specification for Swagger/Postman import

## Quick Stats

- **Total Endpoints:** 80+
- **Authentication:** JWT Bearer token
- **Base URL:** `http://localhost:3000/api/v1`
- **API Version:** v1

## Implemented Endpoints by Category

### ✅ Authentication (4 endpoints)
- POST `/auth/register` - Create new user and tenant
- POST `/auth/login` - Authenticate user
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - Invalidate session

### ✅ Health & Monitoring (6 endpoints)
- GET `/health` - Basic health check
- GET `/health/live` - Liveness probe
- GET `/health/ready` - Readiness probe
- GET `/health/detailed` - Detailed health with metrics
- GET `/health/metrics` - Performance metrics
- GET `/health/version` - Application version

### ✅ Companies (5 endpoints)
- POST `/:tenantId/companies` - Create company
- GET `/:tenantId/companies` - List companies
- GET `/:tenantId/companies/:id` - Get company
- PUT `/:tenantId/companies/:id` - Update company
- DELETE `/:tenantId/companies/:id` - Delete company

### ✅ Customers (8 endpoints)
- POST `/:tenantId/customers` - Create customer
- GET `/:tenantId/customers` - List customers
- GET `/:tenantId/customers/:id` - Get customer
- PUT `/:tenantId/customers/:id` - Update customer
- DELETE `/:tenantId/customers/:id` - Delete customer
- GET `/:tenantId/customers-search/:query` - Search customers
- POST `/:tenantId/customers/:id/merge` - Merge customers
- DELETE `/:tenantId/customers/:id/hard-delete` - Permanently delete

### ✅ Products (7 endpoints)
- POST `/:tenantId/products` - Create product
- GET `/:tenantId/products` - List products
- GET `/:tenantId/products/:id` - Get product
- PUT `/:tenantId/products/:id` - Update product
- DELETE `/:tenantId/products/:id` - Delete product
- GET `/:tenantId/products/sku/:sku` - Get by SKU
- GET `/:tenantId/products/categories` - List categories

### ✅ Invoices (15 endpoints)
- POST `/:tenantId/invoices` - Create invoice
- GET `/:tenantId/invoices` - List invoices
- GET `/:tenantId/invoices/:id` - Get invoice
- PUT `/:tenantId/invoices/:id` - Update invoice
- DELETE `/:tenantId/invoices/:id` - Delete invoice
- POST `/:tenantId/invoices/:id/approve` - Approve invoice
- POST `/:tenantId/invoices/:id/send` - Send to customer
- POST `/:tenantId/invoices/:id/mark-paid` - Mark as paid
- POST `/:tenantId/invoices/:id/cancel` - Cancel invoice
- GET `/:tenantId/invoices/:id/pdf` - Generate PDF
- POST `/:tenantId/invoices/:id/duplicate` - Duplicate invoice
- POST `/:tenantId/invoices/:id/correct` - Create correction
- GET `/:tenantId/invoices/number/:number` - Get by number
- POST `/:tenantId/invoices/bulk-send` - Bulk send
- POST `/:tenantId/invoices/export` - Export invoices

### ✅ Payments (7 endpoints)
- POST `/:tenantId/payments` - Record payment
- GET `/:tenantId/payments` - List payments
- GET `/:tenantId/payments/:id` - Get payment
- POST `/:tenantId/payments/:id/refund` - Refund payment
- POST `/:tenantId/payments/webhook` - Payment webhook
- GET `/:tenantId/payments/invoice/:invoiceId` - Get by invoice
- POST `/:tenantId/payments/verify` - Verify payment

### ✅ Templates (9 endpoints)
- POST `/:tenantId/templates` - Create template
- GET `/:tenantId/templates` - List templates
- GET `/:tenantId/templates/:id` - Get template
- PUT `/:tenantId/templates/:id` - Update template
- DELETE `/:tenantId/templates/:id` - Delete template
- GET `/:tenantId/templates/default/:type` - Get default
- POST `/:tenantId/templates/:id/render` - Render template
- POST `/:tenantId/templates/:id/validate` - Validate template
- POST `/:tenantId/templates/:id/clone` - Clone template

### ✅ Notifications (7 endpoints)
- GET `/:tenantId/notifications` - List notifications
- GET `/:tenantId/notifications/:id` - Get notification
- PUT `/:tenantId/notifications/:id/read` - Mark as read
- PUT `/:tenantId/notifications/mark-all-read` - Mark all read
- DELETE `/:tenantId/notifications/:id` - Delete notification
- GET `/:tenantId/notifications/unread-count` - Unread count
- PUT `/:tenantId/notifications/settings` - Update settings

### ✅ Reports (6 endpoints)
- GET `/:tenantId/reports/dashboard` - Dashboard metrics
- GET `/:tenantId/reports/sales` - Sales report
- GET `/:tenantId/reports/tax` - Tax report (JPK_FA compatible)
- GET `/:tenantId/reports/customers/:id` - Customer report
- GET `/:tenantId/reports/aging` - Aging report
- POST `/:tenantId/reports/export` - Export report

### ✅ Webhooks (8 endpoints)
- POST `/:tenantId/webhooks` - Create webhook
- GET `/:tenantId/webhooks` - List webhooks
- GET `/:tenantId/webhooks/:id` - Get webhook
- PATCH `/:tenantId/webhooks/:id` - Update webhook
- DELETE `/:tenantId/webhooks/:id` - Delete webhook
- POST `/:tenantId/webhooks/:id/test` - Test webhook
- GET `/:tenantId/webhooks/:id/deliveries` - List deliveries
- POST `/:tenantId/webhooks/:webhookId/deliveries/:deliveryId/retry` - Retry delivery

### ✅ Scheduler (4 endpoints)
- GET `/:tenantId/scheduler/tasks` - List tasks
- GET `/:tenantId/scheduler/tasks/:taskId` - Get task
- POST `/:tenantId/scheduler/tasks/:taskId/trigger` - Trigger task
- POST `/:tenantId/scheduler/tasks/:taskId/toggle` - Enable/disable task

### ✅ Allegro Integration (6 endpoints)
- GET `/allegro/auth/authorize` - Get OAuth URL
- POST `/allegro/auth/callback` - OAuth callback
- GET `/allegro/status/:integrationId` - Get status
- POST `/allegro/sync` - Sync orders
- POST `/allegro/deactivate/:integrationId` - Deactivate
- POST `/allegro/webhook` - Receive webhooks

## Testing

### Automated Test Suite

Run the comprehensive API test suite:

```bash
cd /workspaces/Invoice-HUB/backend
npm run test:api
```

### Quick Smoke Test

```bash
npm run test:quick
```

### Manual Testing

- **Swagger UI:** `http://localhost:3000/api-docs`
- **Swagger JSON:** `http://localhost:3000/api-docs.json`
- **Health Check:** `http://localhost:3000/api/health`

## Authentication

All endpoints (except `/auth/*` and `/health/*`) require JWT authentication:

```bash
# 1. Register or login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Use the access token
curl http://localhost:3000/api/v1/:tenantId/invoices \
  -H "Authorization: Bearer <access_token>"
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "statusCode": 200,
  "data": {...},
  "pagination": {...}
}
```

### Error Response
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description",
  "errors": [...]
}
```

## Rate Limiting

- **Authentication endpoints:** 10 requests/minute
- **Standard endpoints:** 100 requests/minute
- **Bulk operations:** 10 requests/minute

## Pagination

All list endpoints support pagination:

```
GET /:tenantId/invoices?page=1&limit=50
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

## Filtering

Most list endpoints support filtering:

```
GET /:tenantId/invoices?status=paid&customerId=uuid&startDate=2025-01-01
```

## Webhook Events

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

## Polish VAT Compliance

The API supports Polish tax regulations:

- **VAT Rates:** 23%, 8%, 5%, 0%, -1 (exempt)
- **JPK_FA Export:** Available via `/reports/tax?format=xml`
- **NIP Validation:** Automatic validation of Polish tax IDs
- **Invoice Numbering:** Compliant with Polish standards

## Export Formats

Supported export formats:
- **PDF** - Invoices, reports
- **Excel (XLSX)** - Reports, invoice lists
- **CSV** - Data exports
- **XML** - JPK_FA, tax reports
- **JSON** - All data

## Multi-tenancy

All endpoints are tenant-scoped using `:tenantId` path parameter. Users can only access data within their tenant.

## Status

✅ **All endpoints implemented and tested**
✅ **OpenAPI documentation complete**
✅ **Automated test suite ready**
✅ **Error handling implemented**
✅ **Rate limiting active**
✅ **Multi-tenant isolation enforced**

## Next Steps for Frontend Implementation

1. **Import OpenAPI Spec** - Use `openapi.yaml` to generate TypeScript client
2. **Review Examples** - Check `API_ENDPOINTS.md` for detailed examples
3. **Test Endpoints** - Use Swagger UI for interactive testing
4. **Implement Auth Flow** - Start with registration/login
5. **Build Dashboard** - Use `/reports/dashboard` endpoint
6. **Invoice Management** - Implement full invoice lifecycle
7. **Webhook Integration** - Set up webhook listeners for real-time updates

## Support

- **API Documentation:** [/docs/API_ENDPOINTS.md](./API_ENDPOINTS.md)
- **OpenAPI Spec:** [/docs/openapi.yaml](./openapi.yaml)
- **Test Scripts:** [/TESTING.md](../TESTING.md)

---

**Ready for Frontend Development** ✨
