import { api } from './apiSlice';
import type { Customer, PaginatedResponse, QueryParams } from '../../types';

export interface CreateCustomerRequest {
    name: string;
    email: string;
    phone?: string;
    nip?: string;
    customerType: 'company' | 'individual';
    address: string;
    city: string;
    postalCode: string;
    country: string;
    notes?: string;
}

export const customerApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCustomers: builder.query<PaginatedResponse<Customer>, { tenantId: string } & QueryParams>({
            query: ({ tenantId, ...params }) => ({
                url: `/${tenantId}/customers`,
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Customer' as const, id })),
                        { type: 'Customer', id: 'LIST' },
                    ]
                    : [{ type: 'Customer', id: 'LIST' }],
        }),
        getCustomer: builder.query<Customer, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => `/${tenantId}/customers/${id}`,
            providesTags: (result, error, { id }) => [{ type: 'Customer', id }],
        }),
        createCustomer: builder.mutation<Customer, { tenantId: string; data: CreateCustomerRequest }>({
            query: ({ tenantId, data }) => ({
                url: `/${tenantId}/customers`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
        }),
        updateCustomer: builder.mutation<
            Customer,
            { tenantId: string; id: string; data: Partial<CreateCustomerRequest> }
        >({
            query: ({ tenantId, id, data }) => ({
                url: `/${tenantId}/customers/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Customer', id },
                { type: 'Customer', id: 'LIST' },
            ],
        }),
        deleteCustomer: builder.mutation<void, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => ({
                url: `/${tenantId}/customers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetCustomersQuery,
    useGetCustomerQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} = customerApi;
