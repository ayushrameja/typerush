'use client';

import { motion } from 'framer-motion';
import { GridBackground } from '@/components/home/GridBackground';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="arena-shell px-4 pb-20 pt-28">
      <GridBackground />
      <div className="relative mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="arena-chip">System Controls</div>
          <h1 className="arena-heading mt-4 text-7xl leading-none text-white md:text-8xl">Settings</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/62">
            Client settings are moving here. Keys, preferences, and toggles that eventually break at 2am.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10"
        >
          <Card glow className="p-8 text-white/74">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-white/12 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.1em] text-white/56">Audio</div>
                <div className="mt-2 text-sm text-white/82">Master volume and keypress feedback.</div>
              </div>
              <div className="border border-white/12 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.1em] text-white/56">Gameplay</div>
                <div className="mt-2 text-sm text-white/82">Input options, timer defaults, and HUD preferences.</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

