import { Repository } from 'typeorm';
import { Department } from '../entities/Department';
import { AppDataSource } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class DepartmentService {
  private departmentRepository: Repository<Department>;

  constructor() {
    this.departmentRepository = AppDataSource.getRepository(Department);
  }

  async createDepartment(data: {
    tenantId: string;
    name: string;
    description?: string;
    managerId?: string;
    code?: string;
    budgetLimits?: {
      monthly?: number;
      yearly?: number;
      currency?: string;
    };
  }): Promise<Department> {
    // Check if name already exists for this tenant
    const existing = await this.departmentRepository.findOne({
      where: { tenantId: data.tenantId, name: data.name },
    });

    if (existing) {
      throw new AppError('Department with this name already exists', 409);
    }

    const department = this.departmentRepository.create({
      ...data,
      isActive: true,
    });

    return await this.departmentRepository.save(department);
  }

  async getDepartment(id: string, tenantId: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id, tenantId },
      relations: ['manager'],
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return department;
  }

  async getDepartments(
    tenantId: string,
    filters?: {
      isActive?: boolean;
      managerId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ departments: Department[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.departmentRepository
      .createQueryBuilder('department')
      .where('department.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('department.manager', 'manager');

    if (filters?.isActive !== undefined) {
      query.andWhere('department.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.managerId) {
      query.andWhere('department.managerId = :managerId', {
        managerId: filters.managerId,
      });
    }

    const [departments, total] = await query
      .orderBy('department.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { departments, total };
  }

  async updateDepartment(
    id: string,
    tenantId: string,
    data: Partial<Department>
  ): Promise<Department> {
    const department = await this.getDepartment(id, tenantId);

    // If name is being changed, check for uniqueness
    if (data.name && data.name !== department.name) {
      const existing = await this.departmentRepository.findOne({
        where: { tenantId, name: data.name },
      });

      if (existing) {
        throw new AppError('Department with this name already exists', 409);
      }
    }

    Object.assign(department, data);
    return await this.departmentRepository.save(department);
  }

  async deleteDepartment(id: string, tenantId: string): Promise<void> {
    const department = await this.getDepartment(id, tenantId);

    // Instead of hard delete, mark as inactive
    department.isActive = false;
    await this.departmentRepository.save(department);
  }

  async assignManager(
    id: string,
    tenantId: string,
    managerId: string
  ): Promise<Department> {
    const department = await this.getDepartment(id, tenantId);

    department.managerId = managerId;
    return await this.departmentRepository.save(department);
  }

  async setBudgetLimits(
    id: string,
    tenantId: string,
    budgetLimits: {
      monthly?: number;
      yearly?: number;
      currency?: string;
    }
  ): Promise<Department> {
    const department = await this.getDepartment(id, tenantId);

    department.budgetLimits = budgetLimits;
    return await this.departmentRepository.save(department);
  }

  async getDepartmentStats(
    tenantId: string
  ): Promise<{
    totalDepartments: number;
    activeDepartments: number;
    departmentsWithManagers: number;
    departmentsWithBudgets: number;
  }> {
    const departments = await this.departmentRepository.find({
      where: { tenantId },
    });

    return {
      totalDepartments: departments.length,
      activeDepartments: departments.filter((d) => d.isActive).length,
      departmentsWithManagers: departments.filter((d) => d.managerId).length,
      departmentsWithBudgets: departments.filter((d) => d.budgetLimits).length,
    };
  }
}
