import { body, param, query } from 'express-validator';
import { KSeFStatus } from '@/entities/KSeFIntegration';

// Configuration validators
export const createConfigValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('nip').trim().notEmpty().withMessage('NIP is required'),
    body('token').trim().notEmpty().withMessage('Token is required'),
];

export const getConfigValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const updateConfigValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const deleteConfigValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

// Invoice submission validators
export const submitInvoiceValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('invoiceId').isUUID().withMessage('Invalid invoice ID'),
];

export const getSubmissionValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('submissionId').isUUID().withMessage('Invalid submission ID'),
];

export const listSubmissionsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const getStatsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

// Phase 1: Session Management
export const listSessionsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    query('pageSize').optional().isInt({ min: 10, max: 100 }).withMessage('Page size must be between 10 and 100'),
];

export const terminateCurrentSessionValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const terminateSessionValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('sessionReference').notEmpty().withMessage('Session reference required'),
];

// Phase 1: Interactive Session (Online)
export const createInteractiveSessionValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('invoice').notEmpty().withMessage('Invoice data required'),
];

export const getSessionStatusValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('sessionReference').notEmpty().withMessage('Session reference required'),
];

export const getSessionUPOValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('sessionReference').notEmpty().withMessage('Session reference required'),
];

// Phase 1: Batch Session
export const createBatchSessionValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('invoiceSchema').notEmpty().withMessage('Invoice schema required'),
    body('packageInfo').notEmpty().withMessage('Package info required'),
];

export const closeBatchSessionValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('sessionReference').notEmpty().withMessage('Session reference required'),
];

export const uploadBatchInvoiceValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('sessionReference').notEmpty().withMessage('Session reference required'),
];

// Phase 1: Invoice Query
export const queryInvoiceMetadataValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('subjectType').isIn(['Subject1', 'Subject2', 'Subject3', 'SubjectAuthorized']).withMessage('Invalid subject type'),
    body('dateRange').notEmpty().withMessage('Date range required'),
    query('pageSize').optional().isInt({ min: 10, max: 100 }).withMessage('Page size must be between 10 and 100'),
    query('pageOffset').optional().isInt({ min: 0 }).withMessage('Page offset must be non-negative'),
];

export const getInvoiceByKsefNumberValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('ksefNumber').notEmpty().withMessage('KSeF number required'),
];

// Phase 1: Invoice Export
export const createExportValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('criteria').notEmpty().withMessage('Export criteria required'),
    body('encryptionKey').optional().isBase64().withMessage('Encryption key must be base64'),
];

export const getExportStatusValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('exportReference').notEmpty().withMessage('Export reference required'),
];
