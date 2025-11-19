import { body, param } from 'express-validator';

export const createProductValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('vatRate').optional().isFloat({ min: 0, max: 100 }).withMessage('VAT rate must be between 0 and 100'),
    body('currency').optional().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
];

export const listProductsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const searchProductsValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('query').trim().notEmpty().withMessage('Search query is required'),
];

export const getProductValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('productId').isUUID().withMessage('Invalid product ID'),
];

export const updateProductValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('productId').isUUID().withMessage('Invalid product ID'),
    body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('vatRate').optional().isFloat({ min: 0, max: 100 }).withMessage('VAT rate must be between 0 and 100'),
    body('currency').optional().trim().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
];

export const deleteProductValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('productId').isUUID().withMessage('Invalid product ID'),
];

export const getProductsByCategoryValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('category').trim().notEmpty().withMessage('Category is required'),
];
