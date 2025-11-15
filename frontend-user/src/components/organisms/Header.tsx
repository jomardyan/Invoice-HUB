import { Box, Toolbar, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import NotificationCenter from './NotificationCenter';
import type { MouseEvent } from 'react';

function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, tenant } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate(`/${tenant?.id}/settings`);
  };

  return (
    <Toolbar
      sx={{
        display: { xs: 'none', md: 'flex' },
        justifyContent: 'flex-end',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Notifications */}
      <NotificationCenter />

      {/* Settings */}
      <IconButton color="inherit" sx={{ mr: 2 }} onClick={handleSettings}>
        <SettingsIcon />
      </IconButton>

      {/* User Avatar & Menu */}
      <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.firstName?.charAt(0)}
          {user?.lastName?.charAt(0)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Box>
            <Box sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{user?.email}</Box>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleSettings}>Settings</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Toolbar>
  );
}

export default Header;
