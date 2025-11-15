import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetCustomersQuery, useCreateCustomerMutation } from '../../../../store/api/customerApi';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { InvoiceFormData } from '../types';

const customerStepSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
});

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  nip: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  customerType: z.enum(['individual', 'company']),
});

type CustomerStepData = z.infer<typeof customerStepSchema>;
type CreateCustomerData = z.infer<typeof createCustomerSchema>;

interface CustomerStepProps {
  data: InvoiceFormData;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: Partial<InvoiceFormData>) => void;
}

function CustomerStep({ data, onNext, onBack, onUpdate }: CustomerStepProps) {
  const { tenant } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: customersData, isLoading: loadingCustomers } = useGetCustomersQuery(
    { tenantId: tenant?.id || '', pageSize: 1000 },
    { skip: !tenant?.id }
  );

  const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerStepData>({
    resolver: zodResolver(customerStepSchema),
    defaultValues: {
      customerId: data.customerId || '',
    },
  });

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors },
  } = useForm<CreateCustomerData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      nip: '',
      address: '',
      city: '',
      postalCode: '',
      customerType: 'company',
    },
  });

  const onSubmit = (formData: CustomerStepData) => {
    onUpdate(formData);
    onNext();
  };

  const handleCreateCustomer = async (formData: CreateCustomerData) => {
    try {
      const newCustomer = await createCustomer({
        tenantId: tenant?.id || '',
        data: { ...formData, country: 'Poland' },
      }).unwrap();

      toast.success('Customer created successfully');
      setValue('customerId', newCustomer.id);
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch {
      toast.error('Failed to create customer');
    }
  };

  const selectedCustomer = customersData?.data.find((c) => c.id === data.customerId);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">
              Select Customer
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => setCreateDialogOpen(true)}
            >
              Add New Customer
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Customer Selection */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={customersData?.data || []}
                    loading={loadingCustomers}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option
                        : `${option.name}${option.nip ? ` | NIP: ${option.nip}` : ''}`
                    }
                    value={
                      customersData?.data.find((c) => c.id === field.value) || null
                    }
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search and select customer"
                        error={!!errors.customerId}
                        helperText={errors.customerId?.message}
                        placeholder="Type customer name or NIP..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingCustomers ? (
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

            {/* Selected Customer Info */}
            {selectedCustomer && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="success">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Selected Customer
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedCustomer.name}
                  </Typography>
                  {selectedCustomer.nip && (
                    <Typography variant="body2">
                      <strong>NIP:</strong> {selectedCustomer.nip}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedCustomer.email}
                  </Typography>
                  {selectedCustomer.address && (
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedCustomer.address}, {selectedCustomer.postalCode} {selectedCustomer.city}
                    </Typography>
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>

          {/* Actions */}
          <Box display="flex" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button onClick={onBack} size="large">
              Back
            </Button>
            <Button type="submit" variant="contained" size="large">
              Next: Add Items
            </Button>
          </Box>
        </Box>
      </form>

      {/* Create Customer Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <form onSubmit={handleCreateSubmit(handleCreateCustomer)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Customer Name *"
                      fullWidth
                      error={!!createErrors.name}
                      helperText={createErrors.name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="customerType"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Customer Type *"
                      fullWidth
                      error={!!createErrors.customerType}
                      helperText={createErrors.customerType?.message}
                    >
                      <MenuItem value="individual">Individual</MenuItem>
                      <MenuItem value="company">Company</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="nip"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="NIP (Tax ID)"
                      fullWidth
                      error={!!createErrors.nip}
                      helperText={createErrors.nip?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="email"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email *"
                      type="email"
                      fullWidth
                      error={!!createErrors.email}
                      helperText={createErrors.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="phone"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone"
                      fullWidth
                      error={!!createErrors.phone}
                      helperText={createErrors.phone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="address"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address"
                      fullWidth
                      error={!!createErrors.address}
                      helperText={createErrors.address?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="city"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City"
                      fullWidth
                      error={!!createErrors.city}
                      helperText={createErrors.city?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="postalCode"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Postal Code"
                      fullWidth
                      error={!!createErrors.postalCode}
                      helperText={createErrors.postalCode?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={creatingCustomer}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingCustomer}>
              {creatingCustomer ? <CircularProgress size={24} /> : 'Create Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default CustomerStep;
