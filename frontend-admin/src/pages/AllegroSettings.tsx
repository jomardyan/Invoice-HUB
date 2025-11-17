import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import adminService from '../services/adminService';
import {
  AllegroSettingsForm,
  AllegroStatusChip,
  formatAllegroDate,
  type AllegroIntegrationStatus,
  type AllegroSettings,
} from '../../../shared';

function AllegroAdminSettings() {
  const [integrations, setIntegrations] = useState<AllegroIntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<AllegroIntegrationStatus | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSettings, setEditingSettings] = useState<AllegroSettings>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      // TODO: Fetch integrations from API
      // For now using mock data for demonstration
      const data = await adminService.getAllAllegroIntegrations();
      setIntegrations(data.length > 0 ? data : [
        {
          id: 'integ-1',
          allegroUserId: 'test_seller_123',
          isActive: true,
          lastSyncAt: new Date('2025-11-17T10:30:00'),
          syncErrorCount: 0,
          lastSyncError: null,
          settings: {
            autoGenerateInvoices: true,
            syncFrequencyMinutes: 60,
            autoCreateCustomer: true,
            autoCreateProduct: true,
            autoMarkAsPaid: false,
            defaultVatRate: 23,
          },
        },
      ]);
    } catch (err) {
      console.error('Failed to load integrations:', err);
      // Fall back to mock data
      setIntegrations([
        {
          id: 'integ-1',
          allegroUserId: 'test_seller_123',
          isActive: true,
          lastSyncAt: new Date('2025-11-17T10:30:00'),
          syncErrorCount: 0,
          lastSyncError: null,
          settings: {
            autoGenerateInvoices: true,
            syncFrequencyMinutes: 60,
            autoCreateCustomer: true,
            autoCreateProduct: true,
            autoMarkAsPaid: false,
            defaultVatRate: 23,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (integration: AllegroIntegrationStatus) => {
    setSelectedIntegration(integration);
    setEditingSettings({ ...integration.settings });
    setOpenDialog(true);
  };

  const handleSaveSettings = async () => {
    console.log('Saving settings for', selectedIntegration?.id, editingSettings);
    setOpenDialog(false);
  };

  const handleRefreshSync = async (integrationId: string) => {
    console.log('Refreshing sync for', integrationId);
  };

  const handleSettingChange = (key: keyof AllegroSettings, value: boolean | number) => {
    setEditingSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Allegro Integrations
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadIntegrations}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Integrations
              </Typography>
              <Typography variant="h4">{integrations.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4">
                {integrations.filter((i) => i.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                With Errors
              </Typography>
              <Typography variant="h4">
                {integrations.filter((i) => i.syncErrorCount > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Last Sync
              </Typography>
              <Typography variant="body2">
                {integrations.length > 0
                  ? formatAllegroDate(integrations[0].lastSyncAt)
                  : 'Never'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Integrations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.lighter' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Allegro User ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Sync</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sync Errors</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {integrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No integrations configured yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              integrations.map((integration) => (
                <TableRow key={integration.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {integration.allegroUserId}
                    </Typography>
                  </TableCell>
                  <TableCell>{<AllegroStatusChip integration={integration} />}</TableCell>
                  <TableCell>{formatAllegroDate(integration.lastSyncAt)}</TableCell>
                  <TableCell>
                    {integration.syncErrorCount > 0 ? (
                      <Chip
                        label={`${integration.syncErrorCount} errors`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        0
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={() => handleEditClick(integration)}
                    >
                      Settings
                    </Button>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={() => handleRefreshSync(integration.id)}
                    >
                      Sync
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Settings Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            Integration Settings: {selectedIntegration?.allegroUserId}
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <AllegroSettingsForm
            settings={editingSettings}
            onSettingChange={handleSettingChange}
          />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Card */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Allegro Integration Management
        </Typography>
        <Typography variant="body2">
          Monitor and configure all Allegro marketplace integrations. Settings apply to all orders synced from
          this integration. Use the Sync button to manually trigger an order synchronization.
        </Typography>
      </Alert>
    </Stack>
  );
}

export default AllegroAdminSettings;
