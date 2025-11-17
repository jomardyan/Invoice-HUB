/**
 * Tests for shared API client utility
 */
import axios from 'axios';
import { createApiClient } from '../services/apiClient';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.location
delete (window as any).location;
(window as any).location = { href: '' };

describe('createApiClient', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage mock
    const localStorageMock: { [key: string]: string } = {};
    global.localStorage = {
      getItem: jest.fn((key: string) => localStorageMock[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        for (const key in localStorageMock) {
          delete localStorageMock[key];
        }
      }),
      length: 0,
      key: jest.fn(),
    };

    // Setup axios instance mock
    mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
  });

  it('should create axios instance with baseURL', () => {
    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
    });

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should add authorization header when token exists', () => {
    localStorage.setItem('test_token', 'my-test-token');

    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
    });

    // Get the request interceptor function
    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    
    // Call it with a config
    const config = { headers: {} } as any;
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('should not add authorization header when token does not exist', () => {
    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
    });

    // Get the request interceptor function
    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    
    // Call it with a config
    const config = { headers: {} } as any;
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should handle 401 errors and clear token', async () => {
    localStorage.setItem('test_token', 'my-test-token');

    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
    });

    // Get the response error interceptor function
    const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Simulate 401 error
    const error = {
      response: { status: 401 },
    };

    try {
      await responseErrorInterceptor(error);
    } catch (e) {
      expect(e).toBe(error);
    }
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('test_token');
  });

  it('should call custom onAuthError when provided', async () => {
    const onAuthError = jest.fn();

    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
      onAuthError,
    });

    // Get the response error interceptor function
    const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Simulate 401 error
    const error = {
      response: { status: 401 },
    };

    try {
      await responseErrorInterceptor(error);
    } catch (e) {
      expect(e).toBe(error);
    }
    
    expect(onAuthError).toHaveBeenCalled();
  });

  it('should pass through non-401 errors', async () => {
    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
    });

    // Get the response error interceptor function
    const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Simulate 500 error
    const error = {
      response: { status: 500 },
    };

    try {
      await responseErrorInterceptor(error);
      fail('Should have rejected');
    } catch (e) {
      expect(e).toBe(error);
    }
  });

  it('should not call onAuthError for non-401 errors', async () => {
    const onAuthError = jest.fn();

    createApiClient({
      baseURL: 'http://localhost:3000',
      tokenStorageKey: 'test_token',
      onAuthError,
    });

    // Get the response error interceptor function
    const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Simulate 500 error
    const error = {
      response: { status: 500 },
    };

    try {
      await responseErrorInterceptor(error);
    } catch (e) {
      // Expected to throw
    }
    
    expect(onAuthError).not.toHaveBeenCalled();
  });
});
