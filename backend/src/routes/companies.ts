import { Router } from 'express';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { CompaniesController } from '@/controllers/companies.controller';
import {
  createCompanyValidation,
  listCompaniesValidation,
  getCompanyValidation,
  updateCompanyValidation,
  deleteCompanyValidation,
} from '@/validators/companies.validation';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create company
router.post(
  '/:tenantId/companies',
  createCompanyValidation,
  asyncHandler(CompaniesController.createCompany)
);

// Get companies
router.get(
  '/:tenantId/companies',
  listCompaniesValidation,
  asyncHandler(CompaniesController.listCompanies)
);

// Get company by ID
router.get(
  '/:tenantId/companies/:companyId',
  getCompanyValidation,
  asyncHandler(CompaniesController.getCompany)
);

// Update company
router.put(
  '/:tenantId/companies/:companyId',
  updateCompanyValidation,
  asyncHandler(CompaniesController.updateCompany)
);

// Delete company
router.delete(
  '/:tenantId/companies/:companyId',
  deleteCompanyValidation,
  asyncHandler(CompaniesController.deleteCompany)
);

export default router;
