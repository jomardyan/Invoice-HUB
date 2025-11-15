import { Card, CardContent, Skeleton, Box } from '@mui/material';

export const DashboardSkeleton: React.FC = () => {
    return (
        <Box>
            {/* Page Title */}
            <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />

            {/* Metric Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
                {[1, 2, 3, 4].map((item) => (
                    <Card key={item}>
                        <CardContent>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
                            <Skeleton variant="text" width="40%" />
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                <Card>
                    <CardContent>
                        <Skeleton variant="text" width={200} height={32} />
                        <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Skeleton variant="text" width={150} height={32} />
                        <Skeleton variant="circular" width={200} height={200} sx={{ mt: 2, mx: 'auto' }} />
                    </CardContent>
                </Card>
            </Box>

            {/* Recent Activity */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Skeleton variant="text" width={200} height={32} />
                    <Box sx={{ mt: 2 }}>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="40%" />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};
