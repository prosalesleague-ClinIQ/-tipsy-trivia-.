import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../socket/SocketProvider';
import { useGameState } from '../state/GameStateContext';
import { WifiOff, Tv } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// Controller-mode big button colors — classic game-show A/B/C/D palette
const CTRL_COLORS = [
    'bg-red-600 active:bg-red-700',
    'bg-blue-600 active:bg-blue-700',
    'bg-green-600 active:bg-green-700',
    'bg-yellow-500 active:bg-yellow-600',
];

type Screen = 'join' | 'waiting' | 'question' | 'buzzer' | 'reveal' | 'scoreboard' | 'end' | 'movie_answer' | 'movie_solved' | 'movie_reveal';

export default function PlayPage() {
    const { socket, connected } = useSocket();
    const { state, dispatch } = useGameState();
    const [screen, setScreen] = useState<Screen>('join');
    const [name, setName] = useState('');
    const [code, setCode] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('code') ?? sessionStorage.getItem('joinCode') ?? '';
    });
    const [joinError, setJoinError] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [hasBuzzed, setHasBuzzed] = useState(false);
    const [buzzerLocked, setBuzzerLocked] = useState(false);
    const [movieAnswer, setMovieAnswer] = useState<string>('');
    const [movieDelta, setMovieDelta] = useState<number | null>(null);
    const [movieLockoutEnd, setMovieLockoutEnd] = useState<number>(0);
    const sessionToken = state.mySessionToken;

    // Controller mode: phone shows only buzzer / answer buttons, not the full question text.
    // Set by the landing page when the user chooses "TV / Big Screen" mode.
    const [controllerMode] = useState(() => sessionStorage.getItem('controllerMode') === 'true');

    useEffect(() => {
        if (!socket) return;

        socket.on('question:show', () => {
            setScreen('question');
            setSelectedAnswer(null);
            setHasBuzzed(false);
            setBuzzerLocked(false);
        });

        socket.on('buzzer:lock', (data) => {
            setBuzzerLocked(true);
            if (data.winner_id === socket.id) setScreen('question'); // winner answers
        });

        socket.on('answer:reveal', () => {
            setScreen('reveal');
        });

        socket.on('scoreboard:update', () => {
            setScreen('scoreboard');
        });

        socket.on('game:end', () => {
            setScreen('end');
        });

        socket.on('room:updated', (data) => {
            if (data.room.phase === 'lobby') setScreen('waiting');
            if (data.room.phase === 'question') { setScreen('question'); setSelectedAnswer(null); }
        });

        socket.on('movie:question_start', () => {
            setScreen('movie_answer');
            setMovieAnswer('');
            setMovieDelta(null);
            setMovieLockoutEnd(0);
        });

        socket.on('movie:answer_result', (data) => {
            if (data.correct) {
                setMovieDelta(data.delta);
                setScreen('movie_solved');
            } else {
                setMovieLockoutEnd(data.locked_until ?? 0);
                setMovieDelta(data.delta);
            }
        });

        socket.on('movie:reveal', () => {
            setScreen('movie_reveal');
        });

        return () => {
            socket.off('question:show');
            socket.off('buzzer:lock');
            socket.off('answer:reveal');
            socket.off('scoreboard:update');
            socket.off('game:end');
            socket.off('room:updated');
            socket.off('movie:question_start');
            socket.off('movie:answer_result');
            socket.off('movie:reveal');
        };
    }, [socket]);

    const joinRoom = () => {
        if (!socket || !name.trim() || !code.trim()) return;
        setJoinError('');
        socket.emit('room:join', { code: code.trim().toUpperCase(), player_name: name.trim(), session_token: sessionToken ?? undefined }, (res) => {
            if ('error' in res) {
                setJoinError(res.error);
                return;
            }
            dispatch({ type: 'ROOM_JOINED', payload: { ...res, isHost: false } });
            sessionStorage.setItem('sessionToken', res.session_token);
            sessionStorage.setItem('joinCode', code.trim().toUpperCase());
            setScreen('waiting');
        });
    };

    const submitAnswer = (index: number) => {
        if (!socket || !state.currentQuestion || selectedAnswer !== null) return;
        setSelectedAnswer(index);
        socket.emit('answer:submit', {
            question_id: state.currentQuestion.id,
            answer_index: index,
            client_time_ms: Date.now(),
        });
    };

    const pressBuzzer = () => {
        if (!socket || !state.currentQuestion || hasBuzzed || buzzerLocked) return;
        setHasBuzzed(true);
        socket.emit('buzzer:press', {
            question_id: state.currentQuestion.id,
            client_time_ms: Date.now(),
        });
    };

    if (!connected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass p-8 text-center">
                    <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-white/60">Reconnecting…</p>
                </div>
            </div>
        );
    }

    /* ── Join Screen ── */
    if (screen === 'join') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass p-8 w-full max-w-sm">
                <h1 className="font-display font-black text-3xl gradient-text text-center mb-1">Join Game</h1>
                {controllerMode && (
                    <div className="flex items-center justify-center gap-2 mb-4 mt-1">
                        <Tv className="w-4 h-4 text-brand-teal" />
                        <span className="text-brand-teal text-sm font-body">TV Controller Mode</span>
                    </div>
                )}
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-white/50 text-sm mb-1 block">Room Code</label>
                        <input
                            className="input text-center text-2xl tracking-widest uppercase font-display font-bold"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder="ABCD1"
                            maxLength={6}
                        />
                    </div>
                    <div>
                        <label className="text-white/50 text-sm mb-1 block">Your Name</label>
                        <input
                            className="input text-center text-xl font-body"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Player Name"
                            maxLength={20}
                            onKeyDown={e => e.key === 'Enter' && joinRoom()}
                        />
                    </div>
                    {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
                    <button className="btn-teal w-full text-xl py-4 mt-2" onClick={joinRoom}>
                        Join →
                    </button>
                </div>
            </motion.div>
        </div>
    );

    /* ── Waiting ── */
    if (screen === 'waiting') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-10">
                <div className="w-16 h-16 rounded-full bg-brand-purple/50 flex items-center justify-center font-display font-black text-2xl mx-auto mb-4">
                    {state.myPlayer?.name[0].toUpperCase() ?? '?'}
                </div>
                <h2 className="font-display font-bold text-2xl mb-2">{state.myPlayer?.name}</h2>
                <p className="text-white/40 text-sm mb-2">Room: <span className="text-brand-gold font-bold">{state.room?.code}</span></p>
                {controllerMode && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                        <Tv className="w-3 h-3 text-brand-teal" />
                        <span className="text-brand-teal text-xs">Phone Controller</span>
                    </div>
                )}
                <div className="flex gap-1 justify-center mb-4">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-brand-purple animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
                <p className="text-white/40">Waiting for host to start…</p>
            </motion.div>

            <div className="mt-6 glass p-4 w-full max-w-sm">
                <p className="text-white/40 text-sm text-center mb-2">Players in room</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {Object.values(state.room?.players ?? {}).map(p => (
                        <span key={p.id} className="glass px-3 py-1 rounded-full text-sm text-white/70">{p.name}</span>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Question ── */
    if (screen === 'question') {
        const q = state.currentQuestion;
        const isBuzzerMode = state.buzzerMode;

        // --- BUZZER MODE ---
        if (isBuzzerMode && !state.buzzerWinner) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center">
                    {controllerMode ? (
                        // Controller mode: giant red physical-style dome buzzer
                        <>
                            <p className="text-white/30 text-center mb-8 font-body text-xs tracking-widest uppercase select-none">
                                Buzz in when you know it
                            </p>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                className="rounded-full flex items-center justify-center select-none cursor-pointer disabled:cursor-not-allowed"
                                style={{
                                    width: 'min(72vmin, 320px)',
                                    height: 'min(72vmin, 320px)',
                                    background: hasBuzzed || buzzerLocked
                                        ? 'radial-gradient(circle at 35% 30%, #6b7280, #374151)'
                                        : 'radial-gradient(circle at 35% 30%, #f87171, #dc2626, #991b1b)',
                                    boxShadow: hasBuzzed || buzzerLocked
                                        ? '0 6px 0 #1f2937, 0 10px 40px rgba(0,0,0,0.4)'
                                        : '0 8px 0 #7f1d1d, 0 16px 60px rgba(239,68,68,0.5)',
                                    transition: 'background 0.2s, box-shadow 0.2s',
                                }}
                                onClick={pressBuzzer}
                                disabled={hasBuzzed || buzzerLocked}
                            >
                                <span className="font-display font-black text-white tracking-widest"
                                    style={{ fontSize: 'clamp(2rem, 10vmin, 4rem)' }}>
                                    {hasBuzzed ? '⏳' : 'BUZZ'}
                                </span>
                            </motion.button>
                            {hasBuzzed && (
                                <p className="text-white/30 mt-8 font-body text-sm">Waiting for host…</p>
                            )}
                        </>
                    ) : (
                        // Mobile mode: show question + yellow BUZZ button
                        <div className="flex flex-col items-center p-6">
                            <p className="text-white/50 text-center mb-6 font-body text-lg">
                                {q?.prompt ?? 'Read the question on the main screen…'}
                            </p>
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                className={`btn-buzz w-64 h-64 rounded-full text-4xl font-black ${hasBuzzed ? 'opacity-50' : ''}`}
                                onClick={pressBuzzer}
                                disabled={hasBuzzed || buzzerLocked}
                            >
                                {hasBuzzed ? '⏳' : '⚡ BUZZ!'}
                            </motion.button>
                            {hasBuzzed && <p className="text-white/40 mt-4">Buzzed! Waiting…</p>}
                        </div>
                    )}
                </div>
            );
        }

        if (!q) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>;

        // --- CONTROLLER MODE: full-bleed A/B/C/D pad, no question text ---
        if (controllerMode) {
            return (
                <div className="min-h-screen flex flex-col gap-1 p-1">
                    <div className="grid grid-cols-2 gap-1 flex-1">
                        {q.options.map((opt, i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.96 }}
                                className={`
                                    rounded-2xl flex flex-col items-center justify-center gap-2 p-4
                                    font-display font-black text-white transition-all select-none
                                    ${CTRL_COLORS[i]}
                                    ${selectedAnswer === i ? 'ring-4 ring-white/80' : ''}
                                    ${selectedAnswer !== null && selectedAnswer !== i ? 'opacity-30' : ''}
                                `}
                                style={{ minHeight: 'calc(50vh - 0.5rem)' }}
                                onClick={() => submitAnswer(i)}
                                disabled={selectedAnswer !== null}
                            >
                                <span className="text-7xl font-black leading-none">{OPTION_LABELS[i]}</span>
                                <span className="text-base font-body font-semibold text-white/90 text-center leading-tight line-clamp-2 max-w-[14ch]">{opt}</span>
                            </motion.button>
                        ))}
                    </div>

                    {selectedAnswer !== null && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-3 shrink-0">
                            <p className="text-white/40 font-body text-sm">
                                Picked <span className="text-white font-bold">{OPTION_LABELS[selectedAnswer]}</span> — locked in!
                            </p>
                        </motion.div>
                    )}
                </div>
            );
        }

        // --- FULL MODE: question text + options ---
        return (
            <div className="min-h-screen flex flex-col p-4">
                <div className="flex gap-2 mb-4">
                    <span className="glass px-3 py-1 rounded-full text-xs text-white/50">{q.category}</span>
                    <span className="glass px-3 py-1 rounded-full text-xs font-bold text-brand-gold">{q.difficulty}</span>
                </div>

                <p className="font-body font-bold text-xl text-white leading-snug mb-6">{q.prompt}</p>

                <div className="space-y-3 flex-1">
                    {q.options.map((opt, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.97 }}
                            className={`answer-btn w-full flex items-start gap-3 ${selectedAnswer === i ? 'selected' : ''
                                } ${selectedAnswer !== null && selectedAnswer !== i ? 'opacity-50' : ''}`}
                            onClick={() => submitAnswer(i)}
                            disabled={selectedAnswer !== null}
                        >
                            <span className={`font-display font-black text-xl ${['text-blue-400', 'text-teal-400', 'text-yellow-400', 'text-pink-400'][i]}`}>
                                {OPTION_LABELS[i]}
                            </span>
                            <span className="flex-1">{opt}</span>
                        </motion.button>
                    ))}
                </div>

                {selectedAnswer !== null && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center text-white/40 mt-4 font-body">
                        Answer locked in! Waiting for reveal…
                    </motion.p>
                )}
            </div>
        );
    }

    /* ── Reveal ── */
    if (screen === 'reveal') {
        const rev = state.lastReveal;
        const q = state.currentQuestion;
        const myAnswer = selectedAnswer;
        const correct = myAnswer === rev?.correct_index;

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* 3D Floating Background */}
                <div className="fixed inset-0 -z-10">
                    <svg width="100vw" height="100vh" style={{ position: 'absolute', width: '100vw', height: '100vh' }}>
                        <defs>
                            <radialGradient id="bgGradPlay" cx="50%" cy="50%" r="80%">
                                <stop offset="0%" stopColor="#181a20" />
                                <stop offset="100%" stopColor="#23263a" />
                            </radialGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#bgGradPlay)" />
                        {/* Floating glass orbs */}
                        {[...Array(4)].map((_, i) => (
                            <ellipse
                                key={i}
                                cx={180 + i * 260}
                                cy={120 + i * 180}
                                rx={60 + i * 20}
                                ry={60 + i * 20}
                                fill={i % 2 === 0 ? '#00f6ff22' : '#ff00c822'}
                                style={{ filter: 'blur(24px)' }}
                            />
                        ))}
                    </svg>
                </div>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`glass p-8 w-full max-w-sm text-center border-2 ${correct ? 'border-green-400/60' : 'border-red-400/60'}`}
                >
                    <div className="text-6xl mb-4">{correct ? '✅' : '❌'}</div>
                    <p className={`font-display font-black text-2xl mb-2 ${correct ? 'text-green-400' : 'text-red-400'}`}>
                        {correct ? 'Correct!' : 'Wrong!'}
                    </p>
                    <p className="font-display font-bold text-lg text-white/70 mb-4">
                        Answer: {OPTION_LABELS[rev?.correct_index ?? 0]}. {q?.options[rev?.correct_index ?? 0]}
                    </p>
                    {rev?.explanation && !controllerMode && (
                        <p className="text-white/60 text-sm font-body leading-relaxed">{rev.explanation}</p>
                    )}
                    {rev?.why_weird && !controllerMode && (
                        <p className="text-brand-gold italic text-sm mt-3 font-body">🤯 {rev.why_weird}</p>
                    )}
                </motion.div>

                <div className="mt-6 glass p-4 w-full max-w-sm text-center">
                    <p className="text-white/40 text-sm">Your score</p>
                    <p className="font-display font-black text-3xl text-brand-gold">
                        {state.scores.find(s => s.player_id === socket?.id)?.score.toLocaleString() ?? '0'}
                    </p>
                </div>
            </div>
        );
    }

    /* ── Scoreboard ── */
    if (screen === 'scoreboard') return (
        <div className="min-h-screen flex flex-col p-6">
            <h2 className="font-display font-black text-3xl gradient-text text-center mb-6">Scores</h2>
            <div className="space-y-3">
                {state.scores.map((s, i) => (
                    <div key={s.player_id}
                        className={`glass p-4 flex items-center gap-3 ${s.player_id === socket?.id ? 'border-brand-purple/50' : ''}`}
                    >
                        <span className="font-display font-bold text-2xl w-8 text-white/30">{i + 1}</span>
                        <span className={`flex-1 font-body font-semibold ${s.player_id === socket?.id ? 'text-brand-gold' : 'text-white'}`}>
                            {s.player_name} {s.player_id === socket?.id ? '(you)' : ''}
                        </span>
                        <span className="font-display font-bold text-xl text-brand-gold">{s.score.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── End ── */
    if (screen === 'end') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-10 max-w-sm w-full">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-display font-black text-3xl gradient-text mb-2">Game Over!</h2>
                <p className="text-white/50 mb-6">Winner: <span className="text-brand-gold font-bold">{state.gameEnd?.winner_name}</span></p>
                <div className="space-y-2">
                    {state.scores.map((s, i) => (
                        <div key={s.player_id} className="flex justify-between text-sm">
                            <span className="text-white/60">{i + 1}. {s.player_name}</span>
                            <span className="text-brand-gold">{s.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <motion.button
                    className="w-full mt-6 py-3 rounded-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(90deg, #00f6ff, #ff00c8)', boxShadow: '0 4px 24px #00f6ff55' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    onClick={() => window.location.href = '/'}
                >
                    Play Again
                </motion.button>
            </motion.div>
        </div>
    );

    /* ── Movie Answer ── */
    if (screen === 'movie_answer') {
        const mq = state.movieQuestion;
        const ms = state.room?.movie_state;
        const isMC = ms?.settings?.answer_mode === 'multiple_choice';
        const choices = mq?.choices;
        const isLocked = movieLockoutEnd > Date.now();

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <p className="text-white/40 text-center text-xs uppercase tracking-widest mb-2 font-body">
                        🎬 {ms?.settings?.variant === 'plot_ladder' ? 'Plot Ladder' : 'Cast Ladder'} · Stage {mq?.stage}
                    </p>
                    {movieDelta !== null && movieDelta < 0 && (
                        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-center font-display font-bold text-lg mb-3">
                            Wrong! {movieDelta} pts
                        </motion.p>
                    )}
                    {isLocked && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-red-400 text-center font-body text-sm mb-4">
                            🔒 Locked out… wait a moment
                        </motion.p>
                    )}

                    {isMC && choices ? (
                        <div className="space-y-3">
                            {choices.map((choice, i) => (
                                <motion.button key={i} whileTap={{ scale: 0.97 }}
                                    className="answer-btn w-full flex items-start gap-3"
                                    onClick={() => {
                                        if (isLocked || !mq) return;
                                        socket?.emit('movie:answer', {
                                            question_id: mq.question_id,
                                            answer: choice,
                                            client_time_ms: Date.now(),
                                        });
                                    }}
                                    disabled={isLocked}
                                >
                                    <span className={`font-display font-black text-xl ${['text-red-400','text-blue-400','text-green-400','text-yellow-400'][i]}`}>
                                        {OPTION_LABELS[i]}
                                    </span>
                                    <span className="flex-1">{choice}</span>
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input
                                className="input text-center text-xl"
                                value={movieAnswer}
                                onChange={e => setMovieAnswer(e.target.value)}
                                placeholder="Type the movie title…"
                                disabled={isLocked}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !isLocked && mq) {
                                        socket?.emit('movie:answer', {
                                            question_id: mq.question_id,
                                            answer: movieAnswer,
                                            client_time_ms: Date.now(),
                                        });
                                    }
                                }}
                            />
                            <motion.button whileTap={{ scale: 0.97 }}
                                className="w-full py-4 font-display font-bold text-lg bg-orange-500 hover:bg-orange-400 text-black rounded-2xl transition-colors"
                                onClick={() => {
                                    if (isLocked || !mq || !movieAnswer.trim()) return;
                                    socket?.emit('movie:answer', {
                                        question_id: mq.question_id,
                                        answer: movieAnswer,
                                        client_time_ms: Date.now(),
                                    });
                                }}
                                disabled={isLocked || !movieAnswer.trim()}
                            >
                                Submit →
                            </motion.button>
                        </div>
                    )}

                    <p className="text-white/20 text-center text-xs mt-6 font-body">Watch the host screen for hints</p>
                </div>
            </div>
        );
    }

    /* ── Movie Solved ── */
    if (screen === 'movie_solved') {
        const mq = state.movieQuestion;
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-10 max-w-sm w-full border-2 border-green-400/50">
                    <div className="text-6xl mb-4">🎉</div>
                    <p className="font-display font-black text-2xl text-green-400 mb-2">Got it!</p>
                    <p className="text-white/60 font-body mb-4">Solved at Stage {mq?.stage}</p>
                    {movieDelta !== null && (
                        <p className="font-display font-black text-4xl text-brand-gold">+{movieDelta} pts</p>
                    )}
                    <p className="text-white/30 text-sm mt-6 font-body">Waiting for next question…</p>
                </motion.div>
            </div>
        );
    }

    /* ── Movie Reveal ── */
    if (screen === 'movie_reveal') {
        const rev = state.movieReveal;
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 max-w-sm w-full border-2 border-orange-400/40">
                    <div className="text-4xl mb-3">🎬</div>
                    <h3 className="font-display font-black text-3xl text-orange-400 mb-1">{rev?.answer}</h3>
                    <p className="text-white/40 text-sm mb-4">({rev?.year}) · {rev?.mpaa}</p>
                    <p className="text-white/60 font-body italic text-sm mb-6">{rev?.explain}</p>
                    <div className="mt-4 glass p-4 text-left">
                        <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Your score</p>
                        <p className="font-display font-black text-3xl text-brand-gold">
                            {state.scores.find(s => s.player_id === socket?.id)?.score.toLocaleString() ?? '0'}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null;
}
