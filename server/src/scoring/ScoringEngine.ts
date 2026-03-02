import type { Room, Player, Question, Difficulty } from '@tipsy-trivia/shared';

export interface ScoreResult {
    delta: number;
    base: number;
    time_bonus: number;
    streak_bonus: number;
    penalty: number;
}

const BASE_POINTS: Record<Difficulty, number> = {
    Easy: 100,
    Medium: 200,
    Hard: 300,
    Genius: 500,
};

const RAPID_FIRE_BASE = 100;
const RAPID_FIRE_PENALTY = -25;
const RAPID_FIRE_STREAK_BONUS = 25;
const MAX_TIME_BONUS = 50;

const LADDER_VALUES = [100, 150, 200, 300, 450, 650, 900, 1200, 1600, 2000, 2500, 3200];

export class ScoringEngine {
    /**
     * General scoring for Mode 1 (Three-Round Trivia) and Mode 3 (Jeopardy) question types.
     */
    static calculate(room: Room, player: Player, question: Question, correct: boolean): ScoreResult {
        if (room.mode === 'trivia_categories') {
            return this.triaCalc(player, question, correct);
        }
        if (room.mode === 'rapid_fire') {
            return this.rapidCalc(room, player, correct);
        }
        if (room.mode === 'legacy_ladder') {
            return this.ladderCalc(player, correct);
        }
        // default: trivia
        return this.triaCalc(player, question, correct);
    }

    static triaCalc(player: Player, question: Question, correct: boolean): ScoreResult {
        if (!correct) return { delta: 0, base: 0, time_bonus: 0, streak_bonus: 0, penalty: 0 };

        const base = BASE_POINTS[question.difficulty];
        const elapsedRatio = Math.min(1, (player.answer_time_ms ?? 0) / (question.time_limit_seconds * 1000));
        const time_bonus = Math.round(MAX_TIME_BONUS * (1 - elapsedRatio));
        const delta = base + time_bonus;

        return { delta, base, time_bonus, streak_bonus: 0, penalty: 0 };
    }

    static rapidCalc(room: Room, player: Player, correct: boolean): ScoreResult {
        if (correct) {
            const streak_bonus = Math.min(player.streak, 10) * RAPID_FIRE_STREAK_BONUS;
            const delta = RAPID_FIRE_BASE + streak_bonus;
            return { delta, base: RAPID_FIRE_BASE, time_bonus: 0, streak_bonus, penalty: 0 };
        } else {
            const penalty = room.settings.rapid_fire_penalty ? RAPID_FIRE_PENALTY : 0;
            return { delta: penalty, base: 0, time_bonus: 0, streak_bonus: 0, penalty: Math.abs(penalty) };
        }
    }

    static ladderCalc(player: Player, correct: boolean): ScoreResult {
        if (!correct) return { delta: 0, base: 0, time_bonus: 0, streak_bonus: 0, penalty: 0 };

        const stepIndex = Math.min(player.ladder_step, LADDER_VALUES.length - 1);
        const base = LADDER_VALUES[stepIndex];

        // Streak bonus after 3 correct: +10% per question
        let streak_bonus = 0;
        if (player.streak >= 3) {
            streak_bonus = Math.round(base * 0.1 * (player.streak - 2));
        }

        const delta = base + streak_bonus;
        return { delta, base, time_bonus: 0, streak_bonus, penalty: 0 };
    }

    /**
     * Jeopardy: score = cell value (if correct) or -wager (Daily Double wrong)
     */
    static jeopardyCalc(
        is_daily_double: boolean,
        wager: number,
        cell_value: number,
        correct: boolean,
    ): ScoreResult {
        if (is_daily_double) {
            const delta = correct ? wager : -wager;
            return { delta, base: wager, time_bonus: 0, streak_bonus: 0, penalty: correct ? 0 : wager };
        }
        return {
            delta: correct ? cell_value : 0,
            base: cell_value,
            time_bonus: 0,
            streak_bonus: 0,
            penalty: 0,
        };
    }

    /**
     * Jeopardy Final: wager-based scoring.
     */
    static jeopardyFinalCalc(wager: number, correct: boolean): ScoreResult {
        const delta = correct ? wager : -wager;
        return { delta, base: wager, time_bonus: 0, streak_bonus: 0, penalty: correct ? 0 : wager };
    }

    /** MAX wager for Jeopardy Daily Double (at least 5 to wager) */
    static maxWager(playerScore: number, cellValue: number): number {
        return Math.max(playerScore, cellValue, 5);
    }
}
