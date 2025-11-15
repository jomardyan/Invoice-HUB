import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Toolbar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onItemClick?: () => void;
}

function Sidebar({ onItemClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useAuth();
  const { t } = useTranslation();

  const menuItems = [
    {
      text: t('dashboard.title'),
      icon: <DashboardIcon />,
      path: `/${tenant?.id}/dashboard`,
    },
    {
      text: t('invoice.invoices'),
      icon: <DescriptionIcon />,
      path: `/${tenant?.id}/invoices`,
    },
    {
      text: t('customer.customers'),
      icon: <PeopleIcon />,
      path: `/${tenant?.id}/customers`,
    },
    {
      text: 'Products',
      icon: <InventoryIcon />,
      path: `/${tenant?.id}/products`,
    },
    {
      text: 'Payments',
      icon: <PaymentIcon />,
      path: `/${tenant?.id}/payments`,
    },
  ];

  const secondaryItems = [
    {
      text: 'Reports',
      icon: <AssessmentIcon />,
      path: `/${tenant?.id}/reports`,
    },
    {
      text: 'Integrations',
      icon: <IntegrationInstructionsIcon />,
      path: `/${tenant?.id}/integrations`,
    },
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: `/${tenant?.id}/notifications`,
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: `/${tenant?.id}/settings`,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Invoice-HUB
        </Typography>
      </Toolbar>

      {/* Tenant Name */}
      {tenant && (
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Organization
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {tenant.name}
          </Typography>
        </Box>
      )}

      {/* Main Menu */}
      <List sx={{ flexGrow: 1, px: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'primary.contrastText' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 2 }} />

        {secondaryItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'primary.contrastText' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Sidebar;
