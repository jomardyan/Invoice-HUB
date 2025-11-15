import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import { useState } from 'react';
import { ArrowBack, Edit, Business, Person } from '@mui/icons-material';
import { useGetCustomerByIdQuery } from '../../store/api/customerApi';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { data: customer, isLoading } = useGetCustomerByIdQuery(id!);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!customer) {
    return <Typography>Customer not found</Typography>;
  }

  const getInitials = () => {
    return customer.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="flex-start" gap={3}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: customer.type === 'company' ? 'primary.main' : 'secondary.main',
              fontSize: '2rem',
            }}
          >
            {customer.type === 'company' ? <Business sx={{ fontSize: 40 }} /> : getInitials()}
          </Avatar>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h4" fontWeight={700}>
                {customer.name}
              </Typography>
              <Chip
                size="small"
                icon={customer.type === 'company' ? <Business /> : <Person />}
                label={customer.type === 'company' ? 'Company' : 'Individual'}
                color={customer.type === 'company' ? 'primary' : 'secondary'}
              />
              <Chip
                size="small"
                label={customer.isActive ? 'Active' : 'Inactive'}
                color={customer.isActive ? 'success' : 'default'}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customer ID: {customer.id}
            </Typography>
            
            <Box display="flex" gap={2} mt={2}>
              <Button variant="contained" startIcon={<Edit />}>
                Edit Customer
              </Button>
              <Button variant="outlined">Create Invoice</Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Invoices" />
          <Tab label="Payments" />
          <Tab label="Activity" />
        </Tabs>

        <Box sx={{ px: 3 }}>
          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <List>
                  {customer.email && (
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={customer.email}
                      />
                    </ListItem>
                  )}
                  {customer.phone && (
                    <ListItem>
                      <ListItemText
                        primary="Phone"
                        secondary={customer.phone}
                      />
                    </ListItem>
                  )}
                  {customer.nip && (
                    <ListItem>
                      <ListItemText
                        primary="Tax ID (NIP)"
                        secondary={customer.nip}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Street Address"
                      secondary={customer.address || 'Not provided'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="City"
                      secondary={customer.city || 'Not provided'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Postal Code"
                      secondary={customer.postalCode || 'Not provided'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Country"
                      secondary={customer.country || 'Not provided'}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Customer Since
                    </Typography>
                    <Typography>
                      {format(new Date(customer.createdAt), 'MMMM d, yyyy')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography>
                      {format(new Date(customer.updatedAt), 'MMMM d, yyyy')}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography color="text.secondary">
              Customer invoices will be listed here
            </Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography color="text.secondary">
              Payment history will be displayed here
            </Typography>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Typography color="text.secondary">
              Activity timeline will be shown here
            </Typography>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

export default CustomerDetail;
