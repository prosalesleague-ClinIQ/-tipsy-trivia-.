import { useState, useEffect } from 'react';
import { useSocket } from '../socket/SocketProvider';
import { useGameState } from '../state/GameStateContext';
import { motion } from 'framer-motion';
import { Eye, WifiOff } from 'lucide-react';

export default function WatchPage() {
    const { socket, connected } = useSocket();
    const { state, dispatch } = useGameState();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isWatching, setIsWatching] = useState(false);

    useEffect(() => {
        if (!socket) return;
        const roomUpdates = (data: any) => dispatch({ type: 'ROOM_UPDATED', payload: data });
        socket.on('room:updated', roomUpdates);
        socket.on('scoreboard:update', data => dispatch({ type: 'SCOREBOARD_UPDATE', payload: data }));
        socket.on('question:show', data => dispatch({ type: 'QUESTION_SHOW', payload: data }));
        socket.on('answer:reveal', data => dispatch({ type: 'ANSWER_REVEAL', payload: data }));

        return () => {
            socket.off('room:updated', roomUpdates);
            socket.off('scoreboard:update');
            socket.off('question:show');
            socket.off('answer:reveal');
        };
    }, [socket, dispatch]);

    const joinSpectator = () => {
        if (!socket || !code.trim()) return;
        setError('');
        socket.emit('room:join', { code: code.trim().toUpperCase(), player_name: `Spectator_${Math.floor(Math.random() * 1000)}` }, (res) => {
            if ('error' in res) {
                setError(res.error);
                return;
            }
            setIsWatching(true);
            dispatch({ type: 'ROOM_JOINED', payload: { ...res, isHost: false } });
        });
    };

    if (!connected) return (
        <div className="animated-bg min-h-screen flex items-center justify-center">
            <div className="glass p-8 text-center">
                <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-white/60">Connecting...</p>
            </div>
        </div>
    );

    if (!isWatching) return (
        <div className="animated-bg min-h-screen flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 w-full max-w-sm text-center">
                <Eye className="w-10 h-10 text-brand-teal mx-auto mb-4" />
                <h1 className="font-display font-black text-3xl gradient-text mb-6">Spectate Game</h1>
                <input
                    className="input text-center text-2xl tracking-widest uppercase font-display font-bold mb-4"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && joinSpectator()}
                />
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <button className="btn-secondary w-full text-xl py-3" onClick={joinSpectator}>
                    Watch →
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className="animated-bg min-h-screen p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-brand-teal" />
                    <span className="font-display font-bold text-white/50">Spectating Room: <span className="text-brand-gold">{state.room?.code}</span></span>
                </div>
                <span className="glass px-3 py-1 text-xs rounded-full">Phase: {state.room?.phase}</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6">
                    <h2 className="font-display font-bold text-xl mb-4 text-white/70">Current State</h2>
                    {state.currentQuestion ? (
                        <div>
                            <p className="text-sm text-brand-gold mb-2">{state.currentQuestion.category} • {state.currentQuestion.difficulty}</p>
                            <p className="font-body text-xl">{state.currentQuestion.prompt}</p>
                        </div>
                    ) : (
                        <p className="text-white/40 italic">Waiting for question...</p>
                    )}
                </div>

                <div className="glass p-6">
                    <h2 className="font-display font-bold text-xl mb-4 text-white/70">Live Standings</h2>
                    <div className="space-y-2">
                        {state.scores.map((s, i) => (
                            <div key={s.player_id} className="flex justify-between p-2 rounded bg-white/5">
                                <span className="font-body"><span className="text-white/40 w-4 inline-block">{i + 1}.</span> {s.player_name}</span>
                                <span className="font-display font-bold text-brand-gold">{s.score.toLocaleString()}</span>
                            </div>
                        ))}
                        {state.scores.length === 0 && <p className="text-white/40 text-sm italic">No scores yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
