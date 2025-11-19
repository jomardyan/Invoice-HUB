# Error Code Reference

Complete documentation of all error codes returned by the Invoice-HUB API.

## Error Response Format

All errors follow this standardized JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context about the error"
    },
    "traceId": "req_abc123xyz",
    "timestamp": "2025-11-19T23:00:00.000Z"
  }
}
```

## Error Categories

### Invoice Errors

| Code | Status | Description |
|------|--------|-------------|
| `INVOICE_NOT_FOUND` | 404 | Invoice with the specified ID does not exist |
| `INVOICE_ALREADY_PAID` | 400 | Attempt to modify an invoice that has already been paid |
| `INVOICE_GENERATION_FAILED` | 500 | PDF or document generation failed |
| `INVOICE_CANCELLATION_FAILED` | 400 | Invoice cannot be cancelled in current state |

### Payment Errors

| Code | Status | Description |
|------|--------|-------------|
| `PAYMENT_DECLINED` | 402 | Payment was declined by payment processor |
| `PAYMENT_METHOD_INVALID` | 400 | Payment method is not supported or invalid |
| `PAYMENT_GATEWAY_ERROR` | 502 | External payment gateway error occurred |

### Customer Errors

| Code | Status | Description |
|------|--------|-------------|
| `CUSTOMER_NOT_FOUND` | 404 | Customer with the specified ID does not exist |
| `DUPLICATE_NIP` | 409 | Customer with this NIP already exists |
| `INVALID_NIP` | 400 | NIP number is invalid or failed validation |

### Product Errors

| Code | Status | Description |
|------|--------|-------------|
| `PRODUCT_NOT_FOUND` | 404 | Product with the specified ID does not exist |
| `INSUFFICIENT_STOCK` | 400 | Requested quantity exceeds available stock |
| `DUPLICATE_PRODUCT_SKU` | 409 | Product with this SKU already exists |

### Warehouse Errors

| Code | Status | Description |
|------|--------|-------------|
| `WAREHOUSE_NOT_FOUND` | 404 | Warehouse with the specified ID does not exist |
| `WAREHOUSE_CONFLICT` | 409 | Warehouse operation conflicts with current state |
| `STOCK_TRANSFER_FAILED` | 400 | Stock transfer between warehouses failed |

### Expense Errors

| Code | Status | Description |
|------|--------|-------------|
| `EXPENSE_NOT_FOUND` | 404 | Expense with the specified ID does not exist |
| `EXPENSE_APPROVAL_FAILED` | 400 | Expense cannot be approved in current state |

### Department Errors

| Code | Status | Description |
|------|--------|-------------|
| `DEPARTMENT_NOT_FOUND` | 404 | Department with the specified ID does not exist |
| `BUDGET_EXCEEDED` | 400 | Department budget would be exceeded |

### Receipt Errors

| Code | Status | Description |
|------|--------|-------------|
| `RECEIPT_NOT_FOUND` | 404 | Receipt with the specified ID does not exist |
| `RECEIPT_GENERATION_FAILED` | 500 | Receipt generation or PDF creation failed |

### Company Errors

| Code | Status | Description |
|------|--------|-------------|
| `COMPANY_NOT_FOUND` | 404 | Company with the specified ID does not exist |
| `COMPANY_SUBSCRIPTION_ERROR` | 402 | Company subscription is inactive or expired |

### Integration Errors

| Code | Status | Description |
|------|--------|-------------|
| `ALLEGRO_INTEGRATION_ERROR` | 502 | Allegro API request failed |
| `BASELINKER_INTEGRATION_ERROR` | 502 | BaseLinker API request failed |
| `KSEF_INTEGRATION_ERROR` | 502 | KSeF e-invoicing system error |
| `EMAIL_DELIVERY_FAILED` | 500 | Email could not be delivered |
| `SMS_DELIVERY_FAILED` | 500 | SMS could not be delivered |
| `WEBHOOK_DELIVERY_FAILED` | 502 | Webhook delivery to external URL failed |

### Authentication & Authorization

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Authentication is required |
| `FORBIDDEN` | 403 | Insufficient permissions for this action |
| `INVALID_TOKEN` | 401 | Authentication token is invalid |
| `TOKEN_EXPIRED` | 401 | Authentication token has expired |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `ACCOUNT_LOCKED` | 403 | Account has been locked |

### Validation Errors

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (includes field details) |
| `INVALID_INPUT` | 400 | Specific input field is invalid |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing from request |

### Rate Limiting

| Code | Status | Description |
|------|--------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests. Includes `retryAfter` in details |

### Database Errors

| Code | Status | Description |
|------|--------|-------------|
| `DATABASE_ERROR` | 500 | Database operation failed |
| `DATABASE_CONNECTION_ERROR` | 503 | Cannot connect to database |
| `DUPLICATE_RECORD` | 409 | Record with unique field already exists |

### General Errors

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Requested resource not found |
| `CONFLICT` | 409 | Request conflicts with current state |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error occurred |
| `SERVICE_UNAVAILABLE` | 503 | Service is temporarily unavailable |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service request failed |
| `ROUTE_NOT_FOUND` | 404 | API endpoint does not exist |
| `FILE_UPLOAD_ERROR` | 400 | File upload failed |

## Response Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Invalid email format"],
        "amount": ["Must be a positive number"]
      }
    },
    "traceId": "req_abc123",
    "timestamp": "2025-11-19T23:00:00.000Z"
  }
}
```

### Not Found Error

```json
{
  "success": false,
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "Invoice with ID inv_12345 not found",
    "details": {
      "invoiceId": "inv_12345"
    },
    "traceId": "req_xyz789",
    "timestamp": "2025-11-19T23:00:00.000Z"
  }
}
```

### Payment Error

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "Payment pay_abc123 was declined: Insufficient funds",
    "details": {
      "paymentId": "pay_abc123",
      "reason": "Insufficient funds"
    },
    "traceId": "req_def456",
    "timestamp": "2025-11-19T23:00:00.000Z"
  }
}
```

### Rate Limit Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded: 100 requests per 60 minute(s). Retry after 300 seconds.",
    "details": {
      "limit": 100,
      "windowMs": 3600000,
      "retryAfter": 300
    },
    "traceId": "req_ghi789",
    "timestamp": "2025-11-19T23:00:00.000Z"
  }
}
```

## Using Trace IDs for Debugging

Every error response includes a `traceId` field. When contacting support:

1. Include the full `traceId` in your support request
2. This allows us to trace the exact request through our logs
3. Helps us diagnose and resolve issues faster

## Best Practices

### For API Clients

1. **Always check `success` field** - Don't assume HTTP status alone
2. **Log trace IDs** - Store trace IDs for debugging failed requests
3. **Handle specific error codes** - Don't just catch generic 400/500
4. **Display user-friendly messages** - Use `message` field but add your own context
5. **Respect rate limits** - Implement exponential backoff for 429 errors

### Error Handling Example (TypeScript)

```typescript
try {
  const response = await invoiceApi.createInvoice(data);
  if (!response.success) {
    handleError(response.error);
  }
} catch (error) {
  if (error.response?.data?.error) {
    const { code, message, traceId } = error.response.data.error;
    
    switch (code) {
      case 'VALIDATION_ERROR':
        displayValidationErrors(error.response.data.error.details);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        const retryAfter = error.response.data.error.details.retryAfter;
        scheduleRetry(retryAfter);
        break;
      case 'PAYMENT_DECLINED':
        showPaymentFailureModal(message);
        break;
      default:
        logger.error(`API Error: ${code} (Trace: ${traceId})`);
        showGenericError();
    }
  }
}
```

## Support

If you encounter an error not documented here, please:

1. Note the `traceId` from the error response
2. Check your request format against API documentation
3. Contact support with the trace ID and request details

---

**Last Updated**: November 19, 2025  
**API Version**: v1
