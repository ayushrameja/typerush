"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Difficulty, getDifficultyDescription } from "@/lib/utils/words"

interface SelectionScreenProps {
  onStart: (duration: number, difficulty: Difficulty) => void
}

const STORAGE_KEY = "typerush_preferences"

const durations = [15, 30, 60, 120] as const
const difficulties: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert']

export function SelectionScreen({ onStart }: SelectionScreenProps) {
  const [duration, setDuration] = useState<number>(60)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        if (prefs.duration) setDuration(prefs.duration)
        if (prefs.difficulty) setDifficulty(prefs.difficulty)
      } catch {
      }
    }
  }, [])

  const handleStart = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration, difficulty }))
    onStart(duration, difficulty)
  }

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
                  ${duration === d
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-[#888] border-[#333] hover:border-[#555] hover:text-white"
                  }
                `}
              >
                {d}s
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
                  ${difficulty === d
                    ? "bg-white/5 border-white/20"
                    : "bg-transparent border-[#333] hover:border-[#555]"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-medium capitalize ${difficulty === d ? "text-white" : "text-[#ededed]"}`}>
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

        <button
          onClick={handleStart}
          className="w-full py-4 bg-white text-black font-medium rounded-lg hover:bg-[#ededed] transition-colors mt-8"
        >
          Start Practice
        </button>
      </div>
    </motion.div>
  )
}
