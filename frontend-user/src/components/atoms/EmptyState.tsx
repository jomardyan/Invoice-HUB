import { Box, Typography, Button } from '@mui/material';
import {
    AddCircleOutline,
    InboxOutlined,
    SearchOff,
    ErrorOutline
} from '@mui/icons-material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'empty' | 'search' | 'error';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    actionLabel,
    onAction,
    variant = 'empty',
}) => {
    const getDefaultIcon = () => {
        switch (variant) {
            case 'search':
                return <SearchOff sx={{ fontSize: 80, color: 'text.disabled' }} />;
            case 'error':
                return <ErrorOutline sx={{ fontSize: 80, color: 'error.light' }} />;
            default:
                return <InboxOutlined sx={{ fontSize: 80, color: 'text.disabled' }} />;
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                textAlign: 'center',
                p: 4,
            }}
        >
            {icon || getDefaultIcon()}

            <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                {title}
            </Typography>

            {description && (
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
                    {description}
                </Typography>
            )}

            {actionLabel && onAction && (
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddCircleOutline />}
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
};
