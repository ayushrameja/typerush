'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useUserStore } from '@/lib/stores/userStore';

export function FriendsList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useUserStore();

  const inviteCode = user?.id
    ? user.id.replaceAll('-', '').slice(0, 8).toUpperCase()
    : '';
  const inviteText = inviteCode ? `TypeRush party: ${inviteCode}` : '';

  return (
    <motion.div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="fixed right-0 top-0 h-screen z-50"
      initial={false}
    >
      <motion.div
        animate={{
          width: isExpanded ? 360 : 78,
          x: isExpanded ? 0 : 10,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative h-full rounded-l-3xl glass-panel overflow-hidden shadow-[0_40px_140px_-80px_rgba(0,0,0,0.95)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.09),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_85%,rgba(245,165,36,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,165,36,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />

        <div className="relative h-full flex">
          <div className="w-[78px] h-full border-l border-white/10 bg-black/40">
            <div className="h-full flex flex-col items-center justify-between py-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_18px_60px_-30px_rgba(245,165,36,0.35)]">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#f5a524]/80 shadow-[0_0_22px_rgba(245,165,36,0.5)]" />
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-2 py-3">
                  <div
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    className="text-[10px] text-white/60 uppercase tracking-[0.28em] leading-none"
                  >
                    Friends
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 text-xs">
                  0
                </div>
                <motion.div
                  animate={{ x: isExpanded ? -2 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
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
                </motion.div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 h-full">
            <div className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-white/55 uppercase tracking-[0.22em]">
                  Squad panel
                </div>
                <div className="text-[11px] text-white/60 border border-white/10 rounded-full px-3 py-1 bg-white/5">
                  {user ? 'Online' : 'Guest'}
                </div>
              </div>

              <div className="mt-5 flex-1 overflow-y-auto scrollbar-hide">
                {user ? (
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-white font-semibold tracking-tight">
                        Party (3)
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        Invite teammates and run it back.
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 flex items-center justify-between">
                          <div className="text-sm text-white/75">You</div>
                          <div className="text-[11px] text-white/55 border border-white/10 rounded-full px-2.5 py-1 bg-white/5">
                            Leader
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 flex items-center justify-between">
                          <div className="text-sm text-white/55">Empty slot</div>
                          <div className="text-[11px] text-white/55">Invite</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 flex items-center justify-between">
                          <div className="text-sm text-white/55">Empty slot</div>
                          <div className="text-[11px] text-white/55">Invite</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-[11px] text-white/55 uppercase tracking-[0.22em]">
                        Invite
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        Share this code
                      </div>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold tracking-[0.22em]">
                            {inviteCode || '—'}
                          </div>
                          <div className="text-xs text-white/45 truncate">
                            {inviteText || 'Sign-in detected, code pending'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!inviteText) return;
                            await navigator.clipboard.writeText(inviteText);
                            setCopied(true);
                            window.setTimeout(() => setCopied(false), 1200);
                          }}
                          className="shrink-0 px-3 py-2 rounded-2xl bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-white/45">
                        Copy it. Paste it. Pretend you’re coordinated.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-white font-semibold tracking-tight">
                        Bring your squad.
                      </div>
                      <div className="mt-2 text-sm text-white/55 leading-relaxed">
                        Log in to invite teammates, save stats, and queue like you
                        actually have a plan.
                      </div>
                      <Link
                        href="/login"
                        className="mt-5 block w-full px-4 py-3 rounded-2xl bg-white text-black text-sm font-medium text-center hover:bg-white/90 transition-colors"
                      >
                        Login
                      </Link>
                      <div className="mt-3 text-xs text-white/45 text-center">
                        No account? Hit Sign up.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-[11px] text-white/55 uppercase tracking-[0.22em]">
                        What you get
                      </div>
                      <div className="mt-3 grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <div className="text-sm text-white/75">Party invites</div>
                          <div className="mt-1 text-xs text-white/45">
                            Stack up without begging in chat.
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <div className="text-sm text-white/75">Saved stats</div>
                          <div className="mt-1 text-xs text-white/45">
                            Track WPM and flex responsibly.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-[10px] text-white/45 uppercase tracking-[0.22em]">
                  {isExpanded ? 'Hover out to collapse' : 'Hover to expand'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
