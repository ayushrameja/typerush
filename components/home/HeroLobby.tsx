'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useConvexAuth } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { GridBackground } from './GridBackground';
import { useUserStore } from '@/lib/stores/userStore';
import { Toast } from '@/components/ui/Toast';

const fallbackName = 'Immature Beast';
const heroImage = '/assets/images/user-profile.png';

export function HeroLobby() {
  const user = useUserStore((state) => state.user);
  const { isAuthenticated } = useConvexAuth();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const displayName = user?.name?.trim() || fallbackName;

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 1600);
    return () => clearTimeout(timer);
  }, [showToast]);

  const addFriendsHref = isAuthenticated ? '/race' : '/login';

  function handleSlotClick(slotLabel: string) {
    setToastMessage(`${slotLabel} slot coming soon.`);
    setShowToast(true);
  }

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 6;
    const rotateX = ((midY - y) / midY) * 6;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }, []);

  const handleTiltLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = '';
  }, []);

  return (
    <div className="arena-shell">
      <GridBackground />
      <Toast message={toastMessage} show={showToast} />

      <div className="hero-lobby-layout relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 md:px-[60px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex h-full w-full flex-1 flex-col"
        >
          <div className="hero-cards-section">
            <div className="hero-card-row mx-auto flex w-full max-w-[1040px] justify-center">
              <button
                type="button"
                onClick={() => handleSlotClick('Left friend')}
                className="hero-slot-card hidden md:flex"
                aria-label="Open left friend slot"
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
              >
                <img src="/assets/icons/add-user.svg" alt="" aria-hidden="true" className="h-11 w-11" />
              </button>

              <div
                className="hero-profile-card"
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
              >
                <img
                  src={heroImage}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
                <div className="hero-profile-overlay" />
                <div className="hero-profile-name">{displayName}</div>
              </div>

              <button
                type="button"
                onClick={() => handleSlotClick('Right friend')}
                className="hero-slot-card hidden md:flex"
                aria-label="Open right friend slot"
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
              >
                <img src="/assets/icons/add-user.svg" alt="" aria-hidden="true" className="h-11 w-11" />
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="hero-cta-section flex items-center justify-center"
          >
            <Link href={addFriendsHref} className="hero-add-friends-btn">
              Add friends
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
