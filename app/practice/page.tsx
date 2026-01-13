"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { SelectionScreen } from "@/components/practice/SelectionScreen"
import { CountdownScreen } from "@/components/practice/CountdownScreen"
import { TypingScreen } from "@/components/practice/TypingScreen"
import { ResultsScreen } from "@/components/practice/ResultsScreen"
import { useGameStore } from "@/lib/stores/gameStore"
import { generateTextForDuration, Difficulty } from "@/lib/utils/words"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"
import type { Stats } from "@/lib/supabase/database.types"

type FlowState = "selection" | "countdown" | "typing" | "results"

export default function PracticePage() {
  const [flowState, setFlowState] = useState<FlowState>("selection")
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium")

  const { user, stats, setStats } = useUserStore()
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
  } = useGameStore()

  const handleStartSelection = useCallback((dur: number, diff: Difficulty) => {
    setSelectedDuration(dur)
    setSelectedDifficulty(diff)
    setDuration(dur)
    setText(generateTextForDuration(dur, diff))
    setFlowState("countdown")
  }, [setDuration, setText])

  const handleCountdownComplete = useCallback(() => {
    startGame()
    setFlowState("typing")
  }, [startGame])

  const handleTypingComplete = useCallback(async () => {
    setFlowState("results")

    if (user && stats) {
      const supabase = createClient()
      const newTotalRaces = stats.total_races + 1
      const newAvgWpm = Math.round(
        (stats.avg_wpm * stats.total_races + wpm) / newTotalRaces
      )
      const newBestWpm = Math.max(stats.best_wpm, wpm)
      const newAccuracy = Math.round(
        (stats.accuracy * stats.total_races + accuracy) / newTotalRaces
      )

      const { data, error } = await supabase
        .from("stats")
        .update({
          avg_wpm: newAvgWpm,
          best_wpm: newBestWpm,
          total_races: newTotalRaces,
          accuracy: newAccuracy,
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (!error && data) {
        setStats(data as Stats)
      }
    }
  }, [user, stats, wpm, accuracy, setStats])

  const handleTryAgain = useCallback(() => {
    reset()
    setText(generateTextForDuration(selectedDuration, selectedDifficulty))
    setFlowState("countdown")
  }, [reset, setText, selectedDuration, selectedDifficulty])

  const handleChangeSettings = useCallback(() => {
    reset()
    setFlowState("selection")
  }, [reset])

  const text = useGameStore((state) => state.text)
  const timeUsed = duration - timeLeft

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center text-[#888] hover:text-white transition-colors text-sm"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {flowState === "selection" && (
            <SelectionScreen 
              key="selection"
              onStart={handleStartSelection} 
            />
          )}

          {flowState === "countdown" && (
            <CountdownScreen
              key="countdown"
              previewText={text}
              onComplete={handleCountdownComplete}
            />
          )}

          {flowState === "typing" && (
            <TypingScreen 
              key="typing"
              onComplete={handleTypingComplete} 
            />
          )}

          {flowState === "results" && (
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
  )
}
