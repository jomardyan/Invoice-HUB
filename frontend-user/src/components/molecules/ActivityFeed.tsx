import {
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: string;
    type: 'invoice_created' | 'invoice_paid' | 'customer_added' | 'payment_received';
    message: string;
    timestamp: string;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    isLoading?: boolean;
}

function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'invoice_created':
                return <DescriptionIcon />;
            case 'invoice_paid':
                return <CheckCircleIcon />;
            case 'customer_added':
                return <PersonAddIcon />;
            case 'payment_received':
                return <PaymentIcon />;
            default:
                return <DescriptionIcon />;
        }
    };

    const getColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'invoice_created':
                return 'primary.main';
            case 'invoice_paid':
                return 'success.main';
            case 'customer_added':
                return 'info.main';
            case 'payment_received':
                return 'warning.main';
            default:
                return 'primary.main';
        }
    };

    if (isLoading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activity
            </Typography>
            {activities && activities.length > 0 ? (
                <List>
                    {activities.map((activity) => (
                        <ListItem key={activity.id} alignItems="flex-start">
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getColor(activity.type) }}>
                                    {getIcon(activity.type)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={activity.message}
                                secondary={formatDistanceToNow(new Date(activity.timestamp), {
                                    addSuffix: true,
                                })}
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No recent activity
                </Typography>
            )}
        </Paper>
    );
}

export default ActivityFeed;
