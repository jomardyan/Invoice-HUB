import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../../store/api/notificationApi';
import type { Notification } from '../../store/api/notificationApi';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function NotificationCenter() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const { data: notifications, isLoading } = useGetNotificationsQuery(
    { tenantId: tenant?.id || '' },
    { skip: !tenant?.id, pollingInterval: 30000 } // Poll every 30 seconds
  );
  
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = notifications?.data.filter(n => !n.isRead).length || 0;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead({ tenantId: tenant?.id || '', id: notification.id });
    }

    // Navigate to related resource
    if (notification.relatedType && notification.relatedId) {
      switch (notification.relatedType) {
        case 'invoice':
          navigate(`/${tenant?.id}/invoices/view/${notification.relatedId}`);
          break;
        case 'payment':
          navigate(`/${tenant?.id}/payments`);
          break;
        case 'customer':
          navigate(`/${tenant?.id}/customers/${notification.relatedId}`);
          break;
      }
    }

    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ tenantId: tenant?.id || '' });
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invoice_paid':
      case 'payment_received':
        return 'success';
      case 'invoice_sent':
      case 'invoice_created':
        return 'info';
      case 'system_alert':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 480 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications?.data.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 360, overflow: 'auto', p: 0 }}>
            {notifications?.data.slice(0, 10).map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': { backgroundColor: 'action.selected' },
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: notification.isRead ? 400 : 600, flexGrow: 1 }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.type.replace('_', ' ')}
                        size="small"
                        color={getNotificationColor(notification.type)}
                        sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider />
        <MenuItem onClick={() => { handleClose(); navigate(`/${tenant?.id}/notifications`); }}>
          <Typography variant="body2" color="primary" textAlign="center" width="100%">
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

export default NotificationCenter;
