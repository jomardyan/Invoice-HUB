import { Router } from 'express';
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Tenant } from '../entities/Tenant';

const router = Router();

// Get platform metrics
router.get('/metrics', async (req: Request, res: Response) => {
    try {
        const tenantRepo = AppDataSource.getRepository(Tenant);
        
        // Get counts
        const [tenants, totalTenants] = await tenantRepo.findAndCount();
        const activeTenants = tenants.filter(t => t.isActive).length;
        
        // Calculate users and invoices (you'll need to adjust based on your schema)
        const totalUsers = tenants.reduce((sum, t) => sum + (t.userCount || 0), 0);
        const totalInvoices = tenants.reduce((sum, t) => sum + (t.invoiceCount || 0), 0);
        
        // Calculate monthly revenue (MRR)
        const monthlyRevenue = tenants.reduce((sum, t) => {
            const tierPricing: any = {
                free: 0,
                basic: 199,
                professional: 499,
                enterprise: 2500
            };
            return sum + (tierPricing[t.subscriptionTier] || 0);
        }, 0);
        
        // Calculate growth (mock for now - implement actual calculation)
        const metrics = {
            totalTenants,
            activeTenants,
            totalUsers,
            totalInvoices,
            monthlyRevenue,
            growth: {
                tenants: 12.5,
                users: 18.3,
                revenue: 22.1
            }
        };
        
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch metrics' });
    }
});

// Get tenant growth data
router.get('/analytics/tenant-growth', async (req: Request, res: Response) => {
    try {
        // Mock data - implement actual calculation based on your needs
        const growthData = [
            { month: 'Jan', newTenants: 12, churnedTenants: 2 },
            { month: 'Feb', newTenants: 15, churnedTenants: 1 },
            { month: 'Mar', newTenants: 18, churnedTenants: 3 },
            { month: 'Apr', newTenants: 22, churnedTenants: 2 },
            { month: 'May', newTenants: 19, churnedTenants: 4 },
            { month: 'Jun', newTenants: 25, churnedTenants: 3 },
            { month: 'Jul', newTenants: 28, churnedTenants: 2 },
            { month: 'Aug', newTenants: 30, churnedTenants: 5 },
            { month: 'Sep', newTenants: 27, churnedTenants: 3 },
            { month: 'Oct', newTenants: 32, churnedTenants: 2 },
            { month: 'Nov', newTenants: 35, churnedTenants: 4 },
            { month: 'Dec', newTenants: 38, churnedTenants: 3 }
        ];
        
        res.json(growthData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch growth data' });
    }
});

// Get revenue data
router.get('/analytics/revenue', async (req: Request, res: Response) => {
    try {
        // Mock data - implement actual calculation
        const revenueData = [
            { month: 'Jan', revenue: 85000 },
            { month: 'Feb', revenue: 92000 },
            { month: 'Mar', revenue: 98000 },
            { month: 'Apr', revenue: 105000 },
            { month: 'May', revenue: 110000 },
            { month: 'Jun', revenue: 115000 },
            { month: 'Jul', revenue: 118000 },
            { month: 'Aug', revenue: 121000 },
            { month: 'Sep', revenue: 123000 },
            { month: 'Oct', revenue: 125000 },
            { month: 'Nov', revenue: 128000 },
            { month: 'Dec', revenue: 132000 }
        ];
        
        res.json(revenueData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch revenue data' });
    }
});

// Get subscription distribution
router.get('/analytics/subscriptions', async (req: Request, res: Response) => {
    try {
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenants = await tenantRepo.find();
        
        const distribution = {
            free: 0,
            basic: 0,
            professional: 0,
            enterprise: 0
        };
        
        tenants.forEach(t => {
            if (t.subscriptionTier && distribution.hasOwnProperty(t.subscriptionTier)) {
                distribution[t.subscriptionTier as keyof typeof distribution]++;
            }
        });
        
        const result = Object.entries(distribution).map(([tier, count]) => ({
            tier,
            count
        }));
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch subscription data' });
    }
});

// Get top tenants
router.get('/tenants/top', async (req: Request, res: Response) => {
    try {
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenants = await tenantRepo.find({ take: 5 });
        
        const tierPricing: any = {
            free: 0,
            basic: 199,
            professional: 499,
            enterprise: 2500
        };
        
        const topTenants = tenants.map(t => ({
            id: t.id,
            name: t.name,
            plan: t.subscriptionTier || 'free',
            users: t.userCount || 0,
            invoices: t.invoiceCount || 0,
            revenue: tierPricing[t.subscriptionTier] || 0,
            status: t.isActive ? 'active' : 'suspended'
        }));
        
        res.json(topTenants);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch top tenants' });
    }
});

// Get all tenants with filtering
router.get('/tenants', async (req: Request, res: Response) => {
    try {
        const { search, status, plan } = req.query;
        const tenantRepo = AppDataSource.getRepository(Tenant);
        
        let query = tenantRepo.createQueryBuilder('tenant');
        
        if (search) {
            query = query.where('tenant.name LIKE :search OR tenant.email LIKE :search', {
                search: `%${search}%`
            });
        }
        
        if (status && status !== 'all') {
            if (status === 'active') {
                query = query.andWhere('tenant.isActive = :isActive', { isActive: true });
            } else if (status === 'suspended') {
                query = query.andWhere('tenant.isActive = :isActive', { isActive: false });
            }
        }
        
        if (plan && plan !== 'all') {
            query = query.andWhere('tenant.subscriptionTier = :plan', { plan });
        }
        
        const tenants = await query.getMany();
        
        const result = tenants.map(t => ({
            id: t.id,
            name: t.name,
            email: t.email || '',
            plan: t.subscriptionTier || 'free',
            status: t.isActive ? 'active' : 'suspended',
            userCount: t.userCount || 0,
            invoiceCount: t.invoiceCount || 0,
            storageUsed: 0,
            storageLimit: 1000,
            createdAt: t.createdAt,
            lastActive: new Date().toISOString()
        }));
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tenants' });
    }
});

// Suspend tenant
router.post('/tenants/:id/suspend', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepo.findOneBy({ id });
        
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        
        tenant.isActive = false;
        await tenantRepo.save(tenant);
        
        res.json({ message: 'Tenant suspended successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to suspend tenant' });
    }
});

// Reactivate tenant
router.post('/tenants/:id/reactivate', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepo.findOneBy({ id });
        
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        
        tenant.isActive = true;
        await tenantRepo.save(tenant);
        
        res.json({ message: 'Tenant reactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reactivate tenant' });
    }
});

// Delete tenant
router.delete('/tenants/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const tenantRepo = AppDataSource.getRepository(Tenant);
        await tenantRepo.delete(id);
        
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete tenant' });
    }
});

// System monitoring endpoints
router.get('/monitoring/health', async (req: Request, res: Response) => {
    try {
        const services = [
            { name: 'API Server', status: 'operational', uptime: 99.9, lastCheck: new Date().toISOString(), responseTime: 45 },
            { name: 'Database', status: 'operational', uptime: 99.95, lastCheck: new Date().toISOString(), responseTime: 12 },
            { name: 'Redis Cache', status: 'operational', uptime: 99.8, lastCheck: new Date().toISOString(), responseTime: 5 },
            { name: 'Email Service', status: 'operational', uptime: 98.5, lastCheck: new Date().toISOString(), responseTime: 230 },
            { name: 'Storage', status: 'operational', uptime: 99.99, lastCheck: new Date().toISOString(), responseTime: 25 }
        ];
        
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch service health' });
    }
});

router.get('/monitoring/performance', async (req: Request, res: Response) => {
    try {
        const metrics = [
            { endpoint: '/api/invoices', avgResponseTime: 120, requestCount: 15420, errorRate: 0.2 },
            { endpoint: '/api/customers', avgResponseTime: 95, requestCount: 8230, errorRate: 0.1 },
            { endpoint: '/api/payments', avgResponseTime: 180, requestCount: 12100, errorRate: 0.3 },
            { endpoint: '/api/products', avgResponseTime: 75, requestCount: 5680, errorRate: 0.05 },
            { endpoint: '/api/reports', avgResponseTime: 450, requestCount: 3200, errorRate: 0.5 }
        ];
        
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch performance metrics' });
    }
});

router.get('/monitoring/errors', async (req: Request, res: Response) => {
    try {
        const logs = [
            {
                id: '1',
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'API',
                message: 'Database connection timeout',
                stack: 'Error: Connection timeout at...'
            },
            {
                id: '2',
                timestamp: new Date().toISOString(),
                level: 'warning',
                service: 'Email',
                message: 'Rate limit approaching',
                stack: undefined
            }
        ];
        
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch error logs' });
    }
});

router.get('/monitoring/resources', async (req: Request, res: Response) => {
    try {
        const resources = {
            cpu: {
                current: 45,
                average: 52,
                peak: 78
            },
            memory: {
                used: 6400,
                total: 16000,
                percentage: 40
            },
            storage: {
                used: 450,
                total: 1000,
                percentage: 45
            },
            database: {
                connections: 45,
                maxConnections: 100,
                size: 25600,
                slowQueries: 3
            }
        };
        
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch resource usage' });
    }
});

export default router;
