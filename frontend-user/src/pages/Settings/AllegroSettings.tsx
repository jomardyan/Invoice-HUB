import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Switch,
  InputAdornment,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import allegroService from '../../services/allegroService';
import type { AllegroSettings } from '../../services/allegroService';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import SyncIcon from '@mui/icons-material/Sync';

function AllegroSettingsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<AllegroSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    // Load integrations and settings
    loadIntegrations();
  }, [user]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      if (!user?.tenantId) throw new Error('Missing tenant ID');
      const fetchedIntegrations = await allegroService.getIntegrationsByTenant(user.tenantId);
      setIntegrations(fetchedIntegrations);
      setError(null);
    } catch (err) {
      setError('Failed to load integrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async (integrationId: string) => {
    setLoading(true);
    try {
      const fetchedSettings = await allegroService.getSettings(integrationId);
      setIntegrationSettings(fetchedSettings);
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationSelect = (integrationId: string) => {
    setSelectedIntegration(integrationId);
    loadSettings(integrationId);
  };

  const handleSettingChange = (key: keyof AllegroSettings, value: any) => {
    setIntegrationSettings((prev: AllegroSettings) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!selectedIntegration) return;

    setSaving(true);
    try {
      await allegroService.updateSettings(selectedIntegration, integrationSettings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      setError(null);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!selectedIntegration || !user?.tenantId) return;

    setSyncLoading(true);
    try {
      const result = await allegroService.triggerSync(
        selectedIntegration,
        user.companyId || '',
        user.tenantId
      );
      setSuccess(`Sync completed: ${result.invoicesCreated} invoices created`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to trigger sync');
      console.error(err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConnectClick = async () => {
    try {
      if (!user?.tenantId) throw new Error('Missing tenant ID');
      const authUrl = await allegroService.getAuthorizationUrl(user.tenantId);
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate Allegro connection');
      console.error(err);
    }
  };

  if (loading) {
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
          title="Allegro Marketplace Connection"
          subheader="Connect your Allegro account to sync orders and manage settings"
        />
        <CardContent>
          <Stack spacing={2}>
            {integrations.length === 0 ? (
              <Alert severity="info">
                No Allegro integrations connected yet. Click below to connect your account.
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
                    {integration.allegroUserId}
                    {integration.isActive ? ' ✓' : ' (Inactive)'}
                  </Button>
                ))}
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              fullWidth
              onClick={handleConnectClick}
              sx={{
                background: 'linear-gradient(135deg, #FF6B00 0%, #FF8533 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #E55A00 0%, #FF6B00 100%)',
                },
              }}
            >
              {integrations.length === 0 ? 'Connect Allegro Account' : 'Add Another Account'}
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
            subheader="Configure how Allegro orders are processed"
          />
          <Divider />
          <CardContent>
            <Stack spacing={3}>
              {/* Auto-Generation Settings */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon sx={{ fontSize: 20 }} />
                  Automatic Processing
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={integrationSettings.autoGenerateInvoices ?? true}
                        onChange={(e) =>
                          handleSettingChange('autoGenerateInvoices', e.target.checked)
                        }
                      />
                    }
                    label="Automatically generate invoices from orders"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    When enabled, invoices will be created automatically when orders are synced
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={integrationSettings.autoCreateCustomer ?? true}
                        onChange={(e) =>
                          handleSettingChange('autoCreateCustomer', e.target.checked)
                        }
                      />
                    }
                    label="Automatically create customers"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Create customer records from Allegro buyers
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={integrationSettings.autoCreateProduct ?? true}
                        onChange={(e) =>
                          handleSettingChange('autoCreateProduct', e.target.checked)
                        }
                      />
                    }
                    label="Automatically create products"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Create product records from Allegro offers
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={integrationSettings.autoMarkAsPaid ?? false}
                        onChange={(e) => handleSettingChange('autoMarkAsPaid', e.target.checked)}
                      />
                    }
                    label="Automatically mark invoices as paid"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Mark generated invoices as paid if payment is confirmed
                  </Typography>
                </FormGroup>
              </Box>

              <Divider />

              {/* Sync Settings */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SyncIcon sx={{ fontSize: 20 }} />
                  Sync Configuration
                </Typography>
                <FormGroup>
                  <TextField
                    label="Sync Frequency"
                    type="number"
                    value={integrationSettings.syncFrequencyMinutes ?? 60}
                    onChange={(e) =>
                      handleSettingChange('syncFrequencyMinutes', parseInt(e.target.value))
                    }
                    InputProps={{
                      endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                    }}
                    sx={{ mb: 2 }}
                    helperText="How often to automatically sync orders with Allegro"
                  />

                  <TextField
                    label="Default VAT Rate"
                    type="number"
                    value={integrationSettings.defaultVatRate ?? 23}
                    onChange={(e) => handleSettingChange('defaultVatRate', parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{ mb: 2 }}
                    helperText="Default VAT rate for products created from Allegro offers"
                  />
                </FormGroup>
              </Box>

              <Divider />

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={syncLoading ? <CircularProgress size={20} /> : <SyncIcon />}
                  onClick={handleSync}
                  disabled={syncLoading}
                  fullWidth
                >
                  {syncLoading ? 'Syncing...' : 'Manual Sync Now'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Documentation Card */}
      <Card sx={{ bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            📚 About Allegro Integration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This integration connects your Invoice-HUB with Allegro marketplace. Orders from your Allegro
            store will be automatically synced, and invoices can be generated automatically. Configure the
            settings above to customize how orders are processed.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default AllegroSettingsPage;
