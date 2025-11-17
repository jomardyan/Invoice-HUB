/**
 * Shared API Client for Frontend Applications
 * Provides a reusable axios instance with authentication and error handling
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  tokenStorageKey: string;
  onAuthError?: () => void;
}

/**
 * Creates an authenticated axios client with interceptors
 * @param config Configuration for the API client
 * @returns Configured axios instance
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const { baseURL, tokenStorageKey, onAuthError } = config;

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Add auth token
  client.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(tokenStorageKey);
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle auth errors
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Clear token on auth error
        localStorage.removeItem(tokenStorageKey);
        
        // Call custom handler if provided
        if (onAuthError) {
          onAuthError();
        } else {
          // Default: redirect to login
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
