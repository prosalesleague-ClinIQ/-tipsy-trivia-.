import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';
import { RoomManager } from '../rooms/RoomManager';
import { GameStateMachine } from '../state/GameStateMachine';
import { MovieLadderStateMachine } from '../state/MovieLadderStateMachine';
import { COMEDIAN_PRESETS } from '../host/ComedianHostEngine';
import { AdRewardManager } from '../ads/AdRewardManager';

export function registerSocketHandlers(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomManager: RoomManager,
): void {
    const stateMachine = new GameStateMachine(io);
    const movieMachine = new MovieLadderStateMachine(io);
    const adManager = new AdRewardManager();

    // Rate limiting state (per socket)
    const buzzerCooldowns = new Map<string, number>();
    const BUZZER_COOLDOWN_MS = 500;

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // ─── Room: Create ─────────────────────────────────────────
        socket.on('room:create', (data, cb) => {
            try {
                const room = roomManager.createRoom(socket.id);
                socket.join(room.code);
                cb({ room_code: room.code, host_token: `host_${socket.id}` });
                console.log(`Room created: ${room.code}`);
            } catch (err) {
                cb({ error: 'Failed to create room' });
            }
        });

        // ─── Room: Join ──────────────────────────────────────────
        socket.on('room:join', (data, cb) => {
            const result = roomManager.joinRoom(data.code, socket.id, data.player_name, data.session_token);
            if ('error' in result) {
                cb({ error: result.error ?? 'Unknown error' });
                return;
            }
            const { room, player, token } = result;
            socket.join(room.code);
            cb({ room, your_player: player, session_token: token });

            // Broadcast updated room to everyone so host lobby and player waiting lists refresh
            io.to(room.code).emit('room:updated', { room });
            socket.to(room.code).emit('player:joined', { player });
        });

        // ─── Room: Spectate ───────────────────────────────────────
        socket.on('room:spectate', (data) => {
            const room = roomManager.addSpectator(data.code, socket.id);
            if (room) {
                socket.join(room.code);
                socket.emit('room:updated', { room });
            }
        });

        // ─── Player: Rename ───────────────────────────────────────
        socket.on('player:rename', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room) return;
            const player = room.players[socket.id];
            if (!player) return;
            player.name = data.name.slice(0, 20) || player.name;
            socket.to(room.code).emit('player:list', { players: Object.values(room.players) });
        });

        // ─── Host: Config (comedian setup) ────────────────────────
        socket.on('host:config', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            room.host_config = data.config;
            io.to(room.code).emit('room:updated', { room });
        });

        // ─── Settings: Update ─────────────────────────────────────
        socket.on('settings:update', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            Object.assign(room.settings, data.settings);
            io.to(room.code).emit('settings:updated', { settings: room.settings });
        });

        // ─── Game: Mode Select ────────────────────────────────────
        socket.on('game:mode_select', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            room.mode = data.mode as any;
            io.to(room.code).emit('game:mode_selected', { mode: data.mode });
        });

        // ─── Game: Start ──────────────────────────────────────────
        socket.on('game:start', async (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            if (room.phase !== 'lobby' && room.phase !== 'mode_select') return;

            room.mode = data.mode as any;
            if (data.settings) Object.assign(room.settings, data.settings);

            await stateMachine.startGame(room);
            io.to(room.code).emit('room:updated', { room });
        });

        // ─── Movie: Start ─────────────────────────────────────────
        socket.on('movie:start', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            if (room.phase !== 'lobby' && room.phase !== 'mode_select') return;
            movieMachine.startMovieGame(room, data.settings);
        });

        // ─── Jeopardy: Cursor (D-Pad navigation) ─────────────────────
        socket.on('jeopardy:cursor', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room) return;
            // Broadcast cursor to everyone (mainly Host TV)
            if (room.jeopardy_controller_id === socket.id) {
                io.to(room.code).emit('jeopardy:cursor', data);
            }
        });

        // ─── Jeopardy: Pick ─────────────────────────────────────────
        socket.on('jeopardy:pick', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.jeopardy_controller_id !== socket.id) return;
            stateMachine.processJeopardyPick(room, socket.id, data.category_index, data.value_index);
        });
        // ─── Categories ─────────────────────────────────────────────
        socket.on('categories:list', () => {
            const categories = stateMachine.getCategories();
            socket.emit('categories:list', { categories });
        });

        // ─── Movie: Answer (player) ───────────────────────────────
        socket.on('movie:answer', (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.phase !== 'movie_stage') return;
            const ms = room.movie_state;
            if (!ms || data.question_id !== ms.question_ids[ms.question_index]) return;
            movieMachine.processMovieAnswer(room, socket.id, data.answer, data.client_time_ms);
        });

        // ─── Movie: Hint Advance (host only) ─────────────────────
        socket.on('movie:hint_advance', () => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            if (room.phase !== 'movie_stage') return;
            movieMachine.advanceStage(room);
        });

        // ─── Answer: Submit ───────────────────────────────────────
        socket.on('answer:submit', async (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || !room.current_question_id) return;
            if (data.question_id !== room.current_question_id) return;
            await stateMachine.processAnswer(room, socket.id, data.answer_index, data.client_time_ms);
        });

        // ─── Buzzer: Press ────────────────────────────────────────
        socket.on('buzzer:press', async (data) => {
            const lastBuzz = buzzerCooldowns.get(socket.id) ?? 0;
            if (Date.now() - lastBuzz < BUZZER_COOLDOWN_MS) return; // rate limit
            buzzerCooldowns.set(socket.id, Date.now());

            const room = roomManager.getRoomBySocket(socket.id);
            if (!room) return;
            await stateMachine.processBuzzer(room, socket.id, data.client_time_ms);
        });

        // ─── Round: Advance (host trigger) ────────────────────────
        socket.on('round:advance', async () => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            if (room.phase === 'answer_reveal' || room.phase === 'round_end') {
                await stateMachine.showNextQuestion(room);
            }
        });

        // ─── Question: Show Next (host) ───────────────────────────
        socket.on('question:show_next', async () => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || room.host_socket_id !== socket.id) return;
            await stateMachine.showNextQuestion(room);
        });

        // ─── Ad: Reward ───────────────────────────────────────────
        socket.on('ad:reward:complete', async (data) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room) return;
            const result = await adManager.grantReward(data.player_id, room);
            if (result.success) {
                io.to(room.code).emit('ad:reward:confirm', {
                    player_id: data.player_id,
                    extra_strikes: result.extra_strikes,
                });
            }
        });

        // ─── Disconnect ───────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            const room = roomManager.getRoomBySocket(socket.id);
            if (room) {
                // If host disconnects from a movie game, clean up timers
                if (room.host_socket_id === socket.id && room.movie_state) {
                    movieMachine.cleanup(room.code);
                }
                io.to(room.code).emit('player:left', { player_id: socket.id });
            }
            roomManager.removePlayer(socket.id);
            buzzerCooldowns.delete(socket.id);
        });
    });
}
