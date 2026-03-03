import { motion } from 'framer-motion';
import { useGameState } from '../../state/GameStateContext';
import { Trophy } from 'lucide-react';

export default function HostScoreboard() {
    const { state } = useGameState();
    const { scores, room } = state;
    const maxScore = scores[0]?.score ?? 1;

    return (
        <div className="min-h-screen p-10 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #181a20 0%, #23263a 100%)' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }} className="text-center mb-10">
                <div className="flex items-center gap-3 justify-center mb-2">
                    <Trophy className="w-8 h-8" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 12px #fbbf24)' }} />
                    <h1 className="font-display font-black text-4xl gradient-text neon-text">
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
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 22 }}
                        whileHover={{ scale: 1.02, boxShadow: '0 0 24px #00f6ff33' }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex items-center gap-5 shadow-xl"
                    >
                        <span className={`font-display font-black text-3xl w-8 ${i === 0 ? 'text-brand-gold' : i === 1 ? 'text-white/60' : i === 2 ? 'text-orange-400' : 'text-white/30'
                            }`}>{i + 1}</span>
                        <div className="flex-1">
                            <p className="font-display font-bold text-lg">{s.player_name}</p>
                            <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #00f6ff, #ff00c8)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(s.score / maxScore) * 100}%` }}
                                    transition={{ delay: i * 0.1 + 0.3, type: 'spring', stiffness: 120, damping: 20 }}
                                />
                            </div>
                        </div>
                        <span className="font-display font-bold text-2xl text-brand-gold">{s.score.toLocaleString()}</span>
                    </motion.div>
                ))}
                {scores.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 text-center text-white/30">No scores yet</div>
                )}
            </div>
        </div>
    );
}
