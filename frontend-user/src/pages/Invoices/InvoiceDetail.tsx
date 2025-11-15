import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetInvoiceQuery, useDeleteInvoiceMutation } from '../../store/api/invoiceApi';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/atoms/StatusBadge';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAuth();

  const { data: invoice, isLoading, error } = useGetInvoiceQuery(
    { tenantId: tenant?.id || '', id: id || '' },
    { skip: !tenant?.id || !id }
  );

  const [deleteInvoice] = useDeleteInvoiceMutation();

  const handleBack = () => {
    navigate(`/${tenant?.id}/invoices`);
  };

  const handleEdit = () => {
    if (invoice?.status === 'draft') {
      navigate(`/${tenant?.id}/invoices/edit/${id}`);
    } else {
      toast.warning('Only draft invoices can be edited');
    }
  };

  const handleSend = () => {
    toast.info('Send invoice feature coming soon');
  };

  const handleDownload = () => {
    toast.info('Download PDF feature coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice({ tenantId: tenant?.id || '', id: id || '' }).unwrap();
        toast.success('Invoice deleted successfully');
        handleBack();
      } catch {
        toast.error('Failed to delete invoice');
      }
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box>
        <Alert severity="error">Failed to load invoice details. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Invoice {invoice.invoiceNumber}
          </Typography>
          <StatusBadge status={invoice.status} />
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<EditIcon />} onClick={handleEdit} disabled={invoice.status !== 'draft'}>
            Edit
          </Button>
          <Button startIcon={<SendIcon />} onClick={handleSend}>
            Send
          </Button>
          <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
            Download
          </Button>
          <Button startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button startIcon={<DeleteIcon />} onClick={handleDelete} color="error">
            Delete
          </Button>
        </Box>
      </Box>

      {/* Invoice Details */}
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              From
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {invoice.company?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              NIP: {invoice.company?.nip}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.company?.address}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.company?.postalCode} {invoice.company?.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.company?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.company?.phone}
            </Typography>
          </Grid>

          {/* Customer Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Bill To
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {invoice.customer?.name}
            </Typography>
            {invoice.customer?.nip && (
              <Typography variant="body2" color="text.secondary">
                NIP: {invoice.customer.nip}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {invoice.customer?.address}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.customer?.postalCode} {invoice.customer?.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.customer?.email}
            </Typography>
          </Grid>

          {/* Invoice Meta */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Invoice Type
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {invoice.invoiceType}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Issue Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Due Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Payment Method
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {invoice.paymentMethod.replace('_', ' ')}
            </Typography>
          </Grid>
        </Grid>

        {/* Line Items */}
        <Box sx={{ mt: 4 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Quantity
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Unit Price
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    VAT Rate
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Net Amount
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    VAT Amount
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Gross Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{invoice.currency} {item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.vatRate}%</TableCell>
                    <TableCell align="right">{invoice.currency} {item.netAmount.toFixed(2)}</TableCell>
                    <TableCell align="right">{invoice.currency} {item.vatAmount.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {invoice.currency} {item.grossAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Totals */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ minWidth: 300 }}>
            <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography>Subtotal:</Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {invoice.currency} {invoice.subtotal.toFixed(2)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography>VAT:</Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {invoice.currency} {invoice.totalVat.toFixed(2)}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Total:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {invoice.currency} {invoice.totalAmount.toFixed(2)}
              </Typography>
            </Box>
            {invoice.paidAmount > 0 && (
              <>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography color="success.main">Paid:</Typography>
                  <Typography color="success.main" sx={{ fontWeight: 600 }}>
                    {invoice.currency} {invoice.paidAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography color="error.main">Outstanding:</Typography>
                  <Typography color="error.main" sx={{ fontWeight: 600 }}>
                    {invoice.currency} {(invoice.totalAmount - invoice.paidAmount).toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Notes */}
        {invoice.notes && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.notes}
            </Typography>
          </Box>
        )}

        {invoice.terms && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Terms & Conditions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.terms}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default InvoiceDetail;
