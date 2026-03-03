import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../../socket/SocketProvider';
import { useGameState } from '../../state/GameStateContext';
import TimerRing from '../shared/TimerRing';
import type { MovieStage, MovieVisibleHints } from '@tipsy-trivia/shared';

const STAGE_LABELS: Record<MovieStage, string> = { A: 'A', B: 'B', C: 'C', D: 'D' };
const ALL_STAGES: MovieStage[] = ['A', 'B', 'C', 'D'];

export default function HostMovieStageScreen() {
    const { socket } = useSocket();
    const { state } = useGameState();
    const { movieQuestion, movieStageUpdate, room } = state;

    const [timeRemaining, setTimeRemaining] = useState(0);
    const [totalTime, setTotalTime] = useState(30);
    const [hints, setHints] = useState<MovieVisibleHints>({});
    const [currentStage, setCurrentStage] = useState<MovieStage>('A');

    // Initialize from movieQuestion
    useEffect(() => {
        if (!movieQuestion) return;
        setHints(movieQuestion.hints_visible);
        setCurrentStage(movieQuestion.stage);
        setTotalTime(movieQuestion.stage_timer_seconds);
        setTimeRemaining(movieQuestion.stage_timer_seconds);
    }, [movieQuestion?.question_id]);

    // Update on stage advance
    useEffect(() => {
        if (!movieStageUpdate) return;
        setHints(prev => ({
            ...prev,
            [movieStageUpdate.new_hint.key]: movieStageUpdate.new_hint.value,
        }));
        setCurrentStage(movieStageUpdate.stage);
        setTimeRemaining(totalTime);
    }, [movieStageUpdate?.stage]);

    // Countdown timer
    useEffect(() => {
        if (timeRemaining <= 0) return;
        const id = setInterval(() => setTimeRemaining(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(id);
    }, [timeRemaining > 0, currentStage]);

    const advanceHint = () => {
        socket?.emit('movie:hint_advance');
    };

    const ms = room?.movie_state;
    const players = Object.values(room?.players ?? {}).filter(p => p.status === 'active');
    const totalQuestions = ms?.question_ids.length ?? 0;
    const currentQuestionNum = (ms?.question_index ?? 0) + 1;

    const variant = ms?.settings?.variant ?? 'plot_ladder';
    const stages: MovieStage[] = variant === 'plot_ladder' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];

    return (
        <div className="min-h-screen flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-white/40 text-sm font-body">
                        Question {currentQuestionNum} of {totalQuestions}
                    </p>
                    <h2 className="font-display font-black text-2xl text-orange-400">
                        {variant === 'plot_ladder' ? '🎬 Plot Ladder' : '🎭 Cast Ladder'}
                    </h2>
                </div>
                <TimerRing total={totalTime} current={timeRemaining} size={80} />
            </div>

            {/* Stage indicator */}
            <div className="flex items-center gap-3 mb-6">
                <span className="text-white/40 text-sm font-body">Stage:</span>
                {stages.map(s => (
                    <div key={s} className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-sm transition-all ${
                        s === currentStage
                            ? 'bg-orange-400 text-black scale-110'
                            : stages.indexOf(s) < stages.indexOf(currentStage)
                                ? 'bg-orange-400/40 text-white'
                                : 'bg-white/10 text-white/30'
                    }`}>
                        {STAGE_LABELS[s]}
                    </div>
                ))}
            </div>

            {/* Hints film strip card */}
            <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border-2 border-orange-500/30 p-6 flex-1 mb-6"
            >
                <div className="space-y-4">
                    {hints.plot_clue && (
                        <HintRow label="Plot" value={hints.plot_clue} fresh={currentStage === 'A'} />
                    )}
                    {hints.actor_3rd && (
                        <HintRow label="Supporting Actor" value={hints.actor_3rd} fresh={currentStage === (variant === 'cast_ladder' ? 'A' : 'B')} />
                    )}
                    {hints.role_tag && (
                        <HintRow label="Role" value={hints.role_tag} fresh={currentStage === 'A'} />
                    )}
                    {hints.actor_2nd && (
                        <HintRow label="2nd Lead" value={hints.actor_2nd} fresh={currentStage === (variant === 'cast_ladder' ? 'B' : 'C')} />
                    )}
                    {hints.actor_top && (
                        <HintRow label="Top Billed" value={hints.actor_top} fresh={currentStage === (variant === 'cast_ladder' ? 'C' : 'D')} />
                    )}
                </div>
            </motion.div>

            {/* Players solved status */}
            <div className="glass p-4 mb-6">
                <p className="text-white/40 text-xs font-body mb-3 uppercase tracking-widest">Players</p>
                <div className="flex flex-wrap gap-2">
                    {players.map(p => {
                        const solved = p.movie_solved_stage !== null;
                        const locked = (p.movie_locked_until ?? 0) > Date.now();
                        return (
                            <div key={p.id} className={`flex items-center gap-2 glass px-3 py-1 rounded-full text-sm ${
                                solved ? 'border border-green-400/40' : locked ? 'border border-red-400/30' : ''
                            }`}>
                                <span className="text-white/70">{p.name}</span>
                                {solved && <span className="text-green-400 text-xs">✓ {p.movie_solved_stage}</span>}
                                {locked && !solved && <span className="text-red-400 text-xs">🔒</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Host controls */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={advanceHint}
                className="w-full py-4 font-display font-bold text-lg border-2 border-orange-400/50 text-orange-400 hover:bg-orange-400/10 rounded-2xl transition-all"
            >
                Next Hint →
            </motion.button>
        </div>
    );
}

function HintRow({ label, value, fresh }: { label: string; value: string; fresh: boolean }) {
    return (
        <motion.div
            initial={fresh ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-1"
        >
            <span className="text-white/30 text-xs font-body uppercase tracking-widest">{label}</span>
            <span className={`font-body font-semibold text-lg ${fresh ? 'text-orange-300' : 'text-white/80'}`}>{value}</span>
        </motion.div>
    );
}
