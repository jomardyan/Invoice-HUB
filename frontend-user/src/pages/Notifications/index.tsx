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

function Notifications() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Notifications
      </Typography>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="All Notifications" />
          <Tab label="Unread" />
          <Tab label="Settings" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography color="text.secondary">
            All notifications will appear here
          </Typography>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography color="text.secondary">
            Unread notifications
          </Typography>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography color="text.secondary">
            Notification preferences and settings
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Notifications;
