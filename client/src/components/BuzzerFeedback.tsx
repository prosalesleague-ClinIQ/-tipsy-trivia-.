import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface BuzzerFeedbackProps {
  show: boolean;
  winnerName?: string;
  onComplete?: () => void;
}

export const BuzzerFeedback: React.FC<BuzzerFeedbackProps> = ({ show, winnerName, onComplete }) => {
  const [flash, setFlash] = useState(false);

  React.useEffect(() => {
    if (show) {
      setFlash(true);
      if (navigator.vibrate) navigator.vibrate(100);
      confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 }, zIndex: 9999 });
      setTimeout(() => setFlash(false), 300);
      setTimeout(() => onComplete && onComplete(), 2000);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Screen flash */}
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 0, left: 0,
                width: '100vw', height: '100vh',
                background: 'radial-gradient(circle, #fff 60%, #00f6ff 100%)',
                zIndex: 9999, pointerEvents: 'none',
              }}
            />
          )}
          {/* Winner card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'fixed', top: '40%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#23263a', color: '#fff',
              borderRadius: 32,
              boxShadow: '0 0 32px #00f6ff, 0 0 64px #ff00c8',
              padding: '2.5rem 3.5rem', zIndex: 10000,
              fontSize: '2.5rem', fontFamily: 'Inter, Montserrat, sans-serif',
              textAlign: 'center', fontWeight: 900,
              textShadow: '0 0 16px #00f6ff, 0 0 32px #ff00c8',
            }}
          >
            {winnerName ? `${winnerName} Wins!` : 'Winner!'}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
