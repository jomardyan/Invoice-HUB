import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetProductsQuery } from '../../../../store/api/productApi';
import { useAuth } from '../../../../hooks/useAuth';
import type { InvoiceFormData, InvoiceItemForm } from '../types';
import type { Product } from '../../../../types';

interface ItemsStepProps {
  data: InvoiceFormData;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: Partial<InvoiceFormData>) => void;
}

function ItemsStep({ data, onNext, onBack, onUpdate }: ItemsStepProps) {
  const { tenant } = useAuth();
  const [items, setItems] = useState<InvoiceItemForm[]>(
    data.items.length > 0
      ? data.items
      : [
          {
            description: '',
            quantity: 1,
            unitPrice: 0,
            vatRate: 23,
            netAmount: 0,
            vatAmount: 0,
            grossAmount: 0,
          },
        ]
  );

  const { data: productsData, isLoading: loadingProducts } = useGetProductsQuery(
    { tenantId: tenant?.id || '', pageSize: 1000 },
    { skip: !tenant?.id }
  );

  const calculateAmounts = (quantity: number, unitPrice: number, vatRate: number) => {
    const netAmount = quantity * unitPrice;
    const vatAmount = netAmount * (vatRate / 100);
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount: parseFloat(netAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      grossAmount: parseFloat(grossAmount.toFixed(2)),
    };
  };

  const handleProductSelect = (index: number, product: Product | string | null) => {
    if (!product || typeof product === 'string') return;

    const newItems = [...items];
    const unitPrice = (product as any).unitPrice || 0;
    const vatRate = (product as any).vatRate || 23;
    const amounts = calculateAmounts(newItems[index].quantity, unitPrice, vatRate);

    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      description: product.name,
      unitPrice,
      vatRate,
      ...amounts,
    };

    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemForm,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amounts if quantity, unitPrice, or vatRate changed
    if (field === 'quantity' || field === 'unitPrice' || field === 'vatRate') {
      const { quantity, unitPrice, vatRate } = newItems[index];
      const amounts = calculateAmounts(
        Number(quantity),
        Number(unitPrice),
        Number(vatRate)
      );
      newItems[index] = { ...newItems[index], ...amounts };
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 23,
        netAmount: 0,
        vatAmount: 0,
        grossAmount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validate that all items have description and positive amounts
    const valid = items.every(
      (item) => item.description.trim() !== '' && item.grossAmount > 0
    );

    if (!valid) {
      alert('Please fill in all items with valid quantities and prices');
      return;
    }

    onUpdate({ items });
    onNext();
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.netAmount, 0);
  const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const total = items.reduce((sum, item) => sum + item.grossAmount, 0);

  const vatRates = [0, 5, 8, 23];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">Add Invoice Items</Typography>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddItem}>
          Add Item
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, minWidth: 300 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>Quantity</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>Unit Price</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>VAT %</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>
                Net Amount
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>
                VAT Amount
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>
                Gross Amount
              </TableCell>
              <TableCell align="center" sx={{ width: 80 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                {/* Description with Product Search */}
                <TableCell>
                  <Autocomplete
                    options={productsData?.data || []}
                    loading={loadingProducts}
                    getOptionLabel={(option) =>
                      typeof option === 'string' ? option : option.name
                    }
                    onChange={(_, newValue) => handleProductSelect(index, newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Type product name or enter manually"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingProducts ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    freeSolo
                  />
                </TableCell>

                {/* Quantity */}
                <TableCell>
                  <TextField
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    size="small"
                    fullWidth
                  />
                </TableCell>

                {/* Unit Price */}
                <TableCell>
                  <TextField
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    size="small"
                    fullWidth
                  />
                </TableCell>

                {/* VAT Rate */}
                <TableCell>
                  <TextField
                    select
                    value={item.vatRate}
                    onChange={(e) =>
                      handleItemChange(index, 'vatRate', parseFloat(e.target.value))
                    }
                    size="small"
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    {vatRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </TextField>
                </TableCell>

                {/* Net Amount */}
                <TableCell align="right">
                  <Typography variant="body2">{item.netAmount.toFixed(2)}</Typography>
                </TableCell>

                {/* VAT Amount */}
                <TableCell align="right">
                  <Typography variant="body2">{item.vatAmount.toFixed(2)}</Typography>
                </TableCell>

                {/* Gross Amount */}
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.grossAmount.toFixed(2)}
                  </Typography>
                </TableCell>

                {/* Actions */}
                <TableCell align="center">
                  <IconButton
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
            <Typography>Subtotal (Net):</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {data.currency} {subtotal.toFixed(2)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography>Total VAT:</Typography>
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

      {/* Actions */}
      <Box display="flex" justifyContent="space-between">
        <Button onClick={onBack} size="large">
          Back
        </Button>
        <Button onClick={handleSubmit} variant="contained" size="large">
          Next: Preview Invoice
        </Button>
      </Box>
    </Box>
  );
}

export default ItemsStep;
