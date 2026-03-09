import { ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Props {
    showBack: boolean;
    onBack?: () => void;
    onHome: () => void;
}

export default function NavButtons({ showBack, onBack, onHome }: Props) {
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <>
            <div className="fixed top-4 left-4 z-40 flex gap-2">
                {showBack && onBack && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="glass w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
                        onClick={onBack}
                        title="Go Back"
                    >
                        <ArrowLeft className="w-5 h-5 text-white/70" />
                    </motion.button>
                )}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="glass w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
                    onClick={() => setShowConfirm(true)}
                    title="Leave Game"
                >
                    <Home className="w-5 h-5 text-white/70" />
                </motion.button>
            </div>

            {/* Confirmation dialog */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: 'rgba(10, 10, 26, 0.85)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass p-8 rounded-2xl max-w-sm text-center"
                        >
                            <h3 className="font-display font-bold text-2xl text-white mb-3">Leave Game?</h3>
                            <p className="text-white/50 font-body mb-6">
                                You'll be disconnected from the current game.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    className="btn-secondary flex-1 py-3 rounded-xl"
                                    onClick={() => setShowConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-danger flex-1 py-3 rounded-xl"
                                    onClick={onHome}
                                >
                                    Leave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
