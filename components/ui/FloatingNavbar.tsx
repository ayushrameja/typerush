"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGameStore } from "@/lib/stores/gameStore";
import { UserAvatar } from "@/components/ui/UserAvatar";

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

const coreShellRoutes = [
  "/",
  "/practice",
  "/history",
  "/leaderboard",
  "/collection",
] as const;

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return href === "/";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isCoreShellPath(pathname: string | null) {
  if (!pathname) return false;

  return coreShellRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
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

function LegacyNavIcon({
  pathname,
  href,
  label,
  iconSrc,
}: {
  pathname: string | null;
  href: string;
  label: string;
  iconSrc: string;
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
      <AssetIcon
        src={iconSrc}
        label={label}
        className="h-[20px] w-[20px] opacity-80"
      />
    </Link>
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
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!expanded) return;
      if (!panelRef.current?.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [expanded]);

  return (
    <div className="pointer-events-none fixed right-0 top-0 z-52 hidden h-screen lg:flex">
      <div
        ref={panelRef}
        className={`core-right-rail pointer-events-auto ${expanded ? "core-right-rail--expanded" : ""}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="core-rail-toggle"
          aria-label={expanded ? "Collapse panel" : "Expand panel"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 text-white/60 transition-transform duration-260 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

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
          href={isAuthenticated ? "/race" : "/login"}
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

        {isAuthenticated ? (
          <div className="core-rail-user-section">
            <div className="core-rail-user-info">
              <div className="text-xs font-semibold text-white truncate">{displayName}</div>
              <div className="text-[10px] text-white/50 truncate">{email}</div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="core-rail-action-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="core-rail-icon">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="core-rail-label">Logout</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="core-rail-action-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="core-rail-icon">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span className="core-rail-label">Sign in</span>
          </Link>
        )}
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

  const isCoreShellRoute = useMemo(() => isCoreShellPath(pathname), [pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMobileOpen(false);
      setUserMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
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
        {isCoreShellRoute
          ? (
            <div className="relative flex h-[60px] items-center px-4 md:px-[60px]">
              <div className="flex h-full w-[150px] shrink-0 items-end pb-2">
                <Link
                  href="/"
                  className="inline-flex cursor-pointer text-2xl leading-none font-extrabold tracking-tight text-white/90 transition-opacity duration-200 hover:opacity-80"
                >
                  Typerush
                </Link>
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
                  className={`nav-btn-fx inline-flex h-62 w-full items-center justify-center rounded-full border transition-all duration-200`}
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
          )
          : (
            <div className="relative flex h-[68px] items-center justify-between px-4 md:px-[60px]">
              <div className="flex w-[84px] items-center">
                <Link
                  href="/"
                  className="cursor-pointer text-white/90 transition-opacity duration-200 hover:opacity-80"
                >
                  <span className="text-xl font-bold leading-none">tr.</span>
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
                  <LegacyNavIcon
                    pathname={pathname}
                    href={leftMainNav[0].href}
                    label={leftMainNav[0].label}
                    iconSrc={leftMainNav[0].iconSrc}
                  />
                  <LegacyNavIcon
                    pathname={pathname}
                    href={leftMainNav[1].href}
                    label={leftMainNav[1].label}
                    iconSrc={leftMainNav[1].iconSrc}
                  />

                  <Link
                    href="/"
                    data-active={playActive}
                    className={`nav-play-fx group relative flex h-full items-center justify-center transition-all duration-200 ${
                      playActive ? "bg-white/10" : "bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,70,85,0.5),transparent)]" />
                    <span className="px-10 text-sm font-bold capitalize leading-none tracking-widest text-white">
                      Play
                    </span>
                  </Link>

                  <LegacyNavIcon
                    pathname={pathname}
                    href={rightMainNav[0].href}
                    label={rightMainNav[0].label}
                    iconSrc={rightMainNav[0].iconSrc}
                  />
                  <LegacyNavIcon
                    pathname={pathname}
                    href={rightMainNav[1].href}
                    label={rightMainNav[1].label}
                    iconSrc={rightMainNav[1].iconSrc}
                  />
                </nav>
              </div>
              <div className="flex w-[140px] items-center justify-end">
                <Link
                  href="/settings"
                  aria-label="Settings"
                  title="Settings"
                  className={`nav-btn-fx inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                    isActivePath(pathname, "/settings")
                      ? "border-white/28 bg-white/14"
                      : "border-white/12 hover:border-white/25 hover:bg-white/8"
                  }`}
                >
                  <AssetIcon
                    src="/assets/icons/settings.svg"
                    label="Settings"
                    className="h-[18px] w-[18px] opacity-85"
                  />
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
          )}
      </motion.header>
      {isCoreShellRoute
        ? (
          <RightSidePanel
            pathname={pathname}
            isAuthenticated={isAuthenticated}
            displayName={displayName}
            email={email}
            onSignOut={() => void signOut()}
          />
        )
        : null}

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
