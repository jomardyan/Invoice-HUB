# Allegro Integration Setup Guide

## Overview

The Invoice-HUB platform now features a modernized Allegro marketplace integration with fully configurable settings accessible from both user and admin panels.

## Features

### User-Facing Features

1. **Connect Allegro Account**
   - OAuth 2.0 authorization flow
   - Multi-account support
   - Secure token storage with AES-256 encryption

2. **Configurable Settings** (in Settings > Integrations)
   - **Automatic Processing**
     - Auto-generate invoices from orders
     - Auto-create customers from buyers
     - Auto-create products from offers
     - Auto-mark invoices as paid
   
   - **Sync Configuration**
     - Set custom sync frequency (in minutes)
     - Configure default VAT rate for products
   
   - **Manual Controls**
     - Manual sync trigger
     - View integration status
     - Connection management

### Admin-Facing Features

1. **Integration Management** (Admin Panel > Allegro Integration)
   - View all tenant integrations
   - Monitor integration health
   - Track sync errors
   - Edit settings per integration
   - Manual sync triggers

2. **Dashboard Metrics**
   - Total integrations count
   - Active integrations count
   - Error tracking
   - Last sync timestamp

## Backend API Endpoints

### New Endpoints

#### Get Integration Settings
```
GET /api/v1/allegro/settings/:integrationId
Response:
{
  "settings": {
    "autoGenerateInvoices": true,
    "invoiceTemplateId": null,
    "syncFrequencyMinutes": 60,
    "autoMarkAsPaid": false,
    "autoCreateCustomer": true,
    "autoCreateProduct": true,
    "defaultVatRate": 23
  }
}
```

#### Update Integration Settings
```
PUT /api/v1/allegro/settings/:integrationId
Request Body:
{
  "settings": {
    "autoGenerateInvoices": true,
    "syncFrequencyMinutes": 45,
    "defaultVatRate": 23
  }
}
Response:
{
  "success": true,
  "settings": { ... }
}
```

## Frontend Components

### User Frontend

#### Service: `frontend-user/src/services/allegroService.ts`
- `getAuthorizationUrl(tenantId)` - Get OAuth URL
- `handleCallback(tenantId, userId, code)` - Handle OAuth callback
- `getStatus(integrationId)` - Get integration status
- `triggerSync(integrationId, companyId, tenantId)` - Manual sync
- `deactivate(integrationId)` - Deactivate integration
- `getSettings(integrationId)` - Get settings
- `updateSettings(integrationId, settings)` - Update settings

#### Components:
1. **Settings Page** - `frontend-user/src/pages/Settings/index.tsx`
   - Tab-based navigation
   - Integrations tab with AllegroSettings component

2. **Allegro Settings Component** - `frontend-user/src/pages/Settings/AllegroSettings.tsx`
   - Connection management
   - Settings configuration
   - Manual sync trigger
   - Status display

3. **Profile Settings** - `frontend-user/src/pages/Settings/ProfileSettings.tsx`
   - Placeholder for future expansion

4. **Company Settings** - `frontend-user/src/pages/Settings/CompanySettings.tsx`
   - Placeholder for future expansion

### Admin Frontend

#### Component: `frontend-admin/src/pages/AllegroSettings.tsx`
- Integration monitoring dashboard
- Settings management dialog
- Sync statistics
- Error tracking
- Batch operations

#### Integration in Admin App
- Added "Allegro Integration" menu item
- Full page support with responsive design

## Configuration

### Environment Variables

The integration uses existing configuration from `backend/src/config/index.ts`:

```
ALLEGRO_CLIENT_ID=your-client-id
ALLEGRO_CLIENT_SECRET=your-client-secret
ALLEGRO_REDIRECT_URI=http://localhost:3000/api/v1/allegro/auth/callback
ALLEGRO_SANDBOX=false (or true for testing)
ALLEGRO_API_URL=https://api.allegro.pl
```

## Usage Flow

### For End Users

1. Navigate to **Settings > Integrations**
2. Click **"Connect Allegro Account"**
3. Authorize with Allegro OAuth
4. Configure integration settings:
   - Toggle automatic features
   - Set sync frequency
   - Configure default VAT rate
5. Click **"Save Settings"**
6. Use **"Manual Sync Now"** to sync orders on demand

### For Admins

1. Navigate to **Admin Panel > Allegro Integration**
2. View all tenant integrations
3. Click **Settings** on any integration to modify
4. Use **Sync** button for manual synchronization
5. Monitor error counts and sync status

## Settings Explanation

### Auto-Generate Invoices
When enabled, invoices are automatically created when orders are synced from Allegro.

### Auto-Create Customers
Automatically create customer records from Allegro buyers.

### Auto-Create Products
Automatically create product records from Allegro offers.

### Auto-Mark As Paid
Automatically mark generated invoices as paid if payment is confirmed by Allegro.

### Sync Frequency
Controls how often the system checks for new orders (in minutes).

### Default VAT Rate
The VAT percentage applied to products created from Allegro offers (typically 23% for Poland).

## Technical Details

### Data Security
- OAuth tokens are encrypted with AES-256-GCM
- Separate encryption key per tenant
- Tokens refreshed automatically 1 hour before expiry

### Error Handling
- Exponential backoff retry mechanism
- Maximum 6 retry attempts with increasing delays
- Automatic integration disabling after 5 consecutive failures

### Idempotency
- Redis-based order caching with 24-hour TTL
- Prevents duplicate invoice generation

## Troubleshooting

### Connection Issues
- Verify ALLEGRO_CLIENT_ID and ALLEGRO_CLIENT_SECRET
- Check redirect URI matches configuration
- Ensure ALLEGRO_API_URL is correct

### Sync Failures
- Check error logs: `syncErrorCount` and `lastSyncError`
- Verify Allegro token hasn't expired
- Check network connectivity to Allegro API

### Settings Not Saving
- Verify integration is active
- Check authentication permissions
- Review backend logs for API errors

## Future Enhancements

- [ ] Webhook integration for real-time order updates
- [ ] Advanced scheduling for syncs
- [ ] Bulk operations for multiple integrations
- [ ] Custom field mapping
- [ ] Order status synchronization
- [ ] Refund handling
- [ ] Multi-currency support

## API Documentation

See `backend/docs/API_ENDPOINTS.md` for complete API documentation including:
- OAuth authentication flow
- Order synchronization
- Webhook handling
- Integration status queries
