import { Card, CardContent, Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    icon: ReactNode;
    color?: string;
}

function StatCard({ title, value, change, isPositive = true, icon, color = 'primary.main' }: StatCardProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {value}
                        </Typography>
                        {change && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                                {isPositive ? (
                                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                ) : (
                                    <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                )}
                                <Typography
                                    variant="body2"
                                    sx={{ color: isPositive ? 'success.main' : 'error.main' }}
                                >
                                    {change}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
                </Box>
            </CardContent>
        </Card>
    );
}

export default StatCard;
