import { motion } from 'framer-motion';
import type { GameMode } from '@tipsy-trivia/shared';
import { Grid, Zap, List, Infinity } from 'lucide-react';

interface Props {
    onSelect: (mode: GameMode) => void;
}

const MODES = [
    {
        id: 'trivia_categories' as GameMode,
        name: 'Three-Round Trivia',
        icon: List,
        description: '3 rounds · 10 questions each · 4 difficulties · time bonus scoring',
        color: 'border-brand-purple/50 hover:border-brand-purple',
        bg: 'bg-brand-purple/10',
        accent: 'text-brand-purple',
        emoji: '📚',
    },
    {
        id: 'rapid_fire' as GameMode,
        name: 'Rapid Fire',
        icon: Zap,
        description: '60 seconds · auto-advance · streak multipliers · optional penalty',
        color: 'border-brand-gold/50 hover:border-brand-gold',
        bg: 'bg-brand-gold/10',
        accent: 'text-brand-gold',
        emoji: '⚡',
    },
    {
        id: 'jeopardy' as GameMode,
        name: 'Jeopardy Board',
        icon: Grid,
        description: '5×5 category board · Daily Double · Final Question wager',
        color: 'border-brand-teal/50 hover:border-brand-teal',
        bg: 'bg-brand-teal/10',
        accent: 'text-brand-teal',
        emoji: '🎯',
    },
    {
        id: 'legacy_ladder' as GameMode,
        name: 'Legacy Ladder',
        icon: Infinity,
        description: 'Climb the ladder · strikes system · streak bonus · ad rewards',
        color: 'border-brand-pink/50 hover:border-brand-pink',
        bg: 'bg-brand-pink/10',
        accent: 'text-brand-pink',
        emoji: '🪜',
    },
];

export default function HostModeSelect({ onSelect }: Props) {
    return (
        <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <h1 className="font-display font-black text-5xl gradient-text mb-3">Choose Your Mode</h1>
                <p className="text-white/50 text-lg">Select a game mode. The host script will adapt automatically.</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                {MODES.map((mode, i) => {
                    const Icon = mode.icon;
                    return (
                        <motion.button
                            key={mode.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.03, y: -4 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelect(mode.id)}
                            className={`glass p-8 text-left border-2 ${mode.color} ${mode.bg} transition-all duration-200`}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <span className="text-5xl">{mode.emoji}</span>
                                <div>
                                    <h2 className={`font-display font-black text-2xl ${mode.accent}`}>{mode.name}</h2>
                                    <p className="text-white/50 text-sm mt-1">{mode.description}</p>
                                </div>
                            </div>
                            <div className={`${mode.accent} font-display font-bold text-sm flex items-center gap-2 mt-4`}>
                                Play this mode →
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
