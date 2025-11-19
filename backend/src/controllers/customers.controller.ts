import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import customerService, { CustomerCreateInput, CustomerUpdateInput } from '../services/CustomerService';
import { CustomerType } from '../entities/Customer';

export class CustomersController {
    static async createCustomer(req: Request, res: Response): Promise<void> {
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
        const customer = await customerService.createCustomer(tenantId, req.body as CustomerCreateInput);

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Customer created successfully',
            data: customer,
        });
    }

    static async listCustomers(req: Request, res: Response): Promise<void> {
        const { tenantId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const skip = (page - 1) * limit;
        const type = req.query.type as CustomerType | undefined;

        const [customers, total] = await customerService.listCustomers(tenantId, skip, limit, type);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: customers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }

    static async searchCustomers(req: Request, res: Response): Promise<void> {
        const { tenantId, query } = req.params;

        if (query.length < 2) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Search query must be at least 2 characters',
            });
        }

        const customers = await customerService.searchCustomers(tenantId, query);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: customers,
        });
    }

    static async getCustomer(req: Request, res: Response): Promise<void> {
        const { tenantId, customerId } = req.params;
        const customer = await customerService.getCustomerById(tenantId, customerId);

        if (!customer) {
            res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Customer not found',
            });
        }

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: customer,
        });
    }

    static async updateCustomer(req: Request, res: Response): Promise<void> {
        const { tenantId, customerId } = req.params;
        const customer = await customerService.updateCustomer(tenantId, customerId, req.body as CustomerUpdateInput);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Customer updated successfully',
            data: customer,
        });
    }

    static async deleteCustomer(req: Request, res: Response): Promise<void> {
        const { tenantId, customerId } = req.params;
        await customerService.deleteCustomer(tenantId, customerId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Customer deleted successfully',
        });
    }

    static async addTag(req: Request, res: Response): Promise<void> {
        const { tenantId, customerId } = req.params;
        const { tag } = req.body;
        const customer = await customerService.addCustomerTag(tenantId, customerId, tag);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Tag added successfully',
            data: customer,
        });
    }

    static async removeTag(req: Request, res: Response): Promise<void> {
        const { tenantId, customerId, tag } = req.params;
        const customer = await customerService.removeCustomerTag(tenantId, customerId, tag);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Tag removed successfully',
            data: customer,
        });
    }
}
