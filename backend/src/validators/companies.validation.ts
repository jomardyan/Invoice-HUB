import { body, param } from 'express-validator';

export const createCompanyValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('nip').trim().matches(/^\d{10}$/).withMessage('Valid Polish NIP is required'),
    body('vatEu').optional().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
];

export const listCompaniesValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const getCompanyValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('companyId').isUUID().withMessage('Invalid company ID'),
];

export const updateCompanyValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('companyId').isUUID().withMessage('Invalid company ID'),
    body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('nip').optional().trim().matches(/^\d{10}$/).withMessage('Valid Polish NIP is required'),
    body('vatEu').optional().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
];

export const deleteCompanyValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('companyId').isUUID().withMessage('Invalid company ID'),
];
