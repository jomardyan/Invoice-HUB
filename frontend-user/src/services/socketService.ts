import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(token: string, tenantId: string): void {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3000';

        this.socket = io(socketUrl, {
            auth: {
                token,
                tenantId,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.disconnect();
            }
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    // Invoice events
    onInvoiceCreated(callback: (data: unknown) => void): void {
        this.socket?.on('invoice:created', callback);
    }

    onInvoiceUpdated(callback: (data: unknown) => void): void {
        this.socket?.on('invoice:updated', callback);
    }

    onInvoicePaid(callback: (data: unknown) => void): void {
        this.socket?.on('invoice:paid', callback);
    }

    onInvoiceSent(callback: (data: unknown) => void): void {
        this.socket?.on('invoice:sent', callback);
    }

    // Payment events
    onPaymentReceived(callback: (data: unknown) => void): void {
        this.socket?.on('payment:received', callback);
    }

    // Notification events
    onNotification(callback: (data: unknown) => void): void {
        this.socket?.on('notification', callback);
    }

    // Customer events
    onCustomerCreated(callback: (data: unknown) => void): void {
        this.socket?.on('customer:created', callback);
    }

    // Allegro events
    onAllegroOrderSynced(callback: (data: unknown) => void): void {
        this.socket?.on('allegro:order-synced', callback);
    }

    // Join tenant room
    joinTenantRoom(tenantId: string): void {
        this.socket?.emit('join:tenant', { tenantId });
    }

    // Leave tenant room
    leaveTenantRoom(tenantId: string): void {
        this.socket?.emit('leave:tenant', { tenantId });
    }

    // Remove specific event listener
    off(event: string, callback?: (...args: unknown[]) => void): void {
        if (callback) {
            this.socket?.off(event, callback);
        } else {
            this.socket?.off(event);
        }
    }

    // Disconnect
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Get connection status
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // Emit custom event
    emit(event: string, data: unknown): void {
        this.socket?.emit(event, data);
    }
}

export const socketService = new SocketService();
