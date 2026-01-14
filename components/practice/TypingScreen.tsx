'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/stores/gameStore';
import { useSound } from '@/lib/hooks/useSound';
import { FallingLetter } from './FallingLetter';
import { Toast } from '@/components/ui/Toast';

interface FallingLetterData {
  id: number;
  char: string;
  x: number;
  y: number;
}

interface TypingScreenProps {
  stopOnError: boolean;
  soundEnabled: boolean;
  onComplete: () => void;
}

let fallingLetterId = 0;

export function TypingScreen({
  stopOnError,
  soundEnabled,
  onComplete,
}: TypingScreenProps) {
  const {
    text,
    currentIndex,
    charResults,
    timeLeft,
    duration,
    status,
    typeChar,
    deleteChar,
    tick,
    recordWpm,
    pauseGame,
    resumeGame,
  } = useGameStore();

  const { play } = useSound(soundEnabled);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fallingContainerRef = useRef<HTMLDivElement>(null);
  const cursorSpanRef = useRef<HTMLSpanElement>(null);
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollOffsetRef = useRef(0);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [fallingLetters, setFallingLetters] = useState<FallingLetterData[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && status === 'playing') {
        pauseGame();
        setToastMessage('Game paused - you left the tab');
        setShowToast(true);
      } else if (!document.hidden && status === 'paused') {
        setToastMessage('Type any key to resume playing');
        setShowToast(true);
        inputRef.current?.focus();
      }
    };

    const handleBlur = () => {
      if (status === 'playing') {
        pauseGame();
        setToastMessage('Game paused - you switched applications');
        setShowToast(true);
      }
    };

    const handleFocus = () => {
      if (status === 'paused') {
        setToastMessage('Type any key to resume playing');
        setShowToast(true);
        inputRef.current?.focus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, pauseGame]);

  useEffect(() => {
    if (showToast && status !== 'paused') {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast, status]);

  useEffect(() => {
    if (status === 'playing') {
      const timer = setInterval(tick, 1000);
      return () => clearInterval(timer);
    }
  }, [status, tick]);

  useEffect(() => {
    if (status === 'playing') {
      wpmIntervalRef.current = setInterval(recordWpm, 2000);
      return () => {
        if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
      };
    }
  }, [status, recordWpm]);

  useEffect(() => {
    if (status === 'finished') {
      play('complete');
      onComplete();
    }
  }, [status, onComplete, play]);

  useEffect(() => {
    if (!cursorSpanRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const cursorRect = cursorSpanRef.current.getBoundingClientRect();

    const containerWidth = containerRect.width;
    const targetPosition = containerWidth * 0.2;

    const cursorVisualLeft = cursorRect.left - containerRect.left;
    const cursorOriginalLeft = cursorVisualLeft + scrollOffsetRef.current;

    if (cursorVisualLeft > targetPosition) {
      const newOffset = cursorOriginalLeft - targetPosition;
      scrollOffsetRef.current = newOffset;
      setScrollOffset(newOffset);
    } else if (
      cursorVisualLeft < targetPosition * 0.5 &&
      scrollOffsetRef.current > 0
    ) {
      const newOffset = Math.max(0, cursorOriginalLeft - targetPosition);
      scrollOffsetRef.current = newOffset;
      setScrollOffset(newOffset);
    }
  }, [currentIndex, text.length]);

  const addFallingLetter = useCallback((char: string) => {
    if (!cursorSpanRef.current || !fallingContainerRef.current) return;

    const cursorRect = cursorSpanRef.current.getBoundingClientRect();
    const containerRect = fallingContainerRef.current.getBoundingClientRect();

    const x = cursorRect.left - containerRect.left;
    const y = cursorRect.top - containerRect.top;

    setFallingLetters((prev) => [
      ...prev,
      { id: fallingLetterId++, char, x, y },
    ]);
  }, []);

  const removeFallingLetter = useCallback((id: number) => {
    setFallingLetters((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (status === 'paused') {
        if (e.key.length === 1 || e.key === ' ' || e.key === 'Backspace') {
          resumeGame();
          setShowToast(false);
        }
        return;
      }

      if (status !== 'playing') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        deleteChar();
        if (stopOnError) {
          setIsBlocked(false);
          setConsecutiveErrors(0);
        }
        return;
      }

      if (isBlocked && stopOnError) {
        if (e.key.length === 1) {
          addFallingLetter(e.key);
          play('error');
        }
        return;
      }

      if (e.key.length === 1) {
        const expectedChar = text[currentIndex];
        const isCorrect = e.key === expectedChar;

        if (!isCorrect) {
          addFallingLetter(e.key);
          play('error');

          if (stopOnError) {
            const newConsecutiveErrors = consecutiveErrors + 1;
            setConsecutiveErrors(newConsecutiveErrors);

            if (newConsecutiveErrors >= 2) {
              setIsBlocked(true);
              return;
            }
          }
        } else {
          setConsecutiveErrors(0);
          if (e.key === ' ') {
            play('space');
          } else {
            play('keypress');
          }
        }

        typeChar(e.key);
      }
    },
    [
      status,
      typeChar,
      deleteChar,
      stopOnError,
      isBlocked,
      consecutiveErrors,
      text,
      currentIndex,
      addFallingLetter,
      play,
      resumeGame,
    ]
  );

  const isInfiniteMode = duration === 0;
  const textProgress = (currentIndex / text.length) * 100;
  const timerProgress = isInfiniteMode
    ? textProgress
    : (timeLeft / duration) * 100;

  const timerColor = isInfiniteMode
    ? '#ffffff'
    : timerProgress > 50
    ? '#ffffff'
    : timerProgress > 25
    ? '#EAB308'
    : '#EF4444';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Toast message={toastMessage} show={showToast} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative min-h-[400px] flex flex-col"
      >
        {status === 'paused' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <p className="text-2xl text-white font-medium mb-2">
                Game Paused
              </p>
              <p className="text-[#888]">Type any key to resume</p>
            </div>
          </div>
        )}

        <div
          className="absolute top-0 right-0 text-2xl font-mono transition-colors duration-300"
          style={{ color: timerColor }}
        >
          {formatTime(timeLeft)}
        </div>

        <div
          ref={fallingContainerRef}
          className="flex-1 flex items-center py-16 relative"
        >
          {fallingLetters.map((letter) => (
            <FallingLetter
              key={letter.id}
              char={letter.char}
              x={letter.x}
              y={letter.y}
              onComplete={() => removeFallingLetter(letter.id)}
            />
          ))}

          <div ref={containerRef} className="w-full overflow-hidden relative">
            <div
              style={{ transform: `translateX(-${scrollOffset}px)` }}
              className="text-4xl md:text-5xl font-mono tracking-wide whitespace-nowrap transition-transform duration-150 ease-out"
            >
              {text.split('').map((char, index) => {
                let charStatus:
                  | 'pending'
                  | 'correct'
                  | 'incorrect'
                  | 'current' = 'pending';

                if (index < currentIndex) {
                  charStatus = charResults[index] ? 'correct' : 'incorrect';
                } else if (index === currentIndex) {
                  charStatus = 'current';
                }

                const isCursor = charStatus === 'current';

                return (
                  <span
                    key={index}
                    ref={isCursor ? cursorSpanRef : null}
                    className={`
                    relative
                    ${charStatus === 'pending' ? 'text-[#444]' : ''}
                    ${charStatus === 'correct' ? 'text-white' : ''}
                    ${charStatus === 'incorrect' ? 'text-red-500' : ''}
                    ${charStatus === 'current' ? 'text-[#888]' : ''}
                  `}
                  >
                    {isCursor && (
                      <span
                        className={`absolute -left-[2px] top-[10%] w-[3px] h-[80%] typing-cursor ${
                          isBlocked ? 'bg-red-500' : 'bg-white'
                        }`}
                      />
                    )}
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0 pointer-events-none"
          onKeyDown={handleKeyDown}
          autoFocus
          onBlur={() => inputRef.current?.focus()}
        />

        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-[3px] bg-[#222] rounded-full overflow-hidden">
            <div
              className={`h-full ${
                isInfiniteMode
                  ? 'transition-all duration-100'
                  : 'transition-all duration-1000 ease-linear'
              }`}
              style={{
                width: `${timerProgress}%`,
                backgroundColor: timerColor,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#666]">
            <span style={{ color: timerColor }}>
              {isInfiniteMode
                ? `${formatTime(timeLeft)} elapsed`
                : `${formatTime(timeLeft)} remaining`}
            </span>
            {isBlocked && (
              <span className="text-red-500">
                Press backspace to fix errors
              </span>
            )}
            {isInfiniteMode && !isBlocked && (
              <span className="text-[#666]">
                {Math.round(textProgress)}% complete
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
