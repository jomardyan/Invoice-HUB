import { useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../../hooks/useAuth';
import { addDays } from 'date-fns';
import type { InvoiceFormData } from '../types';

const companyStepSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  invoiceType: z.enum(['vat', 'proforma', 'corrective']),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'card', 'online', 'other']),
  currency: z.string().min(1, 'Currency is required'),
});

type CompanyStepData = z.infer<typeof companyStepSchema>;

interface CompanyStepProps {
  data: InvoiceFormData;
  onNext: () => void;
  onUpdate: (data: Partial<InvoiceFormData>) => void;
}

function CompanyStep({ data, onNext, onUpdate }: CompanyStepProps) {
  const { tenant } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyStepData>({
    resolver: zodResolver(companyStepSchema),
    defaultValues: {
      companyId: data.companyId || tenant?.id || '',
      invoiceType: data.invoiceType || 'vat',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || addDays(new Date(), 14).toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'bank_transfer',
      currency: data.currency || 'PLN',
    },
  });

  const watchIssueDate = watch('issueDate');

  // Auto-calculate due date (14 days from issue date)
  useEffect(() => {
    if (watchIssueDate) {
      const issueDate = new Date(watchIssueDate);
      const dueDate = addDays(issueDate, 14);
      setValue('dueDate', dueDate.toISOString().split('T')[0]);
    }
  }, [watchIssueDate, setValue]);

  const onSubmit = (formData: CompanyStepData) => {
    onUpdate(formData);
    onNext();
  };

  const invoiceTypes = [
    { value: 'vat', label: 'VAT Invoice' },
    { value: 'proforma', label: 'Proforma Invoice' },
    { value: 'corrective', label: 'Corrective Invoice' },
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'online', label: 'Online Payment' },
    { value: 'other', label: 'Other' },
  ];

  if (!tenant) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Company & Invoice Details
        </Typography>

        {/* Company Info Display */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Issuing Company
          </Typography>
          <Typography variant="body2">
            {tenant.name || 'Company Name'}
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Hidden company ID field */}
          <Controller
            name="companyId"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />

          {/* Invoice Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="invoiceType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Invoice Type"
                  fullWidth
                  error={!!errors.invoiceType}
                  helperText={errors.invoiceType?.message}
                >
                  {invoiceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Currency */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Currency"
                  fullWidth
                  error={!!errors.currency}
                  helperText={errors.currency?.message}
                  disabled
                />
              )}
            />
          </Grid>

          {/* Issue Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="issueDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issue Date"
                  type="date"
                  fullWidth
                  error={!!errors.issueDate}
                  helperText={errors.issueDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          {/* Due Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Due Date"
                  type="date"
                  fullWidth
                  error={!!errors.dueDate}
                  helperText={errors.dueDate?.message}
                  InputLabelProps={{ shrink: true }}
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
        </Grid>

        {/* Actions */}
        <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 4 }}>
          <Button type="submit" variant="contained" size="large">
            Next: Select Customer
          </Button>
        </Box>
      </Box>
    </form>
  );
}

export default CompanyStep;
