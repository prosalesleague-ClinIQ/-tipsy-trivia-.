import 'dotenv/config';
import http from 'http';
import { networkInterfaces } from 'os';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';
import { RoomManager } from './rooms/RoomManager';
import { registerSocketHandlers } from './socket/handlers';
import { adminRouter } from './api/admin';
import { initDB } from './db/database';
import { seedDatabase } from './seed/seed';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CORS_ORIGINS_ENV = process.env.CORS_ORIGINS ?? 'http://localhost:5173';
const CORS_ORIGINS = CORS_ORIGINS_ENV === '*' ? '*' : CORS_ORIGINS_ENV.split(',');

async function main() {
    // Initialize database
    initDB();
    await seedDatabase();

    const app = express();

    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
    app.use(express.json({ limit: '5mb' }));

    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', uptime: process.uptime() });
    });

    // Local network IP — used by client to build phone QR code
    app.get('/local-ip', (_req, res) => {
        const nets = networkInterfaces();
        for (const iface of Object.values(nets)) {
            for (const net of iface ?? []) {
                if (net.family === 'IPv4' && !net.internal) {
                    res.json({ ip: net.address });
                    return;
                }
            }
        }
        res.json({ ip: 'localhost' });
    });

    // ElevenLabs TTS proxy — keeps API key server-side
    app.post('/tts', async (req, res) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            res.status(503).json({ error: 'TTS_NOT_CONFIGURED' });
            return;
        }
        const { text, voice_id, model_id, voice_settings } = req.body as {
            text: string;
            voice_id: string;
            model_id: string;
            voice_settings: Record<string, unknown>;
        };
        try {
            const upstream = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
                {
                    method: 'POST',
                    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, model_id, voice_settings }),
                },
            );
            if (!upstream.ok) {
                res.status(upstream.status).json({ error: 'TTS upstream error' });
                return;
            }
            res.set('Content-Type', 'audio/mpeg');
            const buf = await upstream.arrayBuffer();
            res.send(Buffer.from(buf));
        } catch {
            res.status(500).json({ error: 'TTS request failed' });
        }
    });

    // Admin API
    app.use('/admin', adminRouter);

    const httpServer = http.createServer(app);

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
        cors: {
            origin: CORS_ORIGINS,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingInterval: 10000,
        pingTimeout: 5000,
    });

    const roomManager = new RoomManager(io);
    registerSocketHandlers(io, roomManager);

    httpServer.listen(PORT, () => {
        console.log(`🍺 Tipsy Trivia server running on port ${PORT}`);
        console.log(`   Admin panel: http://localhost:${PORT}/admin`);
    });
}

main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
