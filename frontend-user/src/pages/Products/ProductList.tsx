import { useState } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../components/organisms/DataTable';
import ProductCreateDialog from '../../components/organisms/ProductCreateDialog';
import ProductEditDialog from '../../components/organisms/ProductEditDialog';
import { useGetProductsQuery, useDeleteProductMutation } from '../../store/api/productApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Product } from '../../types';
import type { Column, Action } from '../../components/organisms/DataTable';

function ProductList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data, isLoading } = useGetProductsQuery(
    {
      tenantId: tenant?.id || '',
      page: page + 1,
      pageSize,
      search,
    },
    { skip: !tenant?.id }
  );

  const [deleteProduct] = useDeleteProductMutation();

  const handleAddProduct = () => {
    setCreateDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/${tenant?.id}/products/view/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct({ tenantId: tenant?.id || '', id: product.id }).unwrap();
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const columns: Column<Product>[] = [
    {
      id: 'sku',
      label: 'SKU',
      minWidth: 120,
    },
    {
      id: 'name',
      label: 'Name',
      minWidth: 200,
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 150,
      format: (value) => value || '-',
    },
    {
      id: 'price',
      label: 'Price',
      minWidth: 120,
      align: 'right',
      format: (value) => `PLN ${value.toLocaleString()}`,
    },
    {
      id: 'vatRate',
      label: 'VAT Rate',
      minWidth: 100,
      align: 'center',
      format: (value) => (
        <Chip
          label={`${value}%`}
          size="small"
          color={value === 23 ? 'primary' : 'default'}
        />
      ),
    },
    {
      id: 'unit',
      label: 'Unit',
      minWidth: 80,
    },
    {
      id: 'isActive',
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          size="small"
          color={value ? 'success' : 'default'}
        />
      ),
    },
  ];

  const actions: Action<Product>[] = [
    {
      label: 'View',
      icon: <VisibilityIcon fontSize="small" />,
      onClick: handleViewProduct,
    },
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      onClick: handleEditProduct,
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDeleteProduct,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Products
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddProduct}>
          Add Product
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={data?.data || []}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        actions={actions}
        isLoading={isLoading}
        searchPlaceholder="Search by SKU or name..."
        emptyMessage="No products found"
      />

      <ProductCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => setPage(0)}
      />

      <ProductEditDialog
        open={editDialogOpen}
        product={selectedProduct}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => setPage(0)}
      />
    </Box>
  );
}

export default ProductList;
