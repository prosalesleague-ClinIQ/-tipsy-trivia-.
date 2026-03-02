import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
    socket: AppSocket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<AppSocket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
        const s: AppSocket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        s.on('connect', () => {
            console.log('Socket connected:', s.id);
            setConnected(true);
        });
        s.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        setSocket(s);
        return () => { s.disconnect(); };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
