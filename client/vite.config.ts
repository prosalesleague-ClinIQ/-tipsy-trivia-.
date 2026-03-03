import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/socket.io': {
                target: process.env.VITE_SERVER_URL ?? 'http://localhost:3001',
                changeOrigin: true,
                ws: true,
            },
            '/admin': {
                target: process.env.VITE_SERVER_URL ?? 'http://localhost:3001',
                changeOrigin: true,
            },
            '/health': {
                target: process.env.VITE_SERVER_URL ?? 'http://localhost:3001',
                changeOrigin: true,
            },
            '/tts': {
                target: process.env.VITE_SERVER_URL ?? 'http://localhost:3001',
                changeOrigin: true,
            },
            '/local-ip': {
                target: process.env.VITE_SERVER_URL ?? 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
