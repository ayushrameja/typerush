"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGameStore } from "@/lib/stores/gameStore";
import { UserAvatar } from "@/components/ui/UserAvatar";

type MainNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const leftMainNav: MainNavItem[] = [
  {
    href: "/practice",
    label: "Practice",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 19V5l10 7-10 7Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 7v5l3.3 1.9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const rightMainNav: MainNavItem[] = [
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 20V10h4v10H7Zm6 0V4h4v16h-4Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    href: "/collection",
    label: "Collection",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="7"
          height="7"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="13"
          y="4"
          width="7"
          height="7"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="4"
          y="13"
          width="7"
          height="7"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="13"
          y="13"
          width="7"
          height="7"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return href === "/";
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function MainNavIcon({
  pathname,
  href,
  label,
  icon,
}: {
  pathname: string | null;
  href: string;
  label: string;
  icon: ReactNode;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      data-active={active}
      className={`nav-link-fx group relative inline-flex h-full items-center justify-center transition-all duration-200 ${
        active ? "bg-white/10" : "bg-white/3 hover:bg-white/7"
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-px transition-colors duration-300 ${
          active ? "bg-(--accent)" : "bg-transparent"
        }`}
      />
      <span
        className={`transition-colors duration-200 ${
          active ? "text-white" : "text-white/60 group-hover:text-white"
        }`}
      >
        {icon}
      </span>
    </Link>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 8.7A3.3 3.3 0 1 0 12 15.3A3.3 3.3 0 0 0 12 8.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.2 15.2a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.2a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4H20a1 1 0 0 0-.8.6Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FloatingNavbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip",
  );
  const gameStatus = useGameStore((state) => state.status);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const practiceUiHidden = useMemo(
    () => gameStatus === "playing" || gameStatus === "paused",
    [gameStatus],
  );
  const isHiddenRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname.startsWith("/race")) return true;
    if (pathname.startsWith("/practice")) return practiceUiHidden;
    return false;
  }, [pathname, practiceUiHidden]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (!userMenuOpen) return;
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [userMenuOpen]);

  if (isHiddenRoute) return null;

  const displayName = currentUser?.name ?? "Player";
  const email = currentUser?.email ?? "No email on file";
  const playActive = pathname === "/";

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="relative mx-auto w-full"
      >
        <div className="relative flex h-[68px] items-center justify-between px-3 sm:px-4">
          <div className="flex w-[84px] items-center">
            <Link
              href="/"
              className="cursor-pointer text-white/90 transition-opacity duration-200 hover:opacity-80"
            >
              <span className="text-3xl font-bold leading-none">tr.</span>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 self-stretch items-center justify-center lg:flex">
            <nav
              className="relative grid h-full w-fit grid-cols-[80px_64px_auto_64px_80px] gap-px border border-white/6 bg-[linear-gradient(180deg,rgba(10,13,20,0.95),rgba(6,8,14,0.88))] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, calc(100% - 16px) 100%, 16px 100%)",
              }}
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-[linear-gradient(90deg,transparent_5%,rgba(255,255,255,0.1)_30%,rgba(255,70,85,0.2)_50%,rgba(255,255,255,0.1)_70%,transparent_95%)]" />

              <MainNavIcon
                pathname={pathname}
                href={leftMainNav[0].href}
                label={leftMainNav[0].label}
                icon={leftMainNav[0].icon}
              />
              <MainNavIcon
                pathname={pathname}
                href={leftMainNav[1].href}
                label={leftMainNav[1].label}
                icon={leftMainNav[1].icon}
              />

              <Link
                href="/"
                data-active={playActive}
                className={`nav-play-fx group relative flex h-full items-center justify-center transition-all duration-200 ${
                  playActive ? "bg-white/10" : "bg-white/5 hover:bg-white/8"
                }`}
              >
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,70,85,0.5),transparent)]" />
                <span className="px-10 text-[2rem] font-bold capitalize leading-none tracking-widest text-white">
                  Play
                </span>
              </Link>

              <MainNavIcon
                pathname={pathname}
                href={rightMainNav[0].href}
                label={rightMainNav[0].label}
                icon={rightMainNav[0].icon}
              />
              <MainNavIcon
                pathname={pathname}
                href={rightMainNav[1].href}
                label={rightMainNav[1].label}
                icon={rightMainNav[1].icon}
              />
            </nav>
          </div>

          <div className="flex w-[140px] items-center justify-end gap-2">
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings"
              className={`nav-btn-fx inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
                isActivePath(pathname, "/settings")
                  ? "border-white/28 bg-white/14 text-white"
                  : "border-white/12 text-white/60 hover:border-white/25 hover:bg-white/8 hover:text-white"
              }`}
            >
              <SettingsIcon />
            </Link>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-label="User menu"
                className={`nav-btn-fx inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 ${
                  userMenuOpen
                    ? "border-white/28 bg-white/14"
                    : "border-white/12 hover:border-white/25 hover:bg-white/8"
                }`}
              >
                <UserAvatar
                  src={currentUser?.image ?? null}
                  name={displayName}
                  className="h-8 w-8 rounded-full"
                  fallbackClassName="bg-[linear-gradient(145deg,rgba(255,255,255,0.24),rgba(255,255,255,0.1))] text-[10px] font-bold text-white"
                />
              </button>

              <AnimatePresence>
                {userMenuOpen
                  ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-[calc(100%+10px)] z-40 w-[240px] border border-white/14 bg-[#0f131a]/94 p-3 backdrop-blur-2xl"
                    >
                      <div className="border-b border-white/12 pb-3">
                        <div className="text-sm font-semibold text-white">
                          {displayName}
                        </div>
                        <div className="mt-1 truncate text-xs text-white/62">
                          {email}
                        </div>
                      </div>

                      {isAuthenticated
                        ? (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              void signOut();
                            }}
                            className="dropdown-fx mt-3 inline-flex w-full cursor-pointer items-center justify-center border border-white/14 px-3 py-2 text-xs font-semibold capitalize tracking-[0.06em] text-white/78 transition-all duration-200 hover:border-white/26 hover:bg-white/8 hover:text-white"
                          >
                            Logout
                          </button>
                        )
                        : (
                          <Link
                            href="/login"
                            className="dropdown-fx mt-3 inline-flex w-full cursor-pointer items-center justify-center border border-white/14 px-3 py-2 text-xs font-semibold capitalize tracking-[0.06em] text-white/78 transition-all duration-200 hover:border-white/26 hover:bg-white/8 hover:text-white"
                          >
                            Login
                          </Link>
                        )}
                    </motion.div>
                  )
                  : null}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="nav-btn-fx inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 text-white/74 transition-all duration-200 hover:border-white/24 hover:bg-white/8 hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen
          ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="mx-3 mt-1 border border-white/14 bg-[#0f131a]/94 p-2 backdrop-blur-2xl sm:mx-4 lg:hidden"
            >
              <div className="grid grid-cols-4 gap-2">
                {[...leftMainNav, ...rightMainNav].map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      aria-label={item.label}
                      data-active={active}
                      className={`nav-link-fx inline-flex h-11 cursor-pointer items-center justify-center border transition-all duration-200 ${
                        active
                          ? "border-white/24 bg-white/12 text-white"
                          : "border-white/12 text-white/68 hover:border-white/24 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {item.icon}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )
          : null}
      </AnimatePresence>
    </div>
  );
}
