import { api } from './apiSlice';
import type { Product, PaginatedResponse, QueryParams } from '../../types';

export interface CreateProductRequest {
    sku: string;
    name: string;
    description?: string;
    price: number;
    vatRate: number;
    unit: string;
    category?: string;
}

export const productApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query<PaginatedResponse<Product>, { tenantId: string } & QueryParams>({
            query: ({ tenantId, ...params }) => ({
                url: `/${tenantId}/products`,
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Product' as const, id })),
                        { type: 'Product', id: 'LIST' },
                    ]
                    : [{ type: 'Product', id: 'LIST' }],
        }),
        getProduct: builder.query<Product, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => `/${tenantId}/products/${id}`,
            providesTags: (result, error, { id }) => [{ type: 'Product', id }],
        }),
        createProduct: builder.mutation<Product, { tenantId: string; data: CreateProductRequest }>({
            query: ({ tenantId, data }) => ({
                url: `/${tenantId}/products`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Product', id: 'LIST' }],
        }),
        updateProduct: builder.mutation<
            Product,
            { tenantId: string; id: string; data: Partial<CreateProductRequest> }
        >({
            query: ({ tenantId, id, data }) => ({
                url: `/${tenantId}/products/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Product', id },
                { type: 'Product', id: 'LIST' },
            ],
        }),
        deleteProduct: builder.mutation<void, { tenantId: string; id: string }>({
            query: ({ tenantId, id }) => ({
                url: `/${tenantId}/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Product', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;
