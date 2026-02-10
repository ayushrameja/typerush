'use client';

import { useEffect, useMemo, useState } from 'react';

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
};

const defaultAvatarClassName = 'h-8 w-8 rounded-full';
const defaultFallbackClassName =
  'bg-[linear-gradient(145deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] text-[11px] font-bold text-white/92';

function toInitials(value: string) {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join('') || 'TR'
  );
}

function resolveAvatarSrc(src?: string | null) {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/avatar')
  ) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return `/api/avatar?src=${encodeURIComponent(url.toString())}`;
    }
  } catch {
    return trimmed;
  }

  return null;
}

export function UserAvatar({
  src,
  name,
  className = defaultAvatarClassName,
  fallbackClassName = defaultFallbackClassName,
  alt,
}: UserAvatarProps) {
  const [isBroken, setIsBroken] = useState(false);
  const label = (name?.trim() || 'Player').slice(0, 80);
  const initials = useMemo(() => toInitials(label), [label]);
  const resolvedSrc = useMemo(() => resolveAvatarSrc(src), [src]);
  const showImage = Boolean(resolvedSrc) && !isBroken;

  useEffect(() => {
    setIsBroken(false);
  }, [resolvedSrc]);

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}>
      {showImage ? (
        <img
          src={resolvedSrc ?? undefined}
          alt={alt ?? label}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
            setIsBroken(true);
          }}
        />
      ) : null}
      {!showImage ? (
        <span className={`inline-flex h-full w-full items-center justify-center ${fallbackClassName}`}>
          {initials}
        </span>
      ) : null}
    </div>
  );
}

