import { useEffect, useCallback } from 'react';
import { useAppSelector } from './useRedux';
import { socketService } from '../services/socketService';

export const useSocket = () => {
    const { accessToken } = useAppSelector((state) => state.auth);
    const tenantId = useAppSelector((state) => state.auth.user?.tenantId);

    useEffect(() => {
        if (accessToken && tenantId) {
            socketService.connect(accessToken, tenantId);
            socketService.joinTenantRoom(tenantId);

            return () => {
                socketService.leaveTenantRoom(tenantId);
                socketService.disconnect();
            };
        }
    }, [accessToken, tenantId]);

    const onInvoiceCreated = useCallback((callback: (data: unknown) => void) => {
        socketService.onInvoiceCreated(callback);
        return () => socketService.off('invoice:created', callback);
    }, []);

    const onInvoiceUpdated = useCallback((callback: (data: unknown) => void) => {
        socketService.onInvoiceUpdated(callback);
        return () => socketService.off('invoice:updated', callback);
    }, []);

    const onInvoicePaid = useCallback((callback: (data: unknown) => void) => {
        socketService.onInvoicePaid(callback);
        return () => socketService.off('invoice:paid', callback);
    }, []);

    const onInvoiceSent = useCallback((callback: (data: unknown) => void) => {
        socketService.onInvoiceSent(callback);
        return () => socketService.off('invoice:sent', callback);
    }, []);

    const onPaymentReceived = useCallback((callback: (data: unknown) => void) => {
        socketService.onPaymentReceived(callback);
        return () => socketService.off('payment:received', callback);
    }, []);

    const onNotification = useCallback((callback: (data: unknown) => void) => {
        socketService.onNotification(callback);
        return () => socketService.off('notification', callback);
    }, []);

    const onCustomerCreated = useCallback((callback: (data: unknown) => void) => {
        socketService.onCustomerCreated(callback);
        return () => socketService.off('customer:created', callback);
    }, []);

    const onAllegroOrderSynced = useCallback((callback: (data: unknown) => void) => {
        socketService.onAllegroOrderSynced(callback);
        return () => socketService.off('allegro:order-synced', callback);
    }, []);

    const isConnected = useCallback(() => {
        return socketService.isConnected();
    }, []);

    const emit = useCallback((event: string, data: unknown) => {
        socketService.emit(event, data);
    }, []);

    return {
        onInvoiceCreated,
        onInvoiceUpdated,
        onInvoicePaid,
        onInvoiceSent,
        onPaymentReceived,
        onNotification,
        onCustomerCreated,
        onAllegroOrderSynced,
        isConnected,
        emit,
    };
};
