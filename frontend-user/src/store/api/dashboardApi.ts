import { api } from './apiSlice';

export interface DashboardStats {
    revenue: {
        currentMonth: number;
        lastMonth: number;
        percentageChange: number;
    };
    invoices: {
        total: number;
        draft: number;
        sent: number;
        paid: number;
        overdue: number;
    };
    outstanding: {
        amount: number;
        count: number;
    };
    customers: {
        total: number;
        newThisMonth: number;
    };
    recentActivity: Array<{
        id: string;
        type: 'invoice_created' | 'invoice_paid' | 'customer_added' | 'payment_received';
        message: string;
        timestamp: string;
    }>;
}

export interface RevenueChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
    }>;
}

export const dashboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardStats: builder.query<DashboardStats, string>({
            query: (tenantId) => `/${tenantId}/reports/dashboard`,
            providesTags: ['Invoice', 'Customer', 'Payment'],
        }),
        getRevenueChart: builder.query<RevenueChartData, { tenantId: string; period: string }>({
            query: ({ tenantId, period }) => `/${tenantId}/reports/revenue-chart?period=${period}`,
            providesTags: ['Invoice'],
        }),
    }),
});

export const { useGetDashboardStatsQuery, useGetRevenueChartQuery } = dashboardApi;
