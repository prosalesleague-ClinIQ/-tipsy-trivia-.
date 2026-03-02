import { motion } from 'framer-motion';
import { useGameState } from '../../state/GameStateContext';
import { Trophy, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

function generateConfetti() {
    return Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 3}s`,
        color: ['#7C3AED', '#F59E0B', '#EC4899', '#0D9488', '#fff'][Math.floor(Math.random() * 5)],
    }));
}

export default function HostEndGame() {
    const { state } = useGameState();
    const { gameEnd, scores } = state;
    const [confetti] = useState(generateConfetti);

    if (!gameEnd) return null;

    return (
        <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-10 relative overflow-hidden">
            {/* Confetti */}
            {confetti.map(c => (
                <div
                    key={c.id}
                    className="fixed w-3 h-3 rounded-sm"
                    style={{
                        left: c.left,
                        top: '-12px',
                        backgroundColor: c.color,
                        animation: `confettiFall ${c.duration} ${c.delay} linear forwards`,
                    }}
                />
            ))}

            {/* Winner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="glass p-10 text-center max-w-2xl w-full mb-8 border-2 border-brand-gold/50"
            >
                <Trophy className="w-16 h-16 text-brand-gold mx-auto mb-4" />
                <p className="text-brand-gold font-display font-bold text-lg uppercase tracking-widest mb-2">🏆 Winner</p>
                <h1 className="font-display font-black text-6xl gradient-text mb-4">{gameEnd.winner_name}</h1>
                <p className="text-white/60 text-xl font-body mb-6">{gameEnd.scores[0]?.score.toLocaleString()} points</p>
                {gameEnd.host_winner_roast && (
                    <div className="glass bg-brand-gold/10 p-4 rounded-xl border-l-4 border-brand-gold">
                        <p className="text-brand-gold font-body italic text-lg">🎭 {gameEnd.host_winner_roast}</p>
                    </div>
                )}
            </motion.div>

            {/* Wrap line */}
            {gameEnd.host_wrap && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-white/50 text-lg text-center max-w-xl mb-8 font-body"
                >
                    {gameEnd.host_wrap}
                </motion.p>
            )}

            {/* Final podium */}
            <div className="flex items-end gap-4 justify-center">
                {scores.slice(0, 3).map((s, i) => {
                    const heights = ['h-40', 'h-56', 'h-32'];
                    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
                    const actual = scores[podiumOrder[i]];
                    if (!actual) return null;
                    return (
                        <motion.div
                            key={actual.player_id}
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + i * 0.15 }}
                            className={`glass flex flex-col items-center justify-end p-4 w-32 ${heights[i]} border-t-4 ${podiumOrder[i] === 0 ? 'border-brand-gold' : podiumOrder[i] === 1 ? 'border-gray-400' : 'border-orange-400'
                                }`}
                        >
                            <p className="font-display font-bold text-sm text-center">{actual.player_name}</p>
                            <p className="font-display font-black text-xl text-brand-gold">{actual.score.toLocaleString()}</p>
                            <p className="text-4xl mt-1">{['🥇', '🥈', '🥉'][podiumOrder[i]]}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
