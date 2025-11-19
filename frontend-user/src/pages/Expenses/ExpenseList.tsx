import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  ChipProps,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DataTable from '../../components/organisms/DataTable';
import StatusBadge from '../../components/atoms/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { Column, Action } from '../../components/organisms/DataTable';

interface Expense {
  id: string;
  expenseNumber: string;
  description: string;
  category: string;
  status: string;
  expenseDate: string;
  grossAmount: number;
  currency: string;
  vendor?: string;
  isPaid: boolean;
}

function ExpenseList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expenses, _setExpenses] = useState<Expense[]>([]);
  const [loading, _setLoading] = useState(false);
  const [total, _setTotal] = useState(0);

  // TODO: Replace with actual API call using RTK Query
  // const { data, isLoading } = useGetExpensesQuery(...)

  const handleCreateExpense = () => {
    navigate(`/${tenant?.id}/expenses/create`);
  };

  const handleViewExpense = (expense: Expense) => {
    navigate(`/${tenant?.id}/expenses/view/${expense.id}`);
  };

  const handleEditExpense = (expense: Expense) => {
    if (['draft', 'rejected'].includes(expense.status)) {
      navigate(`/${tenant?.id}/expenses/edit/${expense.id}`);
    } else {
      toast.warning('Only draft or rejected expenses can be edited');
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (window.confirm(`Are you sure you want to delete expense ${expense.expenseNumber}?`)) {
      try {
        // TODO: Implement delete API call
        toast.success('Expense deleted successfully');
      } catch (_error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleApproveExpense = async (_expense: Expense) => {
    try {
      // TODO: Implement approve API call
      toast.success('Expense approved');
    } catch (_error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleRejectExpense = async (_expense: Expense) => {
    try {
      // TODO: Implement reject API call
      toast.success('Expense rejected');
    } catch (_error) {
      toast.error('Failed to reject expense');
    }
  };

  const handleMarkAsPaid = async (_expense: Expense) => {
    try {
      // TODO: Implement mark as paid API call
      toast.success('Expense marked as paid');
    } catch (_error) {
      toast.error('Failed to mark expense as paid');
    }
  };

  const getCategoryColor = (category: string) => {
    type ChipColor = ChipProps['color'];
    const colors: Record<string, ChipColor> = {
      office_supplies: 'default',
      utilities: 'info',
      rent: 'warning',
      transportation: 'primary',
      meals: 'success',
      equipment: 'secondary',
      software: 'info',
      marketing: 'primary',
      professional_services: 'warning',
      insurance: 'error',
      taxes: 'error',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  const columns: Column<Expense>[] = [
    {
      id: 'expenseNumber',
      label: 'Expense #',
      minWidth: 120,
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 120,
      format: (value) => (
        <Chip
          label={String(value).replace(/_/g, ' ')}
          size="small"
          color={getCategoryColor(String(value))}
        />
      ),
    },
    {
      id: 'vendor',
      label: 'Vendor',
      minWidth: 150,
      format: (value) => value || '-',
    },
    {
      id: 'expenseDate',
      label: 'Date',
      minWidth: 120,
      format: (value) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      id: 'grossAmount',
      label: 'Amount',
      minWidth: 100,
      align: 'right',
      format: (value, row) => `${Number(value).toFixed(2)} ${row.currency}`,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'isPaid',
      label: 'Paid',
      minWidth: 80,
      format: (value) => (value ? 'Yes' : 'No'),
    },
  ];

  const actions: Action<Expense>[] = [
    {
      label: 'View',
      icon: <VisibilityIcon />,
      onClick: handleViewExpense,
    },
    {
      label: 'Edit',
      icon: <EditIcon />,
      onClick: handleEditExpense,
      show: (row) => ['draft', 'rejected'].includes(row.status),
    },
    {
      label: 'Approve',
      icon: <CheckIcon />,
      onClick: handleApproveExpense,
      show: (row) => row.status === 'pending_approval',
      color: 'success',
    },
    {
      label: 'Reject',
      icon: <CloseIcon />,
      onClick: handleRejectExpense,
      show: (row) => row.status === 'pending_approval',
      color: 'error',
    },
    {
      label: 'Mark Paid',
      icon: <AttachMoneyIcon />,
      onClick: handleMarkAsPaid,
      show: (row) => row.status === 'approved' && !row.isPaid,
      color: 'primary',
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      onClick: handleDeleteExpense,
      show: (row) => !row.isPaid,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Expense Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateExpense}
        >
          Add Expense
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value)}
        >
          <Tab label="All" value="all" />
          <Tab label="Draft" value="draft" />
          <Tab label="Pending Approval" value="pending_approval" />
          <Tab label="Approved" value="approved" />
          <Tab label="Paid" value="paid" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>
      </Box>

      <DataTable
        columns={columns}
        data={expenses}
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

export default ExpenseList;
