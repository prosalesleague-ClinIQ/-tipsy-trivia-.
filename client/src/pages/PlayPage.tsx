import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../socket/SocketProvider';
import { useGameState } from '../state/GameStateContext';
import { WifiOff, Tv } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// Controller-mode big button colors
const CTRL_COLORS = [
    'bg-blue-500/80 border-blue-400 active:bg-blue-400',
    'bg-teal-500/80 border-teal-400 active:bg-teal-400',
    'bg-yellow-500/80 border-yellow-400 active:bg-yellow-400',
    'bg-pink-500/80 border-pink-400 active:bg-pink-400',
];

type Screen = 'join' | 'waiting' | 'question' | 'buzzer' | 'reveal' | 'scoreboard' | 'end';

export default function PlayPage() {
    const { socket, connected } = useSocket();
    const { state, dispatch } = useGameState();
    const [screen, setScreen] = useState<Screen>('join');
    const [name, setName] = useState('');
    const [code, setCode] = useState(sessionStorage.getItem('joinCode') ?? '');
    const [joinError, setJoinError] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [hasBuzzed, setHasBuzzed] = useState(false);
    const [buzzerLocked, setBuzzerLocked] = useState(false);
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

        return () => {
            socket.off('question:show');
            socket.off('buzzer:lock');
            socket.off('answer:reveal');
            socket.off('scoreboard:update');
            socket.off('game:end');
            socket.off('room:updated');
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
            <div className="animated-bg min-h-screen flex items-center justify-center">
                <div className="glass p-8 text-center">
                    <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-white/60">Reconnecting…</p>
                </div>
            </div>
        );
    }

    /* ── Join Screen ── */
    if (screen === 'join') return (
        <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-6">
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
        <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-6 text-center">
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
                <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-6">
                    {/* In controller mode don't repeat the question — it's on the TV */}
                    {!controllerMode && (
                        <p className="text-white/50 text-center mb-6 font-body text-lg">
                            {q?.prompt ?? 'Read the question on the main screen…'}
                        </p>
                    )}
                    {controllerMode && (
                        <p className="text-white/40 text-center mb-6 font-body text-sm">
                            Watch the TV — buzz in when you know the answer!
                        </p>
                    )}
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
            );
        }

        if (!q) return <div className="animated-bg min-h-screen flex items-center justify-center text-white/40">Loading…</div>;

        // --- CONTROLLER MODE: big A/B/C/D buttons, no question text ---
        if (controllerMode) {
            return (
                <div className="animated-bg min-h-screen flex flex-col p-4">
                    <div className="flex items-center justify-center gap-2 mb-4 mt-2">
                        <Tv className="w-4 h-4 text-brand-teal" />
                        <span className="text-white/40 text-sm">Answer on your phone — question is on the TV</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 mt-2">
                        {q.options.map((opt, i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.93 }}
                                className={`
                                    rounded-2xl border-2 flex flex-col items-center justify-center p-4 gap-3 min-h-[140px]
                                    font-display font-black text-white text-2xl transition-all
                                    ${CTRL_COLORS[i]}
                                    ${selectedAnswer === i ? 'ring-4 ring-white/60 scale-95' : ''}
                                    ${selectedAnswer !== null && selectedAnswer !== i ? 'opacity-40' : ''}
                                `}
                                onClick={() => submitAnswer(i)}
                                disabled={selectedAnswer !== null}
                            >
                                <span className="text-5xl font-black">{OPTION_LABELS[i]}</span>
                                <span className="text-sm font-body font-semibold text-white/90 text-center leading-tight line-clamp-2">{opt}</span>
                            </motion.button>
                        ))}
                    </div>

                    {selectedAnswer !== null && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-4">
                            <p className="text-white/40 font-body">
                                Picked <span className="text-white font-bold">{OPTION_LABELS[selectedAnswer]}</span> — locked in!
                            </p>
                        </motion.div>
                    )}
                </div>
            );
        }

        // --- FULL MODE: question text + options ---
        return (
            <div className="animated-bg min-h-screen flex flex-col p-4">
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
            <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-6">
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
        <div className="animated-bg min-h-screen flex flex-col p-6">
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
        <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-6 text-center">
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
                <button className="btn-secondary w-full mt-6" onClick={() => window.location.href = '/'}>
                    Play Again
                </button>
            </motion.div>
        </div>
    );

    return null;
}
