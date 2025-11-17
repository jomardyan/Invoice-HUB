import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import baselinkerService from '../../services/baselinkerService';
import type { BaseLinkerSettings, BaseLinkerIntegrationStatus } from '../../services/baselinkerService';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import KeyIcon from '@mui/icons-material/Key';

function BaseLinkerSettingsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<BaseLinkerIntegrationStatus[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<BaseLinkerSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [apiToken, setApiToken] = useState('');

  useEffect(() => {
    // Load integrations and settings
    if (user?.tenantId) {
      loadIntegrations();
    }
  }, [user?.tenantId]);

  const loadIntegrations = async () => {
    if (!user?.tenantId) {
      console.warn('Cannot load integrations: missing tenantId');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const fetchedIntegrations = await baselinkerService.getIntegrationsByTenant(user.tenantId);
      setIntegrations(fetchedIntegrations);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load integrations';
      setError(errorMessage);
      console.error('Failed to load integrations:', err);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async (integrationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedSettings = await baselinkerService.getSettings(integrationId);
      setIntegrationSettings(fetchedSettings);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load settings';
      setError(errorMessage);
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationSelect = (integrationId: string) => {
    setSelectedIntegration(integrationId);
    loadSettings(integrationId);
  };

  const handleSettingChange = (key: keyof BaseLinkerSettings, value: boolean | number | number[]) => {
    setIntegrationSettings((prev: BaseLinkerSettings) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!selectedIntegration) {
      setError('No integration selected');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await baselinkerService.updateSettings(selectedIntegration, integrationSettings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save settings';
      setError(errorMessage);
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!selectedIntegration) {
      setError('No integration selected');
      return;
    }
    
    if (!user?.tenantId) {
      setError('Missing tenant information');
      return;
    }

    setSyncLoading(true);
    setError(null);
    try {
      const result = await baselinkerService.triggerSync(
        selectedIntegration,
        user.companyId || '',
        user.tenantId
      );
      setSuccess(`Sync completed: ${result.invoicesCreated || 0} invoices created`);
      setTimeout(() => setSuccess(null), 3000);
      loadIntegrations(); // Refresh status
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to trigger sync';
      setError(errorMessage);
      console.error('Failed to trigger sync:', err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConnectSubmit = async () => {
    if (!user?.tenantId || !user?.id) {
      setError('Missing user information. Please log in again.');
      return;
    }

    if (!apiToken.trim()) {
      setError('Please enter your BaseLinker API token');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const integration = await baselinkerService.connect(user.tenantId, user.id, apiToken);
      setSuccess('BaseLinker connected successfully!');
      setOpenDialog(false);
      setApiToken('');
      await loadIntegrations();
      if (integration.id) {
        setSelectedIntegration(integration.id);
        loadSettings(integration.id);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to connect BaseLinker';
      setError(errorMessage);
      console.error('Failed to connect BaseLinker:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  if (loading && integrations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {/* Connection Status Card */}
      <Card>
        <CardHeader
          avatar={<LinkIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
          title="BaseLinker Connection"
          subheader="Connect your BaseLinker account to sync orders and manage settings"
        />
        <CardContent>
          <Stack spacing={2}>
            {integrations.length === 0 ? (
              <Alert severity="info">
                No BaseLinker integrations connected yet. Click below to connect your account.
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Connected Accounts
                </Typography>
                {integrations.map((integration) => (
                  <Button
                    key={integration.id}
                    variant={selectedIntegration === integration.id ? 'contained' : 'outlined'}
                    fullWidth
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    onClick={() => handleIntegrationSelect(integration.id)}
                  >
                    BaseLinker Integration
                    {integration.isActive ? ' ✓' : ' (Inactive)'}
                    {integration.lastSyncAt && ` - Last sync: ${formatDate(integration.lastSyncAt)}`}
                  </Button>
                ))}
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              fullWidth
              onClick={() => setOpenDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #0066CC 0%, #0088FF 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0055AA 0%, #0066CC 100%)',
                },
              }}
            >
              {integrations.length === 0 ? 'Connect BaseLinker Account' : 'Add Another Account'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Settings Card */}
      {selectedIntegration && (
        <Card>
          <CardHeader
            avatar={<SettingsIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
            title="Integration Settings"
            subheader="Configure how BaseLinker orders are processed"
          />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              {/* Auto-processing Settings */}
              <Typography variant="h6" gutterBottom>
                Auto-processing
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationSettings.autoGenerateInvoices ?? true}
                    onChange={(e) => handleSettingChange('autoGenerateInvoices', e.target.checked)}
                  />
                }
                label="Automatically generate invoices for new orders"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationSettings.autoCreateCustomer ?? true}
                    onChange={(e) => handleSettingChange('autoCreateCustomer', e.target.checked)}
                  />
                }
                label="Automatically create customers from orders"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationSettings.autoCreateProduct ?? true}
                    onChange={(e) => handleSettingChange('autoCreateProduct', e.target.checked)}
                  />
                }
                label="Automatically create products from orders"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationSettings.autoMarkAsPaid ?? false}
                    onChange={(e) => handleSettingChange('autoMarkAsPaid', e.target.checked)}
                  />
                }
                label="Automatically mark invoices as paid (if order is paid)"
              />

              <Divider sx={{ my: 2 }} />

              {/* Sync Configuration */}
              <Typography variant="h6" gutterBottom>
                Sync Configuration
              </Typography>
              
              <TextField
                label="Sync Frequency (minutes)"
                type="number"
                value={integrationSettings.syncFrequencyMinutes ?? 60}
                onChange={(e) => handleSettingChange('syncFrequencyMinutes', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                }}
                helperText="How often to automatically sync orders"
                fullWidth
              />
              
              <TextField
                label="Default VAT Rate"
                type="number"
                value={integrationSettings.defaultVatRate ?? 23}
                onChange={(e) => handleSettingChange('defaultVatRate', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Default VAT rate for products without tax information"
                fullWidth
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={syncLoading ? <CircularProgress size={20} /> : <SyncIcon />}
                onClick={handleSync}
                disabled={syncLoading}
              >
                Manual Sync
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Connect Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <KeyIcon />
            Connect BaseLinker Account
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              To connect BaseLinker, you'll need your API token. You can find it in your BaseLinker account under Settings → API.
            </Alert>
            
            <TextField
              label="API Token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              fullWidth
              placeholder="Enter your BaseLinker API token"
              helperText="Your API token will be encrypted and stored securely"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConnectSubmit}
            variant="contained"
            disabled={loading || !apiToken.trim()}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default BaseLinkerSettingsPage;
