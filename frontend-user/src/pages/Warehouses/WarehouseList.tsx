import { useState } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import DataTable from '../../components/organisms/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Column, Action } from '../../components/organisms/DataTable';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  city?: string;
  isActive: boolean;
  totalProducts?: number;
  lowStockItems?: number;
}

function WarehouseList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [warehouses] = useState<Warehouse[]>([]);
  const [loading] = useState(false);
  const [total] = useState(0);

  const handleCreateWarehouse = () => {
    navigate(`/${tenant?.id}/warehouses/create`);
  };

  const handleViewWarehouse = (warehouse: Warehouse) => {
    navigate(`/${tenant?.id}/warehouses/view/${warehouse.id}`);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    navigate(`/${tenant?.id}/warehouses/edit/${warehouse.id}`);
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        toast.success('Warehouse deleted successfully');
      } catch (error) {
        toast.error('Failed to delete warehouse');
      }
    }
  };

  const columns: Column<Warehouse>[] = [
    { id: 'code', label: 'Code', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 200 },
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      format: (value) => <Chip label={value} size="small" />,
    },
    { id: 'city', label: 'City', minWidth: 120, format: (v) => v || '-' },
    {
      id: 'totalProducts',
      label: 'Products',
      minWidth: 100,
      align: 'right',
      format: (v) => v || 0,
    },
    {
      id: 'lowStockItems',
      label: 'Low Stock',
      minWidth: 100,
      align: 'right',
      format: (value) =>
        Number(value) > 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {value}
          </Box>
        ) : (
          '0'
        ),
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

  const actions: Action<Warehouse>[] = [
    { label: 'View', icon: <VisibilityIcon />, onClick: handleViewWarehouse },
    { label: 'Edit', icon: <EditIcon />, onClick: handleEditWarehouse },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      onClick: handleDeleteWarehouse,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Warehouse Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateWarehouse}>
          Add Warehouse
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={warehouses}
        actions={actions}
        isLoading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Box>
  );
}

export default WarehouseList;
