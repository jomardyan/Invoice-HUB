import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    LinearProgress,
    CircularProgress,
    Alert,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    MoreVert,
    SearchOutlined,
    AddCircleOutline,
    EditOutlined,
    BlockOutlined,
    CheckCircleOutline,
    DeleteOutline,
    VisibilityOutlined,
} from '@mui/icons-material';
import adminService, { type Tenant } from '../services/adminService';

export const TenantManagement = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getTenants();
            setTenants(data);
        } catch (err: any) {
            console.error('Failed to load tenants:', err);
            setError(err.response?.data?.message || 'Failed to load tenants. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (searchQuery) filters.search = searchQuery;
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (planFilter !== 'all') filters.plan = planFilter;
            
            const data = await adminService.getTenants(filters);
            setTenants(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!selectedTenant) return;
        try {
            setActionLoading(true);
            await adminService.suspendTenant(selectedTenant.id, suspendReason);
            await loadTenants();
            setSuspendDialogOpen(false);
            setSuspendReason('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to suspend tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivate = async () => {
        if (!selectedTenant) return;
        try {
            setActionLoading(true);
            await adminService.reactivateTenant(selectedTenant.id);
            await loadTenants();
            handleMenuClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reactivate tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTenant) return;
        try {
            setActionLoading(true);
            await adminService.deleteTenant(selectedTenant.id);
            await loadTenants();
            setDeleteDialogOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, tenant: Tenant) => {
        setAnchorEl(event.currentTarget);
        setSelectedTenant(tenant);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleViewClick = () => {
        setViewDialogOpen(true);
        handleMenuClose();
    };

    const handleEditClick = () => {
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleSuspendClick = () => {
        setSuspendDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'trial':
                return 'info';
            case 'suspended':
                return 'error';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'enterprise':
                return 'error';
            case 'professional':
                return 'secondary';
            case 'basic':
                return 'primary';
            case 'free':
                return 'default';
            default:
                return 'default';
        }
    };

    const filteredTenants = tenants.filter((tenant) => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
        const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
        return matchesSearch && matchesStatus && matchesPlan;
    });

    if (loading) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Tenant Management
                </Typography>
                <Card>
                    <CardContent>
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <CircularProgress />
                            <Typography sx={{ mt: 2 }}>Loading tenants...</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Tenant Management
                </Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button onClick={loadTenants} variant="contained">
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Tenant Management
                </Typography>
                <Button variant="contained" startIcon={<AddCircleOutline />}>
                    Create Tenant
                </Button>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            placeholder="Search tenants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            size="small"
                            sx={{ flex: 1, minWidth: 250 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            select
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            size="small"
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="trial">Trial</MenuItem>
                            <MenuItem value="suspended">Suspended</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </TextField>
                        <TextField
                            select
                            label="Plan"
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            size="small"
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="all">All Plans</MenuItem>
                            <MenuItem value="free">Free</MenuItem>
                            <MenuItem value="basic">Basic</MenuItem>
                            <MenuItem value="professional">Professional</MenuItem>
                            <MenuItem value="enterprise">Enterprise</MenuItem>
                        </TextField>
                        <Button variant="contained" onClick={handleSearch}>
                            Apply Filters
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Tenants Table */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tenant</TableCell>
                                    <TableCell>Plan</TableCell>
                                    <TableCell align="right">Users</TableCell>
                                    <TableCell align="right">Invoices</TableCell>
                                    <TableCell>Storage</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {tenant.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {tenant.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={tenant.plan} 
                                                size="small" 
                                                color={getTierColor(tenant.plan)} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">{tenant.userCount}</TableCell>
                                        <TableCell align="right">{tenant.invoiceCount}</TableCell>
                                        <TableCell>
                                            <Box sx={{ minWidth: 120 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {tenant.storageUsed} / {tenant.storageLimit} MB
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(tenant.storageUsed / tenant.storageLimit) * 100}
                                                    sx={{ mt: 0.5 }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={tenant.status} 
                                                size="small" 
                                                color={getStatusColor(tenant.status)} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => handleMenuClick(e, tenant)}
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {filteredTenants.length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">No tenants found</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleViewClick}>
                    <ListItemIcon><VisibilityOutlined fontSize="small" /></ListItemIcon>
                    <ListItemText>View Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                {selectedTenant?.status === 'suspended' ? (
                    <MenuItem onClick={handleReactivate}>
                        <ListItemIcon><CheckCircleOutline fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText>Reactivate</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={handleSuspendClick}>
                        <ListItemIcon><BlockOutlined fontSize="small" color="warning" /></ListItemIcon>
                        <ListItemText>Suspend</ListItemText>
                    </MenuItem>
                )}
                <MenuItem onClick={handleDeleteClick}>
                    <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Tenant Details</DialogTitle>
                <DialogContent>
                    {selectedTenant && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6">{selectedTenant.name}</Typography>
                            <Typography color="text.secondary" gutterBottom>{selectedTenant.email}</Typography>
                            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Plan</Typography>
                                    <Typography>{selectedTenant.plan}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Typography>{selectedTenant.status}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Users</Typography>
                                    <Typography>{selectedTenant.userCount}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Invoices</Typography>
                                    <Typography>{selectedTenant.invoiceCount}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Created</Typography>
                                    <Typography>{new Date(selectedTenant.createdAt).toLocaleDateString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Last Active</Typography>
                                    <Typography>{new Date(selectedTenant.lastActive).toLocaleDateString()}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Suspend Dialog */}
            <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Suspend Tenant</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This will prevent the tenant from accessing their account.
                    </Alert>
                    <TextField
                        label="Reason for suspension"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSuspendDialogOpen(false)} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSuspend} 
                        variant="contained" 
                        color="warning"
                        disabled={actionLoading || !suspendReason}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Suspend'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Tenant</DialogTitle>
                <DialogContent>
                    <Alert severity="error">
                        This action cannot be undone. All data associated with this tenant will be permanently deleted.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        variant="contained" 
                        color="error"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
