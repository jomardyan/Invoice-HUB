/**
 * BaseLinker Service for User Frontend
 * Uses shared API client and types for consistency
 */
import { createApiClient } from '../../../shared/services/apiClient';
import type {
  BaseLinkerSettings,
  BaseLinkerIntegrationStatus,
  BaseLinkerSyncResult,
} from '../../../shared/types/baselinker';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class BaseLinkerService {
  private api = createApiClient({
    baseURL: API_BASE_URL,
    tokenStorageKey: 'accessToken',
  });

  /**
   * Create a new BaseLinker integration with API token
   */
  async connect(tenantId: string, userId: string, apiToken: string): Promise<BaseLinkerIntegrationStatus> {
    try {
      const response = await this.api.post('/baselinker/connect', {
        tenantId,
        userId,
        apiToken,
      });
      return response.data.integration;
    } catch (error) {
      console.error('Failed to connect BaseLinker:', error);
      throw error;
    }
  }

  /**
   * Get integration status
   */
  async getStatus(integrationId: string): Promise<BaseLinkerIntegrationStatus> {
    try {
      const response = await this.api.get(`/baselinker/status/${integrationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get integration status:', error);
      throw error;
    }
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(integrationId: string, companyId: string, tenantId: string): Promise<BaseLinkerSyncResult> {
    try {
      const response = await this.api.post('/baselinker/sync', {
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
      await this.api.post(`/baselinker/deactivate/${integrationId}`);
    } catch (error) {
      console.error('Failed to deactivate integration:', error);
      throw error;
    }
  }

  /**
   * Get integration settings
   */
  async getSettings(integrationId: string): Promise<BaseLinkerSettings> {
    try {
      const response = await this.api.get(`/baselinker/settings/${integrationId}`);
      return response.data.settings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  }

  /**
   * Update integration settings
   */
  async updateSettings(integrationId: string, settings: Partial<BaseLinkerSettings>): Promise<BaseLinkerSettings> {
    try {
      const response = await this.api.put(`/baselinker/settings/${integrationId}`, {
        settings,
      });
      return response.data.settings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Get all integrations for a tenant
   */
  async getIntegrationsByTenant(tenantId: string): Promise<BaseLinkerIntegrationStatus[]> {
    try {
      const response = await this.api.get(`/baselinker/integrations/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get integrations:', error);
      throw error;
    }
  }
}

// Re-export types for backward compatibility
export type { BaseLinkerSettings, BaseLinkerIntegrationStatus, BaseLinkerSyncResult };

export default new BaseLinkerService();
