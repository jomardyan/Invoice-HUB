import { describe, it, expect, beforeEach } from '@jest/globals';
import authReducer, { setAuth, updateAccessToken, logout, setLoading } from '../../store/slices/authSlice';
import type { AuthState } from '../../types';

describe('authSlice', () => {
    let initialState: AuthState;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();

        initialState = {
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
        };
    });

    it('should return the initial state', () => {
        expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setAuth', () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin' as const,
            tenantId: 'tenant-1',
        };

        const mockTenant = {
            id: 'tenant-1',
            name: 'Test Company',
            subscriptionTier: 'basic' as const,
        };

        const payload = {
            user: mockUser,
            tenant: mockTenant,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        };

        const newState = authReducer(initialState, setAuth(payload));

        expect(newState.user).toEqual(mockUser);
        expect(newState.tenant).toEqual(mockTenant);
        expect(newState.accessToken).toBe('mock-access-token');
        expect(newState.refreshToken).toBe('mock-refresh-token');
        expect(newState.isAuthenticated).toBe(true);
        expect(newState.isLoading).toBe(false);

        // Check localStorage
        expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
        expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });

    it('should handle setAuth without refresh token', () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user' as const,
            tenantId: 'tenant-1',
        };

        const mockTenant = {
            id: 'tenant-1',
            name: 'Test Company',
            subscriptionTier: 'free' as const,
        };

        const payload = {
            user: mockUser,
            tenant: mockTenant,
            accessToken: 'mock-access-token',
        };

        const newState = authReducer(initialState, setAuth(payload));

        expect(newState.accessToken).toBe('mock-access-token');
        expect(newState.refreshToken).toBe(null);
        expect(newState.isAuthenticated).toBe(true);
    });

    it('should handle updateAccessToken', () => {
        const stateWithAuth: AuthState = {
            ...initialState,
            accessToken: 'old-token',
            isAuthenticated: true,
        };

        const newState = authReducer(stateWithAuth, updateAccessToken('new-token'));

        expect(newState.accessToken).toBe('new-token');
        expect(localStorage.getItem('accessToken')).toBe('new-token');
    });

    it('should handle logout', () => {
        const authenticatedState: AuthState = {
            user: {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'admin',
                tenantId: 'tenant-1',
            },
            tenant: {
                id: 'tenant-1',
                name: 'Test Company',
                subscriptionTier: 'basic',
            },
            accessToken: 'token',
            refreshToken: 'refresh',
            isAuthenticated: true,
            isLoading: false,
        };

        // Set items in localStorage
        localStorage.setItem('accessToken', 'token');
        localStorage.setItem('refreshToken', 'refresh');

        const newState = authReducer(authenticatedState, logout());

        expect(newState.user).toBe(null);
        expect(newState.tenant).toBe(null);
        expect(newState.accessToken).toBe(null);
        expect(newState.refreshToken).toBe(null);
        expect(newState.isAuthenticated).toBe(false);

        // Check localStorage is cleared
        expect(localStorage.getItem('accessToken')).toBe(null);
        expect(localStorage.getItem('refreshToken')).toBe(null);
    });

    it('should handle setLoading', () => {
        const newState = authReducer(initialState, setLoading(true));
        expect(newState.isLoading).toBe(true);

        const finalState = authReducer(newState, setLoading(false));
        expect(finalState.isLoading).toBe(false);
    });
});
