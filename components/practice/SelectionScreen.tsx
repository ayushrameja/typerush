'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Difficulty, getDifficultyDescription } from '@/lib/utils/words';
import { useRouter } from 'next/navigation';

export interface PracticeSettings {
  duration: number;
  difficulty: Difficulty;
  stopOnError: boolean;
  soundEnabled: boolean;
}

interface SelectionScreenProps {
  onStart: (settings: PracticeSettings) => void;
}

const STORAGE_KEY = 'typerush_preferences';

const durations = [15, 30, 60, 120, 0] as const;
const difficulties: Difficulty[] = [
  'beginner',
  'easy',
  'medium',
  'hard',
  'expert',
];

export function SelectionScreen({ onStart }: SelectionScreenProps) {
  const router = useRouter();
  const [duration, setDuration] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stopOnError, setStopOnError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.duration) setDuration(prefs.duration);
        if (prefs.difficulty) setDifficulty(prefs.difficulty);
        if (typeof prefs.stopOnError === 'boolean')
          setStopOnError(prefs.stopOnError);
        if (typeof prefs.soundEnabled === 'boolean')
          setSoundEnabled(prefs.soundEnabled);
      } catch {}
    }
  }, []);

  const handleStart = () => {
    const settings: PracticeSettings = {
      duration,
      difficulty,
      stopOnError,
      soundEnabled,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    onStart(settings);
  };

  const durationLabel = useMemo(
    () => (duration === 0 ? '∞' : `${duration}s`),
    [duration]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.repeat) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
      if (e.key === 'Escape') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, duration, difficulty, stopOnError, soundEnabled]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-5xl"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          Configure match
        </div>
        <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
          Practice
        </h1>
        <p className="mt-3 text-white/60">
          Press <span className="text-white/80">Enter</span> to start.
        </p>
      </div>

      <div className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-4">
                Duration
              </label>
              <div className="grid grid-cols-5 gap-3">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-3 rounded-2xl text-sm font-medium transition-all border ${
                      duration === d
                        ? 'bg-[#f5a524] text-black border-[#f5a524]'
                        : 'bg-transparent text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {d === 0 ? '∞' : `${d}s`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-4">
                Difficulty
              </label>
              <div className="space-y-3">
                {difficulties.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`w-full p-5 rounded-3xl text-left transition-all border ${
                      difficulty === d
                        ? 'bg-white/5 border-[#f5a524]/60'
                        : 'bg-transparent border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div
                          className={`font-medium capitalize ${
                            difficulty === d ? 'text-white' : 'text-white/80'
                          }`}
                        >
                          {d}
                        </div>
                        <div className="text-sm text-white/50 mt-1">
                          {getDifficultyDescription(d)}
                        </div>
                      </div>
                      {difficulty === d && (
                        <div className="w-2 h-2 rounded-full bg-[#f5a524] shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-4">
                Options
              </label>

              <div className="space-y-4">
                <button
                  onClick={() => setStopOnError(!stopOnError)}
                  className={`w-full p-5 rounded-3xl text-left transition-all border flex items-center justify-between gap-4 ${
                    stopOnError
                      ? 'bg-white/5 border-[#f5a524]/60'
                      : 'bg-transparent border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`font-medium ${
                        stopOnError ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      Stop on error
                    </div>
                    <div className="text-sm text-white/50 mt-1">
                      Pause after 2 consecutive mistakes
                    </div>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors shrink-0 ${
                      stopOnError ? 'bg-[#f5a524]' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black mt-1 transition-transform ${
                        stopOnError ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </button>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-full p-5 rounded-3xl text-left transition-all border flex items-center justify-between gap-4 ${
                    soundEnabled
                      ? 'bg-white/5 border-[#f5a524]/60'
                      : 'bg-transparent border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`font-medium ${
                        soundEnabled ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      Sound effects
                    </div>
                    <div className="text-sm text-white/50 mt-1">
                      Mechanical key sounds and error tones
                    </div>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors shrink-0 ${
                      soundEnabled ? 'bg-[#f5a524]' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black mt-1 transition-transform ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-white/60 text-xs">Ready</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-white/80 text-sm">
                  {durationLabel} · <span className="capitalize">{difficulty}</span>
                </div>
                <div className="text-[11px] text-white/50 border border-white/10 rounded-md px-2 py-1">
                  Enter
                </div>
              </div>
              <button
                onClick={handleStart}
                className="mt-4 w-full py-3 bg-[#f5a524] text-black font-medium rounded-2xl hover:bg-[#f7b64a] transition-colors"
              >
                Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
