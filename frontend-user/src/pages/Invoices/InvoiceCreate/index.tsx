import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../../hooks/useAuth';
import CompanyStep from './steps/CompanyStep';
import CustomerStep from './steps/CustomerStep';
import ItemsStep from './steps/ItemsStep';
import PreviewStep from './steps/PreviewStep';
import type { InvoiceFormData } from './types';

const steps = ['Company Details', 'Select Customer', 'Add Items', 'Preview & Submit'];

function InvoiceCreate() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<InvoiceFormData>({
    companyId: '',
    customerId: '',
    invoiceType: 'vat',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMethod: 'bank_transfer',
    currency: 'PLN',
    items: [],
    notes: '',
    terms: '',
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleDataUpdate = (data: Partial<InvoiceFormData>) => {
    setFormData((prev: InvoiceFormData) => ({ ...prev, ...data }));
  };

  const handleNavigateBack = () => {
    navigate(`/${tenant?.id}/invoices`);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <CompanyStep
            data={formData}
            onNext={handleNext}
            onUpdate={handleDataUpdate}
          />
        );
      case 1:
        return (
          <CustomerStep
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={handleDataUpdate}
          />
        );
      case 2:
        return (
          <ItemsStep
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={handleDataUpdate}
          />
        );
      case 3:
        return (
          <PreviewStep
            data={formData}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleNavigateBack}>
            Back to Invoices
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Create New Invoice
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 3 }}>
        {renderStepContent()}
      </Paper>
    </Box>
  );
}

export default InvoiceCreate;
