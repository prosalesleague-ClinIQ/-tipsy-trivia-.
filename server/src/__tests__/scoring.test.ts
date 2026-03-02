import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../scoring/ScoringEngine';
import type { Room, Player, Question } from '@tipsy-trivia/shared';

function makeRoom(mode: string, settings: Partial<any> = {}): Room {
    return {
        code: 'TEST1',
        host_socket_id: 'host',
        players: {},
        spectator_ids: [],
        phase: 'question',
        mode: mode as any,
        host_config: null,
        current_round: 1,
        total_rounds: 3,
        current_question_id: null,
        question_start_time: null,
        buzzer_winner_id: null,
        buzzer_locked: false,
        jeopardy_board: null,
        jeopardy_controller_id: null,
        used_fact_hashes: [],
        created_at: Date.now(),
        settings: {
            max_players: 12,
            question_timer_seconds: 12,
            buzzer_enabled: false,
            buzzer_passdown: true,
            rapid_fire_penalty: false,
            rapid_fire_per_player: false,
            ladder_difficulty: 'Medium',
            jeopardy_daily_double: true,
            jeopardy_final_typed: false,
            large_text_mode: false,
            colorblind_mode: false,
            reduced_motion: false,
            parental_ad_gate: false,
            ...settings,
        },
    };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
    return {
        id: 'p1',
        session_token: 'tok',
        name: 'TestPlayer',
        avatar_seed: 'seed',
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
        ...overrides,
    };
}

function makeQuestion(difficulty: Question['difficulty'] = 'Easy', timer = 12): Question {
    return {
        id: 'q1',
        pack_id: 'test',
        category: 'Test',
        difficulty,
        prompt: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correct_index: 0,
        explanation: 'Test explanation',
        tags: [],
        time_limit_seconds: timer,
        question_type: 'multiple_choice',
        hook_line: 'hook',
        why_weird: 'weird',
        source_title: 'Test',
        source_url: 'https://example.com',
        verified_on: '2024-01-01',
        fact_hash: 'abc123',
        claim_strength: 'Primary',
        content_flags: [],
    };
}

// ─── Mode 1: Trivia Categories ─────────────────────────────
describe('ScoringEngine - trivia_categories', () => {
    it('returns 0 for wrong answer', () => {
        const room = makeRoom('trivia_categories');
        const player = makePlayer({ answer_time_ms: 3000 });
        const q = makeQuestion('Easy');
        const result = ScoringEngine.calculate(room, player, q, false);
        expect(result.delta).toBe(0);
    });

    it('awards base points + time bonus for fast correct answer', () => {
        const room = makeRoom('trivia_categories');
        const player = makePlayer({ answer_time_ms: 1000 }); // fast answer
        const q = makeQuestion('Easy', 12); // 1000ms / 12000ms = ~8% elapsed
        const result = ScoringEngine.triaCalc(player, q, true);
        expect(result.base).toBe(100);
        expect(result.time_bonus).toBeGreaterThan(40); // near-max time bonus
        expect(result.delta).toBeGreaterThan(140);
    });

    it('awards correct base for each difficulty', () => {
        const room = makeRoom('trivia_categories');
        const difficulties: Array<[Question['difficulty'], number]> = [
            ['Easy', 100], ['Medium', 200], ['Hard', 300], ['Genius', 500],
        ];
        for (const [diff, base] of difficulties) {
            const p = makePlayer({ answer_time_ms: 12000 }); // slowest answer = 0 time bonus
            const q = makeQuestion(diff);
            const r = ScoringEngine.triaCalc(p, q, true);
            expect(r.base).toBe(base);
        }
    });

    it('capped time bonus at 50', () => {
        const room = makeRoom('trivia_categories');
        const player = makePlayer({ answer_time_ms: 0 }); // instant
        const q = makeQuestion('Easy');
        const r = ScoringEngine.triaCalc(player, q, true);
        expect(r.time_bonus).toBeLessThanOrEqual(50);
    });
});

// ─── Mode 2: Rapid Fire ────────────────────────────────────
describe('ScoringEngine - rapid_fire', () => {
    it('awards 100 + streak bonus for correct answers', () => {
        const room = makeRoom('rapid_fire');
        const player = makePlayer({ streak: 3 });
        const q = makeQuestion();
        const r = ScoringEngine.rapidCalc(room, player, true);
        expect(r.base).toBe(100);
        expect(r.streak_bonus).toBe(75); // 3 * 25
    });

    it('applies no penalty when toggle off', () => {
        const room = makeRoom('rapid_fire', { rapid_fire_penalty: false });
        const player = makePlayer();
        const r = ScoringEngine.rapidCalc(room, player, false);
        expect(r.delta).toBe(0);
    });

    it('applies -25 penalty when toggle on', () => {
        const room = makeRoom('rapid_fire', { rapid_fire_penalty: true });
        const player = makePlayer();
        const r = ScoringEngine.rapidCalc(room, player, false);
        expect(r.delta).toBe(-25);
    });
});

// ─── Mode 4: Legacy Ladder ─────────────────────────────────
describe('ScoringEngine - legacy_ladder', () => {
    it('awards step-based points', () => {
        const player = makePlayer({ ladder_step: 0 });
        const r = ScoringEngine.ladderCalc(player, true);
        expect(r.base).toBe(100); // step 0 = 100
    });

    it('streak bonus kicks in at streak 3+', () => {
        const player = makePlayer({ ladder_step: 3, streak: 4 });
        const r = ScoringEngine.ladderCalc(player, true);
        expect(r.streak_bonus).toBeGreaterThan(0);
    });

    it('no points for wrong answer', () => {
        const player = makePlayer({ ladder_step: 5 });
        const r = ScoringEngine.ladderCalc(player, false);
        expect(r.delta).toBe(0);
    });
});

// ─── Jeopardy ──────────────────────────────────────────────
describe('ScoringEngine - jeopardy', () => {
    it('awards cell value for correct', () => {
        const r = ScoringEngine.jeopardyCalc(false, 0, 400, true);
        expect(r.delta).toBe(400);
    });

    it('zero for wrong non-daily-double', () => {
        const r = ScoringEngine.jeopardyCalc(false, 0, 400, false);
        expect(r.delta).toBe(0);
    });

    it('daily double: awards wager for correct', () => {
        const r = ScoringEngine.jeopardyCalc(true, 800, 400, true);
        expect(r.delta).toBe(800);
    });

    it('daily double: deducts wager for wrong', () => {
        const r = ScoringEngine.jeopardyCalc(true, 800, 400, false);
        expect(r.delta).toBe(-800);
    });

    it('maxWager returns at least cell value', () => {
        expect(ScoringEngine.maxWager(100, 500)).toBe(500);
        expect(ScoringEngine.maxWager(1000, 200)).toBe(1000);
    });
});
