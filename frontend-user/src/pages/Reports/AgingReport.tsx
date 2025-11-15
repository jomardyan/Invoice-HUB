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
    Button,
    LinearProgress,
} from '@mui/material';
import { WarningAmber, EmailOutlined } from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';

interface AgingInvoice {
    id: string;
    invoiceNumber: string;
    customer: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    daysOverdue: number;
    ageBracket: '0-30' | '31-60' | '61-90' | '90+';
}

const mockOverdueInvoices: AgingInvoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2025-001',
        customer: 'Tech Solutions Sp. z o.o.',
        issueDate: '2025-09-15',
        dueDate: '2025-10-15',
        amount: 5200,
        daysOverdue: 31,
        ageBracket: '31-60',
    },
    {
        id: '2',
        invoiceNumber: 'INV-2025-003',
        customer: 'Marketing Pro',
        issueDate: '2025-08-20',
        dueDate: '2025-09-20',
        amount: 3800,
        daysOverdue: 56,
        ageBracket: '31-60',
    },
    {
        id: '3',
        invoiceNumber: 'INV-2025-005',
        customer: 'E-commerce Plus',
        issueDate: '2025-10-01',
        dueDate: '2025-11-01',
        amount: 2400,
        daysOverdue: 14,
        ageBracket: '0-30',
    },
    {
        id: '4',
        invoiceNumber: 'INV-2025-007',
        customer: 'Digital Agency Warsaw',
        issueDate: '2025-07-10',
        dueDate: '2025-08-10',
        amount: 7100,
        daysOverdue: 97,
        ageBracket: '90+',
    },
    {
        id: '5',
        invoiceNumber: 'INV-2025-009',
        customer: 'Consulting Partners',
        issueDate: '2025-10-20',
        dueDate: '2025-11-20',
        amount: 1900,
        daysOverdue: 5,
        ageBracket: '0-30',
    },
    {
        id: '6',
        invoiceNumber: 'INV-2025-011',
        customer: 'Tech Solutions Sp. z o.o.',
        issueDate: '2025-08-01',
        dueDate: '2025-09-01',
        amount: 4500,
        daysOverdue: 75,
        ageBracket: '61-90',
    },
];

const getAgingColor = (bracket: string) => {
    switch (bracket) {
        case '0-30':
            return 'warning';
        case '31-60':
            return 'error';
        case '61-90':
            return 'error';
        case '90+':
            return 'error';
        default:
            return 'default';
    }
};

export const AgingReport: React.FC = () => {
    const brackets = {
        '0-30': mockOverdueInvoices.filter((inv) => inv.ageBracket === '0-30'),
        '31-60': mockOverdueInvoices.filter((inv) => inv.ageBracket === '31-60'),
        '61-90': mockOverdueInvoices.filter((inv) => inv.ageBracket === '61-90'),
        '90+': mockOverdueInvoices.filter((inv) => inv.ageBracket === '90+'),
    };

    const totalOverdue = mockOverdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const agingChartData = {
        labels: ['0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
        datasets: [
            {
                data: [
                    brackets['0-30'].reduce((sum, inv) => sum + inv.amount, 0),
                    brackets['31-60'].reduce((sum, inv) => sum + inv.amount, 0),
                    brackets['61-90'].reduce((sum, inv) => sum + inv.amount, 0),
                    brackets['90+'].reduce((sum, inv) => sum + inv.amount, 0),
                ],
                backgroundColor: [
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(244, 67, 54, 0.6)',
                    'rgba(211, 47, 47, 0.7)',
                    'rgba(183, 28, 28, 0.9)',
                ],
            },
        ],
    };

    const handleSendReminder = (invoiceId: string) => {
        console.log(`Sending payment reminder for invoice ${invoiceId}`);
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Aging Report
            </Typography>

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            Total Overdue
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                            PLN {totalOverdue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {mockOverdueInvoices.length} invoices
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            0-30 Days
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            PLN {brackets['0-30'].reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {brackets['0-30'].length} invoices
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'error.50' }}>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            31-60 Days
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                            PLN {brackets['31-60'].reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {brackets['31-60'].length} invoices
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'error.100' }}>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            61-90 Days
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.dark' }}>
                            PLN {brackets['61-90'].reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {brackets['61-90'].length} invoices
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'error.200' }}>
                    <CardContent>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            90+ Days
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.dark' }}>
                            PLN {brackets['90+'].reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {brackets['90+'].length} invoices
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Chart */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Overdue Distribution
                    </Typography>
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Doughnut
                            data={agingChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                    },
                                },
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Collection Priority */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Collection Priority
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2">Critical (90+ days)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.dark' }}>
                                    {((brackets['90+'].reduce((sum, inv) => sum + inv.amount, 0) / totalOverdue) * 100).toFixed(0)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={(brackets['90+'].reduce((sum, inv) => sum + inv.amount, 0) / totalOverdue) * 100}
                                color="error"
                            />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2">High Priority (61-90 days)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {((brackets['61-90'].reduce((sum, inv) => sum + inv.amount, 0) / totalOverdue) * 100).toFixed(0)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={(brackets['61-90'].reduce((sum, inv) => sum + inv.amount, 0) / totalOverdue) * 100}
                                color="warning"
                            />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2">Monitor (0-60 days)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(
                                        ((brackets['0-30'].reduce((sum, inv) => sum + inv.amount, 0) +
                                            brackets['31-60'].reduce((sum, inv) => sum + inv.amount, 0)) /
                                            totalOverdue) *
                                        100
                                    ).toFixed(0)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={
                                    ((brackets['0-30'].reduce((sum, inv) => sum + inv.amount, 0) +
                                        brackets['31-60'].reduce((sum, inv) => sum + inv.amount, 0)) /
                                        totalOverdue) *
                                    100
                                }
                                color="info"
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Overdue Invoices Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Overdue Invoices
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Invoice #</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Issue Date</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="center">Days Overdue</TableCell>
                                    <TableCell align="center">Age Bracket</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockOverdueInvoices
                                    .sort((a, b) => b.daysOverdue - a.daysOverdue)
                                    .map((invoice) => (
                                        <TableRow key={invoice.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {invoice.invoiceNumber}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{invoice.customer}</TableCell>
                                            <TableCell>
                                                {new Date(invoice.issueDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    PLN {invoice.amount.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {invoice.daysOverdue > 60 && <WarningAmber fontSize="small" color="error" />}
                                                    <Typography
                                                        variant="body2"
                                                        color={invoice.daysOverdue > 60 ? 'error' : 'warning.main'}
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {invoice.daysOverdue} days
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${invoice.ageBracket} days`}
                                                    size="small"
                                                    color={getAgingColor(invoice.ageBracket)}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    startIcon={<EmailOutlined />}
                                                    onClick={() => handleSendReminder(invoice.id)}
                                                >
                                                    Send Reminder
                                                </Button>
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
