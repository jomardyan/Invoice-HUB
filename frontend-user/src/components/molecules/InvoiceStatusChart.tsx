import { Paper, Box, Typography, CircularProgress } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface InvoiceStatusChartProps {
    data: {
        draft: number;
        sent: number;
        paid: number;
        overdue: number;
    };
    isLoading?: boolean;
}

function InvoiceStatusChart({ data, isLoading }: InvoiceStatusChartProps) {
    const chartData = {
        labels: ['Draft', 'Sent', 'Paid', 'Overdue'],
        datasets: [
            {
                data: [data?.draft || 0, data?.sent || 0, data?.paid || 0, data?.overdue || 0],
                backgroundColor: [
                    'rgba(158, 158, 158, 0.8)', // Gray for Draft
                    'rgba(33, 150, 243, 0.8)', // Blue for Sent
                    'rgba(76, 175, 80, 0.8)', // Green for Paid
                    'rgba(244, 67, 54, 0.8)', // Red for Overdue
                ],
                borderColor: [
                    'rgba(158, 158, 158, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(244, 67, 54, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: 400 }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Invoice Status
            </Typography>
            <Box sx={{ height: 300 }}>
                <Doughnut data={chartData} options={options} />
            </Box>
        </Paper>
    );
}

export default InvoiceStatusChart;
