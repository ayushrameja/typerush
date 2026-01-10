"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"
import type { Stats, Profile } from "@/lib/supabase/database.types"

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  best_wpm: number
  avg_wpm: number
  total_races: number
  wins: number
  accuracy: number
}

type SortBy = "best_wpm" | "avg_wpm" | "wins" | "total_races"

export default function LeaderboardPage() {
  const { user } = useUserStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>("best_wpm")

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const { data: statsData } = await supabase
        .from("stats")
        .select("*")
        .order(sortBy, { ascending: false })
        .limit(100)

      const stats = statsData as Stats[] | null

      if (stats) {
        const entriesWithProfiles = await Promise.all(
          stats.map(async (stat, index) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", stat.user_id)
              .single()

            const profile = profileData as Pick<Profile, "username"> | null

            return {
              rank: index + 1,
              user_id: stat.user_id,
              username: profile?.username || "Unknown",
              best_wpm: stat.best_wpm,
              avg_wpm: stat.avg_wpm,
              total_races: stat.total_races,
              wins: stat.wins,
              accuracy: stat.accuracy,
            }
          })
        )

        setEntries(entriesWithProfiles)
      }

      setIsLoading(false)
    }

    fetchLeaderboard()
  }, [sortBy])

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: "best_wpm", label: "Best WPM" },
    { value: "avg_wpm", label: "Avg WPM" },
    { value: "wins", label: "Wins" },
    { value: "total_races", label: "Races" },
  ]

  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-r from-yellow-500 to-amber-500 text-black"
    if (rank === 2)
      return "bg-gradient-to-r from-zinc-300 to-zinc-400 text-black"
    if (rank === 3)
      return "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
    return "bg-zinc-800 text-zinc-400"
  }

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

          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Leaderboards
          </h1>
          <p className="text-zinc-500 mt-2">Top typists from around the world</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    sortBy === option.value
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500">
                  No entries yet. Be the first to race!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-900/50 text-xs text-zinc-500 uppercase tracking-wider">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-right">Best</div>
                  <div className="col-span-2 text-right">Avg</div>
                  <div className="col-span-1 text-right">Wins</div>
                  <div className="col-span-2 text-right">Races</div>
                </div>

                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      grid grid-cols-12 gap-4 px-6 py-4 items-center
                      ${
                        entry.user_id === user?.id
                          ? "bg-cyan-500/10 border-l-2 border-cyan-500"
                          : "hover:bg-zinc-800/50"
                      }
                      transition-colors
                    `}
                  >
                    <div className="col-span-1">
                      <span
                        className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                        ${getRankStyle(entry.rank)}
                      `}
                      >
                        {entry.rank}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <span
                        className={`
                        font-medium
                        ${entry.user_id === user?.id ? "text-cyan-400" : "text-zinc-200"}
                      `}
                      >
                        {entry.username}
                        {entry.user_id === user?.id && (
                          <span className="ml-2 text-xs text-cyan-500">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-emerald-400 font-mono font-medium">
                        {entry.best_wpm}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-blue-400 font-mono">
                        {entry.avg_wpm}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-purple-400 font-mono">
                        {entry.wins}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-zinc-400 font-mono">
                        {entry.total_races}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-3 gap-6"
          >
            {entries.slice(0, 3).map((entry, index) => (
              <Card
                key={entry.user_id}
                glow={index === 0}
                className="p-6 text-center"
              >
                <div
                  className={`
                  text-4xl mb-4
                  ${index === 0 ? "text-yellow-400" : ""}
                  ${index === 1 ? "text-zinc-400" : ""}
                  ${index === 2 ? "text-amber-600" : ""}
                `}
                >
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                </div>
                <h3 className="font-bold text-zinc-100 text-lg mb-1">
                  {entry.username}
                </h3>
                <p
                  className={`
                  text-3xl font-bold
                  ${index === 0 ? "text-yellow-400" : "text-zinc-400"}
                `}
                >
                  {entry.best_wpm}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Best WPM</p>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
