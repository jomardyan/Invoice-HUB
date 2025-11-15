import { Box, Typography, Paper, Button, Tabs, Tab, Grid, TextField } from '@mui/material';
import { useState } from 'react';
import { Save } from '@mui/icons-material';

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

function Templates() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Templates
      </Typography>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Email Templates" />
          <Tab label="Invoice PDF Templates" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>
            Email Templates
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Invoice Email Template
              </Typography>
              <TextField
                label="Subject"
                defaultValue="Your invoice {invoiceNumber} from {companyName}"
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Message Body"
                defaultValue={`Hello {customerName},

Thank you for your business! Please find attached your invoice {invoiceNumber}.

Invoice Details:
- Invoice Number: {invoiceNumber}
- Issue Date: {issueDate}
- Due Date: {dueDate}
- Total Amount: {totalAmount} {currency}

If you have any questions, please don't hesitate to contact us.

Best regards,
{companyName}`}
                multiline
                rows={12}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained" startIcon={<Save />}>
                Save Template
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Invoice PDF Templates
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            PDF template customization coming soon. Currently using default invoice template.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Templates;
