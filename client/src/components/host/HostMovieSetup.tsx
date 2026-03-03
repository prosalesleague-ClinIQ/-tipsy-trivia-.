import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MovieModeSettings, LadderVariant, MovieDifficulty, AnswerMode } from '@tipsy-trivia/shared';

interface Props {
    onStart: (settings: MovieModeSettings) => void;
    onBack: () => void;
}

const VARIANTS: { id: LadderVariant; name: string; desc: string; emoji: string }[] = [
    { id: 'plot_ladder', name: 'Plot Ladder', desc: 'Reveal plot clue first, then cast hints stage by stage', emoji: '📖' },
    { id: 'cast_ladder', name: 'Cast Ladder', desc: 'Cast billing hints only — no plot, pure actor recognition', emoji: '🎭' },
];

const DIFFICULTIES: { id: MovieDifficulty; name: string; desc: string; timer: number; startStage: string }[] = [
    { id: 'trailer_trash',      name: 'Trailer Trash',      desc: 'Starts at Stage B · MC · 30s per stage', timer: 30, startStage: 'B' },
    { id: 'matinee_brain',      name: 'Matinee Brain',      desc: 'Starts at Stage A · MC · 25s per stage', timer: 25, startStage: 'A' },
    { id: 'letterboxd_gremlin', name: 'Letterboxd Gremlin', desc: 'Starts at Stage A · Free Text · 20s per stage', timer: 20, startStage: 'A' },
    { id: 'film_school_final',  name: 'Film School Final',  desc: 'Starts at Stage A · Free Text only · 15s per stage', timer: 15, startStage: 'A' },
];

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Crime', 'Adventure'];
const MPAA_RATINGS = ['G', 'PG', 'PG-13', 'R'];
const QUESTION_COUNTS = [5, 10, 15, 20];

const DEFAULT_YEAR_MIN = 1970;
const DEFAULT_YEAR_MAX = 2024;

export default function HostMovieSetup({ onStart, onBack }: Props) {
    const [variant, setVariant] = useState<LadderVariant>('plot_ladder');
    const [difficulty, setDifficulty] = useState<MovieDifficulty>('matinee_brain');
    const [genres, setGenres] = useState<string[]>([]);
    const [mpaa, setMpaa] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(10);
    const [yearMin, setYearMin] = useState(DEFAULT_YEAR_MIN);
    const [yearMax, setYearMax] = useState(DEFAULT_YEAR_MAX);

    const difficultyObj = DIFFICULTIES.find(d => d.id === difficulty)!;
    const answerMode: AnswerMode = difficulty === 'letterboxd_gremlin' || difficulty === 'film_school_final'
        ? 'free_text'
        : 'multiple_choice';

    const handleStart = () => {
        onStart({
            variant,
            difficulty,
            answer_mode: answerMode,
            year_min: yearMin,
            year_max: yearMax,
            genres,
            mpaa,
            question_count: questionCount,
            stage_timer_seconds: difficultyObj.timer,
        });
    };

    const toggleGenre = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    const toggleMpaa = (r: string) => setMpaa(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
                <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-1">
                    ← Back to modes
                </button>

                <h1 className="font-display font-black text-4xl gradient-text mb-1">Movie Modes 🎬</h1>
                <p className="text-white/50 text-sm mb-8">Configure your movie trivia game</p>

                {/* Variant */}
                <section className="mb-8">
                    <h2 className="font-display font-bold text-lg text-white/70 mb-3">Game Variant</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {VARIANTS.map(v => (
                            <button key={v.id}
                                onClick={() => setVariant(v.id)}
                                className={`glass p-4 text-left border-2 transition-all ${variant === v.id ? 'border-orange-400 bg-orange-500/10' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <div className="text-2xl mb-1">{v.emoji}</div>
                                <div className="font-display font-bold text-orange-400">{v.name}</div>
                                <div className="text-white/50 text-xs mt-1">{v.desc}</div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Difficulty */}
                <section className="mb-8">
                    <h2 className="font-display font-bold text-lg text-white/70 mb-3">Difficulty</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {DIFFICULTIES.map(d => (
                            <button key={d.id}
                                onClick={() => setDifficulty(d.id)}
                                className={`glass p-4 text-left border-2 transition-all ${difficulty === d.id ? 'border-orange-400 bg-orange-500/10' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <div className="font-display font-bold text-white">{d.name}</div>
                                <div className="text-white/40 text-xs mt-1">{d.desc}</div>
                            </button>
                        ))}
                    </div>
                    <p className="text-white/30 text-xs mt-2">
                        Answer mode: <span className="text-white/60 font-semibold">{answerMode === 'multiple_choice' ? 'Multiple Choice' : 'Free Text'}</span>
                        {difficulty === 'film_school_final' && ' (forced)'}
                    </p>
                </section>

                {/* Question Count */}
                <section className="mb-8">
                    <h2 className="font-display font-bold text-lg text-white/70 mb-3">Question Count</h2>
                    <div className="flex gap-3">
                        {QUESTION_COUNTS.map(n => (
                            <button key={n}
                                onClick={() => setQuestionCount(n)}
                                className={`glass px-5 py-3 font-display font-bold text-xl border-2 transition-all ${questionCount === n ? 'border-orange-400 text-orange-400' : 'border-white/10 text-white/50 hover:border-white/30'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Year Range */}
                <section className="mb-8">
                    <h2 className="font-display font-bold text-lg text-white/70 mb-3">Year Range</h2>
                    <div className="flex items-center gap-4">
                        <input type="number" min={1920} max={yearMax} value={yearMin}
                            onChange={e => setYearMin(Number(e.target.value))}
                            className="input w-28 text-center font-display font-bold text-lg" />
                        <span className="text-white/40">–</span>
                        <input type="number" min={yearMin} max={2024} value={yearMax}
                            onChange={e => setYearMax(Number(e.target.value))}
                            className="input w-28 text-center font-display font-bold text-lg" />
                    </div>
                    <p className="text-white/30 text-xs mt-2">Leave at defaults for all years</p>
                </section>

                {/* Genres */}
                <section className="mb-8">
                    <h2 className="font-display font-bold text-lg text-white/70 mb-3">
                        Genres <span className="text-white/30 text-sm font-normal">(none = all)</span>
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map(g => (
                            <button key={g} onClick={() => toggleGenre(g)}
                                className={`px-3 py-1 rounded-full text-sm font-body border transition-all ${genres.includes(g) ? 'bg-orange-500/30 border-orange-400 text-orange-200' : 'border-white/20 text-white/50 hover:border-white/40'}`}>
                                {g}
                            </button>
                        ))}
                    </div>
                </section>

                {/* MPAA */}
                <section className="mb-10">
                    <h2 className="font-display font-bold text-lg text-white/70 mb-3">
                        MPAA Rating <span className="text-white/30 text-sm font-normal">(none = all)</span>
                    </h2>
                    <div className="flex gap-3">
                        {MPAA_RATINGS.map(r => (
                            <button key={r} onClick={() => toggleMpaa(r)}
                                className={`px-4 py-2 rounded-lg font-display font-bold border-2 transition-all ${mpaa.includes(r) ? 'bg-orange-500/30 border-orange-400 text-orange-200' : 'border-white/20 text-white/50 hover:border-white/40'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </section>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    className="w-full py-5 font-display font-black text-xl text-black bg-orange-400 hover:bg-orange-300 rounded-2xl transition-colors"
                >
                    Start Movie Game →
                </motion.button>
            </motion.div>
        </div>
    );
}
