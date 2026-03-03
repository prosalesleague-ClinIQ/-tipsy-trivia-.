// ============================================================
// TIPSY TRIVIA — Movie Ladder State Machine
// Handles Plot Ladder and Cast Ladder game modes
// ============================================================

import type { Room, ScoreEntry } from '@tipsy-trivia/shared';
import type {
    MovieQuestion,
    MovieModeSettings,
    MovieRoomState,
    MovieStage,
    MovieVisibleHints,
} from '@tipsy-trivia/shared';
import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';
import { MovieQuestionManager } from '../movie/MovieQuestionManager';
import { matches as fuzzyMatches } from '../movie/FuzzyMatcher';

const STAGE_POINTS: Record<MovieStage, number> = { A: 100, B: 70, C: 40, D: 20 };
const WRONG_PENALTY = 10;
const LOCKOUT_MS = 4000;
const MAX_SPEED_BONUS = 20;

// Ordered stage sequences per variant
const PLOT_STAGES: MovieStage[] = ['A', 'B', 'C', 'D'];
const CAST_STAGES: MovieStage[] = ['A', 'B', 'C'];

function getStages(variant: string): MovieStage[] {
    return variant === 'plot_ladder' ? PLOT_STAGES : CAST_STAGES;
}

function nextStage(variant: string, current: MovieStage): MovieStage | null {
    const stages = getStages(variant);
    const idx = stages.indexOf(current);
    return idx < stages.length - 1 ? stages[idx + 1] : null;
}

/** Build the cumulative hints visible at a given stage */
function buildHints(q: MovieQuestion, stage: MovieStage, isFSF: boolean): MovieVisibleHints {
    const hints: MovieVisibleHints = {};
    const stages = getStages(q.mode);
    const stageIdx = stages.indexOf(stage);

    if (q.mode === 'plot_ladder') {
        // Stage A+: always show plot_clue
        hints.plot_clue = q.plot_clue;
        // Stage B: + actor_3rd
        if (stageIdx >= 1) hints.actor_3rd = q.hints.actor_3rd;
        // Stage C: + actor_2nd
        if (stageIdx >= 2) hints.actor_2nd = q.hints.actor_2nd;
        // Stage D: + actor_top
        if (stageIdx >= 3) hints.actor_top = q.hints.actor_top;
    } else {
        // cast_ladder
        if (stageIdx >= 0) {
            // Stage A: actor_3rd (or role_tag for Film School Final)
            if (isFSF && q.hints.role_tag_optional) {
                hints.role_tag = q.hints.role_tag_optional.text;
            } else {
                hints.actor_3rd = q.hints.actor_3rd;
            }
        }
        if (stageIdx >= 1) hints.actor_2nd = q.hints.actor_2nd;
        if (stageIdx >= 2) hints.actor_top = q.hints.actor_top;
    }

    return hints;
}

/** Key and value for the NEW hint introduced at a given stage */
function newHintAt(q: MovieQuestion, stage: MovieStage, isFSF: boolean): { key: string; value: string } {
    if (q.mode === 'plot_ladder') {
        if (stage === 'A') return { key: 'plot_clue', value: q.plot_clue ?? '' };
        if (stage === 'B') return { key: 'actor_3rd', value: q.hints.actor_3rd };
        if (stage === 'C') return { key: 'actor_2nd', value: q.hints.actor_2nd };
        return { key: 'actor_top', value: q.hints.actor_top };
    } else {
        if (stage === 'A') {
            if (isFSF && q.hints.role_tag_optional) return { key: 'role_tag', value: q.hints.role_tag_optional.text };
            return { key: 'actor_3rd', value: q.hints.actor_3rd };
        }
        if (stage === 'B') return { key: 'actor_2nd', value: q.hints.actor_2nd };
        return { key: 'actor_top', value: q.hints.actor_top };
    }
}

export class MovieLadderStateMachine {
    private io: Server<ClientToServerEvents, ServerToClientEvents>;
    private questionManager = new MovieQuestionManager();
    /** Stage timer per room code */
    private stageTimers = new Map<string, NodeJS.Timeout>();
    /** Full question list per room (loaded at game start) */
    private roomQuestions = new Map<string, MovieQuestion[]>();

    constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
        this.io = io;
    }

    // ── Public API ────────────────────────────────────────────

    startMovieGame(room: Room, settings: MovieModeSettings): void {
        // Override answer_mode for film_school_final
        if (settings.difficulty === 'film_school_final') {
            settings.answer_mode = 'free_text';
        }

        const questions = this.questionManager.loadForGame(settings);
        if (questions.length === 0) {
            this.io.to(room.code).emit('error', { message: 'No movie questions found for these filters.' });
            return;
        }

        this.roomQuestions.set(room.code, questions);

        // Init movie_state
        room.movie_state = {
            settings,
            question_ids: questions.map(q => q.id),
            question_index: 0,
            current_stage: this._startStage(settings.difficulty),
            stage_start_time: Date.now(),
            player_solved: {},
            player_lockout_until: {},
            used_tmdb_ids: questions.map(q => q.source_meta.provider_id).filter(Boolean),
        };

        // Reset movie-specific player fields
        for (const player of Object.values(room.players)) {
            player.movie_locked_until = null;
            player.movie_solved_stage = null;
        }

        room.mode = settings.variant;
        room.phase = 'movie_stage';
        this.io.to(room.code).emit('room:updated', { room });

        this._startQuestion(room);
    }

    advanceStage(room: Room): void {
        const ms = room.movie_state;
        if (!ms) return;

        const next = nextStage(ms.settings.variant, ms.current_stage);
        if (!next) {
            // Already at last stage — reveal
            this._clearStageTimer(room.code);
            this.revealCurrentQuestion(room);
            return;
        }

        this._clearStageTimer(room.code);
        ms.current_stage = next;
        ms.stage_start_time = Date.now();

        const q = this._currentQuestion(room);
        if (!q) return;

        const isFSF = ms.settings.difficulty === 'film_school_final';
        const { shuffled, correctIndex: _ } = ms.settings.answer_mode === 'multiple_choice'
            ? MovieQuestionManager.shuffleChoices(q.choices)
            : { shuffled: undefined, correctIndex: -1 };

        this.io.to(room.code).emit('movie:stage_advance', {
            question_id: q.id,
            stage: next,
            new_hint: newHintAt(q, next, isFSF),
            choices: shuffled,
            server_time: Date.now(),
        });

        this._scheduleStageTimer(room);
    }

    processMovieAnswer(room: Room, playerId: string, answer: string | number, clientTimeMs: number): void {
        const ms = room.movie_state;
        if (!ms) return;

        const player = room.players[playerId];
        if (!player) return;

        // Already solved or currently locked out
        if (player.movie_solved_stage !== null) return;
        const now = Date.now();
        if ((player.movie_locked_until ?? 0) > now) return;

        const q = this._currentQuestion(room);
        if (!q) return;

        let correct = false;
        if (ms.settings.answer_mode === 'multiple_choice') {
            // answer is a shuffled choice index sent from client — client sends the title string
            correct = typeof answer === 'string'
                ? answer.toLowerCase() === q.answer.toLowerCase()
                : false;
        } else {
            correct = typeof answer === 'string' && fuzzyMatches(answer, q.answer);
        }

        if (correct) {
            const stage = ms.current_stage;
            const stageTimerMs = ms.settings.stage_timer_seconds * 1000;
            const elapsedMs = now - ms.stage_start_time;
            const remainingMs = Math.max(0, stageTimerMs - elapsedMs);
            const speedBonus = Math.floor(MAX_SPEED_BONUS * remainingMs / stageTimerMs);
            const delta = STAGE_POINTS[stage] + speedBonus;

            player.score += delta;
            player.movie_solved_stage = stage;
            ms.player_solved[playerId] = stage;

            this.io.to(playerId).emit('movie:answer_result', {
                player_id: playerId,
                correct: true,
                delta,
                solved_stage: stage,
            });

            this.io.to(room.code).emit('room:updated', { room });

            // Check if all active players solved
            if (this._allSolved(room)) {
                this._clearStageTimer(room.code);
                setTimeout(() => this.revealCurrentQuestion(room), 1200);
            }
        } else {
            const delta = -WRONG_PENALTY;
            player.score = Math.max(0, player.score + delta);
            const lockedUntil = now + LOCKOUT_MS;
            player.movie_locked_until = lockedUntil;
            ms.player_lockout_until[playerId] = lockedUntil;

            this.io.to(playerId).emit('movie:answer_result', {
                player_id: playerId,
                correct: false,
                delta,
                locked_until: lockedUntil,
            });
        }
    }

    revealCurrentQuestion(room: Room): void {
        this._clearStageTimer(room.code);
        const ms = room.movie_state;
        if (!ms) return;

        const q = this._currentQuestion(room);
        if (!q) return;

        room.phase = 'movie_reveal';

        const scores = this._buildScores(room);
        this.io.to(room.code).emit('movie:reveal', {
            question_id: q.id,
            answer: q.answer,
            year: q.year,
            genres: q.genres,
            mpaa: q.mpaa,
            explain: q.explain,
            actor_top: q.hints.actor_top,
            actor_2nd: q.hints.actor_2nd,
            actor_3rd: q.hints.actor_3rd,
            scores,
        });

        this.io.to(room.code).emit('room:updated', { room });

        // Auto-advance to next question after 6s
        setTimeout(() => this._advanceQuestion(room), 6000);
    }

    cleanup(roomCode: string): void {
        this._clearStageTimer(roomCode);
        this.roomQuestions.delete(roomCode);
    }

    // ── Private helpers ───────────────────────────────────────

    private _startQuestion(room: Room): void {
        const ms = room.movie_state!;
        const q = this._currentQuestion(room);
        if (!q) {
            this._endMovieGame(room);
            return;
        }

        // Reset per-question player state
        for (const player of Object.values(room.players)) {
            player.movie_solved_stage = null;
            player.movie_locked_until = null;
        }
        ms.player_solved = {};
        ms.player_lockout_until = {};
        ms.current_stage = this._startStage(ms.settings.difficulty);
        ms.stage_start_time = Date.now();
        room.phase = 'movie_stage';

        const isFSF = ms.settings.difficulty === 'film_school_final';
        const hints = buildHints(q, ms.current_stage, isFSF);
        const isMC = ms.settings.answer_mode === 'multiple_choice';

        let choices: string[] | undefined;
        if (isMC) {
            choices = MovieQuestionManager.shuffleChoices(q.choices).shuffled;
        }

        this.io.to(room.code).emit('movie:question_start', {
            question_id: q.id,
            question_number: ms.question_index + 1,
            total: ms.question_ids.length,
            stage: ms.current_stage,
            hints_visible: hints,
            choices,
            stage_timer_seconds: ms.settings.stage_timer_seconds,
            server_time: Date.now(),
        });

        this.io.to(room.code).emit('room:updated', { room });
        this._scheduleStageTimer(room);
    }

    private _advanceQuestion(room: Room): void {
        const ms = room.movie_state;
        if (!ms) return;

        ms.question_index++;
        if (ms.question_index >= ms.question_ids.length) {
            this._endMovieGame(room);
            return;
        }

        this._startQuestion(room);
    }

    private _endMovieGame(room: Room): void {
        this._clearStageTimer(room.code);
        room.phase = 'final_scoreboard';
        room.movie_state = null;

        const scores = this._buildScores(room);
        const winner = scores[0];
        this.io.to(room.code).emit('game:end', {
            scores,
            winner_id: winner?.player_id ?? '',
            winner_name: winner?.player_name ?? '',
            host_wrap: 'That\'s a wrap! Great movie knowledge!',
            host_winner_roast: `${winner?.player_name ?? 'Someone'} clearly watches too many movies!`,
        });

        this.io.to(room.code).emit('room:updated', { room });
        this.cleanup(room.code);
    }

    private _scheduleStageTimer(room: Room): void {
        const ms = room.movie_state;
        if (!ms) return;
        this._clearStageTimer(room.code);

        const timer = setTimeout(() => {
            const next = nextStage(ms.settings.variant, ms.current_stage);
            if (next) {
                this.advanceStage(room);
            } else {
                this.revealCurrentQuestion(room);
            }
        }, ms.settings.stage_timer_seconds * 1000);

        this.stageTimers.set(room.code, timer);
    }

    private _clearStageTimer(roomCode: string): void {
        const t = this.stageTimers.get(roomCode);
        if (t) { clearTimeout(t); this.stageTimers.delete(roomCode); }
    }

    private _currentQuestion(room: Room): MovieQuestion | null {
        const ms = room.movie_state;
        if (!ms) return null;
        const questions = this.roomQuestions.get(room.code);
        return questions?.[ms.question_index] ?? null;
    }

    private _allSolved(room: Room): boolean {
        const activePlayers = Object.values(room.players).filter(p => p.status === 'active');
        return activePlayers.length > 0 && activePlayers.every(p => p.movie_solved_stage !== null);
    }

    private _startStage(difficulty: string): MovieStage {
        return difficulty === 'trailer_trash' ? 'B' : 'A';
    }

    private _buildScores(room: Room): ScoreEntry[] {
        return Object.values(room.players)
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({
                player_id: p.id,
                player_name: p.name,
                score: p.score,
                delta: 0,
                rank: i + 1,
            }));
    }
}
