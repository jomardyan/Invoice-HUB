import { useEffect } from 'react';
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
import { useUpdateProductMutation } from '../../store/api/productApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Product } from '../../types';

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

interface ProductEditDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function ProductEditDialog({ open, product, onClose, onSuccess }: ProductEditDialogProps) {
  const { tenant } = useAuth();
  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        unitPrice: (product as any).unitPrice || 0,
        vatRate: (product as any).vatRate || 23,
        unit: (product as any).unit || 'pcs',
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!product) return;

    try {
      await updateProduct({
        tenantId: tenant?.id || '',
        id: product.id,
        data,
      }).unwrap();

      toast.success('Product updated successfully');
      handleClose();
      onSuccess?.();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const vatRates = [0, 5, 8, 23];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
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
            {isLoading ? <CircularProgress size={24} /> : 'Update Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ProductEditDialog;
