import { useState } from 'react';
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
    Avatar,
    LinearProgress,
    TextField,
    MenuItem,
} from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface CustomerMetric {
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    invoiceCount: number;
    avgInvoiceValue: number;
    paymentBehavior: 'excellent' | 'good' | 'average' | 'poor';
    lastPurchase: string;
    growth: number;
}

const mockCustomerData: CustomerMetric[] = [
    {
        id: '1',
        name: 'Tech Solutions Sp. z o.o.',
        email: 'contact@techsolutions.pl',
        totalRevenue: 125000,
        invoiceCount: 24,
        avgInvoiceValue: 5208,
        paymentBehavior: 'excellent',
        lastPurchase: '2025-11-10',
        growth: 15,
    },
    {
        id: '2',
        name: 'Marketing Pro',
        email: 'info@marketingpro.pl',
        totalRevenue: 98000,
        invoiceCount: 18,
        avgInvoiceValue: 5444,
        paymentBehavior: 'good',
        lastPurchase: '2025-11-08',
        growth: 8,
    },
    {
        id: '3',
        name: 'Digital Agency Warsaw',
        email: 'hello@digitalagency.pl',
        totalRevenue: 87000,
        invoiceCount: 22,
        avgInvoiceValue: 3954,
        paymentBehavior: 'excellent',
        lastPurchase: '2025-11-12',
        growth: 22,
    },
    {
        id: '4',
        name: 'E-commerce Plus',
        email: 'sales@ecommerceplus.pl',
        totalRevenue: 76000,
        invoiceCount: 15,
        avgInvoiceValue: 5067,
        paymentBehavior: 'average',
        lastPurchase: '2025-11-05',
        growth: -5,
    },
    {
        id: '5',
        name: 'Consulting Partners',
        email: 'info@consultingpartners.pl',
        totalRevenue: 65000,
        invoiceCount: 12,
        avgInvoiceValue: 5417,
        paymentBehavior: 'good',
        lastPurchase: '2025-11-07',
        growth: 12,
    },
];

const getPaymentBehaviorColor = (behavior: string) => {
    switch (behavior) {
        case 'excellent':
            return 'success';
        case 'good':
            return 'info';
        case 'average':
            return 'warning';
        case 'poor':
            return 'error';
        default:
            return 'default';
    }
};

export const CustomerAnalytics: React.FC = () => {
    const [period, setPeriod] = useState('12months');

    const totalCustomers = mockCustomerData.length;
    const totalRevenue = mockCustomerData.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgCustomerValue = totalRevenue / totalCustomers;

    const revenueDistributionData = {
        labels: mockCustomerData.slice(0, 5).map((c) => c.name),
        datasets: [
            {
                data: mockCustomerData.slice(0, 5).map((c) => c.totalRevenue),
                backgroundColor: [
                    'rgba(25, 118, 210, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(156, 39, 176, 0.8)',
                    'rgba(244, 67, 54, 0.8)',
                ],
            },
        ],
    };

    const paymentBehaviorData = {
        labels: ['Excellent', 'Good', 'Average', 'Poor'],
        datasets: [
            {
                label: 'Customers',
                data: [
                    mockCustomerData.filter((c) => c.paymentBehavior === 'excellent').length,
                    mockCustomerData.filter((c) => c.paymentBehavior === 'good').length,
                    mockCustomerData.filter((c) => c.paymentBehavior === 'average').length,
                    mockCustomerData.filter((c) => c.paymentBehavior === 'poor').length,
                ],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(244, 67, 54, 0.7)',
                ],
            },
        ],
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Customer Analytics
                </Typography>

                <TextField
                    select
                    label="Period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="30days">Last 30 Days</MenuItem>
                    <MenuItem value="3months">Last 3 Months</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="12months">Last 12 Months</MenuItem>
                    <MenuItem value="ytd">Year to Date</MenuItem>
                </TextField>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Total Customers
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {totalCustomers}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Total Customer Revenue
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            PLN {totalRevenue.toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Avg Customer Lifetime Value
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            PLN {avgCustomerValue.toFixed(0)}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Revenue Distribution (Top 5)
                        </Typography>
                        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Doughnut
                                data={revenueDistributionData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                    },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Payment Behavior
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <Bar
                                data={paymentBehaviorData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Top Customers Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Top Customers by Revenue
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Customer</TableCell>
                                    <TableCell align="right">Total Revenue</TableCell>
                                    <TableCell align="right">Invoices</TableCell>
                                    <TableCell align="right">Avg Value</TableCell>
                                    <TableCell align="center">Payment Behavior</TableCell>
                                    <TableCell align="right">Growth</TableCell>
                                    <TableCell>Last Purchase</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockCustomerData.map((customer) => (
                                    <TableRow key={customer.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    {customer.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {customer.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {customer.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                PLN {customer.totalRevenue.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{customer.invoiceCount}</TableCell>
                                        <TableCell align="right">
                                            PLN {customer.avgInvoiceValue.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={customer.paymentBehavior}
                                                size="small"
                                                color={getPaymentBehaviorColor(customer.paymentBehavior)}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                {customer.growth > 0 ? (
                                                    <TrendingUp fontSize="small" color="success" />
                                                ) : (
                                                    <TrendingDown fontSize="small" color="error" />
                                                )}
                                                <Typography
                                                    variant="body2"
                                                    color={customer.growth > 0 ? 'success.main' : 'error.main'}
                                                >
                                                    {customer.growth > 0 ? '+' : ''}
                                                    {customer.growth}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(customer.lastPurchase).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Customer Retention */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Customer Retention
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Excellent Payers</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    40%
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={40} color="success" />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Good Payers</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    40%
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={40} color="info" />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Average Payers</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    20%
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={20} color="warning" />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};
