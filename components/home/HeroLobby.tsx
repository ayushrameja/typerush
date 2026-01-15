'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { GridBackground } from './GridBackground';
import { PlayerCard } from './PlayerCard';
import { FriendsList } from './FriendsList';
import { useUserStore } from '@/lib/stores/userStore';

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
        footer: 'Queue up and pretend it was “comms”.',
      };
    }
    return {
      eyebrow: 'Three-stack',
      headline: 'Triple utility. Zero discipline.',
      body: 'Three duelists, one smoke, and a dream.',
      footer: 'If it fails, call it “limit testing”.',
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
        className="transform-style-3d relative w-[280px] h-[320px] rounded-3xl glass-panel overflow-hidden shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_90%,rgba(245,165,36,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_32%,transparent_68%,rgba(245,165,36,0.06))]" />

        <div className="relative h-full p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] text-white/55 uppercase tracking-[0.22em]">
                {copy.eyebrow}
              </div>
              <div className="mt-3 text-xl text-white font-semibold tracking-tight">
                {title}
              </div>
              <div className="mt-3 text-[15px] text-white/85 leading-snug">
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

          <div className="mt-auto pt-5 flex items-center justify-between border-t border-white/10">
            <div className="text-xs text-white/50">{copy.footer}</div>
            <div className="h-2 w-2 rounded-full bg-[#f5a524]/70 shadow-[0_0_18px_rgba(245,165,36,0.45)]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function HeroLobby() {
  const { user, profile, stats, isLoading } = useUserStore();

  const username = useMemo(() => {
    if (profile?.username) return profile.username;
    if (user) return 'Player';
    return 'Rookie';
  }, [profile?.username, user]);

  const isGuest = useMemo(() => !user, [user]);
  const bestWpm = stats?.best_wpm;
  const avgWpm = stats?.avg_wpm;
  const lobbyPlayers = 1;
  const lobbyReady = !!user && lobbyPlayers >= 2;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <GridBackground />
      <FriendsList />

      <div className="relative w-full max-w-7xl mx-auto pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            Match lobby
            <span className="text-white/40">•</span>
            {lobbyPlayers} online
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
          className="mt-12 grid items-center justify-center gap-10 lg:gap-12 lg:grid-cols-[280px_minmax(0,420px)_280px]"
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
            <PlayerCard
              username={username}
              isGuest={isGuest}
              bestWpm={bestWpm}
              avgWpm={avgWpm}
            />

            <div className="mt-8 flex items-center gap-4">
              {isGuest ? (
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-white text-black font-medium tracking-tight hover:bg-white/90 transition-colors"
                >
                  Login to start
                </Link>
              ) : lobbyReady ? (
                <Link
                  href="/race"
                  className="px-8 py-4 rounded-2xl bg-white text-black font-medium tracking-tight hover:bg-white/90 transition-colors"
                >
                  Start match
                </Link>
              ) : (
                <div className="px-8 py-4 rounded-2xl bg-white/10 text-white/50 font-medium tracking-tight cursor-not-allowed">
                  Waiting for players
                </div>
              )}
              <Link
                href="/practice"
                className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Practice
              </Link>
            </div>

            {!isLoading && isGuest && (
              <div className="mt-6 text-sm text-white/60">
                <span className="text-white/70">Tip:</span> Sign in to start a
                match and save stats.
              </div>
            )}
            {!isGuest && !lobbyReady && (
              <div className="mt-4 text-xs text-white/50">
                Multiplayer unlocks when one more player joins.
              </div>
            )}
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

