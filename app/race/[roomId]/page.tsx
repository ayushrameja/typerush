"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useIdentityStore } from "@/lib/stores/identityStore"
import { useHeartbeat } from "@/lib/hooks/useHeartbeat"
import { useLocalHistory } from "@/lib/hooks/useLocalHistory"
import { IdleOverlay } from "@/components/race/IdleOverlay"
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

  const { identity, isReady, setCurrentLobbyId } = useIdentityStore()

  useEffect(() => {
    setCurrentLobbyId(roomId)
    return () => setCurrentLobbyId(null)
  }, [roomId, setCurrentLobbyId])

  const lobby = useQuery(api.lobbies.getLobby, roomId ? { lobbyId } : "skip")

  const startRace = useMutation(api.lobbies.startRace)
  const setCountdownRemote = useMutation(api.lobbies.setCountdown)
  const setTimeLeftRemote = useMutation(api.lobbies.setTimeLeft)
  const updatePlayerProgressRemote = useMutation(api.lobbies.updatePlayerProgress)
  const finishRace = useMutation(api.lobbies.finishRace)
  const saveRaceResultMutation = useMutation(api.raceHistory.saveRaceResult)
  const { addRaceResult } = useLocalHistory()
  const hasSavedResultRef = useRef(false)

  const heartbeatStatus = useMemo(() => {
    if (lobby?.status === "racing") return "in_race" as const
    return "in_lobby" as const
  }, [lobby?.status])

  useHeartbeat({
    playerId: identity?.playerId ?? "",
    playerToken: identity?.token ?? undefined,
    username: identity?.displayName ?? "",
    enabled: isReady && !!identity,
    lobbyId: roomId,
    status: heartbeatStatus,
  })

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
    return () => {
      clearRaceIntervals()
    }
  }, [clearRaceIntervals])

  const status = lobby?.status ?? "waiting"
  const countdown = lobby?.countdown ?? 3
  const timeLeft = lobby?.timeLeft ?? 60
  const textToType = lobby?.textToType ?? ""
  const isHost = !!identity && !!lobby && lobby.hostId === identity.playerId

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

  useEffect(() => {
    if (status !== "finished" || !lobby || !identity) return
    if (hasSavedResultRef.current) return
    hasSavedResultRef.current = true

    const isPlayerHost = lobby.hostId === identity.playerId
    const myProgress = isPlayerHost ? lobby.hostProgress : lobby.guestProgress
    const opponentProgress = isPlayerHost ? lobby.guestProgress : lobby.hostProgress
    const opponentId = isPlayerHost ? (lobby.guestId || "") : lobby.hostId
    const opponentDisconnected = isPlayerHost ? !!lobby.guestDisconnected : !!lobby.hostDisconnected

    const winner = getWinner()
    const didWin = winner === myProgress?.username

    if (identity.isAuthenticated) {
      void saveRaceResultMutation({
        lobbyId: lobby._id,
        playerId: identity.playerId,
        playerToken: undefined,
      })
    } else if (identity.token) {
      void saveRaceResultMutation({
        lobbyId: lobby._id,
        playerId: identity.playerId,
        playerToken: identity.token,
      })
    }

    const textLength = lobby.textToType.length
    const charsTyped = Math.round(((myProgress?.progress ?? 0) / 100) * textLength)
    const myMistakes = myProgress?.mistakes ?? 0
    const raceAccuracy = charsTyped > 0
      ? Math.round(Math.max(0, (1 - myMistakes / (charsTyped + myMistakes)) * 100) * 100) / 100
      : 0

    addRaceResult({
      opponentUsername: opponentProgress?.username || "Unknown",
      opponentId,
      wpm: myProgress?.wpm || 0,
      accuracy: raceAccuracy,
      won: didWin,
      completedAt: Date.now(),
      lobbyId: roomId,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const startGame = useCallback(async () => {
    if (!isHost || !identity || !lobby) {
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
    hasSavedResultRef.current = false

    const startResult = await startRace({
      lobbyId: lobby._id,
      actorId: identity.playerId,
      actorToken: identity.token ?? undefined,
    })

    if (!startResult.ok) {
      return
    }

    let count = 3
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1

      void setCountdownRemote({
        lobbyId: lobby._id,
        actorId: identity.playerId,
        actorToken: identity.token ?? undefined,
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
            actorId: identity.playerId,
            actorToken: identity.token ?? undefined,
            timeLeft: time,
          })

          if (time <= 0 && timerIntervalRef.current !== null) {
            window.clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
        }, 1000)
      }
    }, 1000)
  }, [clearRaceIntervals, isHost, lobby, setCountdownRemote, setTimeLeftRemote, startRace, identity])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!identity || !lobby || status !== "racing") {
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
        playerId: identity.playerId,
        playerToken: identity.token ?? undefined,
        progress,
        wpm: newWpm,
        mistakes,
        finished,
      })

      if (finished) {
        clearRaceIntervals()
        void finishRace({
          lobbyId: lobby._id,
          actorId: identity.playerId,
          actorToken: identity.token ?? undefined,
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
      identity,
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

  if (!isReady || lobby === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#090b0f]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#ff4655] border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (lobby === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#090b0f] px-4">
        <div className="text-center">
          <p className="arena-heading text-5xl leading-none text-white mb-2">Room not found</p>
          <p className="text-white/58 mb-6">This race room does not exist anymore.</p>
          <button
            onClick={() => router.push("/race")}
            className="arena-button px-6 py-3 font-semibold"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (lobby.hostDisconnected && !isHost) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#090b0f] px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#ff4655]/30 bg-[#ff4655]/10">
            <svg className="h-10 w-10 text-[#ff4655]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="arena-heading text-5xl leading-none text-white mb-2">Host disconnected</p>
          <p className="text-white/58 mb-6">Your opponent left the race.</p>
          <button onClick={() => router.push("/race")} className="arena-button px-8 py-3 font-semibold">
            Back to Lobby
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090b0f]">
      <IdleOverlay
        playerId={identity?.playerId ?? ""}
        playerToken={identity?.token ?? undefined}
        lobbyId={roomId}
        enabled={isReady && !!identity && (status === "waiting" || status === "countdown")}
      />

      <div className="absolute top-4 left-4 z-50">
        <div className="rounded-xl border border-white/14 bg-[#0f131b]/82 px-4 py-2 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.09em] text-white/46">Room Code</p>
          <p className="text-xl font-bold text-[#ff9da7] tracking-wider">{lobby.roomCode}</p>
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
            className="arena-button px-12 py-4 text-xl font-bold shadow-[0_20px_42px_-20px_rgba(255,70,85,0.95)]"
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
                  isAnonymous: guestProgress.isAnonymous,
                }
              : undefined
          }
          winner={status === "finished" ? getWinner() : undefined}
          onRestart={handleRestart}
          hostDisconnected={lobby.hostDisconnected}
          guestDisconnected={lobby.guestDisconnected}
          isPlayerAnonymous={!!identity && !identity.isAuthenticated}
        />
      </div>

      {(status === "racing" || status === "countdown") && (
        <div className="h-[40vh] w-full p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex-1 overflow-hidden rounded-2xl border border-white/14 bg-[#0f141d]/70 p-6 backdrop-blur-sm">
              <div className="text-xl leading-relaxed font-mono tracking-wide">
                {textToType.split("").map((char, index) => (
                  <span
                    key={index}
                    className={`
                      ${index < currentIndex ? "text-[#ff9ea8]" : ""}
                      ${index === currentIndex ? "text-white bg-[#ff4655]/32" : ""}
                      ${index > currentIndex ? "text-white/28" : ""}
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
              <p className="text-center text-white/50 text-sm mt-4">Start typing to race.</p>
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
              className="w-16 h-16 border-4 border-[#ff4655] border-t-transparent rounded-full mx-auto mb-6"
            />
            <p className="arena-heading text-5xl leading-none text-white mb-2">
              {lobby.guestDisconnected ? "Opponent left" : "Waiting for opponent..."}
            </p>
            <p className="text-white/58">
              {lobby.guestDisconnected
                ? "Waiting for a new player..."
                : <>Share the room code: <span className="font-bold text-[#ff9ea8]">{lobby.roomCode}</span></>
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
