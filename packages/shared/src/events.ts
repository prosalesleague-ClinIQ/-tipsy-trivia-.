// ============================================================
// TIPSY TRIVIA — Shared Types: Socket.io Event Schema
// ============================================================

import type { Room, Player, HostConfig, HostScript, ScoreEntry, RoomSettings } from './types';
import type { Question } from './question';
import type {
    MovieQuestionStartPayload,
    MovieStageAdvancePayload,
    MovieAnswerResultPayload,
    MovieRevealPayload,
    MovieModeSettings,
} from './movie';

// ---- Payloads (client → server) ----

export interface RoomCreatePayload {
    host_name: string;
}

export interface RoomJoinPayload {
    code: string;
    player_name: string;
    session_token?: string;    // For reconnect
}

export interface PlayerRenamePayload {
    name: string;
}

export interface GameStartPayload {
    mode: string;
    settings: Partial<RoomSettings>;
}

export interface AnswerSubmitPayload {
    question_id: string;
    answer_index: number;
    client_time_ms: number;
}

export interface AnswerTypedPayload {
    question_id: string;
    answer_text: string;
}

export interface BuzzerPressPayload {
    question_id: string;
    client_time_ms: number;
}

export interface WagerSubmitPayload {
    question_id: string;
    wager: number;
}

export interface JeopardyPickPayload {
    category_index: number;
    value_index: number;
}

export interface AdRewardGrantPayload {
    player_id: string;
}

export interface HostConfigPayload {
    config: HostConfig;
}

export interface SettingsUpdatePayload {
    settings: Partial<RoomSettings>;
}

// ---- Payloads (server → client) ----

export interface RoomCreatedPayload {
    room_code: string;
    host_token: string;
}

export interface RoomJoinedPayload {
    room: Room;
    your_player: Player;
    session_token: string;
}

export interface RoomErrorPayload {
    code: string;
    message: string;
}

export interface PlayerListPayload {
    players: Player[];
}

export interface HostScriptReadyPayload {
    script: HostScript;
}

export interface QuestionShowPayload {
    question: Question;
    question_number: number;
    total_questions: number;
    server_time: number;      // unix ms when question shown
    buzzer_mode: boolean;
}

export interface AnswerRevealPayload {
    question_id: string;
    correct_index: number;
    explanation: string;
    hook_line: string;
    why_weird: string;
    source_title: string;
    source_url: string;
    scores: ScoreEntry[];
    host_reaction: string;
}

export interface BuzzerLockPayload {
    winner_id: string;
    winner_name: string;
    locked_at: number;
}

export interface ScoreboardUpdatePayload {
    scores: ScoreEntry[];
    round: number;
}

export interface RoundAdvancePayload {
    round: number;
    category?: string;
    host_intro?: string;
}

export interface JeopardyBoardPayload {
    board: import('./types').JeopardyCell[][];
    controller_id: string;
}

export interface GameEndPayload {
    scores: ScoreEntry[];
    winner_id: string;
    winner_name: string;
    host_wrap: string;
    host_winner_roast: string;
}

export interface LadderStepPayload {
    player_id: string;
    step: number;
    strikes_remaining: number;
    score: number;
}

// ============================================================
// Event Maps for socket.io strong typing
// ============================================================

export interface ServerToClientEvents {
    'room:created': (data: RoomCreatedPayload) => void;
    'room:joined': (data: RoomJoinedPayload) => void;
    'room:error': (data: RoomErrorPayload) => void;
    'room:updated': (data: { room: Room }) => void;
    'player:list': (data: PlayerListPayload) => void;
    'player:joined': (data: { player: Player }) => void;
    'player:left': (data: { player_id: string }) => void;
    'player:reconnected': (data: { player: Player }) => void;
    'host:script': (data: HostScriptReadyPayload) => void;
    'question:show': (data: QuestionShowPayload) => void;
    'question:tick': (data: { remaining_ms: number }) => void;
    'answer:reveal': (data: AnswerRevealPayload) => void;
    'answer:acknowledged': (data: { player_id: string; answer_index: number }) => void;
    'buzzer:lock': (data: BuzzerLockPayload) => void;
    'buzzer:fail': (data: { player_id: string }) => void;
    'round:advance': (data: RoundAdvancePayload) => void;
    'scoreboard:update': (data: ScoreboardUpdatePayload) => void;
    'jeopardy:board': (data: JeopardyBoardPayload) => void;
    'jeopardy:pick': (data: { category_index: number; value_index: number }) => void;
    'jeopardy:daily_double': (data: { player_id: string }) => void;
    'jeopardy:final': (data: { question: Question }) => void;
    'ladder:step': (data: LadderStepPayload) => void;
    'ladder:run_end': (data: { player_id: string; final_score: number; steps: number }) => void;
    'ad:reward:confirm': (data: { player_id: string; extra_strikes: number }) => void;
    'game:end': (data: GameEndPayload) => void;
    'game:mode_selected': (data: { mode: string }) => void;
    'settings:updated': (data: { settings: RoomSettings }) => void;
    'error': (data: { message: string }) => void;
    // Movie Ladder events (server → client)
    'movie:question_start': (data: MovieQuestionStartPayload) => void;
    'movie:stage_advance': (data: MovieStageAdvancePayload) => void;
    'movie:answer_result': (data: MovieAnswerResultPayload) => void;
    'movie:reveal': (data: MovieRevealPayload) => void;
}

export interface ClientToServerEvents {
    'room:create': (data: RoomCreatePayload, cb: (res: RoomCreatedPayload | { error: string }) => void) => void;
    'room:join': (data: RoomJoinPayload, cb: (res: RoomJoinedPayload | { error: string }) => void) => void;
    'room:spectate': (data: { code: string }) => void;
    'player:rename': (data: PlayerRenamePayload) => void;
    'host:config': (data: HostConfigPayload) => void;
    'game:start': (data: GameStartPayload) => void;
    'game:mode_select': (data: { mode: string }) => void;
    'settings:update': (data: SettingsUpdatePayload) => void;
    'question:show_next': () => void;
    'answer:submit': (data: AnswerSubmitPayload) => void;
    'answer:typed': (data: AnswerTypedPayload) => void;
    'buzzer:press': (data: BuzzerPressPayload) => void;
    'wager:submit': (data: WagerSubmitPayload) => void;
    'jeopardy:pick': (data: JeopardyPickPayload) => void;
    'round:advance': () => void;
    'ad:reward:request': (data: { player_id: string }) => void;
    'ad:reward:complete': (data: AdRewardGrantPayload) => void;
    // Movie Ladder events (client → server)
    'movie:answer': (data: { question_id: string; answer: string | number; client_time_ms: number }) => void;
    'movie:hint_advance': () => void;  // Host only: force advance to next stage
    'movie:start': (data: { settings: MovieModeSettings }) => void;
}
