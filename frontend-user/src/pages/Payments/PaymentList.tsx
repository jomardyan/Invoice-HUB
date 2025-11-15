import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../components/organisms/DataTable';
import StatusBadge from '../../components/atoms/StatusBadge';
import RecordPaymentDialog from '../../components/organisms/RecordPaymentDialog';
import { useGetPaymentsQuery, useDeletePaymentMutation } from '../../store/api/paymentApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { Payment } from '../../types';
import type { Column, Action } from '../../components/organisms/DataTable';

function PaymentList() {
  const { tenant } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  const { data, isLoading } = useGetPaymentsQuery(
    {
      tenantId: tenant?.id || '',
      page: page + 1,
      pageSize,
      search,
    },
    { skip: !tenant?.id }
  );

  const [deletePayment] = useDeletePaymentMutation();

  const handleRecordPayment = () => {
    setRecordPaymentOpen(true);
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await deletePayment({ tenantId: tenant?.id || '', id: payment.id }).unwrap();
        toast.success('Payment deleted successfully');
      } catch {
        toast.error('Failed to delete payment');
      }
    }
  };

  const columns: Column<Payment>[] = [
    {
      id: 'paymentDate',
      label: 'Payment Date',
      minWidth: 140,
      format: (value) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      id: 'invoice.invoiceNumber',
      label: 'Invoice #',
      minWidth: 140,
      format: (value, row) => row.invoice?.invoiceNumber || '-',
    },
    {
      id: 'invoice.customer.name',
      label: 'Customer',
      minWidth: 200,
      format: (value, row) => row.invoice?.customer?.name || '-',
    },
    {
      id: 'amount',
      label: 'Amount',
      minWidth: 140,
      align: 'right',
      format: (value) => `PLN ${value.toLocaleString()}`,
    },
    {
      id: 'paymentMethod',
      label: 'Method',
      minWidth: 140,
      format: (value) => value.replace('_', ' ').toUpperCase(),
    },
    {
      id: 'referenceNumber',
      label: 'Reference',
      minWidth: 140,
      format: (value) => value || '-',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => <StatusBadge status={value} />,
    },
  ];

  const actions: Action<Payment>[] = [
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDeletePayment,
      color: 'error',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Payments
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleRecordPayment}>
          Record Payment
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
        searchPlaceholder="Search by invoice number or reference..."
        emptyMessage="No payments found"
      />

      <RecordPaymentDialog
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
      />
    </Box>
  );
}

export default PaymentList;
