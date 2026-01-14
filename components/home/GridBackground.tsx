'use client';

import { motion } from 'framer-motion';

export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-black via-black to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(0,112,243,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(80,227,194,0.08),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,68,68,0.06),transparent_55%)]" />

      <div className="absolute inset-0 mask-[radial-gradient(circle_at_center,black_55%,transparent_95%)]">
        <motion.div
          className="absolute left-1/2 top-[55%] h-[1200px] w-[1600px] -translate-x-1/2 -translate-y-1/2 bg-grid-pattern opacity-40"
          style={{
            transform:
              'translate(-50%, -50%) perspective(1000px) rotateX(70deg) rotateZ(0deg)',
          }}
          animate={{ y: [0, 40], opacity: [0.35, 0.45, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.75)_85%)]" />
    </div>
  );
}

