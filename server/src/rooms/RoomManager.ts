import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';
import type { Room, Player, RoomSettings } from '@tipsy-trivia/shared';
import { v4 as uuidv4 } from 'uuid';
import { GameStateMachine } from '../state/GameStateMachine';

export class RoomManager {
    private rooms = new Map<string, Room>();
    private sessionToRoom = new Map<string, string>(); // session_token → room_code
    private io: Server<ClientToServerEvents, ServerToClientEvents>;

    constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
        this.io = io;
    }

    generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        do {
            code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        } while (this.rooms.has(code));
        return code;
    }

    defaultSettings(): RoomSettings {
        return {
            max_players: 12,
            question_timer_seconds: 12,
            buzzer_enabled: false,
            buzzer_passdown: true,
            rapid_fire_penalty: false,
            rapid_fire_per_player: false,
            difficulty: 'Medium',
            content_rating: 'adult',
            ladder_difficulty: 'Medium',
            jeopardy_daily_double: true,
            jeopardy_final_typed: false,
            large_text_mode: false,
            colorblind_mode: false,
            reduced_motion: false,
            parental_ad_gate: false,
        };
    }

    createRoom(hostSocketId: string): Room {
        const code = this.generateCode();
        const room: Room = {
            code,
            host_socket_id: hostSocketId,
            players: {},
            spectator_ids: [],
            phase: 'lobby',
            mode: null,
            host_config: null,
            current_round: 0,
            total_rounds: 3,
            current_question_id: null,
            question_start_time: null,
            buzzer_winner_id: null,
            buzzer_locked: false,
            jeopardy_board: null,
            jeopardy_controller_id: null,
            used_fact_hashes: [],
            created_at: Date.now(),
            settings: this.defaultSettings(),
            movie_state: null,
        };
        this.rooms.set(code, room);
        return room;
    }

    joinRoom(code: string, socketId: string, playerName: string, sessionToken?: string): {
        room: Room; player: Player; token: string; error?: string;
    } | { error: string } {
        const room = this.rooms.get(code.toUpperCase());
        if (!room) return { error: 'Room not found' };

        // Reconnect by session token
        if (sessionToken && this.sessionToRoom.get(sessionToken) === code) {
            const existing = Object.values(room.players).find(p => p.session_token === sessionToken);
            if (existing) {
                existing.status = 'active';
                const token = sessionToken;
                return { room, player: existing, token };
            }
        }

        const activePlayers = Object.values(room.players).filter(p => p.status === 'active');
        if (activePlayers.length >= room.settings.max_players) return { error: 'Room is full' };

        const cleanName = playerName.trim().slice(0, 20) || 'Player';
        const token = uuidv4();
        const player: Player = {
            id: socketId,
            session_token: token,
            name: cleanName,
            avatar_seed: uuidv4(),
            score: 0,
            streak: 0,
            strikes: 3,
            ladder_step: 0,
            status: 'active',
            answered: false,
            answer_index: null,
            answer_time_ms: null,
            wager: null,
            buzzed_at: null,
            movie_locked_until: null,
            movie_solved_stage: null,
        };

        room.players[socketId] = player;
        this.sessionToRoom.set(token, code);

        return { room, player, token };
    }

    getRoom(code: string): Room | undefined {
        return this.rooms.get(code);
    }

    getRoomBySocket(socketId: string): Room | undefined {
        for (const room of this.rooms.values()) {
            if (room.host_socket_id === socketId || room.players[socketId]) {
                return room;
            }
        }
        return undefined;
    }

    removePlayer(socketId: string): void {
        const room = this.getRoomBySocket(socketId);
        if (!room) return;
        if (room.players[socketId]) {
            room.players[socketId].status = 'disconnected';
        }
    }

    addSpectator(code: string, socketId: string): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;
        if (!room.spectator_ids.includes(socketId)) {
            room.spectator_ids.push(socketId);
        }
        return room;
    }

    deleteRoom(code: string): void {
        this.rooms.delete(code);
    }

    broadcastRoom(room: Room): void {
        this.io.to(room.code).emit('room:updated', { room });
    }

    broadcastScores(room: Room): void {
        const scores = Object.values(room.players)
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({
                player_id: p.id,
                player_name: p.name,
                score: p.score,
                delta: 0,
                rank: i + 1,
            }));
        this.io.to(room.code).emit('scoreboard:update', {
            scores,
            round: room.current_round,
        });
    }
}
