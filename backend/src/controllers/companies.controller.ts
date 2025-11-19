import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import companyService, { CompanyCreateInput, CompanyUpdateInput } from '../services/CompanyService';

export class CompaniesController {
    static async createCompany(req: Request, res: Response): Promise<void> {
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
        const company = await companyService.createCompany(tenantId, req.body as CompanyCreateInput);

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Company created successfully',
            data: company,
        });
    }

    static async listCompanies(req: Request, res: Response): Promise<void> {
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
    }

    static async getCompany(req: Request, res: Response): Promise<void> {
        const { tenantId, companyId } = req.params;
        const company = await companyService.getCompanyById(tenantId, companyId);

        if (!company) {
            res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Company not found',
            });
        }

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: company,
        });
    }

    static async updateCompany(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                error: errors.array(),
            });
        }

        const { tenantId, companyId } = req.params;
        const company = await companyService.updateCompany(tenantId, companyId, req.body as CompanyUpdateInput);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Company updated successfully',
            data: company,
        });
    }

    static async deleteCompany(req: Request, res: Response): Promise<void> {
        const { tenantId, companyId } = req.params;
        await companyService.deleteCompany(tenantId, companyId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Company deleted successfully',
        });
    }
}
