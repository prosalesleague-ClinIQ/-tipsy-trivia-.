import type { Room, Player, Question, Difficulty } from '@tipsy-trivia/shared';
import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@tipsy-trivia/shared';
import { ScoringEngine } from '../scoring/ScoringEngine';
import { QuestionManager } from '../questions/QuestionManager';
import { ComedianHostEngine } from '../host/ComedianHostEngine';

const DIFFICULTY_POINTS: Record<Difficulty, number> = {
    Easy: 100,
    Medium: 200,
    Hard: 300,
    Genius: 500,
};

const LADDER_STEPS = [100, 150, 200, 300, 450, 650, 900, 1200, 1600, 2000, 2500, 3200] as const;

export class GameStateMachine {
    private io: Server<ClientToServerEvents, ServerToClientEvents>;
    private questionManager: QuestionManager;
    private hostEngine: ComedianHostEngine;
    private timers = new Map<string, NodeJS.Timeout>();
    private questionNums = new Map<string, number>();

    constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
        this.io = io;
        this.questionManager = new QuestionManager();
        this.hostEngine = new ComedianHostEngine();
    }

    async startGame(room: Room): Promise<void> {
        room.phase = 'round_intro';
        room.current_round = 1;
        room.used_fact_hashes = [];

        // Generate host script if config set
        if (room.host_config) {
            const players = Object.values(room.players);
            const script = this.hostEngine.generateScript(room.host_config, players, room.mode!);
            this.io.to(room.code).emit('host:script', { script });
        }

        await this.beginRound(room);
    }

    async beginRound(room: Room): Promise<void> {
        room.phase = 'round_intro';
        this.questionNums.set(room.code, 0);
        this.io.to(room.code).emit('room:updated', { room });

        const modeIntro = room.host_config
            ? this.hostEngine.getRoundIntro(room.host_config, room.current_round, room.mode!)
            : '';

        this.io.to(room.code).emit('round:advance', {
            round: room.current_round,
            host_intro: modeIntro,
        });

        // Auto-advance after intro display
        setTimeout(() => this.showNextQuestion(room), 3000);
    }

    async showNextQuestion(room: Room): Promise<void> {
        // Use difficulty setting to filter questions when set
        const diff = room.settings.difficulty;
        const question = diff
            ? (this.questionManager.pickQuestionByDifficulty(room, diff) ?? this.questionManager.pickQuestion(room))
            : this.questionManager.pickQuestion(room);
        if (!question) {
            await this.endRound(room);
            return;
        }

        room.current_question_id = question.id;
        room.question_start_time = Date.now();
        room.phase = 'question';
        room.buzzer_winner_id = null;
        room.buzzer_locked = false;
        used_fact_hashes_add(room, question.fact_hash);

        const qNum = (this.questionNums.get(room.code) ?? 0) + 1;
        this.questionNums.set(room.code, qNum);

        // Reset player answer state
        for (const player of Object.values(room.players)) {
            player.answered = false;
            player.answer_index = null;
            player.answer_time_ms = null;
            player.buzzed_at = null;
        }

        this.io.to(room.code).emit('room:updated', { room });
        this.io.to(room.code).emit('question:show', {
            question: this.stripAnswer(question),
            question_number: qNum,
            total_questions: 10,
            server_time: Date.now(),
            buzzer_mode: room.settings.buzzer_enabled,
        });

        // Start countdown timer
        const timerMs = question.time_limit_seconds * 1000;
        const timer = setTimeout(() => {
            this.revealAnswer(room, question);
        }, timerMs);
        this.setTimer(room.code, timer);
    }

    async processAnswer(room: Room, playerId: string, answerIndex: number, clientTimeMs: number): Promise<void> {
        const player = room.players[playerId];
        const question = this.questionManager.getQuestion(room.current_question_id!);
        if (!player || !question || player.answered) return;
        if (room.phase !== 'question' && room.phase !== 'buzzer_answer') return;

        // Buzzer mode: only winner can answer
        if (room.phase === 'buzzer_answer' && room.buzzer_winner_id !== playerId) return;

        player.answered = true;
        player.answer_index = answerIndex;
        const elapsed = Date.now() - (room.question_start_time ?? Date.now());
        player.answer_time_ms = Math.min(elapsed, question.time_limit_seconds * 1000);

        const correct = answerIndex === question.correct_index;
        const score = ScoringEngine.calculate(room, player, question, correct);

        player.score = Math.max(0, player.score + score.delta);
        if (correct) {
            player.streak++;
        } else {
            player.streak = 0;
        }

        this.io.to(room.code).emit('answer:acknowledged', {
            player_id: playerId,
            answer_index: answerIndex,
        });

        // Check if all active players answered
        const activePlayers = Object.values(room.players).filter(p => p.status === 'active');
        const allAnswered = activePlayers.every(p => p.answered);

        if (allAnswered || room.phase === 'buzzer_answer') {
            this.clearTimer(room.code);
            await this.revealAnswer(room, question);
        }
    }

    async revealAnswer(room: Room, question: Question): Promise<void> {
        this.clearTimer(room.code);
        room.phase = 'answer_reveal';

        const scores = this.buildScoreEntries(room);
        const reaction = room.host_config
            ? this.hostEngine.getReaction(room.host_config, room, question)
            : '';

        this.io.to(room.code).emit('room:updated', { room });
        this.io.to(room.code).emit('answer:reveal', {
            question_id: question.id,
            correct_index: question.correct_index,
            explanation: question.explanation,
            hook_line: question.hook_line,
            why_weird: question.why_weird,
            source_title: question.source_title,
            source_url: question.source_url,
            scores,
            host_reaction: reaction,
        });

        setTimeout(() => this.showNextQuestion(room), 6000);
    }

    async processBuzzer(room: Room, playerId: string, clientTimeMs: number): Promise<void> {
        if (!room.settings.buzzer_enabled) return;
        if (room.buzzer_locked) return;
        if (room.phase !== 'question') return;

        const player = room.players[playerId];
        if (!player) return;

        room.buzzer_locked = true;
        room.buzzer_winner_id = playerId;
        room.phase = 'buzzer_answer';
        player.buzzed_at = Date.now();

        this.clearTimer(room.code);

        this.io.to(room.code).emit('buzzer:lock', {
            winner_id: playerId,
            winner_name: player.name,
            locked_at: Date.now(),
        });

        // 5 second answer window
        const timer = setTimeout(async () => {
            const question = this.questionManager.getQuestion(room.current_question_id!);
            if (question) {
                // Missed buzzer answer — treat as wrong
                player.answered = true;
                player.answer_index = -1;
                player.streak = 0;
                this.io.to(room.code).emit('buzzer:fail', { player_id: playerId });
                await this.revealAnswer(room, question);
            }
        }, 5000);
        this.setTimer(room.code, timer);
    }

    async endRound(room: Room): Promise<void> {
        room.phase = 'round_end';
        const scores = this.buildScoreEntries(room);
        this.io.to(room.code).emit('room:updated', { room });
        this.io.to(room.code).emit('scoreboard:update', { scores, round: room.current_round });

        if (room.current_round >= room.total_rounds) {
            setTimeout(() => this.endGame(room), 5000);
        } else {
            room.current_round++;
            setTimeout(() => this.beginRound(room), 5000);
        }
    }

    async endGame(room: Room): Promise<void> {
        room.phase = 'final_scoreboard';
        const scores = this.buildScoreEntries(room);
        const winner = scores[0];

        const wrap = room.host_config
            ? this.hostEngine.getEndGameWrap(room.host_config, winner?.player_name ?? 'nobody')
            : `That's a wrap! ${winner?.player_name ?? 'nobody'} wins!`;

        const winnerRoast = room.host_config
            ? this.hostEngine.getWinnerRoast(room.host_config, winner?.player_name ?? 'nobody')
            : '';

        this.io.to(room.code).emit('room:updated', { room });
        this.io.to(room.code).emit('game:end', {
            scores,
            winner_id: winner?.player_id ?? '',
            winner_name: winner?.player_name ?? '',
            host_wrap: wrap,
            host_winner_roast: winnerRoast,
        });
    }

    private stripAnswer(q: Question): Question {
        // Don't strip for host screen — client hides correct_index from player view
        return q;
    }

    private buildScoreEntries(room: Room) {
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

    private setTimer(roomCode: string, timer: NodeJS.Timeout): void {
        this.clearTimer(roomCode);
        this.timers.set(roomCode, timer);
    }

    private clearTimer(roomCode: string): void {
        const t = this.timers.get(roomCode);
        if (t) {
            clearTimeout(t);
            this.timers.delete(roomCode);
        }
    }
}

function used_fact_hashes_add(room: Room, hash: string): void {
    if (!room.used_fact_hashes.includes(hash)) {
        room.used_fact_hashes.push(hash);
    }
}
