'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Difficulty, getDifficultyDescription } from '@/lib/utils/words';

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
const difficulties: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export function SelectionScreen({ onStart }: SelectionScreenProps) {
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
        if (typeof prefs.stopOnError === 'boolean') setStopOnError(prefs.stopOnError);
        if (typeof prefs.soundEnabled === 'boolean') setSoundEnabled(prefs.soundEnabled);
      } catch {
        // Keep defaults when parsing fails.
      }
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

  const durationLabel = useMemo(() => (duration === 0 ? 'Infinite' : `${duration}s`), [duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-5xl"
    >
      <div className="mb-8 text-center">
        <div className="arena-chip">Configure Match</div>
        <h1 className="arena-heading mt-4 text-6xl leading-none text-white">Practice Range</h1>
        <p className="mt-2 text-white/62">Pick settings, then launch.</p>
      </div>

      <div className="arena-card rounded-[30px] p-6 md:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="mb-4 block text-sm font-semibold uppercase tracking-[0.09em] text-white/60">
                Duration
              </label>
              <div className="grid grid-cols-5 gap-3">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-2xl border py-3 text-sm font-semibold tracking-wide transition-all ${
                      duration === d
                        ? 'border-[#ff4655]/75 bg-[#ff4655]/20 text-[#ff9ba4]'
                        : 'border-white/12 bg-white/4 text-white/70 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {d === 0 ? '∞' : `${d}s`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-4 block text-sm font-semibold uppercase tracking-[0.09em] text-white/60">
                Difficulty
              </label>
              <div className="space-y-3">
                {difficulties.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`w-full rounded-3xl border p-5 text-left transition-all ${
                      difficulty === d
                        ? 'border-[#ff4655]/65 bg-[#ff4655]/10'
                        : 'border-white/12 bg-transparent hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div
                          className={`text-lg font-semibold capitalize ${
                            difficulty === d ? 'text-white' : 'text-white/84'
                          }`}
                        >
                          {d}
                        </div>
                        <div className="mt-1 text-sm text-white/50">{getDifficultyDescription(d)}</div>
                      </div>
                      {difficulty === d && <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff4655]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-4 block text-sm font-semibold uppercase tracking-[0.09em] text-white/60">
                Options
              </label>

              <div className="space-y-4">
                <button
                  onClick={() => setStopOnError(!stopOnError)}
                  className={`flex w-full items-center justify-between gap-4 rounded-3xl border p-5 text-left transition-all ${
                    stopOnError
                      ? 'border-[#ff4655]/65 bg-[#ff4655]/10'
                      : 'border-white/12 bg-transparent hover:border-white/25'
                  }`}
                >
                  <div className="min-w-0">
                    <div className={`font-semibold ${stopOnError ? 'text-white' : 'text-white/82'}`}>
                      Stop on error
                    </div>
                    <div className="mt-1 text-sm text-white/50">Pause after two mistakes in a row</div>
                  </div>
                  <div className={`h-6 w-10 shrink-0 rounded-full transition-colors ${stopOnError ? 'bg-[#ff4655]' : 'bg-white/12'}`}>
                    <div className={`mt-1 h-4 w-4 rounded-full bg-[#07080b] transition-transform ${stopOnError ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </button>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex w-full items-center justify-between gap-4 rounded-3xl border p-5 text-left transition-all ${
                    soundEnabled
                      ? 'border-[#ff4655]/65 bg-[#ff4655]/10'
                      : 'border-white/12 bg-transparent hover:border-white/25'
                  }`}
                >
                  <div className="min-w-0">
                    <div className={`font-semibold ${soundEnabled ? 'text-white' : 'text-white/82'}`}>
                      Sound effects
                    </div>
                    <div className="mt-1 text-sm text-white/50">Key clicks and error feedback</div>
                  </div>
                  <div className={`h-6 w-10 shrink-0 rounded-full transition-colors ${soundEnabled ? 'bg-[#ff4655]' : 'bg-white/12'}`}>
                    <div className={`mt-1 h-4 w-4 rounded-full bg-[#07080b] transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/14 bg-white/6 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.09em] text-white/58">Ready</div>
              <div className="mt-2 text-sm text-white/85">
                {durationLabel} · <span className="capitalize">{difficulty}</span>
              </div>
              <button onClick={handleStart} className="arena-button mt-4 w-full py-3 font-semibold tracking-wide">
                Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
