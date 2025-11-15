import { api } from './apiSlice';
import type { PaginatedResponse } from '../../types';

export interface Notification {
  id: string;
  type: 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'payment_received' | 'customer_added' | 'system_alert';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: 'invoice' | 'payment' | 'customer';
}

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<Notification>, { tenantId: string; unreadOnly?: boolean }>({
      query: ({ tenantId, unreadOnly }) => ({
        url: `/${tenantId}/notifications`,
        params: { unreadOnly },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),
    markAsRead: builder.mutation<void, { tenantId: string; id: string }>({
      query: ({ tenantId, id }) => ({
        url: `/${tenantId}/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markAllAsRead: builder.mutation<void, { tenantId: string }>({
      query: ({ tenantId }) => ({
        url: `/${tenantId}/notifications/read-all`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
