import { body, param, query } from 'express-validator';

export const authorizeValidation = [
    query('tenantId').trim().notEmpty().withMessage('tenantId is required'),
];

export const callbackValidation = [
    body('tenantId').trim().notEmpty().withMessage('tenantId is required'),
    body('userId').trim().notEmpty().withMessage('userId is required'),
    body('code').trim().notEmpty().withMessage('code is required'),
];

export const getStatusValidation = [
    param('integrationId').isUUID().withMessage('Invalid integration ID'),
];

export const syncValidation = [
    body('integrationId').trim().notEmpty().withMessage('integrationId is required'),
    body('companyId').trim().notEmpty().withMessage('companyId is required'),
    body('tenantId').trim().notEmpty().withMessage('tenantId is required'),
];

export const deactivateValidation = [
    param('integrationId').isUUID().withMessage('Invalid integration ID'),
];

export const getSettingsValidation = [
    param('integrationId').isUUID().withMessage('Invalid integration ID'),
];

export const getIntegrationsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const updateSettingsValidation = [
    param('integrationId').isUUID().withMessage('Invalid integration ID'),
    body('settings').notEmpty().withMessage('settings is required'),
];
