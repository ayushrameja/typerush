'use client';

import { motion } from 'framer-motion';

export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-black via-black/95 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,165,36,0.2),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(245,165,36,0.12),transparent_50%)]" />

      <motion.div
        className="absolute inset-0 bg-scanlines"
        animate={{ opacity: [0.18, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,165,36,0.06),transparent_35%,transparent_65%,rgba(245,165,36,0.05))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.8)_85%)]" />
    </div>
  );
}

