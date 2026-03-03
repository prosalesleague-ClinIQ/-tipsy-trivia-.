import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Smartphone, Users, Mic, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

/* Floating emoji config — positions are viewport-relative (vw / vh) */
const FLOATING_EMOJIS = [
    { emoji: '\u{1F37A}', x: 8,  y: 12, size: 40, delay: 0 },
    { emoji: '\u{1F61C}', x: 88, y: 8,  size: 36, delay: 0.5 },
    { emoji: '\u{1F480}', x: 5,  y: 55, size: 34, delay: 1.2 },
    { emoji: '\u{1F3C6}', x: 92, y: 50, size: 38, delay: 0.8 },
    { emoji: '\u{1F37B}', x: 15, y: 85, size: 32, delay: 1.5 },
    { emoji: '\u{1F389}', x: 85, y: 82, size: 36, delay: 0.3 },
    { emoji: '\u{1F525}', x: 50, y: 5,  size: 30, delay: 1.0 },
    { emoji: '\u{1F3B2}', x: 75, y: 18, size: 28, delay: 1.8 },
    { emoji: '\u{1F920}', x: 20, y: 35, size: 30, delay: 0.7 },
    { emoji: '\u{1F60E}', x: 78, y: 68, size: 32, delay: 1.3 },
];

const FEATURES = [
    { emoji: '\u{1F3B2}', label: '4 Game Modes' },
    { emoji: '\u{1F3A4}', label: 'AI Comedian Host' },
    { emoji: '\u{1F92A}', label: 'Fun Fact Reveals' },
    { emoji: '\u{1F514}', label: 'Buzz-In System' },
    { emoji: '\u{1F465}', label: '2-12 Players' },
    { emoji: '\u{1F4F1}', label: 'Phone Controllers' },
];

const HOW_IT_WORKS = [
    { icon: Tv,         title: 'Host opens game on TV',     desc: 'Launch the host screen on any big display' },
    { icon: Smartphone, title: 'Players join on phones',    desc: 'Scan the QR code or enter the room code' },
    { icon: Zap,        title: 'Answer, laugh, repeat!',    desc: 'Compete, get roasted, and crown a winner' },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [showJoin, setShowJoin] = useState(false);

    /* Join handler */
    const handleJoin = () => {
        if (code.trim().length >= 4) {
            sessionStorage.setItem('joinCode', code.trim().toUpperCase());
            navigate('/play');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden relative">
            {/* ── Background gradient ── */}
            <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0A0A1A] via-[#131328] to-[#1a0d2e]" />

            {/* ── Floating emojis ── */}
            {FLOATING_EMOJIS.map((e, i) => (
                <motion.span
                    key={i}
                    className="fixed select-none pointer-events-none -z-10 opacity-20"
                    style={{ left: `${e.x}vw`, top: `${e.y}vh`, fontSize: e.size }}
                    initial={{ y: 0, rotate: 0 }}
                    animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 5 + i * 0.4, repeat: Infinity, delay: e.delay, ease: 'easeInOut' }}
                >
                    {e.emoji}
                </motion.span>
            ))}

            {/* ── Hero ── */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: 'spring' }}
                className="text-center mb-10"
            >
                <span className="text-6xl mb-4 block">{'\u{1F37A}'}</span>
                <h1 className="font-display text-6xl sm:text-7xl font-black gradient-text neon-text leading-tight">
                    Tipsy Trivia
                </h1>
                <p className="text-white/70 text-lg sm:text-xl font-body mt-4 max-w-md mx-auto">
                    The party trivia game where facts get weird and everyone gets roasted.
                </p>
            </motion.div>

            {/* ── Two big CTA buttons ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl mb-10"
            >
                {/* Host a Game */}
                <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="glass p-8 flex flex-col items-center gap-3 cursor-pointer border-2 border-brand-purple/40 hover:border-brand-purple transition-all"
                    onClick={() => navigate('/host')}
                >
                    <Mic className="w-10 h-10 text-brand-purple" />
                    <span className="font-display font-black text-2xl text-white">Host a Game</span>
                    <span className="text-white/50 text-sm font-body">Start the party on your TV</span>
                </motion.button>

                {/* Join Game */}
                <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(13,148,136,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="glass p-8 flex flex-col items-center gap-3 cursor-pointer border-2 border-brand-teal/40 hover:border-brand-teal transition-all"
                    onClick={() => setShowJoin(true)}
                >
                    <Smartphone className="w-10 h-10 text-brand-teal" />
                    <span className="font-display font-black text-2xl text-white">Join Game</span>
                    <span className="text-white/50 text-sm font-body">Enter room code on your phone</span>
                </motion.button>
            </motion.div>

            {/* ── Join code input (slides in when "Join Game" is clicked) ── */}
            {showJoin && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    transition={{ duration: 0.35, type: 'spring' }}
                    className="glass p-6 w-full max-w-md mb-8 flex flex-col gap-4"
                >
                    <h3 className="font-display font-bold text-lg text-white text-center">Enter Room Code</h3>
                    <input
                        className="input text-center text-3xl tracking-widest font-display font-bold uppercase"
                        placeholder="ABCD1"
                        maxLength={6}
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                        autoFocus
                    />
                    <button className="btn-teal text-xl py-4 w-full" onClick={handleJoin}>
                        Join Game {'\u2192'}
                    </button>
                    <button
                        className="text-white/40 hover:text-white/70 text-sm font-body transition-colors"
                        onClick={() => { setShowJoin(false); navigate('/play'); }}
                    >
                        Join manually on next screen
                    </button>
                </motion.div>
            )}

            {/* ── Feature pills ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3 max-w-xl mb-12"
            >
                {FEATURES.map(f => (
                    <span
                        key={f.label}
                        className="glass px-4 py-2 rounded-full text-sm text-white/80 font-body flex items-center gap-2"
                    >
                        <span>{f.emoji}</span>
                        {f.label}
                    </span>
                ))}
            </motion.div>

            {/* ── How It Works ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="w-full max-w-2xl mb-10"
            >
                <h2 className="font-display font-bold text-2xl text-center text-white mb-6">How It Works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {HOW_IT_WORKS.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.12 }}
                                className="glass p-6 flex flex-col items-center text-center gap-3"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 flex items-center justify-center">
                                    <Icon className="w-7 h-7 text-brand-purple" />
                                </div>
                                <h3 className="font-display font-bold text-white text-sm">{step.title}</h3>
                                <p className="text-white/50 text-xs font-body leading-relaxed">{step.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── Footer ── */}
            <p className="text-white/20 text-xs mt-4">{'\u00A9'} Tipsy Trivia</p>
        </div>
    );
}
