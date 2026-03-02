import 'dotenv/config';
import http from 'http';
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
