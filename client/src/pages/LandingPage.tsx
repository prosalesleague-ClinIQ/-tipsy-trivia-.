import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beer, Tv, Smartphone, Eye, QrCode, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [phoneUrl, setPhoneUrl] = useState('');
    // 'mobile' = full question shown on phone | 'controller' = phone is just a buzzer/button pad
    const [playMode, setPlayMode] = useState<'mobile' | 'controller'>('mobile');

    useEffect(() => {
        const serverBase = import.meta.env.VITE_SERVER_URL ?? '';
        fetch(`${serverBase}/local-ip`)
            .then(r => r.json())
            .then(({ ip }) => setPhoneUrl(`http://${ip}:${window.location.port || '5173'}`))
            .catch(() => setPhoneUrl(window.location.origin));
    }, []);

    const handleJoin = () => {
        if (code.trim().length >= 4) {
            sessionStorage.setItem('joinCode', code.trim().toUpperCase());
            sessionStorage.setItem('controllerMode', playMode === 'controller' ? 'true' : 'false');
            navigate('/play');
        }
    };

    return (
        <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Floating orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-purple/20 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-teal/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-pink/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center mb-10"
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Beer className="w-12 h-12 text-brand-gold" />
                    <h1 className="font-display text-7xl font-black gradient-text">Tipsy Trivia</h1>
                    <Beer className="w-12 h-12 text-brand-gold" />
                </div>
                <p className="text-white/60 text-xl font-body">The party trivia game where facts get weird and everyone gets roasted.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-10">
                {/* Join card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="glass p-6 flex flex-col gap-4 col-span-1 md:col-span-2"
                >
                    <div className="flex items-center gap-3">
                        <Smartphone className="w-7 h-7 text-brand-teal" />
                        <h2 className="font-display font-bold text-2xl">Join a Game</h2>
                    </div>

                    {/* Play mode toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-white/10">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-display font-bold transition-all ${playMode === 'mobile' ? 'bg-brand-teal text-white' : 'text-white/40 hover:text-white/70'}`}
                            onClick={() => setPlayMode('mobile')}
                        >
                            <Smartphone className="w-4 h-4" />
                            Mobile
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-display font-bold transition-all ${playMode === 'controller' ? 'bg-brand-purple text-white' : 'text-white/40 hover:text-white/70'}`}
                            onClick={() => setPlayMode('controller')}
                        >
                            <Tv className="w-4 h-4" />
                            TV Controller
                        </button>
                    </div>

                    {/* Mode description */}
                    <p className="text-white/40 text-xs -mt-2 leading-relaxed">
                        {playMode === 'mobile'
                            ? 'Questions appear on your phone. Great for playing anywhere.'
                            : 'Questions show on the TV/host screen. Your phone is a buzzer + answer pad.'}
                    </p>

                    <input
                        className="input text-center text-3xl tracking-widest font-display font-bold uppercase"
                        placeholder="ABCD1"
                        maxLength={6}
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                        autoFocus
                    />
                    <button className="btn-teal text-xl py-4" onClick={handleJoin}>
                        Join Game →
                    </button>
                    <button
                        className="btn-secondary text-sm"
                        onClick={() => {
                            sessionStorage.setItem('controllerMode', playMode === 'controller' ? 'true' : 'false');
                            navigate('/play');
                        }}
                    >
                        Join manually on next screen
                    </button>
                </motion.div>

                {/* Host + Spectate column */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="flex flex-col gap-4"
                >
                    <div className="glass p-6 flex flex-col gap-3 cursor-pointer hover:border-brand-purple/40 transition-all"
                        onClick={() => navigate('/host')}>
                        <Tv className="w-8 h-8 text-brand-purple" />
                        <h2 className="font-display font-bold text-xl">Host a Game</h2>
                        <p className="text-white/50 text-sm">Start a room, pick a mode, and let the chaos begin</p>
                        <button className="btn-primary w-full mt-2">Host →</button>
                    </div>
                    <div className="glass p-6 flex flex-col gap-3 cursor-pointer hover:border-brand-teal/40 transition-all"
                        onClick={() => navigate('/watch')}>
                        <Eye className="w-7 h-7 text-brand-teal" />
                        <h2 className="font-display font-bold text-xl">Spectate</h2>
                        <p className="text-white/50 text-sm">Watch and see live scores without playing</p>
                        <button className="btn-secondary w-full mt-2">Watch →</button>
                    </div>
                </motion.div>
            </div>

            {/* TV Mode how-to */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass p-5 w-full max-w-3xl mb-8 border border-brand-purple/30"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Monitor className="w-5 h-5 text-brand-purple" />
                    <h3 className="font-display font-bold text-brand-purple">Playing on a TV or big screen?</h3>
                </div>
                <ol className="text-white/50 text-sm font-body space-y-1 list-none">
                    <li className="flex gap-3"><span className="text-brand-gold font-bold">1.</span> Open <span className="text-white/70 font-bold">/host</span> on your TV or laptop — this is the game display.</li>
                    <li className="flex gap-3"><span className="text-brand-gold font-bold">2.</span> Players scan the QR code or visit the URL on their phones.</li>
                    <li className="flex gap-3"><span className="text-brand-gold font-bold">3.</span> Select <span className="text-brand-purple font-bold">TV Controller</span> mode above, enter the room code, and join.</li>
                    <li className="flex gap-3"><span className="text-brand-gold font-bold">4.</span> Phones become buzzers and A/B/C/D answer pads — the question stays on the TV.</li>
                </ol>
            </motion.div>

            {/* Feature pills */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-3 max-w-2xl mb-10"
            >
                {['4 Game Modes', 'Comedian Hosts', 'Fun Fact Reveals', 'Buzz-In System', '2–12 Players', 'Phone Controllers'].map(f => (
                    <span key={f} className="glass px-4 py-2 rounded-full text-sm text-white/70 font-body">{f}</span>
                ))}
            </motion.div>

            {/* Phone QR code */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="glass p-6 flex items-center gap-6 max-w-sm w-full"
            >
                <div className="rounded-xl overflow-hidden bg-white p-2 flex-shrink-0">
                    {phoneUrl && <QRCodeSVG value={phoneUrl} size={96} fgColor="#0f0f1a" bgColor="#ffffff" />}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <QrCode className="w-4 h-4 text-brand-teal" />
                        <p className="font-display font-bold text-sm text-white">Open on your phone</p>
                    </div>
                    <p className="text-white/40 text-xs font-body leading-relaxed">Scan to open on any device on the same WiFi</p>
                    <p className="text-brand-teal/70 text-xs font-mono mt-2 truncate">{phoneUrl || '…'}</p>
                </div>
            </motion.div>

            <p className="text-white/20 text-xs mt-8">© Tipsy Trivia — Not affiliated with Jackbox Games, Inc.</p>
        </div>
    );
}
