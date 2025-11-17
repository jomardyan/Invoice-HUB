import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DataTable from '../../components/organisms/DataTable';
import StatusBadge from '../../components/atoms/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { Column, Action } from '../../components/organisms/DataTable';

interface Receipt {
  id: string;
  receiptNumber: string;
  receiptType: string;
  status: string;
  issueDate: string;
  grossAmount: number;
  currency: string;
  customer?: {
    name: string;
  };
}

function ReceiptList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // TODO: Replace with actual API call using RTK Query
  // const { data, isLoading } = useGetReceiptsQuery(...)

  const handleCreateReceipt = () => {
    navigate(`/${tenant?.id}/receipts/create`);
  };

  const handleViewReceipt = (receipt: Receipt) => {
    navigate(`/${tenant?.id}/receipts/view/${receipt.id}`);
  };

  const handleEditReceipt = (receipt: Receipt) => {
    if (receipt.status === 'draft') {
      navigate(`/${tenant?.id}/receipts/edit/${receipt.id}`);
    } else {
      toast.warning('Only draft receipts can be edited');
    }
  };

  const handleDeleteReceipt = async (receipt: Receipt) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        // TODO: Implement delete API call
        toast.success('Receipt deleted successfully');
      } catch (error) {
        toast.error('Failed to delete receipt');
      }
    }
  };

  const handleIssueReceipt = (receipt: Receipt) => {
    // TODO: Implement issue receipt API call
    toast.info('Issue receipt feature ready for integration');
  };

  const columns: Column<Receipt>[] = [
    {
      id: 'receiptNumber',
      label: 'Receipt #',
      minWidth: 120,
    },
    {
      id: 'receiptType',
      label: 'Type',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'e_receipt' ? 'primary' : 'default'}
        />
      ),
    },
    {
      id: 'customer.name',
      label: 'Customer',
      minWidth: 180,
      format: (value, row) => row.customer?.name || '-',
    },
    {
      id: 'issueDate',
      label: 'Issue Date',
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
  ];

  const actions: Action<Receipt>[] = [
    {
      label: 'View',
      icon: <VisibilityIcon />,
      onClick: handleViewReceipt,
    },
    {
      label: 'Edit',
      icon: <EditIcon />,
      onClick: handleEditReceipt,
      show: (row) => row.status === 'draft',
    },
    {
      label: 'Issue',
      icon: <ReceiptIcon />,
      onClick: handleIssueReceipt,
      show: (row) => row.status === 'draft',
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      onClick: handleDeleteReceipt,
      show: (row) => row.status === 'draft',
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
        <Typography variant="h4">Receipts & E-Receipts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateReceipt}
        >
          Create Receipt
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value)}
        >
          <Tab label="All" value="all" />
          <Tab label="Draft" value="draft" />
          <Tab label="Issued" value="issued" />
          <Tab label="Sent" value="sent" />
          <Tab label="Cancelled" value="cancelled" />
        </Tabs>
      </Box>

      <DataTable
        columns={columns}
        data={receipts}
        actions={actions}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Box>
  );
}

export default ReceiptList;
