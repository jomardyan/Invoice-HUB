import { Router } from 'express';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { CustomersController } from '@/controllers/customers.controller';
import {
  createCustomerValidation,
  listCustomersValidation,
  searchCustomersValidation,
  getCustomerValidation,
  updateCustomerValidation,
  deleteCustomerValidation,
  addTagValidation,
  removeTagValidation,
} from '@/validators/customers.validation';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create customer
router.post(
  '/:tenantId/customers',
  createCustomerValidation,
  asyncHandler(CustomersController.createCustomer)
);

// Get customers
router.get(
  '/:tenantId/customers',
  listCustomersValidation,
  asyncHandler(CustomersController.listCustomers)
);

// Search customers
router.get(
  '/:tenantId/customers-search/:query',
  searchCustomersValidation,
  asyncHandler(CustomersController.searchCustomers)
);

// Get customer by ID
router.get(
  '/:tenantId/customers/:customerId',
  getCustomerValidation,
  asyncHandler(CustomersController.getCustomer)
);

// Update customer
router.put(
  '/:tenantId/customers/:customerId',
  updateCustomerValidation,
  asyncHandler(CustomersController.updateCustomer)
);

// Delete customer
router.delete(
  '/:tenantId/customers/:customerId',
  deleteCustomerValidation,
  asyncHandler(CustomersController.deleteCustomer)
);

// Add tag to customer
router.post(
  '/:tenantId/customers/:customerId/tags',
  addTagValidation,
  asyncHandler(CustomersController.addTag)
);

// Remove tag from customer
router.delete(
  '/:tenantId/customers/:customerId/tags/:tag',
  removeTagValidation,
  asyncHandler(CustomersController.removeTag)
);

export default router;
