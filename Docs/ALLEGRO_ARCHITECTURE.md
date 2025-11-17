# Allegro Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Invoice-HUB Platform                        │
└─────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
   │ Frontend │ │ Backend │ │Database│
   │  User    │ │   API   │ │        │
   └─────────┘ └─────────┘ └────────┘
```

## Allegro Integration Flow

### User Flow

```
User Settings Page
       │
       ├─► Tab: Integrations
       │
       └─► AllegroSettings Component
           │
           ├─► Connection Status
           │   └─► Connect Allegro Account (OAuth)
           │
           ├─► Auto-Processing Settings
           │   ├─► Auto-generate invoices
           │   ├─► Auto-create customers
           │   ├─► Auto-create products
           │   └─► Auto-mark as paid
           │
           ├─► Sync Configuration
           │   ├─► Sync frequency
           │   └─► Default VAT rate
           │
           └─► Actions
               ├─► Manual Sync
               └─► Save Settings
```

### Admin Flow

```
Admin Panel
       │
       ├─► Menu: Allegro Integration
       │
       └─► AllegroSettings (Admin)
           │
           ├─► Summary Dashboard
           │   ├─► Total integrations
           │   ├─► Active count
           │   ├─► Error count
           │   └─► Last sync time
           │
           ├─► Integration Table
           │   ├─► User ID
           │   ├─► Status
           │   ├─► Last sync
           │   ├─► Error count
           │   └─► Actions (Settings, Sync)
           │
           └─► Settings Dialog
               └─► Edit all options
```

## Data Flow

### Settings Save Flow

```
User Input
    │
    └─► AllegroSettings Component
        │
        └─► allegroService.updateSettings()
            │
            └─► PUT /allegro/settings/:integrationId
                │
                └─► Backend Handler
                    │
                    └─► AllegroService.updateSettings()
                        │
                        ├─► Validate settings
                        ├─► Merge with existing
                        ├─► Save to database
                        │
                        └─► Return updated settings
                            │
                            └─► UI Update (Success)
```

### Settings Retrieve Flow

```
Component Mount (useEffect)
    │
    └─► AllegroSettings Component
        │
        └─► allegroService.getSettings()
            │
            └─► GET /allegro/settings/:integrationId
                │
                └─► Backend Handler
                    │
                    └─► AllegroService.getSettings()
                        │
                        ├─► Fetch from database
                        ├─► Merge with defaults
                        │
                        └─► Return settings object
                            │
                            └─► Component State Update
```

### Sync Trigger Flow

```
User clicks "Manual Sync"
    │
    └─► AllegroSettings Component
        │
        └─► allegroService.triggerSync()
            │
            └─► POST /allegro/sync
                │
                └─► Backend Handler
                    │
                    └─► AllegroService.syncOrdersWithRetry()
                        │
                        ├─► Refresh token
                        ├─► Fetch orders from Allegro
                        ├─► Create/update customers
                        ├─► Create/update products
                        ├─► Generate invoices (based on settings)
                        │
                        └─► Return sync result
                            │
                            └─► UI Update (Success/Error)
```

## Component Architecture

### Frontend Structure

```
frontend-user/
├── pages/
│   └── Settings/
│       ├── index.tsx (Main Settings Page with Tabs)
│       ├── AllegroSettings.tsx (Allegro Configuration)
│       ├── ProfileSettings.tsx (Profile Management)
│       └── CompanySettings.tsx (Company Configuration)
│
└── services/
    └── allegroService.ts (API Integration Layer)

frontend-admin/
├── pages/
│   └── AllegroSettings.tsx (Admin Dashboard)
│
└── App.tsx (Route Integration)
```

### Backend Structure

```
backend/
├── services/
│   └── AllegroService.ts
│       ├── getSettings()
│       ├── updateSettings()
│       ├── getSettingsWithDefaults()
│       ├── syncOrdersWithRetry()
│       ├── refreshTokenIfNeeded()
│       └── [...existing methods]
│
├── routes/
│   └── allegro.ts
│       ├── GET /allegro/settings/:id
│       ├── PUT /allegro/settings/:id
│       └── [...existing routes]
│
├── entities/
│   └── AllegroIntegration.ts
│       └── settings: JSONB column
│
└── config/
    └── index.ts
        └── allegro configuration
```

## Database Schema

### AllegroIntegration Entity

```sql
CREATE TABLE allegro_integrations (
  id UUID PRIMARY KEY,
  tenantId UUID NOT NULL,
  userId UUID NOT NULL,
  allegroUserId VARCHAR(100) UNIQUE,
  accessToken TEXT,
  refreshToken TEXT,
  tokenExpiresAt TIMESTAMP,
  isActive BOOLEAN DEFAULT true,
  lastSyncAt TIMESTAMP,
  syncErrorCount INT DEFAULT 0,
  lastSyncError TEXT,
  settings JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Settings JSONB Structure

```json
{
  "autoGenerateInvoices": true,
  "invoiceTemplateId": "template-123",
  "syncFrequencyMinutes": 60,
  "autoMarkAsPaid": false,
  "autoCreateCustomer": true,
  "autoCreateProduct": true,
  "defaultVatRate": 23
}
```

## API Endpoints

### Settings Management

```
GET /api/v1/allegro/settings/:integrationId
├─ Response: { settings: AllegroSettings }
└─ Auth: Required

PUT /api/v1/allegro/settings/:integrationId
├─ Body: { settings: Partial<AllegroSettings> }
├─ Response: { success: boolean, settings: AllegroSettings }
└─ Auth: Required
```

### Existing Endpoints (Enhanced)

```
GET /api/v1/allegro/auth/authorize
├─ Query: tenantId
├─ Response: { authUrl: string }
└─ Auth: Not required

POST /api/v1/allegro/auth/callback
├─ Body: { tenantId, userId, code }
├─ Response: { success: boolean, integration: AllegroIntegration }
└─ Auth: Not required

GET /api/v1/allegro/status/:integrationId
├─ Response: AllegroIntegration
└─ Auth: Required

POST /api/v1/allegro/sync
├─ Body: { integrationId, companyId, tenantId }
├─ Response: AllegroSyncResult
└─ Auth: Required

POST /api/v1/allegro/deactivate/:integrationId
├─ Response: { success: boolean }
└─ Auth: Required
```

## State Management

### User Component State

```typescript
// AllegroSettings.tsx
const [integrations, setIntegrations] = useState<any[]>([]);
const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
const [settings, setSettings] = useState<AllegroSettings>({});
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
const [syncLoading, setSyncLoading] = useState(false);
```

### Admin Component State

```typescript
// AllegroSettings (Admin).tsx
const [integrations, setIntegrations] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [selectedIntegration, setSelectedIntegration] = useState<any | null>(null);
const [openDialog, setOpenDialog] = useState(false);
const [editingSettings, setEditingSettings] = useState<any>({});
```

## Security Model

### Authentication & Authorization

```
Request Flow:
│
├─► JWT Token Validation
│   ├─► Check token expiry
│   ├─► Verify signature
│   └─► Extract user/tenant info
│
├─► Authorization Check
│   ├─► Verify tenant ownership
│   ├─► Verify integration ownership
│   └─► Check role permissions
│
└─► Request Processing
    ├─► Validate input
    ├─► Process settings
    └─► Log audit trail
```

### Token Management

```
Allegro OAuth Flow:
│
├─► User initiates: "Connect Allegro"
│   └─► Redirects to Allegro OAuth
│
├─► User authorizes on Allegro
│   └─► Allegro redirects back with code
│
├─► Backend exchanges code for tokens
│   ├─► POST to Allegro token endpoint
│   ├─► Receive access_token & refresh_token
│   ├─► Encrypt tokens with AES-256-GCM
│   └─► Store in database
│
└─► Automatic Token Refresh
    ├─► Check expiry before API call
    ├─► Refresh if < 1 hour remaining
    └─► Update stored tokens
```

## Error Handling

### Retry Strategy

```
Sync Failure:
│
├─► Attempt 1: Wait 1 second
├─► Attempt 2: Wait 60 seconds
├─► Attempt 3: Wait 300 seconds (5 min)
├─► Attempt 4: Wait 900 seconds (15 min)
├─► Attempt 5: Wait 3600 seconds (1 hour)
├─► Attempt 6: Wait 14400 seconds (4 hours)
│
└─► If all fail:
    ├─► Log error
    ├─► Increment syncErrorCount
    ├─► Disable integration after 5 failures
    └─► Notify admin
```

## Performance Considerations

### Caching Strategy

```
Redis Cache:
├─► Order idempotency keys (24h TTL)
├─► Token refresh state
└─► Integration status cache (5m TTL)
```

### Database Optimization

```
Indexes:
├─► (tenantId, userId) on allegro_integrations
├─► integrationId
└─► allegroUserId (UNIQUE)

Query Optimization:
├─► Use indexed lookups
├─► Batch fetch integrations
└─► Lazy load settings
```

## Deployment Checklist

- [ ] Backend API endpoints tested
- [ ] Frontend service layer verified
- [ ] Settings persistence working
- [ ] OAuth flow functional
- [ ] Admin dashboard accessible
- [ ] User settings page working
- [ ] Settings save/load operations correct
- [ ] Manual sync trigger working
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] XSS prevention implemented
- [ ] CSRF tokens configured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Database migrations run

---

**Last Updated:** November 17, 2025
