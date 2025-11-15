import { useState } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../components/organisms/DataTable';
import CustomerCreateDialog from '../../components/organisms/CustomerCreateDialog';
import CustomerEditDialog from '../../components/organisms/CustomerEditDialog';
import { useGetCustomersQuery, useDeleteCustomerMutation } from '../../store/api/customerApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Customer } from '../../types';
import type { Column, Action } from '../../components/organisms/DataTable';

function CustomerList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useGetCustomersQuery(
    {
      tenantId: tenant?.id || '',
      page: page + 1,
      pageSize,
      search,
    },
    { skip: !tenant?.id }
  );

  const [deleteCustomer] = useDeleteCustomerMutation();

  const handleAddCustomer = () => {
    setCreateDialogOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    navigate(`/${tenant?.id}/customers/view/${customer.id}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await deleteCustomer({ tenantId: tenant?.id || '', id: customer.id }).unwrap();
        toast.success('Customer deleted successfully');
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const columns: Column<Customer>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 200,
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
    },
    {
      id: 'customerType',
      label: 'Type',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'company' ? 'primary' : 'default'}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      id: 'nip',
      label: 'NIP',
      minWidth: 140,
      format: (value) => value || '-',
    },
    {
      id: 'totalInvoices',
      label: 'Invoices',
      minWidth: 100,
      align: 'center',
      format: (value) => value || 0,
    },
    {
      id: 'outstandingBalance',
      label: 'Outstanding',
      minWidth: 140,
      align: 'right',
      format: (value) => (value ? `PLN ${value.toLocaleString()}` : 'PLN 0'),
    },
  ];

  const actions: Action<Customer>[] = [
    {
      label: 'View',
      icon: <VisibilityIcon fontSize="small" />,
      onClick: handleViewCustomer,
    },
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      onClick: handleEditCustomer,
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDeleteCustomer,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Customers
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddCustomer}>
          Add Customer
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
        searchPlaceholder="Search by name, email, or NIP..."
        emptyMessage="No customers found"
      />

      <CustomerCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => setPage(0)}
      />

      <CustomerEditDialog
        open={editDialogOpen}
        customer={selectedCustomer}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={() => setPage(0)}
      />
    </Box>
  );
}

export default CustomerList;
