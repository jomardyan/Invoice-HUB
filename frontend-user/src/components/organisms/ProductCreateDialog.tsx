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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProductMutation } from '../../store/api/productApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Price must be positive'),
  vatRate: z.number().min(0).max(100),
  unit: z.string().optional(),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function ProductCreateDialog({ open, onClose, onSuccess }: ProductDialogProps) {
  const { tenant } = useAuth();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      unitPrice: 0,
      vatRate: 23,
      unit: 'pcs',
      isActive: true,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createProduct({
        tenantId: tenant?.id || '',
        data,
      }).unwrap();

      toast.success('Product created successfully');
      handleClose();
      onSuccess?.();
    } catch {
      toast.error('Failed to create product');
    }
  };

  const vatRates = [0, 5, 8, 23];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Product</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product Name *"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU"
                    fullWidth
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit"
                    fullWidth
                    error={!!errors.unit}
                    helperText={errors.unit?.message}
                    placeholder="pcs, kg, m, etc."
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="unitPrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit Price *"
                    type="number"
                    fullWidth
                    error={!!errors.unitPrice}
                    helperText={errors.unitPrice?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="vatRate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="VAT Rate *"
                    fullWidth
                    error={!!errors.vatRate}
                    helperText={errors.vatRate?.message}
                  >
                    {vatRates.map((rate) => (
                      <MenuItem key={rate} value={rate}>
                        {rate}%
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Active"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ProductCreateDialog;
