import { Box, Typography, Paper } from '@mui/material';

function Settings() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Settings page coming soon...</Typography>
      </Paper>
    </Box>
  );
}

export default Settings;
