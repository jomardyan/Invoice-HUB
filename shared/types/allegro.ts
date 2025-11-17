/**
 * Shared Allegro Integration Types
 * Used across admin and user frontends
 */

export interface AllegroSettings {
  autoGenerateInvoices?: boolean;
  invoiceTemplateId?: string;
  syncFrequencyMinutes?: number;
  autoMarkAsPaid?: boolean;
  autoCreateCustomer?: boolean;
  autoCreateProduct?: boolean;
  defaultVatRate?: number;
}

export interface AllegroIntegrationStatus {
  id: string;
  allegroUserId: string;
  isActive: boolean;
  lastSyncAt?: Date | string | null;
  syncErrorCount: number;
  lastSyncError?: string | null;
  settings?: AllegroSettings;
}

export interface AllegroSyncResult {
  success: boolean;
  ordersProcessed: number;
  invoicesCreated: number;
  errors?: string[];
  timestamp: Date | string;
}
