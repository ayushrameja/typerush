'use client';

import { motion } from 'framer-motion';

export function ArchiveBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-yellow-400/15 backdrop-blur-md border border-yellow-400/30 rounded-xl shadow-lg flex items-center gap-2.5 whitespace-nowrap"
    >
      <span className="text-base">⚠️</span>
      <p className="text-yellow-300 text-sm font-medium">
        This app is being archived — some features may not work as expected.
      </p>
    </motion.div>
  );
}
