import { Box, Typography, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AddIcon from '@mui/icons-material/Add';
import StatCard from '../../components/atoms/StatCard';
import RevenueChart from '../../components/molecules/RevenueChart';
import InvoiceStatusChart from '../../components/molecules/InvoiceStatusChart';
import ActivityFeed from '../../components/molecules/ActivityFeed';
import { useGetDashboardStatsQuery, useGetRevenueChartQuery } from '../../store/api/dashboardApi';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { t } = useTranslation();
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery(
    tenant?.id || '',
    { skip: !tenant?.id }
  );

  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueChartQuery(
    { tenantId: tenant?.id || '', period: '12months' },
    { skip: !tenant?.id }
  );

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const handleCreateInvoice = () => {
    navigate(`/${tenant?.id}/invoices/create`);
  };

  const revenueChange = stats?.revenue.percentageChange || 0;
  const isRevenuePositive = revenueChange >= 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('dashboard.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateInvoice}
          size="large"
        >
          {t('invoice.createInvoice')}
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Revenue This Month"
            value={`PLN ${stats?.revenue.currentMonth.toLocaleString() || 0}`}
            change={`${isRevenuePositive ? '+' : ''}${revenueChange.toFixed(1)}%`}
            isPositive={isRevenuePositive}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Invoices"
            value={stats?.invoices.total || 0}
            change={`${stats?.invoices.draft || 0} drafts`}
            icon={<DescriptionIcon sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Customers"
            value={stats?.customers.total || 0}
            change={`+${stats?.customers.newThisMonth || 0} this month`}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Outstanding"
            value={`PLN ${stats?.outstanding.amount.toLocaleString() || 0}`}
            change={`${stats?.outstanding.count || 0} invoices`}
            isPositive={false}
            icon={<MoneyOffIcon sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RevenueChart data={revenueData || { labels: [], datasets: [] }} isLoading={revenueLoading} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InvoiceStatusChart data={stats?.invoices || { draft: 0, sent: 0, paid: 0, overdue: 0 }} />
        </Grid>
      </Grid>

      {/* Activity Feed */}
      <ActivityFeed activities={stats?.recentActivity || []} />
    </Box>
  );
}

export default Dashboard;
