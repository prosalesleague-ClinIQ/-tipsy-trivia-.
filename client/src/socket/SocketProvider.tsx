import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
    socket: AppSocket | null;
    connected: boolean;
    warmupStatus: 'idle' | 'warming' | 'ready' | 'failed';
}

let SERVER_URL = (import.meta.env.VITE_SERVER_URL ?? '').trim();
// If env forces localhost but player is on LAN (192.168.*), force use of Vite proxy
if (SERVER_URL.includes('localhost') && window.location.hostname !== 'localhost') {
    SERVER_URL = '';
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false, warmupStatus: 'idle' });

/**
 * Ping the server /health endpoint until it responds (handles Render cold starts).
 * Retries every 3s for up to 90s total.
 */
async function warmupServer(signal: AbortSignal): Promise<boolean> {
    const healthUrl = `${SERVER_URL}/health`;
    const maxAttempts = 30; // 30 × 3s = 90s
    for (let i = 0; i < maxAttempts; i++) {
        if (signal.aborted) return false;
        try {
            const res = await fetch(healthUrl, {
                signal,
                mode: 'cors',
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });
            if (res.ok) return true;
        } catch {
            // server still waking up — keep trying
        }
        await new Promise((r) => setTimeout(r, 3000));
    }
    return false;
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<AppSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [warmupStatus, setWarmupStatus] = useState<'idle' | 'warming' | 'ready' | 'failed'>('idle');

    const connect = useCallback(() => {
        const s: AppSocket = io(SERVER_URL, {
            transports: ['polling', 'websocket'], // Try polling first to pass headers
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 30000,
            extraHeaders: {
                'Bypass-Tunnel-Reminder': 'true'
            }
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
        return s;
    }, []);

    useEffect(() => {
        const abort = new AbortController();

        setWarmupStatus('warming');
        warmupServer(abort.signal).then((ok) => {
            if (abort.signal.aborted) return;
            setWarmupStatus(ok ? 'ready' : 'failed');
            // Connect socket regardless — server may have become reachable
            const s = connect();
            return () => { s.disconnect(); };
        });

        return () => {
            abort.abort();
            // Clean up any socket created
            setSocket((prev) => { prev?.disconnect(); return null; });
        };
    }, [connect]);

    return (
        <SocketContext.Provider value={{ socket, connected, warmupStatus }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
