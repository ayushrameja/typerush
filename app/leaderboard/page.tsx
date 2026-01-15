"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { GridBackground } from "@/components/home/GridBackground"
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
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>("best_wpm")

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: statsData, error: statsError } = await supabase
        .from("stats")
        .select("*")
        .order(sortBy, { ascending: false })
        .limit(100)

      if (statsError) {
        throw statsError
      }

      const stats = statsData as Stats[] | null

      if (!stats || stats.length === 0) {
        setEntries([])
        return
      }

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
    } catch (fetchError) {
      setError("Unable to load leaderboard right now.")
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [sortBy])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

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
    <div className="relative min-h-screen px-4 pt-28 pb-20">
      <GridBackground />
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            Global rankings
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Leaderboards
          </h1>
          <p className="text-white/60 mt-2">Top typists from around the world</p>
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
          <div className="glass-panel rounded-[32px] overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-white/5 animate-pulse">
                <div className="grid grid-cols-12 gap-4 px-8 py-4 text-xs text-white/40 uppercase tracking-wider bg-white/5">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-right">Best</div>
                  <div className="col-span-2 text-right">Avg</div>
                  <div className="col-span-1 text-right">Wins</div>
                  <div className="col-span-2 text-right">Races</div>
                </div>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 px-8 py-4 items-center"
                  >
                    <div className="col-span-1">
                      <div className="h-8 w-8 rounded-full bg-white/10" />
                    </div>
                    <div className="col-span-4">
                      <div className="h-4 w-32 rounded-full bg-white/10" />
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="h-4 w-12 rounded-full bg-white/10 ml-auto" />
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="h-4 w-12 rounded-full bg-white/10 ml-auto" />
                    </div>
                    <div className="col-span-1 text-right">
                      <div className="h-4 w-8 rounded-full bg-white/10 ml-auto" />
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="h-4 w-10 rounded-full bg-white/10 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-white/70">{error}</p>
                <button
                  onClick={fetchLeaderboard}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/60">
                  No entries yet. Be the first to race!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-12 gap-4 px-8 py-4 text-xs text-white/40 uppercase tracking-wider bg-white/5">
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
                      grid grid-cols-12 gap-4 px-8 py-4 items-center
                      ${
                        entry.user_id === user?.id
                          ? "bg-[#f5a524]/10 border-l-2 border-[#f5a524]"
                          : "hover:bg-white/5"
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
                        ${entry.user_id === user?.id ? "text-[#f5a524]" : "text-white/90"}
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
                      <span className="text-white font-mono font-medium">
                        {entry.best_wpm}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-white/70 font-mono">
                        {entry.avg_wpm}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-white/70 font-mono">
                        {entry.wins}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-white/60 font-mono">
                        {entry.total_races}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {entries.slice(0, 3).map((entry, index) => (
              <div
                key={entry.user_id}
                className="glass-panel rounded-[32px] p-6 text-center"
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
                <h3 className="font-bold text-white text-lg mb-1">
                  {entry.username}
                </h3>
                <p
                  className={`
                  text-3xl font-bold
                  ${index === 0 ? "text-[#f5a524]" : "text-white/70"}
                `}
                >
                  {entry.best_wpm}
                </p>
                <p className="text-xs text-white/50 mt-1">Best WPM</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
