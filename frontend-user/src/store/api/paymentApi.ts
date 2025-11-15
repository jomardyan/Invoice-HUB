import { api } from './apiSlice';
import type { Payment, PaginatedResponse, QueryParams } from '../../types';

export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<PaginatedResponse<Payment>, { tenantId: string } & QueryParams>({
      query: ({ tenantId, ...params }) => ({
        url: `/${tenantId}/payments`,
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Payment' as const, id })),
              { type: 'Payment', id: 'LIST' },
            ]
          : [{ type: 'Payment', id: 'LIST' }],
    }),
    getPayment: builder.query<Payment, { tenantId: string; id: string }>({
      query: ({ tenantId, id }) => `/${tenantId}/payments/${id}`,
      providesTags: (result, error, { id }) => [{ type: 'Payment', id }],
    }),
    createPayment: builder.mutation<Payment, { tenantId: string; data: CreatePaymentRequest }>({
      query: ({ tenantId, data }) => ({
        url: `/${tenantId}/payments`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Payment', id: 'LIST' },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    deletePayment: builder.mutation<void, { tenantId: string; id: string }>({
      query: ({ tenantId, id }) => ({
        url: `/${tenantId}/payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Payment', id: 'LIST' },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
} = paymentApi;
