"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"
import { generateRoomCode } from "@/lib/utils/calculateStats"
import { generateTextForDuration } from "@/lib/utils/words"
import type { Lobby } from "@/lib/supabase/database.types"

export default function RaceLobbyPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [joinCode, setJoinCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [error, setError] = useState("")

  const handleCreateRoom = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsCreating(true)
    setError("")

    const supabase = createClient()
    const roomCode = generateRoomCode()
    const textToType = generateTextForDuration(60)

    const { data, error: createError } = await supabase
      .from("lobbies")
      .insert({
        host_id: user.id,
        room_code: roomCode,
        text_to_type: textToType,
        status: "waiting" as const,
      })
      .select()
      .single()

    if (createError || !data) {
      setError("Failed to create room. Please try again.")
      setIsCreating(false)
      return
    }

    router.push(`/race/${(data as Lobby).id}?host=true`)
  }

  const handleJoinRoom = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!joinCode.trim()) {
      setError("Please enter a room code")
      return
    }

    setIsJoining(true)
    setError("")

    const supabase = createClient()

    const { data: lobbyData, error: findError } = await supabase
      .from("lobbies")
      .select("*")
      .eq("room_code", joinCode.toUpperCase())
      .eq("status", "waiting")
      .single()

    const lobby = lobbyData as Lobby | null

    if (findError || !lobby) {
      setError("Room not found or already started")
      setIsJoining(false)
      return
    }

    const { error: joinError } = await supabase
      .from("lobbies")
      .update({ guest_id: user.id })
      .eq("id", lobby.id)

    if (joinError) {
      setError("Failed to join room")
      setIsJoining(false)
      return
    }

    router.push(`/race/${lobby.id}`)
  }

  const handleFindMatch = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsFindingMatch(true)
    setError("")

    const supabase = createClient()

    const { data: existingLobbiesData } = await supabase
      .from("lobbies")
      .select("*")
      .eq("status", "waiting")
      .is("guest_id", null)
      .neq("host_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)

    const existingLobbies = existingLobbiesData as Lobby[] | null

    if (existingLobbies && existingLobbies.length > 0) {
      const lobby = existingLobbies[0]

      const { error: joinError } = await supabase
        .from("lobbies")
        .update({ guest_id: user.id })
        .eq("id", lobby.id)

      if (!joinError) {
        router.push(`/race/${lobby.id}`)
        return
      }
    }

    const roomCode = generateRoomCode()
    const textToType = generateTextForDuration(60)

    const { data: newLobbyData, error: createError } = await supabase
      .from("lobbies")
      .insert({
        host_id: user.id,
        room_code: roomCode,
        text_to_type: textToType,
        status: "waiting" as const,
      })
      .select()
      .single()

    const newLobby = newLobbyData as Lobby | null

    if (createError || !newLobby) {
      setError("Failed to find match. Please try again.")
      setIsFindingMatch(false)
      return
    }

    router.push(`/race/${newLobby.id}?host=true&matchmaking=true`)
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
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

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            1v1 Race
          </h1>
          <p className="text-zinc-500 mt-2">
            Challenge a friend or find a random opponent
          </p>
        </motion.div>

        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
          >
            <p className="text-yellow-400 text-sm">
              You need to{" "}
              <Link href="/login" className="underline hover:no-underline">
                sign in
              </Link>{" "}
              to play multiplayer races.
            </p>
          </motion.div>
        )}

        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-4">
                Quick Match
              </h2>
              <p className="text-zinc-500 mb-4">
                Find a random opponent to race against
              </p>
              <Button
                onClick={handleFindMatch}
                isLoading={isFindingMatch}
                disabled={!user}
                className="w-full"
                size="lg"
              >
                Find Opponent
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-4">
                Create Room
              </h2>
              <p className="text-zinc-500 mb-4">
                Create a private room and share the code with a friend
              </p>
              <Button
                onClick={handleCreateRoom}
                isLoading={isCreating}
                disabled={!user}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Create Private Room
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-4">
                Join Room
              </h2>
              <p className="text-zinc-500 mb-4">
                Enter a room code to join a friend&apos;s game
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 uppercase"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  isLoading={isJoining}
                  disabled={!user || !joinCode.trim()}
                  variant="secondary"
                >
                  Join
                </Button>
              </div>
            </Card>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}
