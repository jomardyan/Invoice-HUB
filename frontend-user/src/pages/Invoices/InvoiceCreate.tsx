import { Box, Typography, Paper } from '@mui/material';

function InvoiceCreate() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Create Invoice
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Invoice creation form coming soon...</Typography>
      </Paper>
    </Box>
  );
}

export default InvoiceCreate;
