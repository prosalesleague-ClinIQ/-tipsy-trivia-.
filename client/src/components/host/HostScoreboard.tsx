import { motion } from 'framer-motion';
import { useGameState } from '../../state/GameStateContext';
import { Trophy } from 'lucide-react';

export default function HostScoreboard() {
    const { state } = useGameState();
    const { scores, room } = state;
    const maxScore = scores[0]?.score ?? 1;

    return (
        <div className="animated-bg min-h-screen p-10 flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                <div className="flex items-center gap-3 justify-center mb-2">
                    <Trophy className="w-8 h-8 text-brand-gold" />
                    <h1 className="font-display font-black text-4xl gradient-text">
                        Round {room?.current_round} Scoreboard
                    </h1>
                </div>
                <p className="text-white/40">Next round starting soon…</p>
            </motion.div>

            <div className="w-full max-w-2xl space-y-4">
                {scores.map((s, i) => (
                    <motion.div
                        key={s.player_id}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-5 flex items-center gap-5"
                    >
                        <span className={`font-display font-black text-3xl w-8 ${i === 0 ? 'text-brand-gold' : i === 1 ? 'text-white/60' : i === 2 ? 'text-orange-400' : 'text-white/30'
                            }`}>{i + 1}</span>
                        <div className="flex-1">
                            <p className="font-display font-bold text-lg">{s.player_name}</p>
                            <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-brand-purple"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(s.score / maxScore) * 100}%` }}
                                    transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                        <span className="font-display font-bold text-2xl text-brand-gold">{s.score.toLocaleString()}</span>
                    </motion.div>
                ))}
                {scores.length === 0 && (
                    <div className="glass p-10 text-center text-white/30">No scores yet</div>
                )}
            </div>
        </div>
    );
}
