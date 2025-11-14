import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import customerService, { CustomerCreateInput, CustomerUpdateInput } from '@/services/CustomerService';
import { CustomerType } from '@/entities/Customer';
import logger from '@/utils/logger';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create customer
router.post(
  '/:tenantId/customers',
  [
    param('tenantId').isUUID(),
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('type')
      .isIn([CustomerType.INDIVIDUAL, CustomerType.BUSINESS])
      .withMessage('Valid customer type is required'),
    body('email').optional().isEmail(),
    body('nip').optional().trim(),
    body('creditLimit').optional().isFloat({ min: 0 }),
    body('paymentTermDays').optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Validation failed',
          error: errors.array(),
        });
        return;
      }

      const { tenantId } = req.params;
      const customer = await customerService.createCustomer(tenantId, req.body as CustomerCreateInput);

      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error) {
      logger.error('Create customer error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get customers
router.get('/:tenantId/customers', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;
    const type = req.query.type as CustomerType | undefined;

    const [customers, total] = await customerService.listCustomers(tenantId, skip, limit, type);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get customers error:', error);

    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Failed to fetch customers',
    });
  }
});

// Search customers
router.get('/:tenantId/customers-search/:query', [param('tenantId').isUUID(), param('query').trim()], async (req: Request, res: Response) => {
  try {
    const { tenantId, query } = req.params;

    if (query.length < 2) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    const customers = await customerService.searchCustomers(tenantId, query);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: customers,
    });
  } catch (error) {
    logger.error('Search customers error:', error);

    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Failed to search customers',
    });
  }
});

// Get customer by ID
router.get(
  '/:tenantId/customers/:customerId',
  [param('tenantId').isUUID(), param('customerId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, customerId } = req.params;
      const customer = await customerService.getCustomerById(tenantId, customerId);

      if (!customer) {
        res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: customer,
      });
    } catch (error) {
      logger.error('Get customer error:', error);

      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Failed to fetch customer',
      });
    }
  }
);

// Update customer
router.put(
  '/:tenantId/customers/:customerId',
  [param('tenantId').isUUID(), param('customerId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, customerId } = req.params;
      const customer = await customerService.updateCustomer(tenantId, customerId, req.body as CustomerUpdateInput);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error) {
      logger.error('Update customer error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Delete customer
router.delete(
  '/:tenantId/customers/:customerId',
  [param('tenantId').isUUID(), param('customerId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, customerId } = req.params;
      await customerService.deleteCustomer(tenantId, customerId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      logger.error('Delete customer error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Add tag to customer
router.post(
  '/:tenantId/customers/:customerId/tags',
  [param('tenantId').isUUID(), param('customerId').isUUID(), body('tag').trim().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, customerId } = req.params;
      const { tag } = req.body;
      const customer = await customerService.addCustomerTag(tenantId, customerId, tag);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Tag added successfully',
        data: customer,
      });
    } catch (error) {
      logger.error('Add tag error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add tag';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Remove tag from customer
router.delete(
  '/:tenantId/customers/:customerId/tags/:tag',
  [param('tenantId').isUUID(), param('customerId').isUUID(), param('tag').trim()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, customerId, tag } = req.params;
      const customer = await customerService.removeCustomerTag(tenantId, customerId, tag);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Tag removed successfully',
        data: customer,
      });
    } catch (error) {
      logger.error('Remove tag error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove tag';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

export default router;
