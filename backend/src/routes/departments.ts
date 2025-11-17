import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { DepartmentService } from '../services/DepartmentService';
import logger from '../utils/logger';

const router: Router = Router();
const departmentService = new DepartmentService();

router.use(authMiddleware);
router.use(requireTenant);

// Create department
router.post('/:tenantId/departments', [
  param('tenantId').isUUID(),
  body('name').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', statusCode: 400, message: 'Validation failed', error: errors.array() });
      return;
    }

    const { tenantId } = req.params;
    const department = await departmentService.createDepartment({ ...req.body, tenantId });
    res.status(201).json({ status: 'success', statusCode: 201, message: 'Department created', data: department });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get departments
router.get('/:tenantId/departments', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const filters: any = { page, limit };
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.managerId) filters.managerId = req.query.managerId as string;

    const { departments, total } = await departmentService.getDepartments(tenantId, filters);
    res.status(200).json({ status: 'success', statusCode: 200, data: departments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get department by ID
router.get('/:tenantId/departments/:departmentId', [param('tenantId').isUUID(), param('departmentId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId, departmentId } = req.params;
    const department = await departmentService.getDepartment(departmentId, tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: department });
  } catch (error) {
    logger.error('Get department error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', statusCode, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Update department
router.put('/:tenantId/departments/:departmentId', [param('tenantId').isUUID(), param('departmentId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId, departmentId } = req.params;
    const department = await departmentService.updateDepartment(departmentId, tenantId, req.body);
    res.status(200).json({ status: 'success', statusCode: 200, message: 'Department updated', data: department });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Delete department
router.delete('/:tenantId/departments/:departmentId', [param('tenantId').isUUID(), param('departmentId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId, departmentId } = req.params;
    await departmentService.deleteDepartment(departmentId, tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, message: 'Department deleted' });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get department stats
router.get('/:tenantId/departments-stats', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const stats = await departmentService.getDepartmentStats(tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: stats });
  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
