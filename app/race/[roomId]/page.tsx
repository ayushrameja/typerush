"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useUserStore } from "@/lib/stores/userStore"
import { RaceScene } from "@/components/race/RaceScene"
import { RaceUI } from "@/components/race/RaceUI"
import { calculateProgress } from "@/lib/utils/calculateStats"

const defaultPlayerProgress = {
  userId: "",
  username: "",
  progress: 0,
  wpm: 0,
  mistakes: 0,
  finished: false,
}

export default function RaceRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const lobbyId = roomId as Id<"lobbies">

  const { user, isLoading } = useUserStore()

  const lobby = useQuery(api.lobbies.getLobby, roomId ? { lobbyId } : "skip")

  const startRace = useMutation(api.lobbies.startRace)
  const setCountdownRemote = useMutation(api.lobbies.setCountdown)
  const setTimeLeftRemote = useMutation(api.lobbies.setTimeLeft)
  const updatePlayerProgressRemote = useMutation(api.lobbies.updatePlayerProgress)
  const finishRace = useMutation(api.lobbies.finishRace)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [isMistake, setIsMistake] = useState(false)

  const startTimeRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<number | null>(null)

  const clearRaceIntervals = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  useEffect(() => {
    return () => {
      clearRaceIntervals()
    }
  }, [clearRaceIntervals])

  const status = lobby?.status ?? "waiting"
  const countdown = lobby?.countdown ?? 3
  const timeLeft = lobby?.timeLeft ?? 60
  const textToType = lobby?.textToType ?? ""
  const isHost = !!user && !!lobby && lobby.hostId === user.id

  const hostProgress = lobby?.hostProgress ?? {
    ...defaultPlayerProgress,
    username: "Player 1",
  }

  const guestProgress = lobby?.guestProgress

  useEffect(() => {
    if (status === "racing") {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }
      inputRef.current?.focus()
    }

    if (status === "finished") {
      clearRaceIntervals()
    }
  }, [status, clearRaceIntervals])

  const startGame = useCallback(async () => {
    if (!isHost || !user || !lobby) {
      return
    }

    clearRaceIntervals()
    setCurrentIndex(0)
    setMistakes(0)
    setCorrectChars(0)
    setStreak(0)
    setWpm(0)
    setIsMistake(false)
    startTimeRef.current = null

    const startResult = await startRace({
      lobbyId: lobby._id,
      actorId: user.id,
    })

    if (!startResult.ok) {
      return
    }

    let count = 3
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1

      void setCountdownRemote({
        lobbyId: lobby._id,
        actorId: user.id,
        count,
      })

      if (count <= 0) {
        if (countdownIntervalRef.current !== null) {
          window.clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }

        let time = 60
        timerIntervalRef.current = window.setInterval(() => {
          time -= 1

          void setTimeLeftRemote({
            lobbyId: lobby._id,
            actorId: user.id,
            timeLeft: time,
          })

          if (time <= 0 && timerIntervalRef.current !== null) {
            window.clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
        }, 1000)
      }
    }, 1000)
  }, [clearRaceIntervals, isHost, lobby, setCountdownRemote, setTimeLeftRemote, startRace, user])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!user || !lobby || status !== "racing") {
        return
      }

      if (e.key.length !== 1) {
        return
      }

      const expectedChar = textToType[currentIndex]
      if (!expectedChar) {
        return
      }

      const isCorrect = e.key === expectedChar

      if (!isCorrect) {
        setMistakes((prev) => prev + 1)
        setStreak(0)
        setIsMistake(true)
        setTimeout(() => setIsMistake(false), 200)
        return
      }

      const newCorrectChars = correctChars + 1
      const newIndex = currentIndex + 1
      const newStreak = streak + 1
      const elapsedMinutes = (Date.now() - (startTimeRef.current ?? Date.now())) / 60000
      const wordsTyped = newCorrectChars / 5
      const newWpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0
      const progress = calculateProgress(newIndex, textToType.length)
      const finished = newIndex >= textToType.length

      setCorrectChars(newCorrectChars)
      setCurrentIndex(newIndex)
      setStreak(newStreak)
      setIsMistake(false)
      setWpm(newWpm)

      void updatePlayerProgressRemote({
        lobbyId: lobby._id,
        playerId: user.id,
        progress,
        wpm: newWpm,
        mistakes,
        finished,
      })

      if (finished) {
        clearRaceIntervals()
        void finishRace({
          lobbyId: lobby._id,
          actorId: user.id,
        })
      }
    },
    [
      clearRaceIntervals,
      correctChars,
      currentIndex,
      finishRace,
      lobby,
      mistakes,
      status,
      streak,
      textToType,
      updatePlayerProgressRemote,
      user,
    ]
  )

  const getWinner = () => {
    if (hostProgress.progress >= 100) return hostProgress.username
    if (guestProgress?.progress && guestProgress.progress >= 100) {
      return guestProgress.username
    }
    if (hostProgress.wpm > (guestProgress?.wpm ?? 0)) return hostProgress.username
    if ((guestProgress?.wpm ?? 0) > hostProgress.wpm) return guestProgress?.username
    return hostProgress.username
  }

  const handleRestart = () => {
    clearRaceIntervals()
    router.push("/race")
  }

  if (lobby === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (lobby === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-300 mb-2">Room not found</p>
          <p className="text-zinc-500 mb-6">This race room does not exist anymore.</p>
          <button
            onClick={() => router.push("/race")}
            className="px-6 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950">
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-zinc-800">
          <p className="text-xs text-zinc-500">Room Code</p>
          <p className="text-xl font-bold text-cyan-400 tracking-wider">{lobby.roomCode}</p>
        </div>
      </div>

      {status === "waiting" && isHost && lobby.guestId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <button
            onClick={startGame}
            className="px-12 py-4 text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
          >
            Start Race
          </button>
        </motion.div>
      )}

      <div className="h-[60vh] w-full">
        <RaceScene
          player1={{
            id: hostProgress.userId,
            username: hostProgress.username || "Player 1",
            progress: hostProgress.progress,
            wpm: hostProgress.wpm,
            streak: isHost ? streak : 0,
            isMistake: isHost ? isMistake : false,
          }}
          player2={
            guestProgress?.userId
              ? {
                  id: guestProgress.userId,
                  username: guestProgress.username || "Player 2",
                  progress: guestProgress.progress,
                  wpm: guestProgress.wpm,
                  streak: !isHost ? streak : 0,
                  isMistake: !isHost ? isMistake : false,
                }
              : undefined
          }
          gameSpeed={status === "racing" ? 1 + wpm / 100 : 0.2}
        />

        <RaceUI
          status={status}
          countdown={countdown}
          timeLeft={timeLeft}
          player1={{
            username: hostProgress.username || "Player 1",
            progress: hostProgress.progress,
            wpm: hostProgress.wpm,
          }}
          player2={
            guestProgress?.userId
              ? {
                  username: guestProgress.username || "Player 2",
                  progress: guestProgress.progress,
                  wpm: guestProgress.wpm,
                }
              : undefined
          }
          winner={status === "finished" ? getWinner() : undefined}
          onRestart={handleRestart}
        />
      </div>

      {(status === "racing" || status === "countdown") && (
        <div className="h-[40vh] w-full p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex-1 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
              <div className="text-xl leading-relaxed font-mono tracking-wide">
                {textToType.split("").map((char, index) => (
                  <span
                    key={index}
                    className={`
                      ${index < currentIndex ? "text-cyan-400" : ""}
                      ${index === currentIndex ? "text-white bg-cyan-500/30" : ""}
                      ${index > currentIndex ? "text-zinc-600" : ""}
                    `}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </div>
            </div>

            <input
              ref={inputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none"
              onKeyDown={handleKeyDown}
              autoFocus={status === "racing"}
            />

            {status === "racing" && (
              <p className="text-center text-zinc-500 text-sm mt-4">Start typing to race!</p>
            )}
          </div>
        </div>
      )}

      {status === "waiting" && !lobby.guestId && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6"
            />
            <p className="text-2xl font-bold text-zinc-300 mb-2">Waiting for opponent...</p>
            <p className="text-zinc-500">
              Share the room code: <span className="text-cyan-400 font-bold">{lobby.roomCode}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
