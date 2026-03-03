import { useState } from 'react';
import { motion } from 'framer-motion';
import type { HostConfig, ComedianPreset } from '@tipsy-trivia/shared';
import { COMEDIAN_PRESETS_CLIENT } from '../../data/comedianPresets';
import { ChevronRight, Mic, Volume2 } from 'lucide-react';
import { useSpeech } from '../../state/useSpeech';

interface Props {
    onDone: (config: HostConfig) => void;
}

export default function HostComedianSetup({ onDone }: Props) {
    const [selected, setSelected] = useState<ComedianPreset[]>([]);
    const [weights, setWeights] = useState<number[]>([50, 50, 50]);
    const [roastLevel, setRoastLevel] = useState<HostConfig['roast_level']>('medium');
    const [pace, setPace] = useState<HostConfig['pace']>('normal');
    const { speak } = useSpeech(pace, selected);
    const [ttsStatus, setTtsStatus] = useState<'idle' | 'playing' | 'error'>('idle');

    const trySpeak = () => {
        setTtsStatus('playing');
        speak('Welcome to Tipsy Trivia! This is your host voice preview.');
        // Reset after a short window — speak() handles errors internally
        setTimeout(() => setTtsStatus('idle'), 2000);
    };

    const togglePreset = (preset: ComedianPreset) => {
        setSelected(prev => {
            if (prev.find(p => p.id === preset.id)) {
                return prev.filter(p => p.id !== preset.id);
            }
            if (prev.length >= 3) return prev;
            return [...prev, preset];
        });
    };

    const handleDone = () => {
        const presets = selected.length > 0 ? selected : [COMEDIAN_PRESETS_CLIENT[0]];
        onDone({
            presets,
            preset_weights: weights.slice(0, presets.length),
            roast_level: roastLevel,
            pace,
        });
    };

    const roastLabels: Record<HostConfig['roast_level'], string> = {
        mild: '😇 Mild', medium: '🔥 Medium', spicy: '🌶️ Spicy',
    };
    const paceLabels: Record<HostConfig['pace'], string> = {
        slow: '🐢 Slow', normal: '🚶 Normal', fast: '🏃 Fast',
    };

    return (
        <div className="animated-bg min-h-screen p-8 flex flex-col">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Mic className="w-8 h-8 text-brand-gold" />
                    <h1 className="font-display font-black text-4xl gradient-text">Host Voice Setup</h1>
                </div>
                <p className="text-white/50">Pick up to 3 comedian style influences. The host will use original commentary inspired by your blend.</p>
            </div>

            {/* Comedian preset grid */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
                {COMEDIAN_PRESETS_CLIENT.map(preset => {
                    const isSelected = !!selected.find(s => s.id === preset.id);
                    const idx = selected.findIndex(s => s.id === preset.id);
                    return (
                        <motion.button
                            key={preset.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => togglePreset(preset)}
                            className={`glass p-4 text-left transition-all relative ${isSelected ? 'border-brand-gold/60 bg-brand-gold/10' : 'hover:border-white/30'}`}
                        >
                            {isSelected && (
                                <span className="absolute top-2 right-2 bg-brand-gold text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                </span>
                            )}
                            <p className="font-display font-bold text-sm">{preset.name}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {preset.style_tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Style weight sliders */}
            {selected.length > 0 && (
                <div className="glass p-6 mb-6">
                    <h3 className="font-display font-bold text-lg mb-4">Style Mix Weights</h3>
                    <div className="space-y-4">
                        {selected.map((preset, i) => (
                            <div key={preset.id} className="flex items-center gap-4">
                                <span className="font-body text-sm w-32 text-white/70">{preset.name}</span>
                                <input
                                    type="range" min={0} max={100} value={weights[i] ?? 50}
                                    onChange={e => {
                                        const w = [...weights];
                                        w[i] = Number(e.target.value);
                                        setWeights(w);
                                    }}
                                    className="flex-1 accent-brand-purple"
                                />
                                <span className="text-brand-gold font-display font-bold w-10 text-right">{weights[i] ?? 50}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Roast level + Pace */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="glass p-6">
                    <h3 className="font-display font-bold mb-4">Roast Level</h3>
                    <div className="flex gap-3">
                        {(['mild', 'medium', 'spicy'] as HostConfig['roast_level'][]).map(l => (
                            <button
                                key={l}
                                onClick={() => setRoastLevel(l)}
                                className={`flex-1 py-3 rounded-xl font-display font-bold transition-all ${roastLevel === l ? 'bg-brand-purple text-white' : 'glass text-white/60 hover:text-white'}`}
                            >{roastLabels[l]}</button>
                        ))}
                    </div>
                </div>
                <div className="glass p-6">
                    <h3 className="font-display font-bold mb-4">Pace</h3>
                    <div className="flex gap-3">
                        {(['slow', 'normal', 'fast'] as HostConfig['pace'][]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPace(p)}
                                className={`flex-1 py-3 rounded-xl font-display font-bold transition-all ${pace === p ? 'bg-brand-teal text-white' : 'glass text-white/60 hover:text-white'}`}
                            >{paceLabels[p]}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Test voice */}
            <div className="glass p-5 mb-8 flex items-center gap-4">
                <button
                    onClick={trySpeak}
                    disabled={ttsStatus === 'playing'}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gold text-black font-bold shadow-lg hover:bg-yellow-400 transition disabled:opacity-60"
                >
                    <Volume2 className="w-5 h-5" />
                    {ttsStatus === 'playing' ? 'Playing…' : 'Test Host Voice'}
                </button>
                <p className="text-white/50 text-sm">
                    {ttsStatus === 'error'
                        ? '⚠️ Playback failed — check browser audio settings or try ElevenLabs API key.'
                        : 'Hear a sample with your current comedian blend and pace.'}
                </p>
            </div>

            <div className="flex justify-between items-center">
                <p className="text-white/30 text-xs max-w-sm">
                    ⚠️ Host commentary is original writing. No imitation, no catchphrases, no protected-class content.
                    Roast targets game behavior only.
                </p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-gold text-xl px-10 py-4 flex items-center gap-3"
                    onClick={handleDone}
                >
                    Choose Game Mode <ChevronRight className="w-5 h-5" />
                </motion.button>
            </div>
        </div>
    );
}
