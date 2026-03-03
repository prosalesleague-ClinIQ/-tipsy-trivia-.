// ============================================================
// TIPSY TRIVIA — Shared Types: Game State
// ============================================================

import type { Difficulty } from './question';
import type { MovieRoomState, MovieStage } from './movie';

export type GameMode = 'trivia_categories' | 'rapid_fire' | 'jeopardy' | 'legacy_ladder' | 'plot_ladder' | 'cast_ladder';

export type GamePhase =
    | 'lobby'
    | 'comedian_setup'
    | 'mode_select'
    | 'round_intro'
    | 'question'
    | 'buzzer_wait'
    | 'buzzer_answer'
    | 'answer_reveal'
    | 'round_end'
    | 'jeopardy_board'
    | 'jeopardy_daily_double'
    | 'jeopardy_final'
    | 'ladder_result'
    | 'final_scoreboard'
    | 'movie_stage'
    | 'movie_reveal';

export type PlayerStatus = 'active' | 'disconnected' | 'spectating';

export interface Player {
    id: string;
    session_token: string;
    name: string;
    avatar_seed: string;
    score: number;
    streak: number;
    strikes: number;          // Legacy Ladder
    ladder_step: number;      // Legacy Ladder
    status: PlayerStatus;
    answered: boolean;
    answer_index: number | null;
    answer_time_ms: number | null;
    wager: number | null;     // Jeopardy Daily Double / Final
    buzzed_at: number | null; // unix ms for buzzer
    movie_locked_until: number | null;   // unix ms lockout end (Movie Ladder)
    movie_solved_stage: MovieStage | null; // stage at which player solved (Movie Ladder)
}

export interface ScoreEntry {
    player_id: string;
    player_name: string;
    score: number;
    delta: number;
    rank: number;
}

export interface JeopardyCell {
    category: string;
    value: number;
    question_id: string;
    answered: boolean;
    daily_double: boolean;
}

export interface Room {
    code: string;
    host_socket_id: string;
    players: Record<string, Player>;
    spectator_ids: string[];
    phase: GamePhase;
    mode: GameMode | null;
    host_config: HostConfig | null;
    current_round: number;
    total_rounds: number;
    current_question_id: string | null;
    question_start_time: number | null;
    buzzer_winner_id: string | null;
    buzzer_locked: boolean;
    jeopardy_board: JeopardyCell[][] | null;
    jeopardy_controller_id: string | null;
    used_fact_hashes: string[];
    created_at: number;
    settings: RoomSettings;
    movie_state: MovieRoomState | null; // null when not in movie mode
}

export type ContentRating = 'family' | 'adult' | 'spicy';

export interface RoomSettings {
    max_players: number;          // 2–12
    question_timer_seconds: number;
    buzzer_enabled: boolean;
    buzzer_passdown: boolean;
    rapid_fire_penalty: boolean;
    rapid_fire_per_player: boolean;
    difficulty: Difficulty;
    content_rating: ContentRating;
    ladder_difficulty: 'Easy' | 'Medium' | 'Hard' | 'Genius';
    jeopardy_daily_double: boolean;
    jeopardy_final_typed: boolean;
    large_text_mode: boolean;
    colorblind_mode: boolean;
    reduced_motion: boolean;
    parental_ad_gate: boolean;
}

export interface HostConfig {
    presets: ComedianPreset[];    // 1–3 selected
    preset_weights: number[];     // 0–100 each
    roast_level: 'mild' | 'medium' | 'spicy';
    pace: 'slow' | 'normal' | 'fast';
}

export interface ComedianPreset {
    id: string;
    name: string;
    style_tags: string[];  // ['observational','self-deprecating','fast-paced']
    energy: 'low' | 'medium' | 'high';
}

export interface HostScript {
    opening_monologue: string;
    player_intros: Record<string, string>;
    mode_intro: string;
    reaction_correct: string[];
    reaction_wrong: string[];
    reaction_close_call: string[];
    reaction_buzzer_win: string[];
    reaction_buzzer_fail: string[];
    end_game_wrap: string;
    winner_roast: string;
}

export interface AdReward {
    player_id: string;
    room_code: string;
    granted_at: number;
    extra_strikes: number;
}
