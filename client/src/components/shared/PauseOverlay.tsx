import { motion, AnimatePresence } from 'framer-motion';
import { Pause } from 'lucide-react';

interface Props {
    visible: boolean;
    isHost: boolean;
    onResume?: () => void;
}

export default function PauseOverlay({ visible, isHost, onResume }: Props) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(10, 10, 26, 0.85)', backdropFilter: 'blur(8px)' }}
                >
                    <Pause className="w-20 h-20 text-brand-gold mb-6" />
                    <h2 className="font-display font-black text-6xl text-white mb-4">PAUSED</h2>
                    <p className="text-white/50 font-body text-lg mb-8">
                        {isHost ? 'Game is paused.' : 'Waiting for host to resume\u2026'}
                    </p>
                    {isHost && onResume && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary text-2xl px-12 py-5"
                            onClick={onResume}
                        >
                            Resume Game
                        </motion.button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
