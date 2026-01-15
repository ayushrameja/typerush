'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useMemo, useRef } from 'react';

export interface PlayerCardProps {
  username: string;
  isGuest: boolean;
  bestWpm?: number;
  avgWpm?: number;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

export function PlayerCard({ username, isGuest, bestWpm, avgWpm }: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rxRaw = useTransform(my, [0, 1], [10, -10]);
  const ryRaw = useTransform(mx, [0, 1], [-14, 14]);

  const rx = useSpring(rxRaw, { stiffness: 260, damping: 22, mass: 0.6 });
  const ry = useSpring(ryRaw, { stiffness: 260, damping: 22, mass: 0.6 });

  const label = useMemo(() => {
    if (isGuest) return 'Rookie';
    return username || 'Player';
  }, [isGuest, username]);

  const rank = useMemo(() => {
    const value = bestWpm ?? 0;
    if (value >= 120) return 'Legend';
    if (value >= 90) return 'Elite';
    if (value >= 70) return 'Diamond';
    if (value >= 50) return 'Gold';
    return 'Novice';
  }, [bestWpm]);

  return (
    <div className="perspective-1000">
      <motion.div
        ref={cardRef}
        style={{ rotateX: rx, rotateY: ry }}
        onMouseMove={(e) => {
          const rect = cardRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          mx.set(Math.min(1, Math.max(0, x)));
          my.set(Math.min(1, Math.max(0, y)));
        }}
        onMouseLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        className="transform-style-3d relative mx-auto w-[340px] sm:w-[420px] rounded-3xl glass-panel overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,165,36,0.14),transparent_60%)]" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-semibold">
                {initials(label)}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold tracking-tight truncate">
                  {label}
                </div>
                <div className="text-white/50 text-xs">
                  {isGuest ? 'Not signed in' : 'Online'}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-white/60 border border-white/10 rounded-full px-3 py-1">
              {rank}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/60 text-xs">Best WPM</div>
              <div className="text-white text-3xl font-semibold tracking-tight mt-1">
                {bestWpm ?? '—'}
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white/60 text-xs">Average</div>
              <div className="text-white text-3xl font-semibold tracking-tight mt-1">
                {avgWpm ?? '—'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-white/60 text-xs">
              Press <span className="text-white/80">P</span> to practice
            </div>
            <div className="text-white/60 text-xs">Ready</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

