'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { GridBackground } from './GridBackground';
import { PlayerCard } from './PlayerCard';
import { useUserStore } from '@/lib/stores/userStore';

function Slot({ label }: { label: string }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center w-[220px] h-[280px] rounded-3xl border border-white/10 bg-white/5">
      <div className="text-white/60 text-sm">{label}</div>
      <div className="mt-2 text-white/40 text-xs">Invite link coming soon</div>
    </div>
  );
}

export function HeroLobby() {
  const { user, profile, stats, isLoading } = useUserStore();

  const username = useMemo(() => profile?.username || user?.email || 'Player', [
    profile?.username,
    user?.email,
  ]);

  const isGuest = useMemo(() => !user, [user]);
  const bestWpm = stats?.best_wpm;
  const avgWpm = stats?.avg_wpm;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6">
      <GridBackground />

      <div className="relative w-full max-w-6xl mx-auto pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-[#50e3c2]" />
            Lobby online
          </div>

          <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Ready up.
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            A focused typing arena with fast shortcuts, clean stats, and a future
            1v1 lobby.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
          className="mt-10 flex items-center justify-center gap-8"
        >
          <Slot label="Slot A" />

          <div className="flex flex-col items-center">
            <PlayerCard
              username={username}
              isGuest={isGuest}
              bestWpm={bestWpm}
              avgWpm={avgWpm}
            />

            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/practice"
                className="px-8 py-4 rounded-2xl bg-white text-black font-medium tracking-tight hover:bg-white/90 transition-colors"
              >
                Start match
              </Link>
              <Link
                href="/practice"
                className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Practice
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
              <span className="border border-white/10 rounded-md px-2 py-1">
                P Practice
              </span>
              <span className="border border-white/10 rounded-md px-2 py-1">
                L Leaderboard
              </span>
              <span className="border border-white/10 rounded-md px-2 py-1">
                H Home
              </span>
              <span className="border border-white/10 rounded-md px-2 py-1">
                Esc Close
              </span>
            </div>

            {!isLoading && isGuest && (
              <div className="mt-6 text-sm text-white/60">
                <span className="text-white/70">Tip:</span> Sign up to save
                stats and unlock 1v1 matchmaking.
              </div>
            )}
          </div>

          <Slot label="Slot B" />
        </motion.div>
      </div>
    </div>
  );
}

