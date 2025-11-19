/**
 * Webhook Management Component
 * Allows users to create, view, and manage webhooks for their tenant
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
  FormGroup,
  FormControlLabel,
  Checkbox,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

enum WebhookEvent {
  INVOICE_CREATED = 'invoice.created',
  INVOICE_UPDATED = 'invoice.updated',
  INVOICE_SENT = 'invoice.sent',
  INVOICE_VIEWED = 'invoice.viewed',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_OVERDUE = 'invoice.overdue',
  INVOICE_CANCELLED = 'invoice.cancelled',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
}

enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  secret: string;
  description?: string;
  successCount: number;
  failureCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

function WebhookManagement() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      loadWebhooks();
    }
  }, [user?.tenantId]);

  const loadWebhooks = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    setError(null);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/webhooks/${user.tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhooks(response.data);
    } catch (err: any) {
      console.error('Failed to load webhooks:', err);
      setError(err.response?.data?.error || 'Failed to load webhooks');
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!user?.tenantId || !url || selectedEvents.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE_URL}/webhooks/${user.tenantId}`,
        { url, events: selectedEvents, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Webhook created successfully');
      setOpenDialog(false);
      setUrl('');
      setDescription('');
      setSelectedEvents([]);
      loadWebhooks();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to create webhook:', err);
      setError(err.response?.data?.error || 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!user?.tenantId || !confirm('Are you sure you want to delete this webhook?')) return;

    setLoading(true);
    setError(null);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/webhooks/${user.tenantId}/${webhookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSuccess('Webhook deleted successfully');
      loadWebhooks();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete webhook:', err);
      setError(err.response?.data?.error || 'Failed to delete webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(id);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const getStatusChip = (status: WebhookStatus) => {
    switch (status) {
      case WebhookStatus.ACTIVE:
        return <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />;
      case WebhookStatus.INACTIVE:
        return <Chip icon={<PauseIcon />} label="Inactive" color="default" size="small" />;
      case WebhookStatus.SUSPENDED:
        return <Chip icon={<ErrorIcon />} label="Suspended" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading && webhooks.length === 0) {
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
          title="Webhook Management"
          subheader="Configure webhooks to receive real-time event notifications"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Webhook
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {webhooks.length === 0 ? (
            <Alert severity="info">
              No webhooks configured yet. Create your first webhook to start receiving event notifications.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell>Events</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Success</TableCell>
                    <TableCell align="center">Failures</TableCell>
                    <TableCell>Secret</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <Tooltip title={webhook.description || ''}>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {webhook.url}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {webhook.events.length} events
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(webhook.status)}</TableCell>
                      <TableCell align="center">{webhook.successCount}</TableCell>
                      <TableCell align="center">
                        {webhook.failureCount > 0 ? (
                          <Chip label={webhook.failureCount} color="error" size="small" />
                        ) : (
                          webhook.failureCount
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {webhook.secret.substring(0, 10)}...
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(webhook.secret, webhook.id)}
                          >
                            {copiedSecret === webhook.id ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <CopyIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteWebhook(webhook.id)}
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

      {/* Create Webhook Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Webhook</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Webhook URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              required
              placeholder="https://your-domain.com/webhooks"
              helperText="The URL where webhook events will be sent"
            />
            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., Production webhook for invoice events"
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Select Events *
              </Typography>
              <FormGroup>
                {Object.values(WebhookEvent).map((event) => (
                  <FormControlLabel
                    key={event}
                    control={
                      <Checkbox
                        checked={selectedEvents.includes(event)}
                        onChange={() => handleToggleEvent(event)}
                      />
                    }
                    label={event}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWebhook}
            variant="contained"
            disabled={loading || !url || selectedEvents.length === 0}
          >
            Create Webhook
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WebhookManagement;
