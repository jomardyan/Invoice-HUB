import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    MenuItem,
    IconButton,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import {
    DownloadOutlined,
    FilterListOutlined,
    PrintOutlined,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface SalesData {
    month: string;
    revenue: number;
    invoices: number;
    paid: number;
    pending: number;
}

const mockSalesData: SalesData[] = [
    { month: 'Jan', revenue: 45000, invoices: 45, paid: 40, pending: 5 },
    { month: 'Feb', revenue: 52000, invoices: 52, paid: 48, pending: 4 },
    { month: 'Mar', revenue: 48000, invoices: 48, paid: 44, pending: 4 },
    { month: 'Apr', revenue: 61000, invoices: 61, paid: 58, pending: 3 },
    { month: 'May', revenue: 55000, invoices: 55, paid: 52, pending: 3 },
    { month: 'Jun', revenue: 67000, invoices: 67, paid: 65, pending: 2 },
    { month: 'Jul', revenue: 71000, invoices: 71, paid: 68, pending: 3 },
    { month: 'Aug', revenue: 64000, invoices: 64, paid: 60, pending: 4 },
    { month: 'Sep', revenue: 69000, invoices: 69, paid: 66, pending: 3 },
    { month: 'Oct', revenue: 75000, invoices: 75, paid: 72, pending: 3 },
    { month: 'Nov', revenue: 78000, invoices: 78, paid: 75, pending: 3 },
    { month: 'Dec', revenue: 82000, invoices: 82, paid: 80, pending: 2 },
];

export const SalesReport: React.FC = () => {
    const [dateRange, setDateRange] = useState('12months');
    const [chartType, setChartType] = useState<'revenue' | 'invoices'>('revenue');

    const revenueChartData = {
        labels: mockSalesData.map((d) => d.month),
        datasets: [
            {
                label: 'Revenue (PLN)',
                data: mockSalesData.map((d) => d.revenue),
                borderColor: 'rgb(25, 118, 210)',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const invoiceChartData = {
        labels: mockSalesData.map((d) => d.month),
        datasets: [
            {
                label: 'Paid',
                data: mockSalesData.map((d) => d.paid),
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
            },
            {
                label: 'Pending',
                data: mockSalesData.map((d) => d.pending),
                backgroundColor: 'rgba(255, 152, 0, 0.7)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

    const totalRevenue = mockSalesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalInvoices = mockSalesData.reduce((sum, d) => sum + d.invoices, 0);
    const totalPaid = mockSalesData.reduce((sum, d) => sum + d.paid, 0);
    const totalPending = mockSalesData.reduce((sum, d) => sum + d.pending, 0);
    const avgInvoiceValue = totalRevenue / totalInvoices;

    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
        console.log(`Exporting sales report as ${format}`);
        // Implement export functionality
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Sales Report
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => handleExport('pdf')} title="Export PDF">
                        <DownloadOutlined />
                    </IconButton>
                    <IconButton onClick={() => window.print()} title="Print">
                        <PrintOutlined />
                    </IconButton>
                </Box>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FilterListOutlined color="action" />
                        <TextField
                            select
                            label="Date Range"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            size="small"
                            sx={{ minWidth: 200 }}
                        >
                            <MenuItem value="7days">Last 7 Days</MenuItem>
                            <MenuItem value="30days">Last 30 Days</MenuItem>
                            <MenuItem value="3months">Last 3 Months</MenuItem>
                            <MenuItem value="6months">Last 6 Months</MenuItem>
                            <MenuItem value="12months">Last 12 Months</MenuItem>
                            <MenuItem value="ytd">Year to Date</MenuItem>
                            <MenuItem value="custom">Custom Range</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Chart Type"
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value as 'revenue' | 'invoices')}
                            size="small"
                            sx={{ minWidth: 200 }}
                        >
                            <MenuItem value="revenue">Revenue Trend</MenuItem>
                            <MenuItem value="invoices">Invoice Status</MenuItem>
                        </TextField>
                    </Box>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Total Revenue
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            PLN {totalRevenue.toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Total Invoices
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {totalInvoices}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <Chip label={`${totalPaid} Paid`} size="small" color="success" sx={{ mr: 1 }} />
                            <Chip label={`${totalPending} Pending`} size="small" color="warning" />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Avg Invoice Value
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            PLN {avgInvoiceValue.toFixed(0)}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Collection Rate
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {((totalPaid / totalInvoices) * 100).toFixed(1)}%
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Chart */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {chartType === 'revenue' ? 'Revenue Trend' : 'Invoice Status Distribution'}
                    </Typography>
                    <Box sx={{ height: 400, mt: 2 }}>
                        {chartType === 'revenue' ? (
                            <Line data={revenueChartData} options={chartOptions} />
                        ) : (
                            <Bar data={invoiceChartData} options={chartOptions} />
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Monthly Breakdown
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Month</TableCell>
                                    <TableCell align="right">Revenue</TableCell>
                                    <TableCell align="right">Total Invoices</TableCell>
                                    <TableCell align="right">Paid</TableCell>
                                    <TableCell align="right">Pending</TableCell>
                                    <TableCell align="right">Avg Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockSalesData.map((row) => (
                                    <TableRow key={row.month}>
                                        <TableCell>{row.month}</TableCell>
                                        <TableCell align="right">PLN {row.revenue.toLocaleString()}</TableCell>
                                        <TableCell align="right">{row.invoices}</TableCell>
                                        <TableCell align="right">
                                            <Chip label={row.paid} size="small" color="success" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip label={row.pending} size="small" color="warning" />
                                        </TableCell>
                                        <TableCell align="right">
                                            PLN {(row.revenue / row.invoices).toFixed(0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Export Options */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<DownloadOutlined />}
                    onClick={() => handleExport('excel')}
                >
                    Export to Excel
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<DownloadOutlined />}
                    onClick={() => handleExport('csv')}
                >
                    Export to CSV
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<DownloadOutlined />}
                    onClick={() => handleExport('pdf')}
                >
                    Export to PDF
                </Button>
            </Box>
        </Box>
    );
};
