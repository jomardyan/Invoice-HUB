# KSeF Integration Guide

## Overview

KSeF (Krajowy System e-Faktur - National e-Invoicing System) is Poland's mandatory electronic invoicing system. This guide explains how to configure and use KSeF integration in Invoice-HUB.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Configuration](#configuration)
3. [Submitting Invoices](#submitting-invoices)
4. [Monitoring Submissions](#monitoring-submissions)
5. [Troubleshooting](#troubleshooting)
6. [API Reference](#api-reference)

## Prerequisites

Before using KSeF integration, you need:

1. **Active NIP** (Polish Tax Identification Number)
2. **KSeF API Credentials** from the Polish Ministry of Finance
3. **Test Environment Access** (for initial setup)
4. **Valid Company Registration** in Poland

## Configuration

### Step 1: Obtain KSeF API Credentials

1. Register your company at [https://ksef.mf.gov.pl](https://ksef.mf.gov.pl)
2. Complete the verification process
3. Generate API credentials (token)
4. Save your credentials securely

### Step 2: Configure Invoice-HUB

#### Using the Frontend UI

1. Navigate to **Settings → Integrations → KSeF**
2. Click **Configure KSeF**
3. Fill in the configuration form:
   - **NIP**: Your company's NIP
   - **API Token**: Your KSeF API token
   - **Environment**: Select "Test" or "Production"
   - **Auto-submit**: Enable if you want automatic submission
4. Click **Save Configuration**

#### Using the API

```bash
POST /api/v1/:tenantId/ksef/config
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "nip": "1234567890",
  "token": "your-ksef-api-token",
  "isEnabled": true,
  "autoSubmit": false,
  "environment": "test",
  "settings": {
    "testMode": true,
    "emailNotifications": true,
    "autoRetry": true,
    "maxRetries": 3
  }
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `nip` | Company NIP (required) | - |
| `token` | KSeF API token (required) | - |
| `isEnabled` | Enable/disable KSeF integration | `false` |
| `autoSubmit` | Automatically submit approved invoices | `false` |
| `environment` | API environment (`test` or `production`) | `production` |
| `testMode` | Use test mode | `false` |
| `emailNotifications` | Send email notifications on status changes | `true` |
| `autoRetry` | Automatically retry failed submissions | `true` |
| `maxRetries` | Maximum number of retry attempts | `3` |

## Submitting Invoices

### Manual Submission

#### From the Frontend

1. Navigate to **Invoices**
2. Select an invoice
3. Click **Actions → Submit to KSeF**
4. Confirm the submission
5. Monitor the status in the KSeF Dashboard

#### Using the API

```bash
POST /api/v1/:tenantId/ksef/submit/:invoiceId
Authorization: Bearer <your-access-token>
```

**Response:**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Invoice submitted to KSeF",
  "data": {
    "id": "submission-uuid",
    "invoiceId": "invoice-uuid",
    "status": "pending",
    "submittedAt": "2025-11-17T10:00:00Z"
  }
}
```

### Automatic Submission

When `autoSubmit` is enabled:

1. Invoice is approved
2. System automatically submits to KSeF
3. Notification is sent on status change
4. Submission history is logged

## Monitoring Submissions

### KSeF Dashboard

Access the KSeF Dashboard at **Integrations → KSeF** to view:

- **Configuration Status**: Current KSeF settings
- **Statistics**: 
  - Total submissions
  - Accepted invoices
  - Pending submissions
  - Errors and rejections
- **Recent Submissions**: List of all submissions with status

### Submission Statuses

| Status | Description | Action Required |
|--------|-------------|-----------------|
| `pending` | Queued for submission | Wait |
| `submitted` | Sent to KSeF, awaiting response | Wait |
| `accepted` | Successfully accepted by KSeF | None |
| `rejected` | Rejected by KSeF | Review error, fix, retry |
| `error` | Technical error during submission | Check logs, retry |

### Checking Submission Status

```bash
GET /api/v1/:tenantId/ksef/submissions/:submissionId
Authorization: Bearer <your-access-token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "submission-uuid",
    "invoiceId": "invoice-uuid",
    "ksefReferenceNumber": "KSeF-123456789",
    "status": "accepted",
    "submittedAt": "2025-11-17T10:00:00Z",
    "acceptedAt": "2025-11-17T10:05:00Z",
    "ksefResponse": {
      "processingCode": "200",
      "processingDescription": "Invoice accepted",
      "timestamp": "2025-11-17T10:05:00Z"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "Invalid NIP"

**Cause**: NIP format is incorrect or not registered with KSeF

**Solution**:
- Verify NIP is exactly 10 digits
- Ensure NIP is registered at ksef.mf.gov.pl
- Check for typos

#### 2. "Authentication Failed"

**Cause**: Invalid or expired API token

**Solution**:
- Regenerate API token from KSeF portal
- Update configuration with new token
- Verify token permissions

#### 3. "Invoice Rejected"

**Cause**: Invoice data doesn't meet KSeF requirements

**Solution**:
- Review error message in submission details
- Common issues:
  - Missing required fields (NIP, invoice number)
  - Invalid VAT amounts
  - Incorrect date format
- Fix invoice and resubmit

#### 4. "Connection Error"

**Cause**: Unable to reach KSeF API

**Solution**:
- Check internet connection
- Verify KSeF API endpoint is accessible
- Check firewall settings
- Retry submission

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Verify invoice data format |
| 401 | Unauthorized | Check API credentials |
| 403 | Forbidden | Verify NIP permissions |
| 404 | Not Found | Check invoice exists |
| 409 | Duplicate | Invoice already submitted |
| 500 | Server Error | Contact KSeF support |

### Retry Failed Submissions

#### From the Frontend

1. Go to **KSeF Dashboard**
2. Find the failed submission
3. Click **Retry**
4. Monitor new submission status

#### Using the API

Simply submit the invoice again - the system will create a new submission attempt.

## API Reference

### Configuration Endpoints

#### Create Configuration
```
POST /api/v1/:tenantId/ksef/config
```

#### Get Configuration
```
GET /api/v1/:tenantId/ksef/config
```

#### Update Configuration
```
PUT /api/v1/:tenantId/ksef/config
```

#### Delete Configuration
```
DELETE /api/v1/:tenantId/ksef/config
```

### Submission Endpoints

#### Submit Invoice
```
POST /api/v1/:tenantId/ksef/submit/:invoiceId
```

#### Get Submission
```
GET /api/v1/:tenantId/ksef/submissions/:submissionId
```

#### List Submissions
```
GET /api/v1/:tenantId/ksef/submissions?status=pending&page=1&limit=20
```

#### Get Statistics
```
GET /api/v1/:tenantId/ksef/stats
```

## Best Practices

1. **Test First**: Always test in the test environment before going to production
2. **Monitor Regularly**: Check the KSeF Dashboard daily for submission statuses
3. **Enable Auto-retry**: Helps handle temporary network issues
4. **Keep Credentials Secure**: Store API tokens in secure, encrypted storage
5. **Review Rejections**: Understand why invoices are rejected to prevent future issues
6. **Update Promptly**: Apply KSeF API updates as announced by the Ministry of Finance
7. **Backup Data**: Keep local copies of submitted invoices
8. **Document Changes**: Log any configuration changes for audit purposes

## Compliance

KSeF integration ensures compliance with:

- **Polish VAT Act** (Ustawa o VAT)
- **Electronic Invoicing Regulations** (Rozporządzenie KSeF)
- **Data Retention Requirements** (10-year invoice archival)
- **Privacy Regulations** (GDPR)

## Support

For technical support:

- **Invoice-HUB Support**: support@invoice-hub.com
- **KSeF Technical Support**: [https://ksef.mf.gov.pl/support](https://ksef.mf.gov.pl/support)
- **Ministry of Finance Helpline**: +48 22 330 03 30

## Updates

This integration is regularly updated to comply with KSeF API changes. Check for updates:

- **API Version**: 1.0
- **Last Updated**: November 2025
- **Next Review**: January 2026

## Additional Resources

- [KSeF Official Documentation](https://ksef.mf.gov.pl/web/dokumentacja)
- [Polish Ministry of Finance](https://www.gov.pl/web/finanse)
- [Invoice-HUB API Documentation](./API_DOCUMENTATION.md)
- [Invoice-HUB User Guide](./USER_GUIDE.md)
