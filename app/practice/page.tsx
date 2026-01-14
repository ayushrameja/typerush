'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridBackground } from '@/components/home/GridBackground';
import {
  SelectionScreen,
  PracticeSettings,
} from '@/components/practice/SelectionScreen';
import { CountdownScreen } from '@/components/practice/CountdownScreen';
import { TypingScreen } from '@/components/practice/TypingScreen';
import { ResultsScreen } from '@/components/practice/ResultsScreen';
import { useGameStore } from '@/lib/stores/gameStore';
import { generateTextForDuration } from '@/lib/utils/words';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/userStore';
import type { Stats } from '@/lib/supabase/database.types';

type FlowState = 'selection' | 'countdown' | 'typing' | 'results';

export default function PracticePage() {
  const [flowState, setFlowState] = useState<FlowState>('selection');
  const [settings, setSettings] = useState<PracticeSettings>({
    duration: 60,
    difficulty: 'medium',
    stopOnError: false,
    soundEnabled: true,
  });

  const { user, stats, setStats } = useUserStore();
  const {
    wpm,
    accuracy,
    mistakes,
    duration,
    timeLeft,
    totalChars,
    totalWords,
    wpmHistory,
    setText,
    setDuration,
    startGame,
    reset,
  } = useGameStore();

  const handleStartSelection = useCallback(
    (newSettings: PracticeSettings) => {
      setSettings(newSettings);
      setDuration(newSettings.duration);
      setText(generateTextForDuration(newSettings.duration, newSettings.difficulty));
      setFlowState('countdown');
    },
    [setDuration, setText]
  );

  const handleCountdownComplete = useCallback(() => {
    startGame();
    setFlowState('typing');
  }, [startGame]);

  const handleTypingComplete = useCallback(async () => {
    setFlowState('results');

    if (user && stats) {
      const supabase = createClient();
      const newTotalRaces = stats.total_races + 1;
      const newAvgWpm = Math.round(
        (stats.avg_wpm * stats.total_races + wpm) / newTotalRaces
      );
      const newBestWpm = Math.max(stats.best_wpm, wpm);
      const newAccuracy = Math.round(
        (stats.accuracy * stats.total_races + accuracy) / newTotalRaces
      );

      const { data, error } = await supabase
        .from('stats')
        .update({
          avg_wpm: newAvgWpm,
          best_wpm: newBestWpm,
          total_races: newTotalRaces,
          accuracy: newAccuracy,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) {
        setStats(data as Stats);
      }
    }
  }, [user, stats, wpm, accuracy, setStats]);

  const handleTryAgain = useCallback(() => {
    reset();
    setText(generateTextForDuration(settings.duration, settings.difficulty));
    setFlowState('countdown');
  }, [reset, setText, settings.duration, settings.difficulty]);

  const handleChangeSettings = useCallback(() => {
    reset();
    setFlowState('selection');
  }, [reset]);

  const text = useGameStore((state) => state.text);
  const timeUsed = duration === 0 ? timeLeft : duration - timeLeft;

  return (
    <div className="relative min-h-screen">
      <GridBackground />
      <div className="relative min-h-screen px-4 pt-24 pb-24">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {flowState === 'selection' && (
              <SelectionScreen key="selection" onStart={handleStartSelection} />
            )}

            {flowState === 'countdown' && (
              <CountdownScreen
                key="countdown"
                previewText={text}
                onComplete={handleCountdownComplete}
              />
            )}

            {flowState === 'typing' && (
              <TypingScreen
                key="typing"
                stopOnError={settings.stopOnError}
                soundEnabled={settings.soundEnabled}
                onComplete={handleTypingComplete}
              />
            )}

            {flowState === 'results' && (
              <ResultsScreen
                key="results"
                wpm={wpm}
                accuracy={accuracy}
                duration={duration}
                timeUsed={timeUsed}
                totalChars={totalChars}
                totalWords={totalWords}
                mistakes={mistakes}
                wpmHistory={wpmHistory}
                onTryAgain={handleTryAgain}
                onChangeSettings={handleChangeSettings}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
