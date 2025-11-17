/**
 * Main export file for shared utilities
 */

// Services
export { createApiClient } from './services/apiClient';
export type { ApiClientConfig } from './services/apiClient';

// Types
export type {
  AllegroSettings,
  AllegroIntegrationStatus,
  AllegroSyncResult,
} from './types/allegro';
