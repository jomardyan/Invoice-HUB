import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

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
          <Typography variant="h6" gutterBottom>
            Allegro Integration
          </Typography>
          <Typography color="text.secondary">
            Connect to Allegro marketplace to sync orders and auto-generate invoices
          </Typography>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Webhook Management
          </Typography>
          <Typography color="text.secondary">
            Configure webhooks for external integrations
          </Typography>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>
            API Keys
          </Typography>
          <Typography color="text.secondary">
            Manage API keys for external access
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Integrations;
