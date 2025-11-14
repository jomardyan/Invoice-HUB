import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import productService, { ProductCreateInput, ProductUpdateInput } from '@/services/ProductService';
import logger from '@/utils/logger';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create product
router.post(
  '/:tenantId/products',
  [
    param('tenantId').isUUID(),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('vatRate').optional().isFloat({ min: 0, max: 100 }),
    body('currency').optional().trim().isLength({ min: 3, max: 3 }),
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
      const product = await productService.createProduct(tenantId, req.body as ProductCreateInput);

      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      logger.error('Create product error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get products
router.get('/:tenantId/products', [param('tenantId').isUUID()], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const [products, total] = await productService.listProducts(tenantId, skip, limit, category);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get products error:', error);

    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Failed to fetch products',
    });
  }
});

// Search products
router.get(
  '/:tenantId/products-search/:query',
  [param('tenantId').isUUID(), param('query').trim()],
  async (req: Request, res: Response) => {
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

      const products = await productService.searchProducts(tenantId, query);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: products,
      });
    } catch (error) {
      logger.error('Search products error:', error);

      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Failed to search products',
      });
    }
  }
);

// Get product by ID
router.get(
  '/:tenantId/products/:productId',
  [param('tenantId').isUUID(), param('productId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, productId } = req.params;
      const product = await productService.getProductById(tenantId, productId);

      if (!product) {
        res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: product,
      });
    } catch (error) {
      logger.error('Get product error:', error);

      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Failed to fetch product',
      });
    }
  }
);

// Update product
router.put(
  '/:tenantId/products/:productId',
  [param('tenantId').isUUID(), param('productId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, productId } = req.params;
      const product = await productService.updateProduct(tenantId, productId, req.body as ProductUpdateInput);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      logger.error('Update product error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Delete product
router.delete(
  '/:tenantId/products/:productId',
  [param('tenantId').isUUID(), param('productId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, productId } = req.params;
      await productService.deleteProduct(tenantId, productId);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      logger.error('Delete product error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: errorMessage,
      });
    }
  }
);

// Get products by category
router.get(
  '/:tenantId/products/category/:category',
  [param('tenantId').isUUID(), param('category').trim()],
  async (req: Request, res: Response) => {
    try {
      const { tenantId, category } = req.params;
      const products = await productService.getProductsByCategory(tenantId, category);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: products,
      });
    } catch (error) {
      logger.error('Get products by category error:', error);

      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Failed to fetch products',
      });
    }
  }
);

export default router;
