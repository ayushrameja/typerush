"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"
import type { Match, Profile } from "@/lib/supabase/database.types"

interface MatchWithDetails extends Match {
  opponent_name: string
  won: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, stats, setProfile, isLoading } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [recentMatches, setRecentMatches] = useState<MatchWithDetails[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return

    const fetchMatches = async () => {
      const supabase = createClient()

      const { data } = await supabase
        .from("matches")
        .select("*")
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(10)

      const matchesData = data as Match[] | null

      if (matchesData) {
        const matchesWithDetails = await Promise.all(
          matchesData.map(async (match) => {
            const opponentId =
              match.player1_id === user.id
                ? match.player2_id
                : match.player1_id

            const { data: opponentProfileData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", opponentId)
              .single()

            const opponentProfile = opponentProfileData as Pick<Profile, "username"> | null

            return {
              ...match,
              opponent_name: opponentProfile?.username || "Unknown",
              won: match.winner_id === user.id,
            }
          })
        )

        setRecentMatches(matchesWithDetails)
      }
    }

    fetchMatches()
  }, [user])

  const handleSaveUsername = async () => {
    if (!user || !username.trim()) return

    setIsSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data as Profile)
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || !stats) {
    return null
  }

  const winRate =
    stats.total_races > 0
      ? Math.round((stats.wins / stats.total_races) * 100)
      : 0

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
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1"
          >
            <Card glow className="p-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white mb-4">
                  {profile.username[0].toUpperCase()}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-center"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveUsername}
                        isLoading={isSaving}
                        size="sm"
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false)
                          setUsername(profile.username)
                        }}
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-zinc-100 mb-1">
                      {profile.username}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Edit username
                    </button>
                  </>
                )}

                <p className="text-xs text-zinc-600 mt-4">
                  Member since{" "}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-6">
                Statistics
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {stats.avg_wpm}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">Avg WPM</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    {stats.best_wpm}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">Best WPM</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {stats.total_races}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">Total Races</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {winRate}%
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">Win Rate</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-500">Wins</span>
                  <span className="text-emerald-400">{stats.wins}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-500">Losses</span>
                  <span className="text-red-400">
                    {stats.total_races - stats.wins}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Avg Accuracy</span>
                  <span className="text-blue-400">{stats.accuracy}%</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-zinc-200 mb-6">
              Recent Matches
            </h2>

            {recentMatches.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">
                No matches yet. Start racing to see your history!
              </p>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`
                      flex items-center justify-between p-4 rounded-xl
                      ${
                        match.won
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${
                          match.won
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      `}
                      >
                        {match.won ? "WIN" : "LOSS"}
                      </span>
                      <span className="text-zinc-300">
                        vs {match.opponent_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-cyan-400 font-medium">
                        {match.player1_id === user?.id
                          ? match.player1_wpm
                          : match.player2_wpm}{" "}
                        WPM
                      </span>
                      <span className="text-zinc-500 text-sm">
                        {new Date(match.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
