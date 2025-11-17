import { Box, Typography, Paper, Tabs, Tab, Container } from '@mui/material';
import { useState } from 'react';
import AllegroSettings from './AllegroSettings';
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
          <AllegroSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default Settings;

