import { api } from './apiSlice';
import type { Invoice, PaginatedResponse, QueryParams } from '../../types';

export interface CreateInvoiceRequest {
    companyId: string;
    customerId: string;
    invoiceType: string;
    issueDate: string;
    dueDate: string;
    paymentMethod: string;
    currency: string;
    subtotal: number;
    totalVat: number;
    totalAmount: number;
    status?: string;
    items: Array<{
        productId?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        netAmount: number;
        vatAmount: number;
        grossAmount: number;
    }>;
    notes?: string;
    terms?: string;
    internalNotes?: string;
}

export const invoiceApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getInvoices: builder.query<PaginatedResponse<Invoice>, { tenantId: string } & QueryParams>({
            query: ({ tenantId, ...params }) => ({
                url: `/${tenantId}/invoices`,
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Invoice' as const, id })),
                        { type: 'Invoice', id: 'LIST' },
                    ]
                    : [{ type: 'Invoice', id: 'LIST' }],
        }),
        getInvoice: builder.query<Invoice, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => `/${tenantId}/invoices/${id}`,
            providesTags: (result, error, { id }) => [{ type: 'Invoice', id }],
        }),
        createInvoice: builder.mutation<Invoice, { tenantId: string; data: CreateInvoiceRequest }>({
            query: ({ tenantId, data }) => ({
                url: `/${tenantId}/invoices`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
        }),
        updateInvoice: builder.mutation<
            Invoice,
            { tenantId: string; id: string; data: Partial<CreateInvoiceRequest> }
        >({
            query: ({ tenantId, id, data }) => ({
                url: `/${tenantId}/invoices/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Invoice', id },
                { type: 'Invoice', id: 'LIST' },
            ],
        }),
        deleteInvoice: builder.mutation<void, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => ({
                url: `/${tenantId}/invoices/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
        }),
        sendInvoice: builder.mutation<void, { tenantId: string; id: string; email: string }>({
            query: ({ tenantId, id, email }) => ({
                url: `/${tenantId}/invoices/${id}/send`,
                method: 'POST',
                body: { email },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Invoice', id }],
        }),
        downloadInvoicePdf: builder.query<Blob, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => ({
                url: `/${tenantId}/invoices/${id}/pdf`,
                responseHandler: (response) => response.blob(),
            }),
        }),
    }),
});

export const {
    useGetInvoicesQuery,
    useGetInvoiceQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation,
    useSendInvoiceMutation,
    useLazyDownloadInvoicePdfQuery,
} = invoiceApi;
