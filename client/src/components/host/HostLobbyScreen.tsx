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
        <div className="animated-bg min-h-screen p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-white/50 text-sm font-body uppercase tracking-widest mb-1">Room Code</p>
                    <h1 className="font-display font-black text-8xl tracking-widest gradient-text">{roomCode}</h1>
                    <p className="text-white/50 mt-2">Players join at <span className="text-brand-teal font-semibold">{playUrl}</span></p>
                </div>
                <div className="glass p-4 rounded-2xl">
                    <QRCodeSVG value={joinUrlWithCode} size={160} fgColor="#fff" bgColor="transparent" />
                    <p className="text-white/40 text-xs text-center mt-2">Scan to join</p>
                </div>
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
                                transition={{ delay: i * 0.1 }}
                                className="glass p-4 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-brand-purple/50 flex items-center justify-center font-display font-bold text-lg">
                                    {p.name[0].toUpperCase()}
                                </div>
                                <span className="font-body font-semibold text-lg">{p.name}</span>
                            </motion.div>
                        ))}
                        {players.length === 0 && (
                            <div className="col-span-2 glass p-8 text-center text-white/30">
                                <p className="text-lg">Waiting for players to join…</p>
                                <p className="text-sm mt-1">Share the room code or QR code above</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="glass p-6">
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
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary text-xl px-10 py-4 flex items-center gap-3"
                    onClick={onNext}
                    disabled={players.length < 1}
                >
                    Setup Host Voice <ChevronRight className="w-5 h-5" />
                </motion.button>
            </div>
        </div>
    );
}
