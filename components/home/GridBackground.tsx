'use client';

import { motion } from 'framer-motion';

export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#07080b] via-[#0b0e14] to-[#0a0d12]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,70,85,0.34),transparent_46%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_86%,rgba(255,70,85,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(-36deg,transparent,transparent_18px,rgba(255,255,255,0.018)_18px,rgba(255,255,255,0.018)_19px)]" />

      <motion.div
        className="absolute inset-0 bg-scanlines"
        animate={{ opacity: [0.16, 0.28, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,70,85,0.12),transparent_38%,transparent_66%,rgba(255,70,85,0.08))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.8)_85%)]" />
    </div>
  );
}
