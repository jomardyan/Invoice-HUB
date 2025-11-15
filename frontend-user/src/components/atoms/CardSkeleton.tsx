import { Card, CardContent, Skeleton, Box } from '@mui/material';

interface CardSkeletonProps {
    height?: number;
    hasActions?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    height = 120,
    hasActions = false
}) => {
    return (
        <Card>
            <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Box sx={{ mt: 1 }}>
                    <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={height} sx={{ mt: 2 }} />
                {hasActions && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Skeleton variant="rectangular" width={100} height={36} />
                        <Skeleton variant="rectangular" width={100} height={36} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
