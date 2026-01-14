'use client';

import { useState, useEffect } from 'react';
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
const difficulties: Difficulty[] = [
  'beginner',
  'easy',
  'medium',
  'hard',
  'expert',
];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Practice</h1>
        <p className="text-[#888]">Select your preferences and start typing</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-[#888] mb-4">
            Duration
          </label>
          <div className="flex gap-3">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`
                  flex-1 py-3 rounded-lg text-sm font-medium transition-all border
                  ${
                    duration === d
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-[#888] border-[#333] hover:border-[#555] hover:text-white'
                  }
                `}
              >
                {d === 0 ? '∞' : `${d}s`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#888] mb-4">
            Difficulty
          </label>
          <div className="space-y-2">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`
                  w-full p-4 rounded-lg text-left transition-all border
                  ${
                    difficulty === d
                      ? 'bg-white/5 border-white/20'
                      : 'bg-transparent border-[#333] hover:border-[#555]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={`font-medium capitalize ${difficulty === d ? 'text-white' : 'text-[#ededed]'}`}
                    >
                      {d}
                    </span>
                    <p className="text-sm text-[#888] mt-1">
                      {getDifficultyDescription(d)}
                    </p>
                  </div>
                  {difficulty === d && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#888] mb-4">
            Options
          </label>

          <button
            onClick={() => setStopOnError(!stopOnError)}
            className={`
              w-full p-4 rounded-lg text-left transition-all border flex items-center justify-between
              ${
                stopOnError
                  ? 'bg-white/5 border-white/20'
                  : 'bg-transparent border-[#333] hover:border-[#555]'
              }
            `}
          >
            <div>
              <span
                className={`font-medium ${stopOnError ? 'text-white' : 'text-[#ededed]'}`}
              >
                Stop on error
              </span>
              <p className="text-sm text-[#888] mt-1">
                Pause typing after 2 consecutive mistakes
              </p>
            </div>
            <div
              className={`w-10 h-6 rounded-full transition-colors ${stopOnError ? 'bg-white' : 'bg-[#333]'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black mt-1 transition-transform ${stopOnError ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </div>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`
              w-full p-4 rounded-lg text-left transition-all border flex items-center justify-between
              ${
                soundEnabled
                  ? 'bg-white/5 border-white/20'
                  : 'bg-transparent border-[#333] hover:border-[#555]'
              }
            `}
          >
            <div>
              <span
                className={`font-medium ${soundEnabled ? 'text-white' : 'text-[#ededed]'}`}
              >
                Sound effects
              </span>
              <p className="text-sm text-[#888] mt-1">
                Play sounds for keystrokes and errors
              </p>
            </div>
            <div
              className={`w-10 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-white' : 'bg-[#333]'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black mt-1 transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </div>
          </button>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-white text-black font-medium rounded-lg hover:bg-[#ededed] transition-colors mt-8"
        >
          Start Practice
        </button>
      </div>
    </motion.div>
  );
}
