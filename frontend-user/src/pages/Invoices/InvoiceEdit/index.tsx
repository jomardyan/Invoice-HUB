import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useGetInvoiceQuery, useUpdateInvoiceMutation } from '../../../store/api/invoiceApi';
import { useAuth } from '../../../hooks/useAuth';
import CompanyStep from '../InvoiceCreate/steps/CompanyStep';
import CustomerStep from '../InvoiceCreate/steps/CustomerStep';
import ItemsStep from '../InvoiceCreate/steps/ItemsStep';
import PreviewStep from '../InvoiceCreate/steps/PreviewStep';
import type { InvoiceFormData } from '../InvoiceCreate/types';
import { toast } from 'react-toastify';

const steps = ['Company Details', 'Customer', 'Items', 'Preview'];

function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<InvoiceFormData>({
    companyName: '',
    companyAddress: '',
    companyNIP: '',
    issueDate: new Date(),
    dueDate: new Date(),
    paymentMethod: 'transfer',
    notes: '',
    customerId: '',
    items: [],
    subtotal: 0,
    totalVat: 0,
    totalAmount: 0,
  });

  const { data: invoice, isLoading } = useGetInvoiceQuery(
    { tenantId: tenant?.id || '', id: id || '' },
    { skip: !tenant?.id || !id }
  );

  const [updateInvoice] = useUpdateInvoiceMutation();

  // Pre-populate form data when invoice loads
  useEffect(() => {
    if (invoice) {
      setFormData({
        companyName: tenant?.name || '',
        companyAddress: '', // Would come from tenant settings
        companyNIP: tenant?.id || '',
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        paymentMethod: invoice.paymentMethod,
        notes: invoice.notes || '',
        customerId: invoice.customerId,
        items: invoice.items.map((item) => ({
          productId: item.productId || '',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          amount: item.amount,
        })),
        subtotal: invoice.subtotal,
        totalVat: invoice.totalVat,
        totalAmount: invoice.totalAmount,
      });
    }
  }, [invoice, tenant]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleUpdateFormData = (data: Partial<InvoiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async (status: 'draft' | 'sent') => {
    try {
      await updateInvoice({
        tenantId: tenant?.id || '',
        id: id || '',
        data: {
          customerId: formData.customerId,
          issueDate: formData.issueDate.toISOString(),
          dueDate: formData.dueDate.toISOString(),
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          items: formData.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            amount: item.amount,
          })),
          subtotal: formData.subtotal,
          totalVat: formData.totalVat,
          totalAmount: formData.totalAmount,
          status,
        },
      }).unwrap();

      toast.success(
        status === 'draft'
          ? 'Invoice updated as draft'
          : 'Invoice updated and sent successfully'
      );
      navigate(`/${tenant?.id}/invoices/view/${id}`);
    } catch (error) {
      toast.error('Failed to update invoice');
      console.error('Update invoice error:', error);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CompanyStep
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <CustomerStep
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <ItemsStep
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <PreviewStep
            data={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isEdit
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <Typography>Invoice not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Edit Invoice {invoice.invoiceNumber}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </Paper>
    </Box>
  );
}

export default InvoiceEdit;
