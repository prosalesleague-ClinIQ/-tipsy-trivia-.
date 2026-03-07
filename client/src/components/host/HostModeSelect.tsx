import { motion } from 'framer-motion';
import type { GameMode } from '@tipsy-trivia/shared';
import { Grid, Zap, List, Infinity, Film, Smile } from 'lucide-react';

interface Props {
    onSelect: (mode: GameMode | 'movie_modes', category?: string) => void;
}

const MODES = [
    {
        id: 'fun_fact' as GameMode,
        name: 'Fun Fact',
        icon: Smile,
        description: 'Bizarre facts · multiple choice · no pressure · pure trivia chaos',
        color: 'border-yellow-400/50 hover:border-yellow-400',
        bg: 'bg-yellow-400/10',
        accent: 'text-yellow-400',
        emoji: '😲',
    },
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
    {
        id: 'movie_modes' as const,
        name: 'Movie Modes',
        icon: Film,
        description: 'Plot Ladder & Cast Ladder · stage hints · free text or MC · speed bonus',
        color: 'border-orange-500/50 hover:border-orange-400',
        bg: 'bg-orange-500/10',
        accent: 'text-orange-400',
        emoji: '🎬',
    },
];

import { useState, useEffect } from 'react';
import { useSocket } from '../../socket/SocketProvider';

export default function HostModeSelect({ onSelect }: Props) {
    const { socket } = useSocket();
    const [categories, setCategories] = useState<string[]>([]);
    const [expandedMode, setExpandedMode] = useState<GameMode | 'movie_modes' | null>(null);

    useEffect(() => {
        if (!socket) return;
        socket.emit('categories:list');
        socket.on('categories:list', (data: { categories: string[] }) => {
            setCategories(data.categories);
        });
        return () => {
            socket.off('categories:list');
        };
    }, [socket]);

    const handleModeClick = (modeId: GameMode | 'movie_modes') => {
        // Modes that allow category selection
        if (modeId === 'rapid_fire' || modeId === 'legacy_ladder' || modeId === 'trivia_categories' || modeId === 'fun_fact') {
            if (expandedMode === modeId) {
                // If already expanded, default to full random
                onSelect(modeId);
            } else {
                setExpandedMode(modeId);
            }
        } else {
            onSelect(modeId);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 mt-8">
                <h1 className="font-display font-black text-5xl gradient-text mb-3">Choose Your Mode</h1>
                <p className="text-white/50 text-lg">Select a game mode. The host script will adapt automatically.</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl pb-12" style={{ gridAutoRows: 'auto' }}>
                {MODES.map((mode, i) => {
                    const isExpanded = expandedMode === mode.id;

                    return (
                        <motion.div
                            key={mode.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`glass text-left border-2 ${mode.color} ${mode.bg} transition-all duration-200 overflow-hidden flex flex-col`}
                        >
                            <button
                                className="p-8 pb-4 flex items-start gap-4 text-left w-full h-full"
                                onClick={() => handleModeClick(mode.id)}
                            >
                                <span className="text-5xl">{mode.emoji}</span>
                                <div className="flex-1">
                                    <h2 className={`font-display font-black text-2xl ${mode.accent}`}>{mode.name}</h2>
                                    <p className="text-white/50 text-sm mt-1 mb-2 leading-snug">{mode.description}</p>
                                    <div className={`${mode.accent} font-display font-bold text-sm flex items-center gap-2 mt-2`}>
                                        {isExpanded ? 'Cancel Selection' : 'Play this mode →'}
                                    </div>
                                </div>
                            </button>

                            {/* Category Selector Expansion */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="px-8 pb-8 pt-2 border-t border-white/5 bg-black/20"
                                >
                                    <p className="text-white/60 mb-3 text-sm font-bold font-display uppercase tracking-widest">Select Category</p>
                                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            className={`w-full text-left p-3 rounded-xl font-bold bg-white/5 hover:${mode.bg} transition-colors flex justify-between`}
                                            onClick={() => onSelect(mode.id)}
                                        >
                                            🎲 Random Categories
                                            <span className="opacity-50 text-xs mt-1">Mixed from all</span>
                                        </button>

                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                className={`w-full text-left p-3 rounded-xl font-body font-medium bg-white/5 hover:${mode.bg} transition-colors flex justify-between`}
                                                onClick={() => onSelect(mode.id, cat)}
                                            >
                                                <span>{cat}</span>
                                                <span className={`${mode.accent} opacity-0 hover:opacity-100 transition-opacity`}>Play →</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
