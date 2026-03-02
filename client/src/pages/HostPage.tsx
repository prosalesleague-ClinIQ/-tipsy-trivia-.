import { useState, useEffect } from 'react';
import { useSocket } from '../socket/SocketProvider';
import { useGameState } from '../state/GameStateContext';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Users, Settings, Play, ChevronRight } from 'lucide-react';
import type { Room, Player, HostConfig, ComedianPreset, GameMode } from '@tipsy-trivia/shared';
import { COMEDIAN_PRESETS_CLIENT } from '../data/comedianPresets';
import HostLobbyScreen from '../components/host/HostLobbyScreen';
import HostComedianSetup from '../components/host/HostComedianSetup';
import HostModeSelect from '../components/host/HostModeSelect';
import HostQuestionScreen from '../components/host/HostQuestionScreen';
import HostRevealScreen from '../components/host/HostRevealScreen';
import HostScoreboard from '../components/host/HostScoreboard';
import HostJeopardyBoard from '../components/host/HostJeopardyBoard';
import HostEndGame from '../components/host/HostEndGame';

export default function HostPage() {
    const { socket, connected } = useSocket();
    const { state, dispatch } = useGameState();
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [hostName, setHostName] = useState('Host');
    const [screen, setScreen] = useState<'setup' | 'lobby' | 'comedian' | 'mode_select' | 'game'>('setup');

    useEffect(() => {
        if (!socket) return;

        socket.on('room:joined', (data) => {
            dispatch({ type: 'ROOM_JOINED', payload: { ...data, isHost: true } });
            setRoomCode(data.room.code);
            setScreen('lobby');
        });

        socket.on('player:joined', () => { });
        socket.on('game:mode_selected', () => { });

        return () => {
            socket.off('room:joined');
            socket.off('player:joined');
            socket.off('game:mode_selected');
        };
    }, [socket]);

    // Route to appropriate sub-screen based on game phase
    useEffect(() => {
        if (!state.room) return;
        const phase = state.room.phase;
        if (phase === 'lobby') setScreen('lobby');
        else if (phase === 'comedian_setup') setScreen('comedian');
        else if (phase === 'mode_select') setScreen('mode_select');
        else setScreen('game');
    }, [state.room?.phase]);

    const createRoom = () => {
        if (!socket) return;
        socket.emit('room:join',
            { code: '__create__', player_name: hostName },
            () => { }
        );
        // Actually use create event
        socket.emit('room:create', { host_name: hostName }, (res) => {
            if ('error' in res) {
                alert(res.error);
                return;
            }
            setRoomCode(res.room_code);
            // Now join as player-host
            socket.emit('room:join', { code: res.room_code, player_name: hostName }, (joinRes) => {
                if ('error' in joinRes) return;
                dispatch({ type: 'ROOM_JOINED', payload: { ...joinRes, isHost: true } });
                setScreen('lobby');
            });
        });
    };

    const startGame = (mode: GameMode) => {
        if (!socket || !roomCode) return;
        socket.emit('game:start', {
            mode,
            settings: state.room?.settings ?? {},
        });
    };

    const setHostConfig = (config: HostConfig) => {
        if (!socket) return;
        socket.emit('host:config', { config });
        setScreen('mode_select');
    };

    if (!connected) {
        return (
            <div className="animated-bg min-h-screen flex items-center justify-center">
                <div className="glass p-8 text-center">
                    <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white/70">Connecting to server...</p>
                </div>
            </div>
        );
    }

    if (screen === 'setup') {
        return (
            <div className="animated-bg min-h-screen flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass p-10 max-w-md w-full text-center">
                    <h1 className="font-display font-black text-4xl gradient-text mb-2">Host a Game</h1>
                    <p className="text-white/50 mb-8">You'll control from this screen. Players join on their phones.</p>
                    <input
                        className="input text-center text-lg mb-6"
                        placeholder="Your display name (optional)"
                        value={hostName}
                        onChange={e => setHostName(e.target.value || 'Host')}
                        maxLength={20}
                    />
                    <button className="btn-primary w-full text-xl py-4" onClick={createRoom}>
                        Create Room →
                    </button>
                </motion.div>
            </div>
        );
    }

    if (screen === 'lobby') {
        return <HostLobbyScreen
            roomCode={roomCode!}
            room={state.room}
            onNext={() => setScreen('comedian')}
        />;
    }

    if (screen === 'comedian') {
        return <HostComedianSetup onDone={setHostConfig} />;
    }

    if (screen === 'mode_select') {
        return <HostModeSelect onSelect={startGame} />;
    }

    // Game screens — routed by phase
    const phase = state.room?.phase;
    if (phase === 'question' || phase === 'buzzer_wait' || phase === 'buzzer_answer') {
        return <HostQuestionScreen />;
    }
    if (phase === 'answer_reveal') {
        return <HostRevealScreen />;
    }
    if (phase === 'round_end' || phase === 'final_scoreboard') {
        if (state.gameEnd) return <HostEndGame />;
        return <HostScoreboard />;
    }
    if (phase === 'jeopardy_board') {
        return <HostJeopardyBoard />;
    }

    return <HostScoreboard />;
}
