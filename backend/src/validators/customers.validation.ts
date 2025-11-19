import { body, param } from 'express-validator';
import { CustomerType } from '@/entities/Customer';

export const createCustomerValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('type')
        .isIn([CustomerType.INDIVIDUAL, CustomerType.BUSINESS])
        .withMessage('Valid customer type is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('nip').optional().trim(),
    body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be a positive number'),
    body('paymentTermDays').optional().isInt({ min: 0 }).withMessage('Payment term days must be a positive integer'),
];

export const listCustomersValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
];

export const searchCustomersValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('query').trim().notEmpty().withMessage('Search query is required'),
];

export const getCustomerValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('customerId').isUUID().withMessage('Invalid customer ID'),
];

export const updateCustomerValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('customerId').isUUID().withMessage('Invalid customer ID'),
    body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
    body('type').optional().isIn([CustomerType.INDIVIDUAL, CustomerType.BUSINESS]).withMessage('Valid customer type is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('nip').optional().trim(),
    body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be a positive number'),
    body('paymentTermDays').optional().isInt({ min: 0 }).withMessage('Payment term days must be a positive integer'),
];

export const deleteCustomerValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('customerId').isUUID().withMessage('Invalid customer ID'),
];

export const addTagValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('customerId').isUUID().withMessage('Invalid customer ID'),
    body('tag').trim().notEmpty().withMessage('Tag is required'),
];

export const removeTagValidation = [
    param('tenantId').isUUID().withMessage('Invalid tenant ID'),
    param('customerId').isUUID().withMessage('Invalid customer ID'),
    param('tag').trim().notEmpty().withMessage('Tag is required'),
];
