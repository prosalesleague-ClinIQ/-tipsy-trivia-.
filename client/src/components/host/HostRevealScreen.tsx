import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '../../state/GameStateContext';
import { useSpeech } from '../../state/useSpeech';
import { ExternalLink } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function HostRevealScreen() {
    const { state } = useGameState();
    const { lastReveal, currentQuestion } = state;
    const { speak } = useSpeech(state.room?.host_config?.pace ?? 'normal', state.room?.host_config?.presets);

    useEffect(() => {
        if (lastReveal?.host_reaction) speak(lastReveal.host_reaction);
        // speak is stable (useCallback), safe to omit from deps to avoid re-firing on re-render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastReveal?.host_reaction]);

    if (!lastReveal || !currentQuestion) return null;

    const options = currentQuestion.options;

    return (
        <div className="animated-bg min-h-screen p-8 flex flex-col justify-center">
            {/* Correct answer banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass border-2 border-green-400/60 bg-green-500/10 p-6 rounded-2xl mb-6 text-center"
            >
                <p className="text-green-300 font-display font-bold text-sm uppercase tracking-widest mb-2">Correct Answer</p>
                <p className="font-display font-black text-4xl text-white">
                    {OPTION_LABELS[lastReveal.correct_index]}. {options[lastReveal.correct_index]}
                </p>
            </motion.div>

            {/* Host reaction */}
            {lastReveal.host_reaction && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass px-6 py-4 rounded-2xl mb-6 border-l-4 border-brand-gold text-center"
                >
                    <p className="text-brand-gold font-display font-bold text-xl">🎭 {lastReveal.host_reaction}</p>
                </motion.div>
            )}

            <div className="grid grid-cols-2 gap-6">
                {/* Explanation */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-6"
                >
                    <h3 className="font-display font-bold text-lg text-white/70 mb-3">The Fact</h3>
                    <p className="font-body text-lg text-white leading-relaxed mb-4">{lastReveal.explanation}</p>
                    {lastReveal.why_weird && (
                        <div className="glass bg-brand-purple/10 p-4 rounded-xl border-l-4 border-brand-purple">
                            <p className="text-brand-purple font-body italic">🤯 {lastReveal.why_weird}</p>
                        </div>
                    )}
                    {lastReveal.source_url && (
                        <a
                            href={lastReveal.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 mt-4 text-white/40 hover:text-white/70 text-sm transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {lastReveal.source_title}
                        </a>
                    )}
                </motion.div>

                {/* Scores */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass p-6"
                >
                    <h3 className="font-display font-bold text-lg text-white/70 mb-3">Standings</h3>
                    <div className="space-y-3">
                        {lastReveal.scores.slice(0, 6).map((s, i) => (
                            <div key={s.player_id} className="flex items-center gap-3">
                                <span className="font-display font-bold text-xl text-white/30 w-6">{i + 1}</span>
                                <span className="font-body flex-1 text-white">{s.player_name}</span>
                                <span className="font-display font-bold text-brand-gold">{s.score.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
