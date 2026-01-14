'use client';

import { motion } from 'framer-motion';

interface FallingLetterProps {
  char: string;
  x: number;
  y: number;
  onComplete: () => void;
}

export function FallingLetter({ char, x, y, onComplete }: FallingLetterProps) {
  return (
    <motion.span
      initial={{ opacity: 1, y: 0, scale: 1.2 }}
      animate={{ opacity: 0, y: 200, scale: 0.6 }}
      transition={{ duration: 1.2, ease: 'easeIn' }}
      onAnimationComplete={onComplete}
      className="absolute text-red-500 font-mono text-5xl md:text-6xl pointer-events-none z-50 font-bold drop-shadow-[0_0_12px_rgba(239,68,68,1)]"
      style={{ left: x, top: y }}
    >
      {char}
    </motion.span>
  );
}
