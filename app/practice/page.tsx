"use client"

import { useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { TypingTest } from "@/components/typing/TypingTest"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"
import type { Stats } from "@/lib/supabase/database.types"

export default function PracticePage() {
  const { user, stats, setStats } = useUserStore()

  const handleComplete = useCallback(
    async (results: {
      wpm: number
      accuracy: number
      mistakes: number
      duration: number
    }) => {
      if (!user || !stats) return

      const supabase = createClient()

      const newTotalRaces = stats.total_races + 1
      const newAvgWpm = Math.round(
        (stats.avg_wpm * stats.total_races + results.wpm) / newTotalRaces
      )
      const newBestWpm = Math.max(stats.best_wpm, results.wpm)
      const newAccuracy = Math.round(
        (stats.accuracy * stats.total_races + results.accuracy) / newTotalRaces
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
    },
    [user, stats, setStats]
  )

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
          >
            <svg
              className="w-5 h-5 mr-2"
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

          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Solo Practice
          </h1>
          <p className="text-zinc-500 mt-2">
            Improve your typing speed and accuracy
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TypingTest onComplete={handleComplete} />
        </motion.div>

        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
          >
            <h2 className="text-xl font-semibold text-zinc-300 mb-4">
              Your Stats
            </h2>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold text-cyan-400">
                  {stats.avg_wpm}
                </p>
                <p className="text-zinc-500 text-sm">Avg WPM</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-400">
                  {stats.best_wpm}
                </p>
                <p className="text-zinc-500 text-sm">Best WPM</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">
                  {stats.total_races}
                </p>
                <p className="text-zinc-500 text-sm">Tests Taken</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {stats.accuracy}%
                </p>
                <p className="text-zinc-500 text-sm">Avg Accuracy</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
