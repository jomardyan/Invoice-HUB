import { body } from 'express-validator';

export const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must contain special character'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('tenantName').trim().notEmpty().withMessage('Tenant name is required'),
];

export const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('tenantId').optional().isUUID().withMessage('Valid tenant ID is required'),
];

export const tenantLookupValidation = [
    body('email').isEmail().normalizeEmail(),
];

export const requestPasswordResetValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('tenantId').isUUID().withMessage('Valid tenant ID is required'),
];

export const resetPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('tenantId').isUUID().withMessage('Valid tenant ID is required'),
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must contain special character'),
];

export const refreshTokenValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
