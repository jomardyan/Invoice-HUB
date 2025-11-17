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

export type {
  BaseLinkerSettings,
  BaseLinkerIntegrationStatus,
  BaseLinkerSyncResult,
} from './types/baselinker';

// Components
export {
  AllegroSettingsForm,
  AllegroStatusChip,
  formatAllegroDate,
} from './components/Allegro';
export type {
  AllegroSettingsFormProps,
  AllegroStatusChipProps,
} from './components/Allegro';
