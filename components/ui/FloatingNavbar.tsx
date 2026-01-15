'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/userStore';
import { useGameStore } from '@/lib/stores/gameStore';

type NavItem = {
  href: string;
  label: string;
  shortcut?: string;
  icon: JSX.Element;
};

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    shortcut: 'H',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    href: '/practice',
    label: 'Practice',
    shortcut: 'P',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M6 19a9 9 0 1 1 12 0"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    shortcut: 'L',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M7 21V10h4v11H7Zm6 0V3h4v18h-4Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
];

export function FloatingNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading } = useUserStore();
  const gameStatus = useGameStore((s) => s.status);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

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


  if (isHiddenRoute) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-50">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex max-w-6xl items-center justify-between px-4"
      >
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl font-semibold" style={{ fontFamily: 'Stardom, sans-serif' }}>
            TypeRush
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-3 rounded-full border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            const isHovered = hoveredHref === item.href;
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center justify-center h-10 w-10 rounded-2xl border transition-colors ${
                    isActive
                      ? 'border-[#f5a524] text-[#f5a524] bg-white/5'
                      : 'border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  {item.icon}
                </Link>
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-3 py-1 text-[11px] text-white/70"
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {!isLoading && user ? (
              <>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-2xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {profile?.username || 'Profile'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-2xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-2xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-2xl text-sm bg-white text-black hover:bg-white/90 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden px-3 py-2 rounded-2xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            Menu
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden mt-4 px-4"
          >
            <div className="glass-panel rounded-3xl p-3">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[10px] text-white/40 border border-white/10 rounded-md px-1.5 py-0.5">
                        {item.shortcut}
                      </span>
                    )}
                  </Link>
                ))}
                <div className="h-px bg-white/10 my-1" />
                {!isLoading && user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {profile?.username || 'Profile'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        void handleLogout();
                      }}
                      className="text-left rounded-2xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl px-3 py-2 text-sm bg-white text-black hover:bg-white/90 transition-colors"
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
  );
}

