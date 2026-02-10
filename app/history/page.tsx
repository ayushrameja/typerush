'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion } from 'framer-motion';
import { GridBackground } from '@/components/home/GridBackground';
import Link from 'next/link';

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number) {
  if (seconds === 0) return '∞';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const stats = useQuery(api.practice.getStats, isAuthenticated ? {} : 'skip');
  const history = useQuery(api.practice.getHistory, isAuthenticated ? {} : 'skip');

  if (isLoading) {
    return (
      <div className="arena-shell">
        <GridBackground />
        <div className="relative min-h-screen px-4 pb-20 pt-28">
          <div className="mx-auto max-w-4xl">
            <HistorySkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="arena-shell">
        <GridBackground />
        <div className="relative flex min-h-screen items-center justify-center px-4 pb-20 pt-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mb-6 text-6xl">🔒</div>
            <h1 className="arena-heading text-6xl leading-none text-white">Sign in to view history</h1>
            <p className="mb-8 mt-3 text-white/60">Your practice sessions are saved when you&apos;re logged in.</p>
            <Link href="/login" className="arena-button px-8 py-4 font-semibold tracking-wide">
              Sign in
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-shell">
      <GridBackground />
      <div className="relative min-h-screen px-4 pb-20 pt-28">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-10 text-center">
              <div className="arena-chip">Your stats</div>
              <h1 className="arena-heading mt-4 text-7xl leading-none text-white md:text-8xl">History</h1>
              <p className="mt-3 text-white/60">Track your typing progression.</p>
            </div>

            {stats && (
              <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="arena-card rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-white">{stats.avgWpm}</div>
                  <div className="mt-1 text-sm text-white/50">Avg WPM</div>
                </div>
                <div className="arena-card rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-[#ff9ea7]">{stats.bestWpm}</div>
                  <div className="mt-1 text-sm text-white/50">Best WPM</div>
                </div>
                <div className="arena-card rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
                  <div className="mt-1 text-sm text-white/50">Sessions</div>
                </div>
                <div className="arena-card rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-white">{stats.accuracy}%</div>
                  <div className="mt-1 text-sm text-white/50">Accuracy</div>
                </div>
              </div>
            )}

            {!history || history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="arena-card rounded-3xl p-12 text-center"
              >
                <div className="mb-4 text-5xl">⌨️</div>
                <h2 className="text-xl font-semibold text-white mb-2">No sessions yet</h2>
                <p className="mb-6 text-white/50">Complete a practice session to populate this board.</p>
                <Link href="/practice" className="arena-button inline-flex px-6 py-3 font-semibold tracking-wide">
                  Start Practicing
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {history.map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="arena-card rounded-2xl p-5 transition-colors hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-5">
                        <div className="w-16 shrink-0 text-center">
                          <div className="text-2xl font-bold text-white">{session.wpm}</div>
                          <div className="text-[11px] text-white/45">WPM</div>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-white/40">Accuracy </span>
                            <span className="font-medium text-white">{session.accuracy}%</span>
                          </div>
                          <div>
                            <span className="text-white/40">Time </span>
                            <span className="font-medium text-white">{formatDuration(session.timeUsed)}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Words </span>
                            <span className="font-medium text-white">{session.totalWords}</span>
                          </div>
                          <div className="hidden sm:block">
                            <span className="text-white/40">Mistakes </span>
                            <span className="font-medium text-[#ff7e8b]">{session.mistakes}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] capitalize text-white/50 sm:inline-flex">
                          {session.difficulty}
                        </span>
                        <span className="text-xs text-white/35">{formatDate(session.completedAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-6 w-24 rounded-full bg-white/10" />
        <div className="mx-auto h-10 w-40 rounded-full bg-white/10" />
        <div className="mx-auto h-4 w-48 rounded-full bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="arena-card rounded-2xl p-5 text-center">
            <div className="mx-auto h-8 w-16 rounded-full bg-white/10" />
            <div className="mx-auto mt-2 h-4 w-12 rounded-full bg-white/5" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="arena-card rounded-2xl p-5">
            <div className="h-10 rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
