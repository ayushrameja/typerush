'use client';

import { motion } from 'framer-motion';
import { GridBackground } from '@/components/home/GridBackground';
import { Card } from '@/components/ui/Card';

export default function CollectionPage() {
  return (
    <div className="arena-shell px-4 pb-20 pt-28">
      <GridBackground />
      <div className="relative mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="arena-chip">Inventory</div>
          <h1 className="arena-heading mt-4 text-7xl leading-none text-white md:text-8xl">Collection</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/62">
            This is where cosmetics and unlocks will live once we finish pretending scope creep is under control.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10"
        >
          <Card glow className="p-8 text-white/74">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-white/12 bg-white/5 p-4 text-sm text-white/82">Keycap skins</div>
              <div className="border border-white/12 bg-white/5 p-4 text-sm text-white/82">Trail effects</div>
              <div className="border border-white/12 bg-white/5 p-4 text-sm text-white/82">Profile banners</div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

