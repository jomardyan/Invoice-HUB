import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '../middleware/auth';
import { WarehouseService } from '../services/WarehouseService';
import { WarehouseType } from '../entities/Warehouse';
import logger from '../utils/logger';

const router: Router = Router();
const warehouseService = new WarehouseService();

router.use(authMiddleware);
router.use(requireTenant);

// Create warehouse
router.post('/:tenantId/warehouses', [
  param('tenantId').isUUID(),
  body('code').trim().notEmpty(),
  body('name').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', statusCode: 400, message: 'Validation failed', error: errors.array() });
      return;
    }

    const { tenantId } = req.params;
    const warehouse = await warehouseService.createWarehouse({ ...req.body, tenantId });

    res.status(201).json({ status: 'success', statusCode: 201, message: 'Warehouse created', data: warehouse });
  } catch (error) {
    logger.error('Create warehouse error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get warehouses
router.get('/:tenantId/warehouses', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const filters: any = { page, limit };
    if (req.query.type) filters.type = req.query.type as WarehouseType;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const { warehouses, total } = await warehouseService.getWarehouses(tenantId, filters);

    res.status(200).json({ status: 'success', statusCode: 200, data: warehouses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Get warehouses error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get warehouse by ID
router.get('/:tenantId/warehouses/:warehouseId', [param('tenantId').isUUID(), param('warehouseId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId, warehouseId } = req.params;
    const warehouse = await warehouseService.getWarehouse(warehouseId, tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: warehouse });
  } catch (error) {
    logger.error('Get warehouse error:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ status: 'error', statusCode, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Update warehouse
router.put('/:tenantId/warehouses/:warehouseId', [param('tenantId').isUUID(), param('warehouseId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId, warehouseId } = req.params;
    const warehouse = await warehouseService.updateWarehouse(warehouseId, tenantId, req.body);
    res.status(200).json({ status: 'success', statusCode: 200, message: 'Warehouse updated', data: warehouse });
  } catch (error) {
    logger.error('Update warehouse error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Delete warehouse
router.delete('/:tenantId/warehouses/:warehouseId', [param('tenantId').isUUID(), param('warehouseId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId, warehouseId } = req.params;
    await warehouseService.deleteWarehouse(warehouseId, tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, message: 'Warehouse deleted' });
  } catch (error) {
    logger.error('Delete warehouse error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Stock Management
router.post('/:tenantId/warehouses/:warehouseId/stock', [
  param('tenantId').isUUID(),
  param('warehouseId').isUUID(),
  body('productId').isUUID(),
  body('quantity').isFloat({ min: 0 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', statusCode: 400, message: 'Validation failed', error: errors.array() });
      return;
    }

    const { warehouseId } = req.params;
    const stock = await warehouseService.addStock({ ...req.body, warehouseId });
    res.status(201).json({ status: 'success', statusCode: 201, message: 'Stock added', data: stock });
  } catch (error) {
    logger.error('Add stock error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Get warehouse stock
router.get('/:tenantId/warehouses/:warehouseId/stock', [param('tenantId').isUUID(), param('warehouseId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { warehouseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const filters: any = { page, limit };
    if (req.query.lowStock === 'true') filters.lowStock = true;

    const { stock, total } = await warehouseService.getWarehouseStock(warehouseId, filters);
    res.status(200).json({ status: 'success', statusCode: 200, data: stock, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Get stock error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Low stock alerts
router.get('/:tenantId/warehouses/alerts/low-stock', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const alerts = await warehouseService.getLowStockAlerts(tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: alerts });
  } catch (error) {
    logger.error('Get low stock alerts error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

// Stock report
router.get('/:tenantId/warehouses/reports/stock', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const report = await warehouseService.getStockReport(tenantId);
    res.status(200).json({ status: 'success', statusCode: 200, data: report });
  } catch (error) {
    logger.error('Get stock report error:', error);
    res.status(400).json({ status: 'error', statusCode: 400, message: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
