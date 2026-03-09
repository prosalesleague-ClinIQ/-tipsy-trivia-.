import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../../state/GameStateContext';
import { useSocket } from '../../socket/SocketProvider';
import TimerRing from '../shared/TimerRing';
import { Users, Zap } from 'lucide-react';
import { Buzzer3D } from '../../components/Buzzer3D';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = [
    'border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/20',
    'border-brand-teal/50 hover:border-brand-teal hover:bg-teal-500/20',
    'border-brand-gold/50 hover:border-brand-gold hover:bg-yellow-500/20',
    'border-brand-pink/50 hover:border-brand-pink hover:bg-pink-500/20',
];

export default function HostQuestionScreen() {
    const { state } = useGameState();
    const { socket } = useSocket();
    const { currentQuestion, room, buzzerWinner, serverTime, buzzerMode } = state;
    const effectiveTime = Math.max(currentQuestion?.time_limit_seconds ?? 20, 20);
    const [timeLeft, setTimeLeft] = useState(effectiveTime);

    useEffect(() => {
        if (!currentQuestion || !serverTime) return;
        if (state.isPaused) return; // freeze timer while paused
        const total = effectiveTime * 1000;
        const pauseMs = room?.pause_elapsed_ms ?? 0;
        const interval = setInterval(() => {
            const elapsed = Date.now() - serverTime - pauseMs;
            const remaining = Math.max(0, total - elapsed) / 1000;
            setTimeLeft(Math.ceil(remaining));
        }, 100);
        return () => clearInterval(interval);
    }, [currentQuestion, serverTime, state.isPaused, room?.pause_elapsed_ms]);

    if (!currentQuestion) return null;

    const players = room ? Object.values(room.players) : [];
    const answeredCount = players.filter(p => p.answered).length;

    return (
        <div className="min-h-screen p-8 flex flex-col items-center justify-center">
            {/* Hook line */}
            {currentQuestion.hook_line && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass px-6 py-3 rounded-full text-brand-gold font-body text-center mb-6 mx-auto max-w-2xl"
                >
                    ✨ {currentQuestion.hook_line}
                </motion.div>
            )}

            <div className="flex-1 flex flex-col md:flex-row gap-8">
                {/* Question + answers */}
                <div className="flex-1 flex flex-col">
                    {/* Category badge */}
                    <div className="flex gap-3 mb-6">
                        <span className="glass px-4 py-1 rounded-full text-sm text-white/60">{currentQuestion.category}</span>
                        <span className={`glass px-4 py-1 rounded-full text-sm font-bold ${currentQuestion.difficulty === 'Easy' ? 'text-green-400' :
                                currentQuestion.difficulty === 'Medium' ? 'text-brand-gold' :
                                    currentQuestion.difficulty === 'Hard' ? 'text-orange-400' : 'text-red-400'
                            }`}>{currentQuestion.difficulty}</span>
                    </div>

                    {/* Prompt */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-display font-bold text-4xl text-white mb-8 leading-tight"
                    >
                        {currentQuestion.prompt}
                    </motion.h2>

                    {/* Options grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 + 0.3 }}
                                className={`glass p-5 border-2 ${OPTION_COLORS[i]} transition-all flex items-start gap-4`}
                            >
                                <span className={`font-display font-black text-2xl ${['text-blue-400', 'text-brand-teal', 'text-brand-gold', 'text-brand-pink'][i]}`}>
                                    {OPTION_LABELS[i]}
                                </span>
                                <span className="font-body text-lg text-white/90 leading-snug">{opt}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right panel: timer + players */}
                <div className="flex flex-col gap-6 w-64">
                    <div className="glass p-6 flex flex-col items-center">
                        <TimerRing
                            total={effectiveTime}
                            current={timeLeft}
                            size={120}
                        />
                    </div>

                    {/* Buzzer mode */}
                    {buzzerMode && (
                        <div className="glass p-4 text-center">
                            <Zap className="w-6 h-6 text-brand-gold mx-auto mb-1" />
                            <p className="text-sm text-brand-gold font-display font-bold">BUZZ MODE</p>
                            {buzzerWinner ? (
                                <p className="text-white font-bold mt-1">{buzzerWinner.winner_name} buzzed in!</p>
                            ) : (
                                <p className="text-white/40 text-sm">Waiting for buzz...</p>
                            )}
                        </div>
                    )}

                    {/* Answer count */}
                    <div className="glass p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-brand-teal" />
                            <p className="text-sm text-white/60">Answered</p>
                        </div>
                        <p className="font-display font-bold text-2xl text-white">{answeredCount} / {players.length}</p>
                        <div className="flex gap-1 mt-2">
                            {players.map(p => (
                                <div
                                    key={p.id}
                                    className={`flex-1 h-2 rounded-full ${p.answered ? 'bg-green-400' : 'bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
