"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGameStore } from "@/lib/stores/gameStore";
import { useIdentityStore } from "@/lib/stores/identityStore";

type MainNavItem = {
  href: string;
  label: string;
  iconSrc: string;
};

const leftMainNav: MainNavItem[] = [
  {
    href: "/practice",
    label: "Practice",
    iconSrc: "/assets/icons/biceps.svg",
  },
  {
    href: "/history",
    label: "History",
    iconSrc: "/assets/icons/recent.svg",
  },
];

const rightMainNav: MainNavItem[] = [
  {
    href: "/leaderboard",
    label: "Leaderboard",
    iconSrc: "/assets/icons/leadship.svg",
  },
  {
    href: "/collection",
    label: "Collection",
    iconSrc: "/assets/icons/collection.svg",
  },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return href === "/";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AssetIcon({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      title={label}
      className={className}
    />
  );
}

function CoreNavIcon({
  pathname,
  item,
}: {
  pathname: string | null;
  item: MainNavItem;
}) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      title={item.label}
      data-active={active}
      className="core-shell-icon"
    >
      <AssetIcon
        src={item.iconSrc}
        label={item.label}
        className="h-[30px] w-[30px]"
      />
    </Link>
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

function MobileNavItem({
  item,
  pathname,
}: {
  item: MainNavItem;
  pathname: string | null;
}) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
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
      <AssetIcon
        src={item.iconSrc}
        label={item.label}
        className="h-[18px] w-[18px] opacity-85"
      />
    </Link>
  );
}

function RightSidePanel({
  pathname,
  isAuthenticated,
  displayName,
  email,
  onSignOut,
}: {
  pathname: string | null;
  isAuthenticated: boolean;
  displayName: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div className="pointer-events-none fixed right-0 top-0 z-52 hidden h-screen lg:flex">
      <div className="core-right-rail pointer-events-auto group">
        <div
          className="core-rail-toggle"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-white/60 transition-transform duration-200 group-hover:rotate-180"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>

        <div className="core-rail-divider" />

        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          data-active={isActivePath(pathname, "/settings")}
          className="core-rail-action"
        >
          <AssetIcon
            src="/assets/icons/settings.svg"
            label="Settings"
            className="core-rail-icon"
          />
          <span className="core-rail-label">Settings</span>
        </Link>

        <Link
          href="/race"
          aria-label="Friends"
          title="Friends"
          className="core-rail-action"
        >
          <AssetIcon
            src="/assets/icons/friends.svg"
            label="Friends"
            className="core-rail-icon"
          />
          <span className="core-rail-label">Friends</span>
        </Link>

        <div className="core-rail-divider" />

        {isAuthenticated
          ? (
            <div className="core-rail-user-section">
              <div className="core-rail-user-info">
                <div className="text-xs font-semibold text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-white/50 truncate">
                  {email}
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="core-rail-action-btn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="core-rail-icon"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="core-rail-label">Logout</span>
              </button>
            </div>
          )
          : (
            <div className="core-rail-user-section">
              <AnonIdentityDisplay />
              <Link
                href="/login"
                className="core-rail-action-btn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="core-rail-icon"
                >
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span className="core-rail-label">Sign in</span>
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}

function AnonIdentityDisplay() {
  const { identity } = useIdentityStore();
  if (!identity || identity.isAuthenticated) return null;

  return (
    <div className="core-rail-user-info">
      <div className="text-xs font-semibold text-white truncate">
        {identity.displayName}
      </div>
      <div className="text-[10px] text-white/50 truncate">
        Anonymous
      </div>
    </div>
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

  const practiceUiHidden = useMemo(
    () => gameStatus === "playing" || gameStatus === "paused",
    [gameStatus],
  );
  const isHiddenRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname.startsWith("/race/")) return true;
    if (pathname.startsWith("/practice")) return practiceUiHidden;
    return false;
  }, [pathname, practiceUiHidden]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMobileOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

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
        <div className="relative flex h-[60px] items-center px-4 md:px-[60px] lg:pr-[116px]">
          <div className="flex h-full w-12 shrink-0 items-center">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/90 transition-opacity duration-200 hover:opacity-80"
            />
          </div>
          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <nav className="core-shell-nav">
              <div className="flex items-center justify-center pr-4 pl-10 gap-4">
                <CoreNavIcon pathname={pathname} item={leftMainNav[0]} />
                <CoreNavIcon pathname={pathname} item={leftMainNav[1]} />
              </div>
              <div className="w-auto h-full">
                <Link
                  href="/"
                  data-active={playActive}
                  className="core-shell-play h-full"
                >
                  <span className="inline-flex overflow-hidden lowercase">
                    {"Play".split("").map((char, i) => (
                      <motion.span
                        key={i}
                        className="inline-block first:capitalize"
                        animate={{
                          y: [0, -30, 30, 0],
                          opacity: [1, 0, 0, 1],
                        }}
                        transition={{
                          duration: 0.4,
                          delay: i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 4,
                          ease: "easeInOut",
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                </Link>
              </div>
              <div className="flex items-center justify-center pl-4 pr-10 gap-4">
                <CoreNavIcon pathname={pathname} item={rightMainNav[0]} />
                <CoreNavIcon pathname={pathname} item={rightMainNav[1]} />
              </div>
            </nav>
          </div>

          <div className="ml-auto flex w-[150px] items-center justify-end gap-2 lg:hidden">
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings"
              className="nav-btn-fx inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 transition-all duration-200 hover:border-white/24 hover:bg-white/8"
            >
              <AssetIcon
                src="/assets/icons/settings.svg"
                label="Settings"
                className="h-[30px] w-[30px]"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="nav-btn-fx inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 text-white/74 transition-all duration-200 hover:border-white/24 hover:bg-white/8 hover:text-white"
              aria-label="Open navigation"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </motion.header>

      <RightSidePanel
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        displayName={displayName}
        email={email}
        onSignOut={() => void signOut()}
      />

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
              <div className="grid grid-cols-5 gap-2">
                <MobileNavItem item={leftMainNav[0]} pathname={pathname} />
                <MobileNavItem item={leftMainNav[1]} pathname={pathname} />
                <Link
                  href="/"
                  data-active={playActive}
                  className={`nav-link-fx inline-flex h-11 cursor-pointer items-center justify-center border text-sm font-semibold tracking-[0.04em] transition-all duration-200 ${
                    playActive
                      ? "border-white/24 bg-white/12 text-white"
                      : "border-white/12 text-white/68 hover:border-white/24 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  Play
                </Link>
                <MobileNavItem item={rightMainNav[0]} pathname={pathname} />
                <MobileNavItem item={rightMainNav[1]} pathname={pathname} />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/settings"
                  className="inline-flex h-10 items-center justify-center border border-white/12 text-xs font-semibold tracking-[0.06em] text-white/78 transition-all duration-200 hover:border-white/24 hover:bg-white/8 hover:text-white"
                >
                  Settings
                </Link>
                {isAuthenticated
                  ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        void signOut();
                      }}
                      className="inline-flex h-10 items-center justify-center border border-white/12 text-xs font-semibold tracking-[0.06em] text-white/78 transition-all duration-200 hover:border-white/24 hover:bg-white/8 hover:text-white"
                    >
                      Logout
                    </button>
                  )
                  : (
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center justify-center border border-white/12 text-xs font-semibold tracking-[0.06em] text-white/78 transition-all duration-200 hover:border-white/24 hover:bg-white/8 hover:text-white"
                    >
                      Login
                    </Link>
                  )}
              </div>
            </motion.div>
          )
          : null}
      </AnimatePresence>
    </div>
  );
}
