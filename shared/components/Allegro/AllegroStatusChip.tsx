/**
 * Shared Allegro Integration Status Component
 * Displays status chip for Allegro integrations
 */
import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { AllegroIntegrationStatus } from '../../types/allegro';

export interface AllegroStatusChipProps {
  integration: AllegroIntegrationStatus;
  errorThreshold?: number;
}

export const AllegroStatusChip: React.FC<AllegroStatusChipProps> = ({
  integration,
  errorThreshold = 3,
}) => {
  if (!integration.isActive) {
    return <Chip label="Inactive" color="default" variant="outlined" />;
  }
  if (integration.syncErrorCount > errorThreshold) {
    return <Chip icon={<ErrorIcon />} label="Errors" color="error" />;
  }
  return <Chip icon={<CheckCircleIcon />} label="Active" color="success" />;
};

/**
 * Utility function to format dates consistently
 */
export const formatAllegroDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString();
};
