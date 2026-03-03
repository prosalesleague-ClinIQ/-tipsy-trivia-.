import { motion } from 'framer-motion';
import { useGameState } from '../../state/GameStateContext';

const MPAA_COLORS: Record<string, string> = {
    'G': 'bg-green-500/30 text-green-300',
    'PG': 'bg-blue-500/30 text-blue-300',
    'PG-13': 'bg-yellow-500/30 text-yellow-300',
    'R': 'bg-red-500/30 text-red-300',
    'NC-17': 'bg-red-800/30 text-red-400',
    'NR': 'bg-white/10 text-white/40',
};

export default function HostMovieRevealScreen() {
    const { state } = useGameState();
    const { movieReveal, scores } = state;

    if (!movieReveal) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-white/40">Loading reveal…</p>
            </div>
        );
    }

    const mpaaColor = MPAA_COLORS[movieReveal.mpaa] ?? 'bg-white/10 text-white/40';

    return (
        <div className="min-h-screen flex flex-col p-6">
            {/* Film strip header */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass border-2 border-orange-400/40 p-8 mb-6 text-center"
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-body ${mpaaColor}`}>
                        {movieReveal.mpaa}
                    </span>
                    <span className="text-white/30 text-sm">({movieReveal.year})</span>
                    <div className="flex gap-1">
                        {movieReveal.genres.slice(0, 3).map(g => (
                            <span key={g} className="glass px-2 py-0.5 rounded-full text-xs text-white/50">{g}</span>
                        ))}
                    </div>
                </div>

                <h2 className="font-display font-black text-5xl text-orange-400 mb-4">
                    {movieReveal.answer}
                </h2>

                <p className="text-white/60 font-body italic text-lg">"{movieReveal.explain}"</p>
            </motion.div>

            {/* Full cast reveal */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 mb-6"
            >
                <p className="text-white/30 text-xs font-body uppercase tracking-widest mb-4">Full Cast</p>
                <div className="space-y-3">
                    <CastRow billing="Top Billed" name={movieReveal.actor_top} />
                    <CastRow billing="2nd Lead" name={movieReveal.actor_2nd} />
                    <CastRow billing="Supporting" name={movieReveal.actor_3rd} />
                </div>
            </motion.div>

            {/* Scores */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass p-6"
            >
                <p className="text-white/30 text-xs font-body uppercase tracking-widest mb-4">Scores</p>
                <div className="space-y-2">
                    {scores.slice(0, 8).map((s, i) => (
                        <div key={s.player_id} className="flex items-center gap-3">
                            <span className="font-display font-bold text-lg w-6 text-white/30">{i + 1}</span>
                            <span className="flex-1 font-body font-semibold text-white">{s.player_name}</span>
                            <span className="font-display font-bold text-brand-gold">{s.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function CastRow({ billing, name }: { billing: string; name: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs font-body w-24 shrink-0">{billing}</span>
            <span className="font-body font-semibold text-white">{name}</span>
        </div>
    );
}
