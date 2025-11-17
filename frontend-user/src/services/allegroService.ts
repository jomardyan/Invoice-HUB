/**
 * Allegro Service for User Frontend
 * Uses shared API client and types for consistency
 */
import { createApiClient } from '../../../shared/services/apiClient';
import type {
  AllegroSettings,
  AllegroIntegrationStatus,
  AllegroSyncResult,
} from '../../../shared/types/allegro';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class AllegroService {
  private api = createApiClient({
    baseURL: API_BASE_URL,
    tokenStorageKey: 'accessToken',
  });

  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationUrl(tenantId: string): Promise<string> {
    try {
      const response = await this.api.get('/allegro/auth/authorize', {
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
      const response = await this.api.post('/allegro/auth/callback', {
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
      const response = await this.api.get(`/allegro/status/${integrationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get integration status:', error);
      throw error;
    }
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(integrationId: string, companyId: string, tenantId: string): Promise<AllegroSyncResult> {
    try {
      const response = await this.api.post('/allegro/sync', {
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
      await this.api.post(`/allegro/deactivate/${integrationId}`);
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
      const response = await this.api.get(`/allegro/settings/${integrationId}`);
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
      const response = await this.api.put(`/allegro/settings/${integrationId}`, {
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
  async getIntegrationsByTenant(tenantId: string): Promise<AllegroIntegrationStatus[]> {
    try {
      const response = await this.api.get(`/allegro/integrations/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get integrations:', error);
      throw error;
    }
  }
}

// Re-export types for backward compatibility
export type { AllegroSettings, AllegroIntegrationStatus, AllegroSyncResult };

export default new AllegroService();
