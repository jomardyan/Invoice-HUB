import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
} from '@mui/material';
import { useState } from 'react';
import { Send } from '@mui/icons-material';
import type { Invoice } from '../../types';

interface SendInvoiceDialogProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSend: (data: { email: string; subject: string; message: string; attachPdf: boolean }) => void;
}

function SendInvoiceDialog({ open, invoice, onClose, onSend }: SendInvoiceDialogProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);

  // Pre-populate fields when invoice changes
  useState(() => {
    if (invoice) {
      setEmail(invoice.customer?.email || '');
      setSubject(`Invoice ${invoice.invoiceNumber} from Your Company`);
      setMessage(
        `Dear ${invoice.customer?.name || 'Customer'},\n\n` +
        `Thank you for your business! Please find attached your invoice ${invoice.invoiceNumber}.\n\n` +
        `Invoice Details:\n` +
        `- Invoice Number: ${invoice.invoiceNumber}\n` +
        `- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}\n` +
        `- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n` +
        `- Total Amount: ${invoice.totalAmount.toFixed(2)} PLN\n\n` +
        `If you have any questions, please don't hesitate to contact us.\n\n` +
        `Best regards,\n` +
        `Your Company`
      );
    }
  });

  const handleSend = () => {
    onSend({ email, subject, message, attachPdf });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Send />
          <Typography variant="h6">Send Invoice via Email</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            label="Recipient Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            rows={10}
            required
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={attachPdf}
                onChange={(e) => setAttachPdf(e.target.checked)}
              />
            }
            label="Attach invoice as PDF"
          />

          <Divider sx={{ my: 2 }} />

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom>
              Email Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>To:</strong> {email || '(enter email)'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Subject:</strong> {subject || '(enter subject)'}
            </Typography>
            {attachPdf && (
              <Typography variant="body2" color="text.secondary">
                <strong>Attachment:</strong> {invoice?.invoiceNumber || 'Invoice'}.pdf
              </Typography>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={<Send />}
          disabled={!email || !subject || !message}
        >
          Send Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SendInvoiceDialog;
