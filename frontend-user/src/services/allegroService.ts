import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
  lastSyncAt?: Date;
  syncErrorCount: number;
  lastSyncError?: string;
}

class AllegroService {
  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationUrl(tenantId: string): Promise<string> {
    try {
      const response = await axios.get(`${API_BASE_URL}/allegro/auth/authorize`, {
        params: { tenantId },
      });
      return response.data.authUrl;
    } catch (error) {
      console.error('Failed to get authorization URL:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(tenantId: string, userId: string, code: string): Promise<AllegroIntegrationStatus> {
    try {
      const response = await axios.post(`${API_BASE_URL}/allegro/auth/callback`, {
        tenantId,
        userId,
        code,
      });
      return response.data.integration;
    } catch (error) {
      console.error('Failed to handle OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Get integration status
   */
  async getStatus(integrationId: string): Promise<AllegroIntegrationStatus> {
    try {
      const response = await axios.get(`${API_BASE_URL}/allegro/status/${integrationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get integration status:', error);
      throw error;
    }
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(integrationId: string, companyId: string, tenantId: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/allegro/sync`, {
        integrationId,
        companyId,
        tenantId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  }

  /**
   * Deactivate integration
   */
  async deactivate(integrationId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/allegro/deactivate/${integrationId}`);
    } catch (error) {
      console.error('Failed to deactivate integration:', error);
      throw error;
    }
  }

  /**
   * Get integration settings
   */
  async getSettings(integrationId: string): Promise<AllegroSettings> {
    try {
      const response = await axios.get(`${API_BASE_URL}/allegro/settings/${integrationId}`);
      return response.data.settings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  }

  /**
   * Update integration settings
   */
  async updateSettings(integrationId: string, settings: Partial<AllegroSettings>): Promise<AllegroSettings> {
    try {
      const response = await axios.put(`${API_BASE_URL}/allegro/settings/${integrationId}`, {
        settings,
      });
      return response.data.settings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
}

export default new AllegroService();
