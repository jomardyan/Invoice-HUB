import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import productService, { ProductCreateInput, ProductUpdateInput } from '../services/ProductService';

export class ProductsController {
    static async createProduct(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                error: errors.array(),
            });
        }

        const { tenantId } = req.params;
        const product = await productService.createProduct(tenantId, req.body as ProductCreateInput);

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Product created successfully',
            data: product,
        });
    }

    static async listProducts(req: Request, res: Response): Promise<void> {
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
    }

    static async searchProducts(req: Request, res: Response): Promise<void> {
        const { tenantId, query } = req.params;

        if (query.length < 2) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Search query must be at least 2 characters',
            });
        }

        const products = await productService.searchProducts(tenantId, query);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: products,
        });
    }

    static async getProduct(req: Request, res: Response): Promise<void> {
        const { tenantId, productId } = req.params;
        const product = await productService.getProductById(tenantId, productId);

        if (!product) {
            res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: product,
        });
    }

    static async updateProduct(req: Request, res: Response): Promise<void> {
        const { tenantId, productId } = req.params;
        const product = await productService.updateProduct(tenantId, productId, req.body as ProductUpdateInput);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Product updated successfully',
            data: product,
        });
    }

    static async deleteProduct(req: Request, res: Response): Promise<void> {
        const { tenantId, productId } = req.params;
        await productService.deleteProduct(tenantId, productId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Product deleted successfully',
        });
    }

    static async getProductsByCategory(req: Request, res: Response): Promise<void> {
        const { tenantId, category } = req.params;
        const products = await productService.getProductsByCategory(tenantId, category);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: products,
        });
    }
}
