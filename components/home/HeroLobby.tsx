'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { GridBackground } from './GridBackground';

function ValorantCard({
  mode,
  title,
}: {
  mode: 'duo' | 'trio';
  title: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rxRaw = useTransform(my, [0, 1], [10, -10]);
  const ryRaw = useTransform(mx, [0, 1], [-14, 14]);
  const rx = useSpring(rxRaw, { stiffness: 260, damping: 22, mass: 0.6 });
  const ry = useSpring(ryRaw, { stiffness: 260, damping: 22, mass: 0.6 });

  const copy = useMemo(() => {
    if (mode === 'duo') {
      return {
        eyebrow: 'Two-stack',
        headline: 'Bring your pocket Sage.',
        body: 'One aims. One panics. Both blame ping.',
        footer: 'Queue up and pretend it was "comms".',
      };
    }
    return {
      eyebrow: 'Three-stack',
      headline: 'Triple utility. Zero discipline.',
      body: 'Three duelists, one smoke, and a dream.',
      footer: 'If it fails, call it "limit testing".',
    };
  }, [mode]);

  return (
    <div className="hidden lg:block perspective-1000">
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
        whileHover={{ y: -6, transition: { duration: 0.18 } }}
        className="transform-style-3d relative w-[300px] rounded-3xl glass-panel overflow-hidden shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_90%,rgba(245,165,36,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_32%,transparent_68%,rgba(245,165,36,0.06))]" />

        <div className="relative p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] text-white/55 uppercase tracking-[0.22em]">
                {copy.eyebrow}
              </div>
              <div className="mt-3 text-xl text-white font-semibold tracking-tight">
                {title}
              </div>
              <div className="mt-2 text-[15px] text-white/85 leading-snug whitespace-nowrap">
                {copy.headline}
              </div>
              <div className="mt-2 text-sm text-white/55 leading-relaxed">
                {copy.body}
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
              Queue
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PlayerCard() {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
      className="relative w-full max-w-sm rounded-3xl glass-panel overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(245,165,36,0.22),transparent_55%)]" />

      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/15 flex items-center justify-center text-2xl text-white/90">
                👤
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-black" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white tracking-tight">
                Guest Player
              </div>
              <div className="text-sm text-white/55">Demo Mode</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-white">—</div>
            <div className="text-xs text-white/45">Best WPM</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="text-lg font-semibold text-white">—</div>
            <div className="text-[11px] text-white/45">Avg WPM</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="text-lg font-semibold text-white">0</div>
            <div className="text-[11px] text-white/45">Races</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="text-lg font-semibold text-white">—</div>
            <div className="text-[11px] text-white/45">Accuracy</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroLobby() {
  const lobbyPlayers = 1;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <GridBackground />

      <div className="relative w-full max-w-7xl mx-auto pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            Demo mode
            <span className="text-white/40">•</span>
            Practice available
          </div>

          <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Ready for the duo or trio?
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            No crosshair needed. Lock in your warmup and outtype the lobby.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
          className="mt-12 grid items-center justify-center gap-10 lg:gap-12 lg:grid-cols-[300px_minmax(0,420px)_300px]"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <ValorantCard
              mode="duo"
              title="Duo queue"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <PlayerCard />

            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                disabled
                className="px-8 py-4 rounded-2xl bg-white/20 text-white/40 font-medium tracking-tight cursor-not-allowed"
              >
                Login to start
              </button>
              <Link
                href="/practice"
                className="px-6 py-4 rounded-2xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
              >
                Practice
              </Link>
            </div>

            <div className="mt-6 text-sm text-white/60">
              <span className="text-[#f5a524]">Demo mode:</span> Login & multiplayer coming with Convex.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
          >
            <ValorantCard
              mode="trio"
              title="Trio queue"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
