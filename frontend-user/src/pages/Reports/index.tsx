import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { SalesReport } from './SalesReport';
import { JPKFAGenerator } from './JPKFAGenerator';
import { CustomerAnalytics } from './CustomerAnalytics';
import { AgingReport } from './AgingReport';

function Reports() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Reports & Analytics
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Sales Report" />
          <Tab label="Customer Analytics" />
          <Tab label="Aging Report" />
          <Tab label="JPK_FA (Polish VAT)" />
        </Tabs>
      </Box>

      {activeTab === 0 && <SalesReport />}
      {activeTab === 1 && <CustomerAnalytics />}
      {activeTab === 2 && <AgingReport />}
      {activeTab === 3 && <JPKFAGenerator />}
    </Box>
  );
}

export default Reports;
