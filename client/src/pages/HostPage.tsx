import { useState, useEffect } from 'react';
import { useSocket } from '../socket/SocketProvider';
import { useGameState } from '../state/GameStateContext';
import { useSpeech } from '../state/useSpeech';
import { motion } from 'framer-motion';
import { WifiOff, Users, Zap, Flame, Brain, Loader2 } from 'lucide-react';
import type { HostConfig, GameMode, Difficulty, ContentRating } from '@tipsy-trivia/shared';
import HostLobbyScreen from '../components/host/HostLobbyScreen';
import HostComedianSetup from '../components/host/HostComedianSetup';
import HostModeSelect from '../components/host/HostModeSelect';
import HostQuestionScreen from '../components/host/HostQuestionScreen';
import HostRevealScreen from '../components/host/HostRevealScreen';
import HostScoreboard from '../components/host/HostScoreboard';
import HostJeopardyBoard from '../components/host/HostJeopardyBoard';
import HostEndGame from '../components/host/HostEndGame';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; icon: string; color: string }[] = [
    { value: 'Easy', label: 'Easy', icon: '🟢', color: 'border-green-500 bg-green-500/20 text-green-300' },
    { value: 'Medium', label: 'Medium', icon: '🟡', color: 'border-yellow-500 bg-yellow-500/20 text-yellow-300' },
    { value: 'Hard', label: 'Hard', icon: '🔴', color: 'border-red-500 bg-red-500/20 text-red-300' },
    { value: 'Genius', label: 'Genius', icon: '🧠', color: 'border-purple-500 bg-purple-500/20 text-purple-300' },
];

const CONTENT_OPTIONS: { value: ContentRating; label: string; desc: string; color: string }[] = [
    { value: 'family', label: 'Family Friendly', desc: 'Clean jokes, all ages', color: 'border-green-500 bg-green-500/20 text-green-300' },
    { value: 'adult', label: 'Adult', desc: 'Edgy humor & roasts', color: 'border-yellow-500 bg-yellow-500/20 text-yellow-300' },
    { value: 'spicy', label: 'Spicy AF', desc: 'No filter, savage', color: 'border-red-500 bg-red-500/20 text-red-300' },
];

export default function HostPage() {
    const { socket, connected } = useSocket();
    const { state, dispatch } = useGameState();
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [hostName, setHostName] = useState('Host');
    const [screen, setScreen] = useState<'setup' | 'lobby' | 'comedian' | 'mode_select' | 'game'>('setup');

    // Setup state
    const [playerCount, setPlayerCount] = useState(4);
    const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [contentRating, setContentRating] = useState<ContentRating>('adult');
    const [creating, setCreating] = useState(false);

    const pace = state.room?.host_config?.pace ?? 'normal';
    const { speak, stop } = useSpeech(pace, state.room?.host_config?.presets ?? undefined);

    // Sync player name array with count
    useEffect(() => {
        setPlayerNames(prev => {
            const next = [...prev];
            while (next.length < playerCount) next.push('');
            return next.slice(0, playerCount);
        });
    }, [playerCount]);

    useEffect(() => {
        if (state.hostScript?.opening_monologue) {
            speak(state.hostScript.opening_monologue);
        }
    }, [state.hostScript]);

    useEffect(() => {
        if (!socket) return;
        const handler = (data: { host_intro?: string }) => {
            if (data.host_intro) speak(data.host_intro);
        };
        socket.on('round:advance', handler);
        return () => { socket.off('round:advance', handler); };
    }, [socket, speak]);

    useEffect(() => {
        if (!socket) return;
        socket.on('room:joined', (data) => {
            dispatch({ type: 'ROOM_JOINED', payload: { ...data, isHost: true } });
            setRoomCode(data.room.code);
            setScreen('lobby');
        });
        return () => {
            socket.off('room:joined');
            stop();
        };
    }, [socket]);

    useEffect(() => {
        if (!state.room) return;
        const phase = state.room.phase;
        if (phase === 'lobby') setScreen('lobby');
        else if (phase === 'comedian_setup') setScreen('comedian');
        else if (phase === 'mode_select') setScreen('mode_select');
        else setScreen('game');
    }, [state.room?.phase]);

    const createRoom = async () => {
        if (!socket || creating) return;
        const names = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`);
        setCreating(true);

        socket.emit('room:create', { host_name: hostName }, (res) => {
            if ('error' in res) {
                alert(res.error);
                setCreating(false);
                return;
            }
            const code = res.room_code;
            setRoomCode(code);

            // Join as host
            socket.emit('room:join', { code, player_name: hostName }, (joinRes) => {
                if ('error' in joinRes) { setCreating(false); return; }
                dispatch({ type: 'ROOM_JOINED', payload: { ...joinRes, isHost: true } });

                // Push difficulty + content settings
                socket.emit('settings:update', {
                    settings: { max_players: playerCount + 1, difficulty, content_rating: contentRating },
                });

                // Register each player
                let joined = 0;
                for (const name of names) {
                    socket.emit('room:join', { code, player_name: name }, () => {
                        joined++;
                        if (joined === names.length) setCreating(false);
                    });
                }

                setScreen('lobby');
            });
        });
    };

    const startGame = (mode: GameMode) => {
        if (!socket || !roomCode) return;
        socket.emit('game:start', {
            mode,
            settings: { ...state.room?.settings, difficulty, content_rating: contentRating },
        });
    };

    const setHostConfig = (config: HostConfig) => {
        if (!socket) return;
        const adjustedConfig: HostConfig = {
            ...config,
            roast_level: contentRating === 'family' ? 'mild' : contentRating === 'adult' ? 'medium' : 'spicy',
        };
        socket.emit('host:config', { config: adjustedConfig });
        setScreen('mode_select');
    };

    // ── Not connected ──────────────────────────────────────────
    if (!connected) {
        return (
            <div className="animated-bg min-h-screen flex items-center justify-center p-6">
                <div className="glass p-8 text-center max-w-md">
                    <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white/70 text-lg mb-2">Connecting to game server...</p>
                    <p className="text-white/40 text-sm">This may take a moment if the server is waking up.</p>
                    <Loader2 className="w-6 h-6 text-brand-purple animate-spin mx-auto mt-4" />
                </div>
            </div>
        );
    }

    // ── Setup screen (player names, difficulty, joke level) ────
    if (screen === 'setup') {
        return (
            <div className="animated-bg min-h-screen flex items-center justify-center p-4 overflow-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-8 max-w-2xl w-full my-8"
                >
                    <h1 className="font-display font-black text-4xl gradient-text mb-1 text-center">Host a Game</h1>
                    <p className="text-white/50 mb-6 text-center text-sm">Set up your trivia night</p>

                    {/* Host name */}
                    <div className="mb-5">
                        <label className="text-white/60 text-sm font-display font-bold block mb-2">Your Name (Host)</label>
                        <input className="input text-center text-lg" placeholder="Host" value={hostName}
                            onChange={e => setHostName(e.target.value || 'Host')} maxLength={20} />
                    </div>

                    {/* Player count */}
                    <div className="mb-5">
                        <label className="text-white/60 text-sm font-display font-bold flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4" /> How many players?
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {[2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                                <button key={n}
                                    className={`w-12 h-12 rounded-xl font-display font-bold text-lg transition-all ${
                                        playerCount === n
                                            ? 'bg-brand-purple text-white scale-110 shadow-lg shadow-purple-900/50'
                                            : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                                    onClick={() => setPlayerCount(n)}>{n}</button>
                            ))}
                        </div>
                    </div>

                    {/* Player names */}
                    <div className="mb-5">
                        <label className="text-white/60 text-sm font-display font-bold block mb-3">Player Names</label>
                        <div className="grid grid-cols-2 gap-3">
                            {playerNames.map((name, i) => (
                                <input key={i} className="input text-sm" placeholder={`Player ${i + 1}`}
                                    value={name} maxLength={20}
                                    onChange={e => {
                                        const next = [...playerNames];
                                        next[i] = e.target.value;
                                        setPlayerNames(next);
                                    }} />
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="mb-5">
                        <label className="text-white/60 text-sm font-display font-bold flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4" /> Difficulty
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {DIFFICULTY_OPTIONS.map(opt => (
                                <button key={opt.value}
                                    className={`p-3 rounded-xl font-display font-bold text-sm border-2 transition-all ${
                                        difficulty === opt.value ? opt.color : 'border-white/10 text-white/40 hover:border-white/30'}`}
                                    onClick={() => setDifficulty(opt.value)}>
                                    <span className="text-lg block">{opt.icon}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Joke Level */}
                    <div className="mb-8">
                        <label className="text-white/60 text-sm font-display font-bold flex items-center gap-2 mb-3">
                            <Flame className="w-4 h-4" /> Joke Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {CONTENT_OPTIONS.map(opt => (
                                <button key={opt.value}
                                    className={`p-3 rounded-xl font-display font-bold text-sm border-2 transition-all text-center ${
                                        contentRating === opt.value ? opt.color : 'border-white/10 text-white/40 hover:border-white/30'}`}
                                    onClick={() => setContentRating(opt.value)}>
                                    {opt.label}
                                    <span className="block text-xs font-body font-normal mt-1 opacity-70">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="btn-primary w-full text-xl py-4 flex items-center justify-center gap-3"
                        onClick={createRoom} disabled={creating}>
                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {creating ? 'Creating...' : 'Create Room & Start'}
                    </button>
                </motion.div>
            </div>
        );
    }

    if (screen === 'lobby') {
        return <HostLobbyScreen roomCode={roomCode!} room={state.room} onNext={() => setScreen('comedian')} />;
    }
    if (screen === 'comedian') {
        return <HostComedianSetup onDone={setHostConfig} />;
    }
    if (screen === 'mode_select') {
        return <HostModeSelect onSelect={startGame} />;
    }

    const phase = state.room?.phase;
    if (phase === 'question' || phase === 'buzzer_wait' || phase === 'buzzer_answer') return <HostQuestionScreen />;
    if (phase === 'answer_reveal') return <HostRevealScreen />;
    if (phase === 'round_end' || phase === 'final_scoreboard') {
        if (state.gameEnd) return <HostEndGame />;
        return <HostScoreboard />;
    }
    if (phase === 'jeopardy_board') return <HostJeopardyBoard />;
    return <HostScoreboard />;
}
