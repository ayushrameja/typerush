'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { GridBackground } from './GridBackground';
import { useUserStore } from '@/lib/stores/userStore';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function HeroLobby() {
  const user = useUserStore((state) => state.user);
  const { isAuthenticated } = useConvexAuth();
  const stats = useQuery(api.practice.getStats, isAuthenticated ? {} : 'skip');

  const displayName = user?.name ?? 'Guest Player';
  const subtitle = user ? 'Online' : 'Practice Mode';

  return (
    <div className="arena-shell flex min-h-screen items-center justify-center px-4">
      <GridBackground />

      <div className="relative mx-auto w-full max-w-5xl pb-16 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="arena-chip">
            {user ? 'Multiplayer + Practice Ready' : 'Practice Available'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
          className="relative mt-16"
        >
          <h1
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-[58%] select-none text-center arena-heading text-[6rem] leading-[0.85] md:text-[9rem] lg:text-[12rem]"
            aria-hidden="true"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,70,85,0.55), rgba(255,70,85,0.03))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Tactical
            <br />
            Typing
          </h1>

          <div className="relative z-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="relative z-0 -mr-4 hidden h-[280px] w-[76px] shrink-0 flex-col items-center justify-center border border-white/8 bg-[linear-gradient(135deg,rgba(15,18,24,0.94),rgba(8,11,18,0.85))] backdrop-blur-xl lg:flex"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,rgba(255,70,85,0.1),transparent_70%)]" />
              <span className="arena-heading [writing-mode:vertical-rl] rotate-180 text-[1.8rem] tracking-[0.3em] text-white/25">
                Duo
              </span>
              <span className="absolute bottom-3 [writing-mode:vertical-rl] rotate-180 text-[8px] uppercase tracking-[0.2em] text-white/18">
                2-Player
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10 w-full max-w-[520px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,18,24,0.92),rgba(8,11,18,0.8))] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,255,255,0.06),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_100%,rgba(255,70,85,0.1),transparent_50%)]" />

              <div className="relative p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <UserAvatar
                        src={user?.avatarUrl}
                        name={displayName}
                        className="h-[88px] w-[88px] border border-white/14 shadow-[0_0_30px_rgba(255,70,85,0.12)]"
                        fallbackClassName="bg-[linear-gradient(145deg,rgba(255,255,255,0.2),rgba(255,255,255,0.06))] text-2xl font-semibold text-white/90"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 h-4 w-4 border-2 border-[#0b0d10] ${
                          user ? 'bg-[#73e78d]' : 'bg-white/30'
                        }`}
                      />
                      <div className="pointer-events-none absolute -inset-px border border-white/8" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xl font-semibold tracking-tight text-white">
                        {displayName}
                      </div>
                      <div className="mt-1 text-sm text-white/46">{subtitle}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-5xl font-bold leading-none text-[#ff9ea7]">
                      {stats?.bestWpm ?? '—'}
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/36">
                      Best WPM
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[
                    { value: stats?.avgWpm ?? '—', label: 'Avg WPM' },
                    { value: stats?.totalSessions ?? 0, label: 'Sessions' },
                    { value: stats?.accuracy ? `${stats.accuracy}%` : '—', label: 'Accuracy' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border border-white/8 bg-white/[0.03] p-4 text-center"
                    >
                      <div className="text-2xl font-semibold text-white">{stat.value}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/36">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="relative z-0 -ml-4 hidden h-[280px] w-[76px] shrink-0 flex-col items-center justify-center border border-white/8 bg-[linear-gradient(225deg,rgba(15,18,24,0.94),rgba(8,11,18,0.85))] backdrop-blur-xl lg:flex"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(255,70,85,0.1),transparent_70%)]" />
              <span className="arena-heading [writing-mode:vertical-rl] text-[1.8rem] tracking-[0.3em] text-white/25">
                Trio
              </span>
              <span className="absolute bottom-3 [writing-mode:vertical-rl] text-[8px] uppercase tracking-[0.2em] text-white/18">
                3-Player
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mx-auto mt-10 max-w-lg text-center text-[0.95rem] leading-relaxed text-white/46"
        >
          Warm up solo, queue with friends, and keep your WPM from falling apart in public.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <Link
            href="/practice"
            className="cursor-pointer border border-white/16 bg-white/[0.04] px-8 py-4 text-[0.9rem] font-semibold tracking-wide text-white/88 transition-all duration-200 hover:border-white/28 hover:bg-white/8 hover:text-white"
          >
            Practice
          </Link>
          {user ? (
            <Link
              href="/race"
              className="cursor-pointer bg-[linear-gradient(120deg,var(--accent),var(--accent-strong))] px-8 py-4 text-[0.9rem] font-semibold tracking-wide text-white transition-all duration-200 hover:shadow-[0_14px_30px_-18px_rgba(255,70,85,0.8)] hover:brightness-110"
            >
              Create Room
            </Link>
          ) : (
            <Link
              href="/login"
              className="cursor-pointer border border-white/16 bg-white/[0.04] px-8 py-4 text-[0.9rem] font-semibold tracking-wide text-white/88 transition-all duration-200 hover:border-white/28 hover:bg-white/8 hover:text-white"
            >
              Sign in for Multiplayer
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
