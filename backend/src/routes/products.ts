import { Router } from 'express';
import { authMiddleware, requireTenant } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { ProductsController } from '@/controllers/products.controller';
import {
  createProductValidation,
  listProductsValidation,
  searchProductsValidation,
  getProductValidation,
  updateProductValidation,
  deleteProductValidation,
  getProductsByCategoryValidation,
} from '@/validators/products.validation';

const router: Router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireTenant);

// Create product
router.post(
  '/:tenantId/products',
  createProductValidation,
  asyncHandler(ProductsController.createProduct)
);

// Get products
router.get(
  '/:tenantId/products',
  listProductsValidation,
  asyncHandler(ProductsController.listProducts)
);

// Search products
router.get(
  '/:tenantId/products-search/:query',
  searchProductsValidation,
  asyncHandler(ProductsController.searchProducts)
);

// Get product by ID
router.get(
  '/:tenantId/products/:productId',
  getProductValidation,
  asyncHandler(ProductsController.getProduct)
);

// Update product
router.put(
  '/:tenantId/products/:productId',
  updateProductValidation,
  asyncHandler(ProductsController.updateProduct)
);

// Delete product
router.delete(
  '/:tenantId/products/:productId',
  deleteProductValidation,
  asyncHandler(ProductsController.deleteProduct)
);

// Get products by category
router.get(
  '/:tenantId/products/category/:category',
  getProductsByCategoryValidation,
  asyncHandler(ProductsController.getProductsByCategory)
);

export default router;
