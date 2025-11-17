import React from 'react';
import { Box, Card, CardContent, CardHeader, Stack, TextField, Button, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

function ProfileSettings() {
  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          avatar={<PersonIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
          title="Profile Information"
          subheader="Manage your personal account details"
        />
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Profile settings feature coming soon. You can manage your profile from your account settings.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default ProfileSettings;
