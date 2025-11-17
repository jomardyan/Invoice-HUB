import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import DataTable from '../../components/organisms/DataTable';
import StatusBadge from '../../components/atoms/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { Column, Action } from '../../components/organisms/DataTable';

interface KSeFSubmission {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  ksefReferenceNumber?: string;
  status: string;
  submittedAt?: string;
  acceptedAt?: string;
  errorMessage?: string;
}

interface KSeFStats {
  totalSubmissions: number;
  pending: number;
  submitted: number;
  accepted: number;
  rejected: number;
  errors: number;
}

function KSeFDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [submissions] = useState<KSeFSubmission[]>([]);
  const [loading] = useState(false);
  const [total] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [stats] = useState<KSeFStats>({
    totalSubmissions: 0,
    pending: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
    errors: 0,
  });

  const handleConfigureKSeF = () => {
    navigate(`/${tenant?.id}/ksef/configure`);
  };

  const handleViewSubmission = (submission: KSeFSubmission) => {
    navigate(`/${tenant?.id}/ksef/submissions/${submission.id}`);
  };

  const handleRetrySubmission = async (submission: KSeFSubmission) => {
    try {
      toast.success('Submission retried');
    } catch (error) {
      toast.error('Failed to retry submission');
    }
  };

  const columns: Column<KSeFSubmission>[] = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      minWidth: 120,
      format: (v) => v || '-',
    },
    {
      id: 'ksefReferenceNumber',
      label: 'KSeF Reference',
      minWidth: 150,
      format: (v) => v || '-',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'submittedAt',
      label: 'Submitted',
      minWidth: 150,
      format: (value) =>
        value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '-',
    },
    {
      id: 'acceptedAt',
      label: 'Accepted',
      minWidth: 150,
      format: (value) =>
        value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '-',
    },
    {
      id: 'errorMessage',
      label: 'Error',
      minWidth: 200,
      format: (value) =>
        value ? (
          <Typography variant="caption" color="error" noWrap>
            {value}
          </Typography>
        ) : (
          '-'
        ),
    },
  ];

  const actions: Action<KSeFSubmission>[] = [
    {
      label: 'View',
      icon: <VisibilityIcon />,
      onClick: handleViewSubmission,
    },
    {
      label: 'Retry',
      icon: <SendIcon />,
      onClick: handleRetrySubmission,
      show: (row) => ['error', 'rejected'].includes(row.status),
      color: 'primary',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">KSeF Integration</Typography>
        <Button variant="contained" startIcon={<SettingsIcon />} onClick={handleConfigureKSeF}>
          Configure KSeF
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                  />
                }
                label="KSeF Integration Enabled"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSubmit}
                    onChange={(e) => setAutoSubmit(e.target.checked)}
                    disabled={!isEnabled}
                  />
                }
                label="Auto-submit Invoices"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                  <Typography variant="h5">{stats.totalSubmissions}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Accepted
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {stats.accepted}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {stats.pending}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Errors
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {stats.errors + stats.rejected}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Submissions
      </Typography>

      <DataTable
        columns={columns}
        data={submissions}
        actions={actions}
        isLoading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Box>
  );
}

export default KSeFDashboard;
