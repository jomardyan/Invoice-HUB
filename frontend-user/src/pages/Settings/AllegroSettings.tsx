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
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import allegroService from '../../services/allegroService';
import type { AllegroSettings, AllegroIntegrationStatus } from '../../services/allegroService';
import {
  AllegroSettingsForm,
  formatAllegroDate,
} from '../../../../shared';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';

function AllegroSettingsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<AllegroIntegrationStatus[]>([]);
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
      const fetchedIntegrations = await allegroService.getIntegrationsByTenant(user.tenantId);
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
      const fetchedSettings = await allegroService.getSettings(integrationId);
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

  const handleSettingChange = (key: keyof AllegroSettings, value: boolean | number) => {
    setIntegrationSettings((prev: AllegroSettings) => ({
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
      await allegroService.updateSettings(selectedIntegration, integrationSettings);
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
      const result = await allegroService.triggerSync(
        selectedIntegration,
        user.companyId || '',
        user.tenantId
      );
      setSuccess(`Sync completed: ${result.invoicesCreated || 0} invoices created`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to trigger sync';
      setError(errorMessage);
      console.error('Failed to trigger sync:', err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConnectClick = async () => {
    if (!user?.tenantId) {
      setError('Missing tenant information. Please log in again.');
      return;
    }
    
    setError(null);
    try {
      const authUrl = await allegroService.getAuthorizationUrl(user.tenantId);
      window.location.href = authUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate Allegro connection';
      setError(errorMessage);
      console.error('Failed to initiate Allegro connection:', err);
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
            <AllegroSettingsForm
              settings={integrationSettings}
              onSettingChange={handleSettingChange}
            />

            <Divider sx={{ my: 3 }} />

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
