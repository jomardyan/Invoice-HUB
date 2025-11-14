import { AppDataSource } from '@/config/database';
import { Product } from '@/entities/Product';
import { Tenant } from '@/entities/Tenant';
import logger from '@/utils/logger';

export interface ProductCreateInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  vatRate?: number;
  unit?: string;
  imageUrl?: string;
  specifications?: Record<string, any>;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  vatRate?: number;
  unit?: string;
  imageUrl?: string;
  specifications?: Record<string, any>;
}

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async createProduct(tenantId: string, input: ProductCreateInput): Promise<Product> {
    try {
      // Check if tenant exists
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check for duplicate SKU within tenant
      const existing = await this.productRepository.findOne({
        where: { tenantId, sku: input.sku },
      });

      if (existing) {
        throw new Error('Product with this SKU already exists in your account');
      }

      const product = this.productRepository.create({
        tenantId,
        sku: input.sku,
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        currency: input.currency || 'PLN',
        vatRate: input.vatRate !== undefined ? input.vatRate : 23.0,
        unit: input.unit || 'pcs',
        imageUrl: input.imageUrl,
        specifications: input.specifications,
        isActive: true,
      }) as Product;

      const saved = await this.productRepository.save(product);
      logger.info(`Product created: ${saved.id} for tenant ${tenantId}`);

      return saved;
    } catch (error) {
      logger.error('Product creation error:', error);
      throw error;
    }
  }

  async getProductById(tenantId: string, productId: string): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });
  }

  async getProductBySku(tenantId: string, sku: string): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: { tenantId, sku },
    });
  }

  async listProducts(
    tenantId: string,
    skip: number = 0,
    take: number = 50,
    category?: string
  ): Promise<[Product[], number]> {
    const where: any = { tenantId, isActive: true };
    if (category) where.category = category;

    return await this.productRepository.findAndCount({
      where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async searchProducts(tenantId: string, query: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = true')
      .andWhere('(product.name ILIKE :query OR product.sku ILIKE :query OR product.category ILIKE :query)', {
        query: `%${query}%`,
      })
      .limit(20)
      .getMany();
  }

  async updateProduct(tenantId: string, productId: string, input: ProductUpdateInput): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId, tenantId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (input.name !== undefined) product.name = input.name;
      if (input.description !== undefined) product.description = input.description;
      if (input.category !== undefined) product.category = input.category;
      if (input.price !== undefined) product.price = input.price;
      if (input.currency !== undefined) product.currency = input.currency;
      if (input.vatRate !== undefined) product.vatRate = input.vatRate;
      if (input.unit !== undefined) product.unit = input.unit;
      if (input.imageUrl !== undefined) product.imageUrl = input.imageUrl;
      if (input.specifications !== undefined) product.specifications = input.specifications;

      const updated = await this.productRepository.save(product);
      logger.info(`Product updated: ${productId}`);

      return updated;
    } catch (error) {
      logger.error('Product update error:', error);
      throw error;
    }
  }

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId, tenantId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      product.isActive = false;
      await this.productRepository.save(product);
      logger.info(`Product deactivated: ${productId}`);
    } catch (error) {
      logger.error('Product deletion error:', error);
      throw error;
    }
  }

  async getProductsByCategory(tenantId: string, category: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { tenantId, category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async bulkUpdatePrices(
    tenantId: string,
    productIds: string[],
    newPrice: number
  ): Promise<void> {
    try {
      await this.productRepository.update(
        { id: productIds.some((id) => id) ? undefined : undefined, tenantId },
        { price: newPrice }
      );

      logger.info(`Bulk updated prices for ${productIds.length} products in tenant ${tenantId}`);
    } catch (error) {
      logger.error('Bulk price update error:', error);
      throw error;
    }
  }
}

export default new ProductService();
