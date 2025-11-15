import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useCreateInvoiceMutation } from '../../../../store/api/invoiceApi';
import { useGetCustomersQuery } from '../../../../store/api/customerApi';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { InvoiceFormData } from '../types';

interface PreviewStepProps {
  data: InvoiceFormData;
  onBack: () => void;
  onSubmit?: (status: 'draft' | 'sent') => Promise<void>;
  isEdit?: boolean;
}

function PreviewStep({ data, onBack, onSubmit, isEdit = false }: PreviewStepProps) {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [notes, setNotes] = useState(data.notes || '');
  const [terms, setTerms] = useState(data.terms || '');
  const [sendImmediately, setSendImmediately] = useState(false);

  const { data: customersData } = useGetCustomersQuery(
    { tenantId: tenant?.id || '', pageSize: 1000 },
    { skip: !tenant?.id }
  );

  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();

  const customer = customersData?.data.find((c) => c.id === data.customerId);

  const subtotal = data.items.reduce((sum, item) => sum + item.netAmount, 0);
  const totalVat = data.items.reduce((sum, item) => sum + item.vatAmount, 0);
  const total = data.items.reduce((sum, item) => sum + item.grossAmount, 0);

  const handleSubmit = async (saveAsDraft: boolean) => {
    try {
      const status = saveAsDraft ? 'draft' : 'sent';
      
      // If onSubmit is provided (for edit mode), use it
      if (onSubmit) {
        await onSubmit(status);
        return;
      }

      // Otherwise, create new invoice (create mode)
      const invoiceData = {
        ...data,
        notes,
        terms,
        subtotal,
        totalVat,
        totalAmount: total,
        status,
      };

      const invoice = await createInvoice({
        tenantId: tenant?.id || '',
        data: invoiceData,
      }).unwrap();

      if (saveAsDraft) {
        toast.success('Invoice saved as draft');
      } else {
        toast.success(sendImmediately ? 'Invoice created and sent' : 'Invoice created');
      }

      navigate(`/${tenant?.id}/invoices/view/${invoice.id}`);
    } catch {
      toast.error(isEdit ? 'Failed to update invoice' : 'Failed to create invoice');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Preview & Confirm Invoice
      </Typography>

      {/* Invoice Header Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              From (Seller)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {tenant?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tenant ID: {tenant?.id}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              To (Buyer)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {customer?.name}
            </Typography>
            {customer?.nip && (
              <Typography variant="body2" color="text.secondary">
                NIP: {customer.nip}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {customer?.email}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Invoice Type
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {data.invoiceType}
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Issue Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {format(new Date(data.issueDate), 'MMM dd, yyyy')}
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Due Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {format(new Date(data.dueDate), 'MMM dd, yyyy')}
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Payment Method
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {data.paymentMethod.replace('_', ' ')}
          </Typography>
        </Grid>
      </Grid>

      {/* Line Items */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Qty
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Unit Price
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                VAT %
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Net
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                VAT
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Gross
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">
                  {data.currency} {item.unitPrice.toFixed(2)}
                </TableCell>
                <TableCell align="right">{item.vatRate}%</TableCell>
                <TableCell align="right">
                  {data.currency} {item.netAmount.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  {data.currency} {item.vatAmount.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {data.currency} {item.grossAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box display="flex" justifyContent="flex-end" sx={{ mb: 3 }}>
        <Box sx={{ minWidth: 300 }}>
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography>Subtotal:</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {data.currency} {subtotal.toFixed(2)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography>VAT:</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {data.currency} {totalVat.toFixed(2)}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {data.currency} {total.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Notes and Terms */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Notes (Optional)"
            multiline
            rows={4}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or comments..."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Terms & Conditions (Optional)"
            multiline
            rows={4}
            fullWidth
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Add payment terms, return policy, etc..."
          />
        </Grid>
      </Grid>

      {/* Send Option */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
            />
          }
          label="Send invoice to customer immediately after creation"
        />
      </Alert>

      {/* Actions */}
      <Box display="flex" justifyContent="space-between">
        <Button onClick={onBack} size="large" disabled={creating}>
          Back
        </Button>
        <Box display="flex" gap={2}>
          <Button
            onClick={() => handleSubmit(true)}
            variant="outlined"
            size="large"
            disabled={creating}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            variant="contained"
            size="large"
            disabled={creating}
          >
            {creating ? (
              <CircularProgress size={24} />
            ) : sendImmediately ? (
              'Create & Send'
            ) : (
              'Create Invoice'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default PreviewStep;
