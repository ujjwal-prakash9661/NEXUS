import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/contexts/AuthContext";

class SocketService {
    public socket: Socket | null = null;

    private listeners: Map<string, Function[]> = new Map();

    connect(token: string) {
        if (this.socket) return;

        // Remove /api if present to get base URL
        const SOCKET_URL = API_BASE_URL.replace('/api', '');

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
            console.log("Socket Service Connected:", this.socket?.id);
            this.attachPendingListeners();
        });

        this.socket.on("connect_error", (err) => {
            console.error("Socket Service Error:", err);
        });

        // Attach any listeners added before connection
        this.attachPendingListeners();
    }

    private attachPendingListeners() {
        if (!this.socket) return;

        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(cb => {
                // Remove existing to avoid duplicates if re-attaching
                this.socket?.off(event, cb as any);
                this.socket?.on(event, cb as any);
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }

        // Store in map for reconnection or init
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    off(event: string, callback?: (...args: any[]) => void) {
        this.socket?.off(event, callback);

        if (callback && this.listeners.has(event)) {
            const cbs = this.listeners.get(event) || [];
            this.listeners.set(event, cbs.filter(cb => cb !== callback));
        } else if (!callback) {
            this.listeners.delete(event);
        }
    }
}

export const socketService = new SocketService();
