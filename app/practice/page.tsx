'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { GridBackground } from '@/components/home/GridBackground';
import {
  SelectionScreen,
  PracticeSettings,
} from '@/components/practice/SelectionScreen';
import { CountdownScreen } from '@/components/practice/CountdownScreen';
import { TypingScreen } from '@/components/practice/TypingScreen';
import { ResultsScreen } from '@/components/practice/ResultsScreen';
import { useGameStore } from '@/lib/stores/gameStore';
import { useLocalHistory } from '@/lib/hooks/useLocalHistory';
import { generateTextForDuration } from '@/lib/utils/words';

type FlowState = 'selection' | 'countdown' | 'typing' | 'results';

export default function PracticePage() {
  const [isBooting, setIsBooting] = useState(true);
  const [flowState, setFlowState] = useState<FlowState>('selection');
  const [settings, setSettings] = useState<PracticeSettings>({
    duration: 60,
    difficulty: 'medium',
    stopOnError: false,
    soundEnabled: true,
  });
  const hasSavedRef = useRef(false);

  const { isAuthenticated } = useConvexAuth();
  const saveSession = useMutation(api.practice.saveSession);
  const { addPracticeResult } = useLocalHistory();

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
      hasSavedRef.current = false;
      setFlowState('countdown');
    },
    [setDuration, setText]
  );

  const handleCountdownComplete = useCallback(() => {
    startGame();
    setFlowState('typing');
  }, [startGame]);

  const handleTypingComplete = useCallback(() => {
    setFlowState('results');
  }, []);

  const handleTryAgain = useCallback(() => {
    reset();
    setText(generateTextForDuration(settings.duration, settings.difficulty));
    hasSavedRef.current = false;
    setFlowState('countdown');
  }, [reset, setText, settings.duration, settings.difficulty]);

  const handleChangeSettings = useCallback(() => {
    reset();
    hasSavedRef.current = false;
    setFlowState('selection');
  }, [reset]);

  const text = useGameStore((state) => state.text);
  const timeUsed = duration === 0 ? timeLeft : duration - timeLeft;

  useEffect(() => {
    if (flowState !== 'results' || hasSavedRef.current) return;
    hasSavedRef.current = true;

    if (isAuthenticated) {
      saveSession({
        wpm,
        accuracy,
        duration,
        timeUsed,
        totalChars,
        totalWords,
        mistakes,
        difficulty: settings.difficulty,
      });
    }

    addPracticeResult({
      wpm,
      accuracy,
      duration,
      difficulty: settings.difficulty,
      completedAt: Date.now(),
    });
  }, [flowState, isAuthenticated, saveSession, addPracticeResult, wpm, accuracy, duration, timeUsed, totalChars, totalWords, mistakes, settings.difficulty]);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 350);
    return () => clearTimeout(timer);
  }, []);

  if (isBooting) {
    return (
      <div className="arena-shell">
        <GridBackground />
        <div className="relative min-h-screen px-4 pt-28 pb-20">
          <div className="max-w-5xl mx-auto">
            <PracticeSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-shell">
      <GridBackground />
      <div className="relative min-h-screen px-4 pt-28 pb-20">
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

function PracticeSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto h-6 w-32 rounded-full bg-white/10" />
        <div className="mx-auto h-10 w-48 rounded-full bg-white/10" />
        <div className="mx-auto h-4 w-40 rounded-full bg-white/5" />
      </div>
      <div className="glass-panel rounded-3xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-10 rounded-xl bg-white/10" />
              ))}
            </div>
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-20 rounded-2xl bg-white/5" />
              ))}
            </div>
            <div className="h-20 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
