/**
 * API client for admin frontend
 * Uses shared API client utility for consistency
 */
import { createApiClient } from '../../../shared/services/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = createApiClient({
    baseURL: API_BASE_URL,
    tokenStorageKey: 'admin_token',
    onAuthError: () => {
        window.location.href = '/login';
    },
});

export default api;
