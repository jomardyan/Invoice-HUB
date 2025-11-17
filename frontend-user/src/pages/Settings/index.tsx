import { Box, Typography, Paper, Tabs, Tab, Container, Stack, Divider } from '@mui/material';
import { useState } from 'react';
import AllegroSettings from './AllegroSettings';
import BaseLinkerSettings from './BaseLinkerSettings';
import ProfileSettings from './ProfileSettings';
import CompanySettings from './CompanySettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab label="Profile" />
          <Tab label="Company" />
          <Tab label="Integrations" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ProfileSettings />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CompanySettings />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Marketplace Integrations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Connect your marketplace accounts to automatically sync orders and generate invoices.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                Allegro Marketplace
              </Typography>
              <AllegroSettings />
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                BaseLinker
              </Typography>
              <BaseLinkerSettings />
            </Box>
          </Stack>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default Settings;

