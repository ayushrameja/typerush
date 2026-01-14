'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/userStore';
import { useGameStore } from '@/lib/stores/gameStore';

type NavItem = { href: string; label: string; shortcut?: string };

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/practice', label: 'Practice', shortcut: 'P' },
  { href: '/leaderboard', label: 'Leaderboard', shortcut: 'L' },
];

export function FloatingNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading } = useUserStore();
  const gameStatus = useGameStore((s) => s.status);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [spotlight, setSpotlight] = useState<{ x: number; w: number } | null>(
    null
  );

  const shortcutsDisabled = useMemo(() => {
    return gameStatus === 'playing' || gameStatus === 'paused';
  }, [gameStatus]);

  const isHiddenRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname.startsWith('/race')) return true;
    if (pathname.startsWith('/practice')) return shortcutsDisabled;
    return false;
  }, [pathname, shortcutsDisabled]);

  const activeHref = useMemo(() => {
    if (!pathname) return '/';
    const exact = navItems.find((i) => i.href === pathname);
    return exact?.href ?? (pathname.startsWith('/leaderboard') ? '/leaderboard' : '/');
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.repeat) return;

      if (shortcutsDisabled) return;

      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        !!active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable);
      if (isEditable) return;

      const key = e.key.toLowerCase();
      if (key === 'p') router.push('/practice');
      if (key === 'l') router.push('/leaderboard');
      if (key === 'h') router.push('/');
      if (key === 'escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, shortcutsDisabled]);

  useEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const update = () => {
      const targetHref = hoveredHref ?? activeHref;
      const el = itemRefs.current[targetHref];
      if (!el) return;
      setSpotlight({ x: el.offsetLeft, w: el.offsetWidth });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(container);
    return () => ro.disconnect();
  }, [hoveredHref, activeHref]);

  if (isHiddenRoute) return null;

  return (
    <div className="fixed top-5 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto mx-auto w-full"
        >
          <div className="glass-panel rounded-2xl px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors"
              >
                <span className="text-white font-semibold tracking-tight">TypeRush</span>
                <span className="text-[11px] text-white/50 border border-white/10 rounded-full px-2 py-[2px]">
                  lobby
                </span>
              </Link>

              <div
                ref={navContainerRef}
                className="hidden md:flex items-center gap-1 relative"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <AnimatePresence>
                    {spotlight && (
                      <motion.div
                        layoutId="navSpotlight"
                        className="absolute top-0 bottom-0 rounded-xl bg-white/5 border border-white/10"
                        style={{
                          x: spotlight.x,
                          width: spotlight.w,
                        }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {navItems.map((item) => {
                  const isActive = activeHref === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => setHoveredHref(item.href)}
                      onMouseLeave={() => setHoveredHref(null)}
                      ref={(el) => {
                        itemRefs.current[item.href] = el;
                      }}
                      className={`relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                        isActive ? 'text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] text-white/40 border border-white/10 rounded-md px-1.5 py-0.5">
                          {item.shortcut}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2">
                  {!isLoading && user ? (
                    <>
                      <Link
                        href="/profile"
                        className="px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {profile?.username || 'Profile'}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="px-3 py-2 rounded-xl text-sm bg-white text-black hover:bg-white/90 transition-colors"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  className="md:hidden px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Open menu"
                >
                  Menu
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mobileOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="pt-2 pb-1 border-t border-white/10 mt-2">
                    <div className="flex flex-col">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <span className="text-[10px] text-white/40 border border-white/10 rounded-md px-1.5 py-0.5">
                              {item.shortcut}
                            </span>
                          )}
                        </Link>
                      ))}
                      <div className="h-px bg-white/10 my-2" />
                      {!isLoading && user ? (
                        <>
                          <Link
                            href="/profile"
                            onClick={() => setMobileOpen(false)}
                            className="px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            {profile?.username || 'Profile'}
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setMobileOpen(false);
                              void handleLogout();
                            }}
                            className="text-left px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/login"
                            onClick={() => setMobileOpen(false)}
                            className="px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Login
                          </Link>
                          <Link
                            href="/signup"
                            onClick={() => setMobileOpen(false)}
                            className="px-3 py-2 rounded-xl text-sm bg-white text-black hover:bg-white/90 transition-colors"
                          >
                            Sign up
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

