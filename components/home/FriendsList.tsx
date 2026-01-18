'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function FriendsList() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="fixed right-0 top-0 h-screen z-50"
      initial={false}
    >
      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? 360 : 78,
          x: isExpanded ? 0 : 10,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative h-full rounded-l-3xl glass-panel overflow-hidden shadow-[0_40px_140px_-80px_rgba(0,0,0,0.95)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_85%,rgba(245,165,36,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,165,36,0.12),transparent_30%,transparent_70%,rgba(255,255,255,0.08))]" />

        <div className="relative h-full flex">
          <div className="w-[78px] h-full border-l border-white/20 bg-black/50">
            <div className="h-full flex flex-col items-center justify-between py-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_18px_60px_-30px_rgba(245,165,36,0.4)]">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#f5a524]/80 shadow-[0_0_22px_rgba(245,165,36,0.5)]" />
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-2 py-3">
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                    }}
                    className="text-[10px] text-white/70 uppercase tracking-[0.28em] leading-none"
                  >
                    Friends
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 text-xs">
                  0
                </div>
                <motion.button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  animate={{
                    x: isExpanded ? -2 : 0,
                    rotate: isExpanded ? 180 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
                  className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/80"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-white/70"
                  >
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 min-w-0 h-full"
            >
              <div className="h-full flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-white/70 uppercase tracking-[0.22em]">
                    Squad panel
                  </div>
                  <div className="text-[11px] text-white/75 border border-white/20 rounded-full px-3 py-1 bg-white/10">
                    Demo
                  </div>
                </div>

                <div className="mt-5 flex-1 overflow-y-auto scrollbar-hide">
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-white font-semibold tracking-tight">
                        Bring your squad.
                      </div>
                      <div className="mt-2 text-sm text-white/55 leading-relaxed">
                        Social features are coming soon with our Convex
                        migration. Stay tuned!
                      </div>
                      <button
                        type="button"
                        disabled
                        className="mt-5 block w-full px-4 py-3 rounded-2xl bg-white/20 text-white/40 text-sm font-medium text-center cursor-not-allowed"
                      >
                        Login (Coming soon)
                      </button>
                      <div className="mt-3 text-xs text-white/45 text-center">
                        Multiplayer launching soon!
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-[11px] text-white/55 uppercase tracking-[0.22em]">
                        What&apos;s coming
                      </div>
                      <div className="mt-3 grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <div className="text-sm text-white/75">
                            Party invites
                          </div>
                          <div className="mt-1 text-xs text-white/45">
                            Stack up without begging in chat.
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <div className="text-sm text-white/75">
                            Saved stats
                          </div>
                          <div className="mt-1 text-xs text-white/45">
                            Track WPM and flex responsibly.
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <div className="text-sm text-white/75">
                            Leaderboards
                          </div>
                          <div className="mt-1 text-xs text-white/45">
                            Compete globally or with friends.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="text-[10px] text-white/45 uppercase tracking-[0.22em]">
                    {isExpanded ? 'Hover out to collapse' : 'Hover to expand'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
