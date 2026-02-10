'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useConvexAuth } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { GridBackground } from './GridBackground';
import { useUserStore } from '@/lib/stores/userStore';
import { Toast } from '@/components/ui/Toast';

const fallbackName = 'Immature Beast';
const fallbackImage = '/assets/images/user-profile.png';

export function HeroLobby() {
  const user = useUserStore((state) => state.user);
  const { isAuthenticated } = useConvexAuth();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const displayName = user?.name?.trim() || fallbackName;
  const preferredImage = useMemo(() => {
    const candidate = user?.avatarUrl?.trim();
    return candidate || fallbackImage;
  }, [user?.avatarUrl]);

  const [heroImage, setHeroImage] = useState(preferredImage);

  useEffect(() => {
    setHeroImage(preferredImage);
  }, [preferredImage]);

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

  return (
    <div className="arena-shell">
      <GridBackground />
      <Toast message={toastMessage} show={showToast} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 md:px-[60px] pb-20 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="mx-auto flex w-full max-w-[980px] items-center justify-center gap-6 lg:gap-8">
            <button
              type="button"
              onClick={() => handleSlotClick('Left friend')}
              className="hero-slot-card hidden md:flex"
              aria-label="Open left friend slot"
            >
              <img src="/assets/icons/add-user.svg" alt="" aria-hidden="true" className="h-11 w-11" />
            </button>

            <div className="hero-profile-card">
              <img
                src={heroImage}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={() => setHeroImage(fallbackImage)}
              />
              <div className="hero-profile-overlay" />
              <div className="hero-profile-name">{displayName}</div>
            </div>

            <button
              type="button"
              onClick={() => handleSlotClick('Right friend')}
              className="hero-slot-card hidden md:flex"
              aria-label="Open right friend slot"
            >
              <img src="/assets/icons/add-user.svg" alt="" aria-hidden="true" className="h-11 w-11" />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-12 flex items-center justify-center"
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
