/**
 * Shared BaseLinker Integration Types
 * Used across admin and user frontends
 */

export interface BaseLinkerSettings {
  autoGenerateInvoices?: boolean;
  invoiceTemplateId?: string;
  syncFrequencyMinutes?: number;
  autoMarkAsPaid?: boolean;
  autoCreateCustomer?: boolean;
  autoCreateProduct?: boolean;
  defaultVatRate?: number;
  orderSources?: number[];
}

export interface BaseLinkerIntegrationStatus {
  id: string;
  isActive: boolean;
  lastSyncAt?: Date | string | null;
  syncErrorCount: number;
  lastSyncError?: string | null;
  settings?: BaseLinkerSettings;
}

export interface BaseLinkerSyncResult {
  success: boolean;
  ordersProcessed: number;
  invoicesCreated: number;
  errors?: string[];
  timestamp?: Date | string;
}
