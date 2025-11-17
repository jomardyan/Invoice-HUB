import { describe, it, expect, beforeEach } from '@jest/globals';
import authReducer, { setAuth, updateAccessToken, clearAuth, setLoading } from '../../store/slices/authSlice';
import type { AuthState } from '../../types';
import { UserRole, SubscriptionTier } from '../../types';

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
            error: null,
        };
    });

    it('should return the initial state', () => {
        expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setAuth', () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: UserRole.ADMIN,
            isActive: true,
            tenantId: 'tenant-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mockTenant = {
            id: 'tenant-1',
            name: 'Test Company',
            subscriptionTier: SubscriptionTier.BASIC,
            subscriptionStatus: 'active' as const,
            monthlyInvoiceLimit: 100,
            currentMonthInvoices: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
            firstName: 'Test',
            lastName: 'User',
            role: UserRole.USER,
            isActive: true,
            tenantId: 'tenant-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mockTenant = {
            id: 'tenant-1',
            name: 'Test Company',
            subscriptionTier: SubscriptionTier.FREE,
            subscriptionStatus: 'trial' as const,
            monthlyInvoiceLimit: 10,
            currentMonthInvoices: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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

    it('should handle clearAuth', () => {
        const authenticatedState: AuthState = {
            user: {
                id: '1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: UserRole.ADMIN,
                isActive: true,
                tenantId: 'tenant-1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            tenant: {
                id: 'tenant-1',
                name: 'Test Company',
                subscriptionTier: SubscriptionTier.BASIC,
                subscriptionStatus: 'active' as const,
                monthlyInvoiceLimit: 100,
                currentMonthInvoices: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            accessToken: 'token',
            refreshToken: 'refresh',
            isAuthenticated: true,
            isLoading: false,
            error: null,
        };

        // Set items in localStorage
        localStorage.setItem('accessToken', 'token');
        localStorage.setItem('refreshToken', 'refresh');
        localStorage.setItem('authState', '{}');

        const newState = authReducer(authenticatedState, clearAuth());

        expect(newState.user).toBe(null);
        expect(newState.tenant).toBe(null);
        expect(newState.accessToken).toBe(null);
        expect(newState.refreshToken).toBe(null);
        expect(newState.isAuthenticated).toBe(false);

        // Check localStorage is cleared
        expect(localStorage.getItem('accessToken')).toBe(null);
        expect(localStorage.getItem('refreshToken')).toBe(null);
        expect(localStorage.getItem('authState')).toBe(null);
    });

    it('should handle setLoading', () => {
        const newState = authReducer(initialState, setLoading(true));
        expect(newState.isLoading).toBe(true);

        const finalState = authReducer(newState, setLoading(false));
        expect(finalState.isLoading).toBe(false);
    });
});
