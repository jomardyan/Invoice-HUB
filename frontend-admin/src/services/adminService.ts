import api from './api';

export interface PlatformMetrics {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalInvoices: number;
    monthlyRevenue: number;
    growth: {
        tenants: number;
        users: number;
        revenue: number;
    };
}

export interface TenantGrowthData {
    month: string;
    newTenants: number;
    churnedTenants: number;
}

export interface RevenueData {
    month: string;
    revenue: number;
}

export interface SubscriptionDistribution {
    tier: string;
    count: number;
}

export interface TopTenant {
    id: string;
    name: string;
    plan: string;
    users: number;
    invoices: number;
    revenue: number;
    status: 'active' | 'suspended' | 'trial';
}

export interface Tenant {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'trial' | 'cancelled';
    userCount: number;
    invoiceCount: number;
    storageUsed: number;
    storageLimit: number;
    createdAt: string;
    lastActive: string;
    // Additional fields for management
    subscriptionTier?: 'free' | 'basic' | 'professional' | 'enterprise';
    quota?: number;
    quotaUsed?: number;
    mrr?: number;
}

export interface ServiceHealth {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: number;
    lastCheck: string;
    responseTime?: number;
}

export interface PerformanceMetric {
    endpoint: string;
    avgResponseTime: number;
    requestCount: number;
    errorRate: number;
}

export interface ErrorLog {
    id: string;
    timestamp: string;
    level: 'error' | 'warning' | 'info';
    service: string;
    message: string;
    stack?: string;
}

export interface ResourceUsage {
    cpu: {
        current: number;
        average: number;
        peak: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    storage: {
        used: number;
        total: number;
        percentage: number;
    };
    database: {
        connections: number;
        maxConnections: number;
        size: number;
        slowQueries: number;
    };
}

const adminService = {
    // Dashboard
    getPlatformMetrics: async (): Promise<PlatformMetrics> => {
        const response = await api.get('/admin/metrics');
        return response.data;
    },

    getTenantGrowth: async (): Promise<TenantGrowthData[]> => {
        const response = await api.get('/admin/analytics/tenant-growth');
        return response.data;
    },

    getRevenueData: async (): Promise<RevenueData[]> => {
        const response = await api.get('/admin/analytics/revenue');
        return response.data;
    },

    getSubscriptionDistribution: async (): Promise<SubscriptionDistribution[]> => {
        const response = await api.get('/admin/analytics/subscriptions');
        return response.data;
    },

    getTopTenants: async (): Promise<TopTenant[]> => {
        const response = await api.get('/admin/tenants/top');
        return response.data;
    },

    // Tenant Management
    getTenants: async (filters?: {
        search?: string;
        status?: string;
        plan?: string;
    }): Promise<Tenant[]> => {
        const response = await api.get('/admin/tenants', { params: filters });
        return response.data;
    },

    getTenant: async (id: string): Promise<Tenant> => {
        const response = await api.get(`/admin/tenants/${id}`);
        return response.data;
    },

    updateTenant: async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
        const response = await api.patch(`/admin/tenants/${id}`, data);
        return response.data;
    },

    suspendTenant: async (id: string, reason: string): Promise<void> => {
        await api.post(`/admin/tenants/${id}/suspend`, { reason });
    },

    reactivateTenant: async (id: string): Promise<void> => {
        await api.post(`/admin/tenants/${id}/reactivate`);
    },

    deleteTenant: async (id: string): Promise<void> => {
        await api.delete(`/admin/tenants/${id}`);
    },

    // System Monitoring
    getServiceHealth: async (): Promise<ServiceHealth[]> => {
        const response = await api.get('/admin/monitoring/health');
        return response.data;
    },

    getPerformanceMetrics: async (): Promise<PerformanceMetric[]> => {
        const response = await api.get('/admin/monitoring/performance');
        return response.data;
    },

    getErrorLogs: async (filters?: {
        level?: string;
        service?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<ErrorLog[]> => {
        const response = await api.get('/admin/monitoring/errors', { params: filters });
        return response.data;
    },

    getResourceUsage: async (): Promise<ResourceUsage> => {
        const response = await api.get('/admin/monitoring/resources');
        return response.data;
    },

    refreshHealth: async (): Promise<void> => {
        await api.post('/admin/monitoring/refresh');
    },
};

export default adminService;
