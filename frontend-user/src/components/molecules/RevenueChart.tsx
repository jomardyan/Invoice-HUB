import { Paper, Box, Typography, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface RevenueChartProps {
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
        }>;
    };
    isLoading?: boolean;
}

function RevenueChart({ data, isLoading }: RevenueChartProps) {
    const chartData = {
        labels: data?.labels || [],
        datasets:
            data?.datasets.map((dataset) => ({
                label: dataset.label,
                data: dataset.data,
                borderColor: 'rgb(25, 118, 210)',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                fill: true,
                tension: 0.4,
            })) || [],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => `PLN ${value.toLocaleString()}`,
                },
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
                Revenue Trend
            </Typography>
            <Box sx={{ height: 300 }}>
                <Line data={chartData} options={options} />
            </Box>
        </Paper>
    );
}

export default RevenueChart;
