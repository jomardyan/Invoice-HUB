import { Box, Typography, Paper, Tabs, Tab, Grid, TextField, Button, Avatar, Divider } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const { user, tenant } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Company" />
          <Tab label="Profile" />
          <Tab label="Team" />
          <Tab label="Billing" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>
            Company Settings
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Company Name" defaultValue={tenant?.name} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Tax ID (NIP)" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Phone" fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Address" fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained">Save Changes</Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Profile Settings
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Button variant="outlined">Change Photo</Button>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="First Name" defaultValue={user?.firstName} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Last Name" defaultValue={user?.lastName} fullWidth />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Email" defaultValue={user?.email} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Change Password
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Current Password" type="password" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="New Password" type="password" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Confirm Password" type="password" fullWidth />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="contained">Update Profile</Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>
            Team Management
          </Typography>
          <Typography color="text.secondary">
            Invite team members and manage roles (coming soon)
          </Typography>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <Typography variant="h6" gutterBottom>
            Billing & Subscription
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Current Plan:</strong> {tenant?.subscriptionTier || 'Free'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Status:</strong> {tenant?.subscriptionStatus || 'Active'}
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              Upgrade Plan
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Settings;
