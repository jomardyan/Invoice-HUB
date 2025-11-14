import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import companyService, { CompanyCreateInput, CompanyUpdateInput } from '@/services/CompanyService';
import logger from '@/utils/logger';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create company
router.post(
  '/:tenantId/companies',
  [
    param('tenantId').isUUID(),
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('nip').trim().matches(/^\d{10}$/).withMessage('Valid Polish NIP is required'),
    body('vatEu').optional().trim(),
    body('email').optional().isEmail(),
    body('phone').optional().trim(),
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
      const company = await companyService.createCompany(tenantId, req.body as CompanyCreateInput);

      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Company created successfully',
        data: company,
      });
    } catch (error) {
      logger.error('Create company error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create company';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get companies
router.get('/:tenantId/companies', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;

    const [companies, total] = await companyService.listCompanies(tenantId, skip, limit);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get companies error:', error);

    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Failed to fetch companies',
    });
  }
});

// Get company by ID
router.get(
  '/:tenantId/companies/:companyId',
  [param('tenantId').isUUID(), param('companyId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, companyId } = req.params;
      const company = await companyService.getCompanyById(tenantId, companyId);

      if (!company) {
        res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: 'Company not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: company,
      });
    } catch (error) {
      logger.error('Get company error:', error);

      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Failed to fetch company',
      });
    }
  }
);

// Update company
router.put(
  '/:tenantId/companies/:companyId',
  [param('tenantId').isUUID(), param('companyId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, companyId } = req.params;
      const company = await companyService.updateCompany(tenantId, companyId, req.body as CompanyUpdateInput);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Company updated successfully',
        data: company,
      });
    } catch (error) {
      logger.error('Update company error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update company';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Delete company
router.delete(
  '/:tenantId/companies/:companyId',
  [param('tenantId').isUUID(), param('companyId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, companyId } = req.params;
      await companyService.deleteCompany(tenantId, companyId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      logger.error('Delete company error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete company';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

export default router;
