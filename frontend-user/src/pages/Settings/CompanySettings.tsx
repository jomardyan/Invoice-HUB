import React from 'react';
import { Box, Card, CardContent, CardHeader, Stack, Alert } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

function CompanySettings() {
  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          avatar={<BusinessIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
          title="Company Settings"
          subheader="Configure your company information and preferences"
        />
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Company settings feature coming soon. You can manage company details from the admin dashboard.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default CompanySettings;
