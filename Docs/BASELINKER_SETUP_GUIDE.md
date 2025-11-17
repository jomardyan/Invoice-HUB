# BaseLinker Integration Setup Guide

## Overview

The BaseLinker integration allows Invoice-HUB to automatically sync orders from your BaseLinker account and generate invoices. This guide will walk you through setting up and configuring the integration.

## Prerequisites

- Active Invoice-HUB account
- Active BaseLinker account
- BaseLinker API token

## Features

- ✅ **Automatic Order Sync** - Fetch orders from BaseLinker automatically
- ✅ **Invoice Generation** - Create invoices from orders automatically
- ✅ **Customer Management** - Auto-create customers from order data
- ✅ **Product Management** - Auto-create products from order items
- ✅ **Flexible Configuration** - Customize sync behavior and automation
- ✅ **Manual Sync** - Trigger order sync on-demand
- ✅ **Error Handling** - Retry logic with exponential backoff
- ✅ **Idempotency** - Prevent duplicate invoice generation

## Step 1: Get Your BaseLinker API Token

1. Log in to your BaseLinker account
2. Navigate to **Settings** → **API**
3. Click **Generate new token** or copy your existing token
4. Save this token securely - you'll need it for Invoice-HUB

## Step 2: Connect BaseLinker to Invoice-HUB

### Via User Interface

1. Log in to Invoice-HUB
2. Navigate to **Settings** → **Integrations**
3. Find the **BaseLinker** section
4. Click **Connect BaseLinker Account**
5. In the dialog, paste your API token
6. Click **Connect**

### Via API

```bash
POST /api/v1/baselinker/connect
Content-Type: application/json

{
  "tenantId": "your-tenant-id",
  "userId": "your-user-id",
  "apiToken": "your-baselinker-api-token"
}
```

Response:
```json
{
  "success": true,
  "integration": {
    "id": "integration-uuid",
    "isActive": true
  }
}
```

## Step 3: Configure Integration Settings

### Auto-processing Settings

Configure what happens when new orders are synced:

- **Auto-generate invoices** (default: ON)
  - Automatically create invoices for new orders
  
- **Auto-create customers** (default: ON)
  - Create customer records from order billing information
  
- **Auto-create products** (default: ON)
  - Create product records from order line items
  
- **Auto-mark as paid** (default: OFF)
  - Mark invoices as paid if the order payment is confirmed

### Sync Configuration

- **Sync Frequency** (default: 60 minutes)
  - How often to automatically sync orders
  - Range: 15-1440 minutes (15 min to 24 hours)

- **Default VAT Rate** (default: 23%)
  - VAT rate to apply when product doesn't have tax information
  - Polish standard rate is 23%

### Order Filtering

- **Order Sources** (optional)
  - Filter by specific order sources (e.g., specific marketplaces)
  - Leave empty to sync all orders

## Step 4: Manual Sync

To manually trigger a sync:

1. Go to **Settings** → **Integrations** → **BaseLinker**
2. Select your connected integration
3. Click **Manual Sync**
4. Wait for the sync to complete
5. View results in the notification

## API Endpoints

### Get Integration Status

```bash
GET /api/v1/baselinker/status/:integrationId
```

Response:
```json
{
  "id": "integration-uuid",
  "isActive": true,
  "lastSyncAt": "2025-11-17T10:30:00Z",
  "syncErrorCount": 0,
  "lastSyncError": null
}
```

### Trigger Manual Sync

```bash
POST /api/v1/baselinker/sync
Content-Type: application/json

{
  "integrationId": "integration-uuid",
  "companyId": "company-uuid",
  "tenantId": "tenant-uuid"
}
```

Response:
```json
{
  "success": true,
  "ordersProcessed": 10,
  "invoicesCreated": 8,
  "errors": []
}
```

### Get Settings

```bash
GET /api/v1/baselinker/settings/:integrationId
```

Response:
```json
{
  "settings": {
    "autoGenerateInvoices": true,
    "autoCreateCustomer": true,
    "autoCreateProduct": true,
    "autoMarkAsPaid": false,
    "syncFrequencyMinutes": 60,
    "defaultVatRate": 23
  }
}
```

### Update Settings

```bash
PUT /api/v1/baselinker/settings/:integrationId
Content-Type: application/json

{
  "settings": {
    "autoGenerateInvoices": false,
    "defaultVatRate": 8
  }
}
```

### Get All Integrations

```bash
GET /api/v1/baselinker/integrations/:tenantId
```

### Deactivate Integration

```bash
POST /api/v1/baselinker/deactivate/:integrationId
```

## Order Processing Flow

1. **Fetch Orders**
   - Fetches orders from last 30 days
   - Only "new" and "processing" orders (status IDs: 11100, 11200)
   - Includes unconfirmed orders

2. **Idempotency Check**
   - Checks if order was already processed using Redis cache
   - Cache key: `baselinker:order:{order_id}`
   - Cache expires after 24 hours

3. **Customer Creation** (if enabled)
   - Extracts billing information from order
   - Creates or finds existing customer by email
   - Stores address, phone, country code

4. **Product Creation** (if enabled)
   - Extracts product information from order items
   - Creates or finds existing product by SKU
   - Uses product name, price, and tax rate from order

5. **Invoice Generation** (if enabled)
   - Maps order items to invoice items
   - Sets issue date to order creation date
   - Sets due date to 14 days after order date
   - Includes order reference in invoice notes

6. **Mark as Processed**
   - Stores order ID in Redis cache
   - Prevents duplicate processing

## Error Handling

### Retry Logic

If sync fails, the system automatically retries with exponential backoff:

1. **Retry 1**: Wait 1 second
2. **Retry 2**: Wait 1 minute
3. **Retry 3**: Wait 5 minutes
4. **Retry 4**: Wait 15 minutes
5. **Retry 5**: Wait 1 hour
6. **Retry 6**: Wait 4 hours

After 6 failed attempts, the integration will be marked as failed.

### Auto-Deactivation

After 5 consecutive sync failures, the integration is automatically deactivated to prevent further errors.

## Troubleshooting

### Integration Not Connecting

**Problem**: Cannot connect BaseLinker account

**Solutions**:
- Verify API token is correct
- Check token has not expired
- Ensure token has proper permissions
- Check BaseLinker API is accessible

### Orders Not Syncing

**Problem**: Orders not appearing in Invoice-HUB

**Solutions**:
- Check sync frequency settings
- Verify auto-generate invoices is enabled
- Check order status (must be new or processing)
- Verify orders are within last 30 days
- Check error logs for specific issues

### Duplicate Invoices

**Problem**: Same order creates multiple invoices

**Solutions**:
- This should not happen due to idempotency
- Check Redis cache is working
- Verify cache expiration (24 hours)
- Contact support if issue persists

### Missing Customer/Product Data

**Problem**: Customers or products not created automatically

**Solutions**:
- Verify auto-create settings are enabled
- Check order data contains required fields
- Ensure email is present for customer creation
- Check SKU or product name is present for products

## Security

### API Token Storage

- Tokens are encrypted using AES-256-GCM encryption
- Stored securely in database
- Never exposed in API responses
- Decrypted only when needed for API calls

### Authentication

- All endpoints require valid JWT token
- User must belong to same tenant as integration
- Rate limiting prevents abuse

## Performance

### Sync Performance

- Fetches up to 100 orders per sync
- Processes orders sequentially
- Uses Redis cache for idempotency
- Average sync time: 10-60 seconds (depending on order count)

### Database Impact

- Minimal impact on database performance
- Uses indexed queries for lookups
- Batch operations where possible

## Differences from Allegro Integration

| Feature | BaseLinker | Allegro |
|---------|-----------|---------|
| Authentication | API Token | OAuth 2.0 |
| API Style | POST with method param | RESTful |
| Token Refresh | Not needed | Automatic |
| Order Fetching | Date + Status filter | Status filter |
| Webhook Support | Not implemented | Supported |

## Best Practices

1. **Start with Manual Sync**
   - Test integration with manual sync first
   - Verify invoices are created correctly
   - Check customer and product data

2. **Review Generated Invoices**
   - Check first few invoices manually
   - Verify VAT rates are correct
   - Ensure customer data is accurate

3. **Configure VAT Rates**
   - Set default VAT rate to your most common rate
   - Products can override default rate
   - Polish standard rate is 23%

4. **Monitor Sync Status**
   - Check sync status regularly
   - Review error logs if sync fails
   - Contact support if errors persist

5. **Regular Token Rotation**
   - Rotate API tokens periodically for security
   - Update token in Invoice-HUB after rotation
   - Test connection after update

## Support

For issues or questions:

- Check this guide first
- Review error messages in the UI
- Contact Invoice-HUB support
- Check BaseLinker API documentation: https://api.baselinker.com/

## Changelog

### Version 1.0.0 (2025-11-17)

- Initial release
- API token authentication
- Order sync with date and status filtering
- Automatic invoice generation
- Customer and product auto-creation
- Configurable settings
- Manual sync trigger
- Retry logic with exponential backoff
- Idempotency support

---

**Last Updated**: November 17, 2025
