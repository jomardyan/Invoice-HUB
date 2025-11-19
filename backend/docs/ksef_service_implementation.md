# KSeF Service Layer Implementation Guide

## Overview
The KSeF controllers have been expanded with Phase 1 endpoints. The service layer needs corresponding implementation to integrate with the Polish KSeF API.

## Required Service Methods

### Session Management
```typescript
// List active authentication sessions
listActiveSessions(tenantId: string, options: { pageSize: number, continuationToken?: string })

// Terminate current session (invalidate refresh token)
terminateCurrentSession(tenantId: string)

// Terminate specific session by reference number
terminateSession(tenantId: string, sessionReference: string)
```

### Interactive Session (Online - Single Invoice)
```typescript
// Send invoice to interactive session
// POST /api/v2/sessions
sendInteractiveInvoice(tenantId: string, invoice: any)

// Get session status
// GET /api/v2/sessions/{referenceNumber}
getSessionStatus(tenantId: string, sessionReference: string)

// Get UPO (confirmation) for session
// GET /api/v2/sessions/{referenceNumber}/upo/{upoReferenceNumber}
getSessionUPO(tenantId: string, sessionReference: string)
```

### Batch Session (Bulk Processing)
```typescript
// Open batch session for multiple invoices
// POST /api/v2/sessions/batch
openBatchSession(tenantId: string, params: { invoiceSchema: string, packageInfo: any })

// Close batch session and start processing
// POST /api/v2/sessions/batch/{referenceNumber}/close
closeBatchSession(tenantId: string, sessionReference: string)

// Upload invoice to batch session
// POST /api/v2/sessions/batch/{referenceNumber}/invoices
uploadBatchInvoice(tenantId: string, sessionReference: string, invoiceData: any)
```

### Invoice Query & Retrieval
```typescript
// Query invoice metadata with filters
// POST /api/v2/invoices/query/metadata
queryInvoiceMetadata(tenantId: string, criteria: any, pagination: { pageSize: number, pageOffset: number })

// Get specific invoice by KSeF number
// GET /api/v2/invoices/ksef/{ksefNumber}
getInvoiceByKsefNumber(tenantId: string, ksefNumber: string)
```

### Invoice Export
```typescript
// Create encrypted export package
// POST /api/v2/invoices/exports
createInvoiceExport(tenantId: string, criteria: any, encryptionKey?: string)

// Get export status and download URL
// GET /api/v2/invoices/exports/{referenceNumber}
getExportStatus(tenantId: string, exportReference: string)
```

## Implementation Notes

### Authentication
All KSeF API calls require:
1. Valid session token (obtained via `/api/v2/auth/sessions`)
2. Bearer token in Authorization header
3. Tenant configuration (NIP, token) from database

### Error Handling
KSeF API returns structured errors:
```typescript
{
  exceptionCode: number,
  exceptionDescription: string,
  details?: any
}
```

Common error codes:
- 21405: Validation failed
- 21418: Invalid continuation token
- 25xxx: Certificate-related errors
- 401: Unauthorized

### Session Flow
1. **Interactive**: POST session → Get status → Download UPO
2. **Batch**: Open session → Upload invoices → Close session → Get status → Download UPO

### Encryption
Export functionality requires:
- RSA encryption for symmetric keys
- AES-256-CBC for invoice packages
- Public key from `/api/v2/security/public-key-certificates`

## Testing Strategy
1. Use test environment endpoints (test.ksef.gov.pl)
2. Create test subjects via `/api/v2/testdata/subject`
3. Validate with sample FA_VAT invoices
4. Check UPO generation

## Next Steps
1. Implement authentication/session management first
2. Add interactive session support
3. Implement querying
4. Add batch and export (optional, more complex)
