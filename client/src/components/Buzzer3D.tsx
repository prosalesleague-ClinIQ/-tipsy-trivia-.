// @ts-nocheck - Bypassing strict types due to r3f v8 downgrade for React 18 compatibility
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export const Buzzer3D: React.FC<{ onWin?: () => void }> = ({ onWin }) => {
  const [pressed, setPressed] = useState(false);
  const [win, setWin] = useState(false);

  const handlePress = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 200);
    // Magnetic hover and spring bounce
    if (navigator.vibrate) navigator.vibrate(80);
    // Win state trigger
    setWin(true);
    confetti({
      particleCount: 120,
      spread: 120,
      origin: { y: 0.7 },
      zIndex: 9999,
    });
    setTimeout(() => {
      setWin(false);
      if (onWin) onWin();
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[340px]">
      <Canvas style={{ height: 260 }} camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 4, 8]} intensity={1.2} />
        <mesh position={[0, pressed ? -0.5 : 0, 0]}>
          <sphereGeometry args={[2.2, 48, 48]} />
          {/* @ts-ignore - r3f v8 type issue */}
          <meshPhysicalMaterial
            color={win ? '#ff00c8' : '#00f6ff'}
            roughness={0.18}
            metalness={0.7}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transmission={0.7}
            ior={1.5}
            opacity={0.92}
            transparent
          />
        </mesh>
        {/* Dome base */}
        <mesh position={[0, -2.2, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.5, 48]} />
          {/* @ts-ignore */}
          <meshStandardMaterial color="#23263a" />
        </mesh>
        {/* Button overlay for click */}
        <Html center>
          <motion.button
            className="absolute top-0 left-0 w-[180px] h-[180px] rounded-full bg-transparent"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handlePress}
            style={{ outline: 'none', border: 'none', cursor: 'pointer' }}
          />
        </Html>
      </Canvas>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: pressed ? 0.95 : 1.08 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="mt-4 text-3xl font-extrabold neon-text"
      >
        Press the Buzzer
      </motion.div>
      {/* Win state: Winner card animation */}
      {win && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl px-8 py-6 text-4xl font-bold neon-pink border border-white/30"
          style={{ zIndex: 10000 }}
        >
          Winner!
        </motion.div>
      )}
    </div>
  );
};
