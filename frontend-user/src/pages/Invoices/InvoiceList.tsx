import { useState } from 'react';
import { Box, Typography, Button, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import DataTable from '../../components/organisms/DataTable';
import StatusBadge from '../../components/atoms/StatusBadge';
import { useGetInvoicesQuery, useDeleteInvoiceMutation } from '../../store/api/invoiceApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { Invoice } from '../../types';
import type { Column, Action } from '../../components/organisms/DataTable';

function InvoiceList() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useGetInvoicesQuery(
    {
      tenantId: tenant?.id || '',
      page: page + 1,
      pageSize,
      search,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    },
    { skip: !tenant?.id }
  );

  const [deleteInvoice] = useDeleteInvoiceMutation();

  const handleCreateInvoice = () => {
    navigate(`/${tenant?.id}/invoices/create`);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/${tenant?.id}/invoices/view/${invoice.id}`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (invoice.status === 'draft') {
      navigate(`/${tenant?.id}/invoices/edit/${invoice.id}`);
    } else {
      toast.warning('Only draft invoices can be edited');
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice({ tenantId: tenant?.id || '', id: invoice.id }).unwrap();
        toast.success('Invoice deleted successfully');
      } catch (_error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleSendInvoice = (_invoice: Invoice) => {
    // TODO: Implement send invoice dialog
    toast.info('Send invoice feature coming soon');
  };

  const handleDownloadInvoice = (_invoice: Invoice) => {
    // TODO: Implement download PDF
    toast.info('Download PDF feature coming soon');
  };

  const columns: Column<Invoice>[] = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      minWidth: 120,
    },
    {
      id: 'customer.name',
      label: 'Customer',
      minWidth: 180,
      format: (_value, row) => row.customer?.name || '-',
    },
    {
      format: (value) => format(new Date(value as string), 'MMM dd, yyyy'),
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      minWidth: 120,
      format: (value) => format(new Date(value as string), 'MMM dd, yyyy'),
    },
    {
      id: 'totalAmount',
      label: 'Total',
      minWidth: 120,
      align: 'right',
      format: (value, row) => `${row.currency} ${(value as number).toLocaleString()}`,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const actions: Action<Invoice>[] = [
    {
      label: 'View',
      icon: <VisibilityIcon fontSize="small" />,
      onClick: handleViewInvoice,
    },
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      onClick: handleEditInvoice,
    },
    {
      label: 'Send',
      icon: <SendIcon fontSize="small" />,
      onClick: handleSendInvoice,
    },
    {
      label: 'Download PDF',
      icon: <DownloadIcon fontSize="small" />,
      onClick: handleDownloadInvoice,
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDeleteInvoice,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Invoices
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateInvoice}>
          Create Invoice
        </Button>
      </Box>

      {/* Status Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={statusFilter} onChange={(_, value) => setStatusFilter(value)}>
          <Tab label="All" value="all" />
          <Tab label="Draft" value="draft" />
          <Tab label="Sent" value="sent" />
          <Tab label="Paid" value="paid" />
          <Tab label="Overdue" value="overdue" />
        </Tabs>
      </Box>

      {/* Invoice Table */}
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
        searchPlaceholder="Search by invoice number or customer..."
        emptyMessage="No invoices found"
      />
    </Box>
  );
}

export default InvoiceList;
