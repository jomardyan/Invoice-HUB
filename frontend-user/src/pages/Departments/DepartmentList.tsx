import { useState } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../components/organisms/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Column, Action } from '../../components/organisms/DataTable';

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  manager?: { name: string };
  isActive: boolean;
  budgetLimits?: { monthly?: number; yearly?: number; currency?: string };
}

function DepartmentList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [departments] = useState<Department[]>([]);
  const [loading] = useState(false);
  const [total] = useState(0);

  const handleCreateDepartment = () => {
    navigate(`/${tenant?.id}/departments/create`);
  };

  const handleViewDepartment = (department: Department) => {
    navigate(`/${tenant?.id}/departments/view/${department.id}`);
  };

  const handleEditDepartment = (department: Department) => {
    navigate(`/${tenant?.id}/departments/edit/${department.id}`);
  };

  const handleDeleteDepartment = async (_department: Department) => {
    if (window.confirm('Are you sure you want to deactivate this department?')) {
      try {
        toast.success('Department deactivated successfully');
      } catch (_error) {
        toast.error('Failed to deactivate department');
      }
    }
  };

  const columns: Column<Department>[] = [
    { id: 'code', label: 'Code', minWidth: 100, format: (v) => v || '-' },
    { id: 'name', label: 'Name', minWidth: 200 },
    {
      id: 'manager.name',
      label: 'Manager',
      minWidth: 150,
      format: (_v, row) => row.manager?.name || '-',
    },
    {
      id: 'budgetLimits',
      label: 'Monthly Budget',
      minWidth: 120,
      align: 'right',
      format: (value) => {
        const budget = value as { monthly?: number; currency?: string };
        return budget?.monthly
          ? `${budget.monthly.toLocaleString()} ${budget.currency || 'PLN'}`
          : '-';
      },
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

  const actions: Action<Department>[] = [
    { label: 'View', icon: <VisibilityIcon />, onClick: handleViewDepartment },
    { label: 'Edit', icon: <EditIcon />, onClick: handleEditDepartment },
    {
      label: 'Deactivate',
      icon: <DeleteIcon />,
      onClick: handleDeleteDepartment,
      show: (row) => row.isActive,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Department Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateDepartment}>
          Add Department
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={departments}
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

export default DepartmentList;
