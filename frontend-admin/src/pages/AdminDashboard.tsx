import { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Skeleton,
} from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { TrendingUp, TrendingDown, Group, Business, Receipt, AttachMoney } from '@mui/icons-material';
import adminService, { type PlatformMetrics, type TopTenant } from '../services/adminService';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export const AdminDashboard = () => {
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
    const [tenantGrowthData, setTenantGrowthData] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [metricsData, tenantsData, growthData, revenue, subscriptions] = await Promise.all([
                adminService.getPlatformMetrics(),
                adminService.getTopTenants(),
                adminService.getTenantGrowth(),
                adminService.getRevenueData(),
                adminService.getSubscriptionDistribution(),
            ]);

            setMetrics(metricsData);
            setTopTenants(tenantsData);

            // Transform tenant growth data for Chart.js
            setTenantGrowthData({
                labels: growthData.map((d) => d.month),
                datasets: [
                    {
                        label: 'New Tenants',
                        data: growthData.map((d) => d.newTenants),
                        borderColor: 'rgb(25, 118, 210)',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        tension: 0.4,
                    },
                ],
            });

            // Transform revenue data for Chart.js
            setRevenueData({
                labels: revenue.map((d) => d.month),
                datasets: [
                    {
                        label: 'MRR (PLN)',
                        data: revenue.map((d) => d.revenue),
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    },
                ],
            });

            // Transform subscription data for Chart.js
            const colors = {
                free: 'rgba(158, 158, 158, 0.8)',
                basic: 'rgba(33, 150, 243, 0.8)',
                professional: 'rgba(156, 39, 176, 0.8)',
                enterprise: 'rgba(255, 152, 0, 0.8)',
            };

            setSubscriptionData({
                labels: subscriptions.map((s) => s.tier.charAt(0).toUpperCase() + s.tier.slice(1)),
                datasets: [
                    {
                        data: subscriptions.map((s) => s.count),
                        backgroundColor: subscriptions.map((s) => colors[s.tier as keyof typeof colors] || 'rgba(158, 158, 158, 0.8)'),
                    },
                ],
            });
        } catch (err: any) {
            console.error('Failed to load dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pl-PL').format(value);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'suspended':
                return 'error';
            case 'trial':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'enterprise':
                return 'error';
            case 'professional':
                return 'secondary';
            case 'basic':
                return 'primary';
            case 'free':
                return 'default';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Platform Dashboard
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="40%" height={40} />
                                <Skeleton variant="text" width="50%" />
                            </CardContent>
                        </Card>
                    ))}
                </Box>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Platform Dashboard
                </Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                    Note: If the backend API is not running, the dashboard will show this error. Start the backend server to see real data.
                </Typography>
            </Box>
        );
    }

    if (!metrics) return null;
    if (!metrics) return null;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Platform Dashboard
            </Typography>

            {/* Metrics Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Total Tenants
                                </Typography>
                                <Typography variant="h4">{formatNumber(metrics.totalTenants)}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    {metrics.growth.tenants >= 0 ? (
                                        <TrendingUp color="success" fontSize="small" />
                                    ) : (
                                        <TrendingDown color="error" fontSize="small" />
                                    )}
                                    <Typography
                                        variant="body2"
                                        color={metrics.growth.tenants >= 0 ? 'success.main' : 'error.main'}
                                        sx={{ ml: 0.5 }}
                                    >
                                        {metrics.growth.tenants > 0 ? '+' : ''}{metrics.growth.tenants}% this month
                                    </Typography>
                                </Box>
                            </Box>
                            <Business color="primary" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Total Users
                                </Typography>
                                <Typography variant="h4">{formatNumber(metrics.totalUsers)}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    {metrics.growth.users >= 0 ? (
                                        <TrendingUp color="success" fontSize="small" />
                                    ) : (
                                        <TrendingDown color="error" fontSize="small" />
                                    )}
                                    <Typography
                                        variant="body2"
                                        color={metrics.growth.users >= 0 ? 'success.main' : 'error.main'}
                                        sx={{ ml: 0.5 }}
                                    >
                                        {metrics.growth.users > 0 ? '+' : ''}{metrics.growth.users}% this month
                                    </Typography>
                                </Box>
                            </Box>
                            <Group color="secondary" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Total Invoices
                                </Typography>
                                <Typography variant="h4">{formatNumber(metrics.totalInvoices)}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Active: {formatNumber(metrics.activeTenants)}
                                </Typography>
                            </Box>
                            <Receipt color="info" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography color="text.secondary" variant="body2" gutterBottom>
                                    Monthly Revenue
                                </Typography>
                                <Typography variant="h4">{formatCurrency(metrics.monthlyRevenue)}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    {metrics.growth.revenue >= 0 ? (
                                        <TrendingUp color="success" fontSize="small" />
                                    ) : (
                                        <TrendingDown color="error" fontSize="small" />
                                    )}
                                    <Typography
                                        variant="body2"
                                        color={metrics.growth.revenue >= 0 ? 'success.main' : 'error.main'}
                                        sx={{ ml: 0.5 }}
                                    >
                                        {metrics.growth.revenue > 0 ? '+' : ''}{metrics.growth.revenue}% MoM
                                    </Typography>
                                </Box>
                            </Box>
                            <AttachMoney color="success" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Tenant Growth
                        </Typography>
                        {tenantGrowthData && <Line data={tenantGrowthData} options={{ responsive: true, maintainAspectRatio: true }} />}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Subscription Distribution
                        </Typography>
                        {subscriptionData && (
                            <Doughnut
                                data={subscriptionData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                    },
                                }}
                            />
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Revenue Trend (MRR)
                    </Typography>
                    {revenueData && <Bar data={revenueData} options={{ responsive: true, maintainAspectRatio: true }} />}
                </CardContent>
            </Card>

            {/* Top Tenants Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Top Tenants by Revenue
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tenant Name</TableCell>
                                    <TableCell>Plan</TableCell>
                                    <TableCell align="right">Users</TableCell>
                                    <TableCell align="right">Invoices</TableCell>
                                    <TableCell align="right">Revenue</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {topTenants.map((tenant) => (
                                    <TableRow key={tenant.id} hover>
                                        <TableCell>{tenant.name}</TableCell>
                                        <TableCell>
                                            <Chip label={tenant.plan} color={getPlanColor(tenant.plan)} size="small" />
                                        </TableCell>
                                        <TableCell align="right">{formatNumber(tenant.users)}</TableCell>
                                        <TableCell align="right">{formatNumber(tenant.invoices)}</TableCell>
                                        <TableCell align="right">{formatCurrency(tenant.revenue)}</TableCell>
                                        <TableCell>
                                            <Chip label={tenant.status} color={getStatusColor(tenant.status)} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
};
