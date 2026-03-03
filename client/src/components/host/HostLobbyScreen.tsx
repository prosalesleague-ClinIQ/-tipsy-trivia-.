import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Users, ChevronRight } from 'lucide-react';
import type { Room } from '@tipsy-trivia/shared';

interface Props {
    roomCode: string;
    room: Room | null;
    onNext: () => void;
}

export default function HostLobbyScreen({ roomCode, room, onNext }: Props) {
    const players = room ? Object.values(room.players) : [];
    const playUrl = `${window.location.origin}/play`;
    const joinUrlWithCode = `${playUrl}?code=${roomCode}`;

    return (
        <div className="min-h-screen p-8 flex flex-col" style={{ background: 'linear-gradient(135deg, #181a20 0%, #23263a 100%)' }}>
            <div className="flex items-center justify-between mb-8">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring' }}>
                    <p className="text-white/50 text-sm font-body uppercase tracking-widest mb-1">Room Code</p>
                    <h1 className="font-display font-black text-8xl tracking-widest gradient-text neon-text">{roomCode}</h1>
                    <p className="text-white/50 mt-2">Players join at <span className="text-brand-teal font-semibold">{playUrl}</span></p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="bg-white p-4 rounded-2xl shadow-xl">
                    <QRCodeSVG value={joinUrlWithCode} size={160} fgColor="#0f0f1a" bgColor="#ffffff" level="H" />
                    <p className="text-gray-500 text-xs text-center mt-2">Scan to join</p>
                </motion.div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-brand-teal" />
                        <h2 className="font-display font-bold text-xl text-white/80">
                            Players ({players.length}/{room?.settings.max_players ?? 12})
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {players.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                                whileHover={{ scale: 1.04, boxShadow: '0 0 16px #00f6ff55' }}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg" style={{ background: 'linear-gradient(135deg, #00f6ff, #ff00c8)' }}>
                                    {p.name[0].toUpperCase()}
                                </div>
                                <span className="font-body font-semibold text-lg text-white">{p.name}</span>
                            </motion.div>
                        ))}
                        {players.length === 0 && (
                            <div className="col-span-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center text-white/30">
                                <p className="text-lg">Waiting for players to join…</p>
                                <p className="text-sm mt-1">Share the room code or QR code above</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', delay: 0.15 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
                        <h3 className="font-display font-bold text-lg mb-3">Settings</h3>
                        <div className="space-y-2 text-sm text-white/60">
                            <div className="flex justify-between">
                                <span>Players</span>
                                <span>{players.length} joined</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Timer</span>
                                <span>{room?.settings.question_timer_seconds ?? 12}s</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Buzzer Mode</span>
                                <span>{room?.settings.buzzer_enabled ? '✅' : '—'}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.06, boxShadow: '0 0 32px #00f6ff88' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className={`text-xl px-10 py-4 flex items-center gap-3 rounded-2xl font-bold text-white ${players.length < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ background: 'linear-gradient(90deg, #00f6ff, #ff00c8)', boxShadow: '0 4px 24px #00f6ff55' }}
                    onClick={onNext}
                    disabled={players.length < 1}
                >
                    Setup Host Voice <ChevronRight className="w-5 h-5" />
                </motion.button>
            </div>
        </div>
    );
}
