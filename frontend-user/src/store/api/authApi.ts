import { api } from './apiSlice';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../../types';

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation<LoginResponse, RegisterRequest>({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data,
            }),
        }),
        refreshToken: builder.mutation<{ accessToken: string }, { refreshToken: string }>({
            query: (data) => ({
                url: '/auth/refresh',
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
    useLoginMutation,
    useRegisterMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
} = authApi;
