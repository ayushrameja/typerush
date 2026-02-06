"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { useUserStore } from "@/lib/stores/userStore"
import { generateTextForDuration } from "@/lib/utils/words"

export default function RaceLobbyPage() {
  const router = useRouter()
  const { user, profile } = useUserStore()
  const [joinCode, setJoinCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [error, setError] = useState("")

  const createLobby = useMutation(api.lobbies.createLobby)
  const joinLobbyByCode = useMutation(api.lobbies.joinLobbyByCode)
  const findOrCreateMatch = useMutation(api.lobbies.findOrCreateMatch)

  const getUsername = () => profile?.username || "Player"

  const handleCreateRoom = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const textToType = generateTextForDuration(60)
      const result = await createLobby({
        hostId: user.id,
        username: getUsername(),
        textToType,
      })

      router.push(`/race/${result.lobbyId}?host=true`)
    } catch (createError) {
      console.error(createError)
      setError("Failed to create room. Please try again.")
    } finally {
      setIsCreating(false)
    }
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

    try {
      const result = await joinLobbyByCode({
        userId: user.id,
        username: getUsername(),
        roomCode: joinCode,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.push(`/race/${result.lobbyId}`)
    } catch (joinError) {
      console.error(joinError)
      setError("Failed to join room")
    } finally {
      setIsJoining(false)
    }
  }

  const handleFindMatch = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsFindingMatch(true)
    setError("")

    try {
      const textToType = generateTextForDuration(60)
      const result = await findOrCreateMatch({
        userId: user.id,
        username: getUsername(),
        textToType,
      })

      if (result.role === "host") {
        router.push(`/race/${result.lobbyId}?host=true&matchmaking=true`)
      } else {
        router.push(`/race/${result.lobbyId}`)
      }
    } catch (matchError) {
      console.error(matchError)
      setError("Failed to find match. Please try again.")
    } finally {
      setIsFindingMatch(false)
    }
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
