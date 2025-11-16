import { api } from './apiSlice';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../../types';

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        lookupTenant: builder.mutation<{ tenantId: string }, { email: string }>({
            query: (data) => ({
                url: '/auth/lookup-tenant',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: { data: { tenantId: string } }) => response.data,
        }),
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            transformResponse: (response: { data: LoginResponse }) => response.data,
        }),
        register: builder.mutation<LoginResponse, RegisterRequest>({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: { data: LoginResponse }) => response.data,
        }),
        refreshToken: builder.mutation<{ data: { accessToken: string } }, { refreshToken: string }>({
            query: (data) => ({
                url: '/auth/refresh-token',
                method: 'POST',
                body: data,
            }),
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useLookupTenantMutation,
    useLoginMutation,
    useRegisterMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
} = authApi;
