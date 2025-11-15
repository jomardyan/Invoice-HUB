import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid2,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import adminService from '../services/adminService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  lastCheck: string;
  responseTime: number;
}

interface PerformanceMetric {
  endpoint: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  service: string;
  message: string;
  stack?: string;
}

interface ResourceUsage {
  cpu: {
    current: number;
    average: number;
    peak: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    size: number;
    slowQueries: number;
  };
}

function SystemMonitoring() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [resources, setResources] = useState<ResourceUsage | null>(null);

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthData, performanceData, errorData, resourceData] = await Promise.all([
        adminService.getServiceHealth(),
        adminService.getPerformanceMetrics(),
        adminService.getErrorLogs(),
        adminService.getResourceUsage(),
      ]);

      setServices(healthData);
      setPerformanceMetrics(performanceData);
      setErrorLogs(errorData);
      setResources(resourceData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleOutline />;
      case 'degraded':
        return <WarningAmberOutlined />;
      case 'down':
        return <ErrorOutline />;
      default:
        return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading monitoring data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={loadMonitoringData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          System Monitoring
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={loadMonitoringData}
        >
          Refresh
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Service Health" />
        <Tab label="Performance" />
        <Tab label="Error Logs" />
        <Tab label="Resources" />
      </Tabs>

      {/* Service Health Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid2 container spacing={3}>
            {services.map((service) => (
              <Grid2 size={{ xs: 12, md: 6 }} key={service.name}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{service.name}</Typography>
                      <Chip
                        icon={getStatusIcon(service.status)}
                        label={service.status}
                        color={getStatusColor(service.status)}
                        size="small"
                      />
                    </Box>
                    <Grid2 container spacing={2}>
                      <Grid2 size={6}>
                        <Typography variant="body2" color="text.secondary">
                          Uptime
                        </Typography>
                        <Typography variant="h6">{service.uptime}%</Typography>
                      </Grid2>
                      <Grid2 size={6}>
                        <Typography variant="body2" color="text.secondary">
                          Response Time
                        </Typography>
                        <Typography variant="h6">{service.responseTime}ms</Typography>
                      </Grid2>
                      <Grid2 size={12}>
                        <Typography variant="body2" color="text.secondary">
                          Last Check
                        </Typography>
                        <Typography variant="body2">
                          {new Date(service.lastCheck).toLocaleString()}
                        </Typography>
                      </Grid2>
                    </Grid2>
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        </Box>
      )}

      {/* Performance Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, lg: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Response Times
                  </Typography>
                  <Line
                    data={{
                      labels: performanceMetrics.map((m) => m.endpoint),
                      datasets: [
                        {
                          label: 'Average Response Time (ms)',
                          data: performanceMetrics.map((m) => m.avgResponseTime),
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.2)',
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Request Volume
                  </Typography>
                  <Bar
                    data={{
                      labels: performanceMetrics.map((m) => m.endpoint),
                      datasets: [
                        {
                          label: 'Total Requests',
                          data: performanceMetrics.map((m) => m.requestCount),
                          backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Endpoint</TableCell>
                          <TableCell align="right">Avg Response Time</TableCell>
                          <TableCell align="right">Request Count</TableCell>
                          <TableCell align="right">Error Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {performanceMetrics.map((metric) => (
                          <TableRow key={metric.endpoint}>
                            <TableCell component="th" scope="row">
                              {metric.endpoint}
                            </TableCell>
                            <TableCell align="right">{metric.avgResponseTime}ms</TableCell>
                            <TableCell align="right">{metric.requestCount.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${metric.errorRate}%`}
                                color={metric.errorRate > 1 ? 'error' : 'success'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>
        </Box>
      )}

      {/* Error Logs Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Errors
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No error logs found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    errorLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip label={log.level} color={getLevelColor(log.level)} size="small" />
                        </TableCell>
                        <TableCell>{log.service}</TableCell>
                        <TableCell>{log.message}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Resources Tab */}
      {activeTab === 3 && resources && (
        <Grid2 container spacing={3}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  CPU Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Current</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {resources.cpu.current}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={resources.cpu.current}
                    color={resources.cpu.current > 80 ? 'error' : 'primary'}
                  />
                </Box>
                <Grid2 container spacing={2}>
                  <Grid2 size={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average
                    </Typography>
                    <Typography variant="h6">{resources.cpu.average}%</Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography variant="body2" color="text.secondary">
                      Peak
                    </Typography>
                    <Typography variant="h6">{resources.cpu.peak}%</Typography>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Memory Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {formatBytes(resources.memory.used)} / {formatBytes(resources.memory.total)}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {resources.memory.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={resources.memory.percentage}
                    color={resources.memory.percentage > 80 ? 'error' : 'primary'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {formatBytes(resources.storage.used)} / {formatBytes(resources.storage.total)}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {resources.storage.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={resources.storage.percentage}
                    color={resources.storage.percentage > 80 ? 'warning' : 'primary'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Database
                </Typography>
                <Grid2 container spacing={2}>
                  <Grid2 size={6}>
                    <Typography variant="body2" color="text.secondary">
                      Connections
                    </Typography>
                    <Typography variant="h6">
                      {resources.database.connections} / {resources.database.maxConnections}
                    </Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography variant="body2" color="text.secondary">
                      Size
                    </Typography>
                    <Typography variant="h6">{formatBytes(resources.database.size)}</Typography>
                  </Grid2>
                  <Grid2 size={12}>
                    <Typography variant="body2" color="text.secondary">
                      Slow Queries
                    </Typography>
                    <Typography variant="h6">
                      <Chip
                        label={resources.database.slowQueries}
                        color={resources.database.slowQueries > 5 ? 'warning' : 'success'}
                        size="small"
                      />
                    </Typography>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      )}
    </Box>
  );
}

export default SystemMonitoring;
