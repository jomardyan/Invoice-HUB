import { Skeleton, TableRow, TableCell } from '@mui/material';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6 }) => {
    return (
        <>
            {[...Array(rows)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {[...Array(columns)].map((_, colIndex) => (
                        <TableCell key={colIndex}>
                            <Skeleton variant="text" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
};
