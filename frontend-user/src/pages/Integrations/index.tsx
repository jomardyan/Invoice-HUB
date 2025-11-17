import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import AllegroSettings from '../Settings/AllegroSettings';
import WebhookManagement from './WebhookManagement';
import ApiKeyManagement from './ApiKeyManagement';

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

function Integrations() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Integrations
      </Typography>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Allegro" />
          <Tab label="Webhooks" />
          <Tab label="API Keys" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <AllegroSettings />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <WebhookManagement />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <ApiKeyManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Integrations;
