import { useState } from 'react';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    DashboardOutlined,
    BusinessOutlined,
    MonitorHeartOutlined,
    MenuOutlined,
    AccountCircle,
    Person,
    Settings,
    Logout,
} from '@mui/icons-material';
import { AdminDashboard } from './pages/AdminDashboard';
import { TenantManagement } from './pages/TenantManagement';
import { SystemMonitoring } from './pages/SystemMonitoring';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#9c27b0',
        },
    },
});

const drawerWidth = 240;

function App() {
    const [activePage, setActivePage] = useState('dashboard');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfileClick = () => {
        handleMenuClose();
        setProfileDialogOpen(true);
    };

    const handleSettingsClick = () => {
        handleMenuClose();
        setSettingsDialogOpen(true);
    };

    const handleLogout = () => {
        handleMenuClose();
        // Clear admin token
        localStorage.removeItem('admin_token');
        setSnackbarMessage('Logged out successfully');
        setSnackbarOpen(true);
        // In a real app, redirect to login page
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    };

    const handleSaveProfile = () => {
        setProfileDialogOpen(false);
        setSnackbarMessage('Profile updated successfully');
        setSnackbarOpen(true);
    };

    const handleSaveSettings = () => {
        setSettingsDialogOpen(false);
        setSnackbarMessage('Settings saved successfully');
        setSnackbarOpen(true);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
        { id: 'tenants', label: 'Tenants', icon: <BusinessOutlined /> },
        { id: 'monitoring', label: 'Monitoring', icon: <MonitorHeartOutlined /> },
    ];

    const drawer = (
        <Box>
            <Toolbar>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
                    Admin Panel
                </Typography>
            </Toolbar>
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.id} disablePadding>
                        <ListItemButton
                            selected={activePage === item.id}
                            onClick={() => {
                                setActivePage(item.id);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'tenants':
                return <TenantManagement />;
            case 'monitoring':
                return <SystemMonitoring />;
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        ml: { sm: `${drawerWidth}px` },
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuOutlined />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                            Invoice-HUB Platform Administration
                        </Typography>
                        <IconButton color="inherit" onClick={handleMenuOpen}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                <AccountCircle />
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
                            <MenuItem onClick={handleProfileClick}>
                                <ListItemIcon>
                                    <Person fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Profile</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={handleSettingsClick}>
                                <ListItemIcon>
                                    <Settings fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Settings</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <Logout fontSize="small" color="error" />
                                </ListItemIcon>
                                <ListItemText>Logout</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true,
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        mt: 8,
                    }}
                >
                    {renderPage()}
                </Box>

                {/* Profile Dialog */}
                <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Admin Profile</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Full Name"
                                defaultValue="Admin User"
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                label="Email"
                                defaultValue="admin@invoicehub.com"
                                fullWidth
                                variant="outlined"
                                type="email"
                            />
                            <TextField
                                label="Phone"
                                defaultValue="+48 123 456 789"
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                label="Role"
                                defaultValue="Super Administrator"
                                fullWidth
                                variant="outlined"
                                disabled
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile} variant="contained">Save Changes</Button>
                    </DialogActions>
                </Dialog>

                {/* Settings Dialog */}
                <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Admin Settings</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Alert severity="info">
                                Configure platform-wide settings and preferences
                            </Alert>
                            <TextField
                                label="Session Timeout (minutes)"
                                defaultValue="30"
                                fullWidth
                                variant="outlined"
                                type="number"
                            />
                            <TextField
                                label="API Rate Limit (requests/hour)"
                                defaultValue="1000"
                                fullWidth
                                variant="outlined"
                                type="number"
                            />
                            <TextField
                                label="Max Tenants Allowed"
                                defaultValue="500"
                                fullWidth
                                variant="outlined"
                                type="number"
                            />
                            <TextField
                                label="Notification Email"
                                defaultValue="notifications@invoicehub.com"
                                fullWidth
                                variant="outlined"
                                type="email"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings} variant="contained">Save Settings</Button>
                    </DialogActions>
                </Dialog>

                {/* Success Snackbar */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
}

export default App;
