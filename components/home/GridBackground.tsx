'use client';

import { motion } from 'framer-motion';

export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#080808]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(-36deg,transparent,transparent_18px,rgba(255,255,255,0.018)_18px,rgba(255,255,255,0.018)_19px)]" />

      <motion.div
        className="absolute inset-0 bg-scanlines"
        animate={{ opacity: [0.16, 0.28, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.8)_85%)]" />
    </div>
  );
}
