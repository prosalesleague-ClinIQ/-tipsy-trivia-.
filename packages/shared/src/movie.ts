// ============================================================
// TIPSY TRIVIA — Shared Types: Movie Ladder Modes
// ============================================================

export type LadderVariant = 'plot_ladder' | 'cast_ladder';

export type MovieDifficulty =
    | 'trailer_trash'       // Stage B start, MC, 30s
    | 'matinee_brain'       // Stage A start, MC, 25s
    | 'letterboxd_gremlin'  // Stage A start, free text, 20s
    | 'film_school_final';  // Stage A start, free text only, 15s, role_tag hint

export type AnswerMode = 'multiple_choice' | 'free_text';

export type MovieStage = 'A' | 'B' | 'C' | 'D';

export interface MovieQuestionHints {
    actor_3rd: string;
    actor_2nd: string;
    actor_top: string;
    role_tag_optional?: { stage: MovieStage; text: string };
}

export interface MovieQuestion {
    id: string;              // "movie_pl_000001" | "movie_cl_000001"
    mode: LadderVariant;
    title: string;
    year: number;
    mpaa: string;            // 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'NR'
    genres: string[];
    plot_clue?: string;      // Plot Ladder only — must NOT contain title/actor/char names
    hints: MovieQuestionHints;
    choices: string[];       // 4 MC options, correct is always at index 0 pre-shuffle
    answer: string;          // correct title (canonical)
    explain: string;         // one liner, no spoilers
    source_meta: {
        provider: 'tmdb';
        provider_id: number;
        fetched_at: string;
    };
}

export interface MovieModeSettings {
    variant: LadderVariant;
    difficulty: MovieDifficulty;
    answer_mode: AnswerMode;       // overridden to free_text for film_school_final
    year_min: number;
    year_max: number;
    genres: string[];              // [] = all genres
    mpaa: string[];                // [] = all ratings
    question_count: number;        // 5–20
    stage_timer_seconds: number;   // per stage
}

export interface MovieRoomState {
    settings: MovieModeSettings;
    question_ids: string[];        // pre-filtered, pre-shuffled IDs
    question_index: number;
    current_stage: MovieStage;
    stage_start_time: number;      // unix ms
    player_solved: Record<string, MovieStage | null>; // player_id → stage solved at (null = unsolved)
    player_lockout_until: Record<string, number>;     // player_id → unix ms (0 = not locked)
    used_tmdb_ids: number[];
}

// ── Payload types (used in events.ts) ──────────────────────

export interface MovieVisibleHints {
    plot_clue?: string;
    actor_3rd?: string;
    actor_2nd?: string;
    actor_top?: string;
    role_tag?: string;
}

export interface MovieQuestionStartPayload {
    question_id: string;
    question_number: number;
    total: number;
    stage: MovieStage;
    hints_visible: MovieVisibleHints;
    choices?: string[];            // shuffled (MC mode only)
    stage_timer_seconds: number;
    server_time: number;           // unix ms for client-side timer sync
}

export interface MovieStageAdvancePayload {
    question_id: string;
    stage: MovieStage;
    new_hint: { key: string; value: string };
    choices?: string[];            // re-shuffled (MC mode)
    server_time: number;
}

export interface MovieAnswerResultPayload {
    player_id: string;
    correct: boolean;
    delta: number;
    locked_until?: number;         // unix ms (if wrong guess)
    solved_stage?: MovieStage;
}

export interface MovieRevealPayload {
    question_id: string;
    answer: string;
    year: number;
    genres: string[];
    mpaa: string;
    explain: string;
    actor_top: string;
    actor_2nd: string;
    actor_3rd: string;
    scores: import('./types').ScoreEntry[];
}
