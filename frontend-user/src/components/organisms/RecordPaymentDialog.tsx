import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Autocomplete,
  Box,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePaymentMutation } from '../../store/api/paymentApi';
import { useGetInvoicesQuery } from '../../store/api/invoiceApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Invoice } from '../../types';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Please select an invoice'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'card', 'online', 'other']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedInvoiceId?: string;
}

function RecordPaymentDialog({ open, onClose, preselectedInvoiceId }: RecordPaymentDialogProps) {
  const { tenant } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoicesData, isLoading: loadingInvoices } = useGetInvoicesQuery(
    {
      tenantId: tenant?.id || '',
      status: 'sent,overdue,partially_paid',
    },
    { skip: !tenant?.id || !open }
  );

  const [createPayment, { isLoading: creatingPayment }] = useCreatePaymentMutation();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: preselectedInvoiceId || '',
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      notes: '',
    },
  });

  const watchedInvoiceId = watch('invoiceId');

  // Update selected invoice when invoiceId changes
  useEffect(() => {
    if (invoicesData && watchedInvoiceId) {
      const invoice = invoicesData.data.find((inv) => inv.id === watchedInvoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        const outstanding = invoice.totalAmount - invoice.paidAmount;
        setValue('amount', outstanding);
      }
    }
  }, [watchedInvoiceId, invoicesData, setValue]);

  // Set preselected invoice
  useEffect(() => {
    if (preselectedInvoiceId && open) {
      setValue('invoiceId', preselectedInvoiceId);
    }
  }, [preselectedInvoiceId, open, setValue]);

  const handleClose = () => {
    reset();
    setSelectedInvoice(null);
    onClose();
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await createPayment({
        tenantId: tenant?.id || '',
        data,
      }).unwrap();

      toast.success('Payment recorded successfully');
      handleClose();
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'online', label: 'Online Payment' },
    { value: 'other', label: 'Other' },
  ];

  const outstandingAmount = selectedInvoice
    ? selectedInvoice.totalAmount - selectedInvoice.paidAmount
    : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Invoice Selection */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="invoiceId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={invoicesData?.data || []}
                    loading={loadingInvoices}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option
                        : `${option.invoiceNumber} - ${option.customer?.name} (${option.currency} ${option.totalAmount.toFixed(2)})`
                    }
                    value={
                      invoicesData?.data.find((inv) => inv.id === field.value) || null
                    }
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Invoice"
                        error={!!errors.invoiceId}
                        helperText={errors.invoiceId?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingInvoices ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Outstanding Amount Display */}
            {selectedInvoice && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  <Box>
                    <Typography variant="body2">
                      <strong>Invoice Total:</strong> {selectedInvoice.currency}{' '}
                      {selectedInvoice.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Paid:</strong> {selectedInvoice.currency}{' '}
                      {selectedInvoice.paidAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      <strong>Outstanding:</strong> {selectedInvoice.currency}{' '}
                      {outstandingAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Alert>
              </Grid>
            )}

            {/* Payment Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Payment Date"
                    type="date"
                    fullWidth
                    error={!!errors.paymentDate}
                    helperText={errors.paymentDate?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {/* Amount */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Amount"
                    type="number"
                    fullWidth
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                )}
              />
            </Grid>

            {/* Payment Method */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Payment Method"
                    fullWidth
                    error={!!errors.paymentMethod}
                    helperText={errors.paymentMethod?.message}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Reference Number */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="referenceNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Reference Number (Optional)"
                    fullWidth
                    error={!!errors.referenceNumber}
                    helperText={errors.referenceNumber?.message}
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creatingPayment}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={creatingPayment}>
            {creatingPayment ? <CircularProgress size={24} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default RecordPaymentDialog;
