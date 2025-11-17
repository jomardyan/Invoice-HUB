import { Repository } from 'typeorm';
import { Warehouse, WarehouseStock, WarehouseType } from '../entities/Warehouse';
import { AppDataSource } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class WarehouseService {
  private warehouseRepository: Repository<Warehouse>;
  private stockRepository: Repository<WarehouseStock>;

  constructor() {
    this.warehouseRepository = AppDataSource.getRepository(Warehouse);
    this.stockRepository = AppDataSource.getRepository(WarehouseStock);
  }

  async createWarehouse(data: {
    tenantId: string;
    code: string;
    name: string;
    type?: WarehouseType;
    description?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    managerId?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<Warehouse> {
    // Check if code already exists
    const existing = await this.warehouseRepository.findOne({
      where: { tenantId: data.tenantId, code: data.code },
    });

    if (existing) {
      throw new AppError('Warehouse with this code already exists', 409);
    }

    const warehouse = this.warehouseRepository.create({
      ...data,
      type: data.type || WarehouseType.MAIN,
      isActive: true,
    });

    return await this.warehouseRepository.save(warehouse);
  }

  async getWarehouse(id: string, tenantId: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, tenantId },
      relations: ['manager'],
    });

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    return warehouse;
  }

  async getWarehouses(
    tenantId: string,
    filters?: {
      type?: WarehouseType;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ warehouses: Warehouse[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.warehouseRepository
      .createQueryBuilder('warehouse')
      .where('warehouse.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('warehouse.manager', 'manager');

    if (filters?.type) {
      query.andWhere('warehouse.type = :type', { type: filters.type });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('warehouse.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const [warehouses, total] = await query
      .orderBy('warehouse.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { warehouses, total };
  }

  async updateWarehouse(
    id: string,
    tenantId: string,
    data: Partial<Warehouse>
  ): Promise<Warehouse> {
    const warehouse = await this.getWarehouse(id, tenantId);

    Object.assign(warehouse, data);
    return await this.warehouseRepository.save(warehouse);
  }

  async deleteWarehouse(id: string, tenantId: string): Promise<void> {
    const warehouse = await this.getWarehouse(id, tenantId);

    // Check if warehouse has stock
    const stockCount = await this.stockRepository.count({
      where: { warehouseId: id },
    });

    if (stockCount > 0) {
      throw new AppError(
        'Cannot delete warehouse with existing stock. Transfer or remove stock first.',
        400
      );
    }

    await this.warehouseRepository.remove(warehouse);
  }

  // Stock Management
  async addStock(data: {
    warehouseId: string;
    productId: string;
    quantity: number;
    location?: string;
    minStockLevel?: number;
    maxStockLevel?: number;
  }): Promise<WarehouseStock> {
    const existing = await this.stockRepository.findOne({
      where: {
        warehouseId: data.warehouseId,
        productId: data.productId,
      },
    });

    if (existing) {
      existing.quantity = Number(existing.quantity) + data.quantity;
      existing.availableQuantity = Number(existing.availableQuantity) + data.quantity;
      if (data.location) existing.location = data.location;
      if (data.minStockLevel !== undefined)
        existing.minStockLevel = data.minStockLevel;
      if (data.maxStockLevel !== undefined)
        existing.maxStockLevel = data.maxStockLevel;

      return await this.stockRepository.save(existing);
    }

    const stock = this.stockRepository.create({
      ...data,
      availableQuantity: data.quantity,
      reservedQuantity: 0,
    });

    return await this.stockRepository.save(stock);
  }

  async getStock(
    warehouseId: string,
    productId: string
  ): Promise<WarehouseStock | null> {
    return await this.stockRepository.findOne({
      where: { warehouseId, productId },
      relations: ['warehouse'],
    });
  }

  async getWarehouseStock(
    warehouseId: string,
    filters?: {
      lowStock?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ stock: WarehouseStock[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const query = this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.warehouseId = :warehouseId', { warehouseId })
      .leftJoinAndSelect('stock.warehouse', 'warehouse');

    if (filters?.lowStock) {
      query.andWhere(
        '(stock.minStockLevel IS NOT NULL AND stock.quantity <= stock.minStockLevel)'
      );
    }

    const [stock, total] = await query
      .orderBy('stock.quantity', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { stock, total };
  }

  async reserveStock(
    warehouseId: string,
    productId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    const stock = await this.getStock(warehouseId, productId);

    if (!stock) {
      throw new AppError('Stock not found', 404);
    }

    if (Number(stock.availableQuantity) < quantity) {
      throw new AppError('Insufficient available stock', 400);
    }

    stock.reservedQuantity = Number(stock.reservedQuantity) + quantity;
    stock.availableQuantity = Number(stock.availableQuantity) - quantity;

    return await this.stockRepository.save(stock);
  }

  async releaseStock(
    warehouseId: string,
    productId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    const stock = await this.getStock(warehouseId, productId);

    if (!stock) {
      throw new AppError('Stock not found', 404);
    }

    if (Number(stock.reservedQuantity) < quantity) {
      throw new AppError('Cannot release more than reserved quantity', 400);
    }

    stock.reservedQuantity = Number(stock.reservedQuantity) - quantity;
    stock.availableQuantity = Number(stock.availableQuantity) + quantity;

    return await this.stockRepository.save(stock);
  }

  async removeStock(
    warehouseId: string,
    productId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    const stock = await this.getStock(warehouseId, productId);

    if (!stock) {
      throw new AppError('Stock not found', 404);
    }

    if (Number(stock.quantity) < quantity) {
      throw new AppError('Insufficient stock to remove', 400);
    }

    stock.quantity = Number(stock.quantity) - quantity;
    stock.availableQuantity = Math.max(0, Number(stock.availableQuantity) - quantity);

    return await this.stockRepository.save(stock);
  }

  async transferStock(
    fromWarehouseId: string,
    toWarehouseId: string,
    productId: string,
    quantity: number
  ): Promise<{ from: WarehouseStock; to: WarehouseStock }> {
    // Remove from source warehouse
    const fromStock = await this.removeStock(
      fromWarehouseId,
      productId,
      quantity
    );

    // Add to destination warehouse
    const toStock = await this.addStock({
      warehouseId: toWarehouseId,
      productId,
      quantity,
    });

    return { from: fromStock, to: toStock };
  }

  async getLowStockAlerts(
    tenantId: string
  ): Promise<Array<WarehouseStock & { productName?: string }>> {
    const warehouses = await this.warehouseRepository.find({
      where: { tenantId, isActive: true },
    });

    const warehouseIds = warehouses.map((w) => w.id);

    if (warehouseIds.length === 0) {
      return [];
    }

    const lowStock = await this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.warehouseId IN (:...warehouseIds)', { warehouseIds })
      .andWhere(
        '(stock.minStockLevel IS NOT NULL AND stock.quantity <= stock.minStockLevel)'
      )
      .leftJoinAndSelect('stock.warehouse', 'warehouse')
      .orderBy('stock.quantity', 'ASC')
      .getMany();

    return lowStock;
  }

  async getStockReport(
    tenantId: string
  ): Promise<{
    totalWarehouses: number;
    activeWarehouses: number;
    totalProducts: number;
    totalQuantity: number;
    lowStockItems: number;
  }> {
    const warehouses = await this.warehouseRepository.find({
      where: { tenantId },
    });

    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter((w) => w.isActive).length;

    const warehouseIds = warehouses.map((w) => w.id);

    if (warehouseIds.length === 0) {
      return {
        totalWarehouses,
        activeWarehouses,
        totalProducts: 0,
        totalQuantity: 0,
        lowStockItems: 0,
      };
    }

    const stock = await this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.warehouseId IN (:...warehouseIds)', { warehouseIds })
      .getMany();

    const totalProducts = stock.length;
    const totalQuantity = stock.reduce((sum, s) => sum + Number(s.quantity), 0);
    const lowStockItems = stock.filter(
      (s) => s.minStockLevel && Number(s.quantity) <= s.minStockLevel
    ).length;

    return {
      totalWarehouses,
      activeWarehouses,
      totalProducts,
      totalQuantity,
      lowStockItems,
    };
  }
}
