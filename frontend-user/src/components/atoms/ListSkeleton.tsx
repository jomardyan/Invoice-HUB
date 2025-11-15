import { Card, CardContent, Skeleton, Box } from '@mui/material';

interface ListSkeletonProps {
    rows?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 10 }) => {
    return (
        <Card>
            <CardContent>
                {/* Header with search and filters */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Skeleton variant="rectangular" width={300} height={40} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="rectangular" width={100} height={40} />
                        <Skeleton variant="rectangular" width={100} height={40} />
                    </Box>
                </Box>

                {/* Table rows */}
                {[...Array(rows)].map((_, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="70%" />
                            <Skeleton variant="text" width="50%" />
                        </Box>
                        <Skeleton variant="rectangular" width={80} height={32} sx={{ mr: 2 }} />
                        <Skeleton variant="rectangular" width={100} height={32} />
                    </Box>
                ))}

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Skeleton variant="rectangular" width={300} height={40} />
                </Box>
            </CardContent>
        </Card>
    );
};
