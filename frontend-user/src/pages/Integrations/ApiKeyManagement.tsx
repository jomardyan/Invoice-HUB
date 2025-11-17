/**
 * API Keys Management Component
 * Allows users to generate and manage API keys for programmatic access
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Paper,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

function ApiKeyManagement() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [neverExpires, setNeverExpires] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState(90);
  
  // Visibility state
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      loadApiKeys();
    }
  }, [user?.tenantId]);

  const loadApiKeys = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Simulate API call - replace with actual API endpoint when backend is ready
      // const response = await axios.get(`/api/v1/api-keys/${user.tenantId}`);
      // setApiKeys(response.data);
      
      // Mock data for demonstration
      const mockKeys: ApiKey[] = [
        {
          id: '1',
          name: 'Production API',
          key: 'ihub_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
          prefix: 'ihub_live',
          lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
        {
          id: '2',
          name: 'Development API',
          key: 'ihub_test_xyz789abc012def345ghi678jkl901mno234pqr567stu890vwx123yz',
          prefix: 'ihub_test',
          lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
      ];
      setApiKeys(mockKeys);
    } catch (err: any) {
      console.error('Failed to load API keys:', err);
      setError('Failed to load API keys');
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!user?.tenantId || !name) {
      setError('Please provide a name for the API key');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Generate a random API key
      const prefix = 'ihub_live';
      const randomKey = Array.from({ length: 48 }, () =>
        '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]
      ).join('');
      const fullKey = `${prefix}_${randomKey}`;
      
      // Simulate API call - replace with actual API endpoint when backend is ready
      // const response = await axios.post(`/api/v1/api-keys/${user.tenantId}`, {
      //   name,
      //   expiresAt: neverExpires ? null : new Date(Date.now() + expiresInDays * 86400000),
      // });
      
      setNewApiKey(fullKey);
      setSuccess('API key created successfully. Make sure to copy it now - you won\'t be able to see it again!');
      setName('');
      
      // Add to the list
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name,
        key: fullKey,
        prefix,
        isActive: true,
        createdAt: new Date().toISOString(),
        expiresAt: neverExpires ? undefined : new Date(Date.now() + expiresInDays * 86400000).toISOString(),
      };
      setApiKeys((prev) => [newKey, ...prev]);
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      setError('Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (!user?.tenantId || !confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    setLoading(true);
    setError(null);
    try {
      // Simulate API call - replace with actual API endpoint when backend is ready
      // await axios.delete(`/api/v1/api-keys/${user.tenantId}/${apiKeyId}`);
      
      setApiKeys((prev) => prev.filter((k) => k.id !== apiKeyId));
      setSuccess('API key deleted successfully');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete API key:', err);
      setError('Failed to delete API key');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setNewApiKey(null);
    setName('');
    setNeverExpires(true);
    setExpiresInDays(90);
  };

  if (loading && apiKeys.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardHeader
          title="API Keys"
          subheader="Manage API keys for programmatic access to your account"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Generate API Key
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
            Keep your API keys secure. Don't share them in publicly accessible areas such as GitHub, client-side code, etc.
          </Alert>

          {apiKeys.length === 0 ? (
            <Alert severity="info">
              No API keys configured yet. Generate your first API key to access the Invoice-HUB API programmatically.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>API Key</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {apiKey.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created {formatDate(apiKey.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                          >
                            {visibleKeys.has(apiKey.id)
                              ? apiKey.key
                              : `${apiKey.prefix}_${'•'.repeat(48)}`}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? (
                              <VisibilityOffIcon fontSize="small" />
                            ) : (
                              <VisibilityIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          >
                            {copiedKey === apiKey.id ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <CopyIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatRelativeTime(apiKey.lastUsedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {apiKey.expiresAt ? (
                          <Tooltip title={`Expires on ${formatDate(apiKey.expiresAt)}`}>
                            <Chip
                              label={formatDate(apiKey.expiresAt)}
                              size="small"
                              color={new Date(apiKey.expiresAt) < new Date() ? 'error' : 'default'}
                            />
                          </Tooltip>
                        ) : (
                          <Chip label="Never" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {apiKey.isActive ? (
                          <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />
                        ) : (
                          <Chip label="Inactive" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New API Key</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {newApiKey ? (
            <Stack spacing={2}>
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Your API key has been generated successfully!
              </Alert>
              <Alert severity="warning" icon={<WarningIcon />}>
                <strong>Important:</strong> Copy this key now. You won't be able to see it again!
              </Alert>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Your API Key:
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      wordBreak: 'break-all',
                      flex: 1,
                    }}
                  >
                    {newApiKey}
                  </Typography>
                  <IconButton onClick={() => copyToClipboard(newApiKey, 'new')}>
                    {copiedKey === 'new' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <CopyIcon />
                    )}
                  </IconButton>
                </Paper>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <TextField
                label="API Key Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                placeholder="e.g., Production Server"
                helperText="A descriptive name to help you identify this key"
              />
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={neverExpires}
                      onChange={(e) => setNeverExpires(e.target.checked)}
                    />
                  }
                  label="Never expires"
                />
                {!neverExpires && (
                  <TextField
                    label="Expires in (days)"
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 90)}
                    fullWidth
                    sx={{ mt: 2 }}
                    inputProps={{ min: 1, max: 365 }}
                  />
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          {newApiKey ? (
            <Button onClick={closeDialog} variant="contained">
              Done
            </Button>
          ) : (
            <>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button
                onClick={handleCreateApiKey}
                variant="contained"
                disabled={loading || !name}
              >
                Generate Key
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ApiKeyManagement;
