"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"
import { useRaceStore } from "@/lib/stores/raceStore"
import { useRealtime } from "@/lib/hooks/useRealtime"
import { RaceScene } from "@/components/race/RaceScene"
import { RaceUI } from "@/components/race/RaceUI"
import { calculateProgress } from "@/lib/utils/calculateStats"
import type { Lobby, Profile } from "@/lib/supabase/database.types"

export default function RaceRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const { user, profile } = useUserStore()
  const {
    status,
    countdown,
    timeLeft,
    textToType,
    hostProgress,
    guestProgress,
    isHost,
    setLobbyId,
    setRoomCode,
    setTextToType,
    setStatus,
    setCountdown,
    setTimeLeft,
    setIsHost,
    updateHostProgress,
    updateGuestProgress,
    reset,
  } = useRaceStore()

  const {
    broadcastProgress,
    broadcastGameStart,
    broadcastCountdown,
    broadcastTimerTick,
    broadcastGameEnd,
  } = useRealtime(roomId)

  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [isMistake, setIsMistake] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const supabase = createClient()

    const fetchLobby = async () => {
      const { data } = await supabase
        .from("lobbies")
        .select("*")
        .eq("id", roomId)
        .single()

      const lobbyData = data as Lobby | null

      if (lobbyData) {
        setLobby(lobbyData)
        setLobbyId(lobbyData.id)
        setRoomCode(lobbyData.room_code)
        setTextToType(lobbyData.text_to_type)
        setIsHost(lobbyData.host_id === user.id)

        if (lobbyData.host_id === user.id) {
          updateHostProgress({
            id: user.id,
            username: profile?.username || "Player 1",
          })
        } else {
          updateGuestProgress({
            id: user.id,
            username: profile?.username || "Player 2",
          })
        }
      }
    }

    fetchLobby()

    const channel = supabase
      .channel(`lobby:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          const updatedLobby = payload.new as Lobby
          setLobby(updatedLobby)

          if (updatedLobby.guest_id && updatedLobby.host_id) {
            const { data: guestProfileData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", updatedLobby.guest_id)
              .single()

            const { data: hostProfileData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", updatedLobby.host_id)
              .single()

            const guestProfile = guestProfileData as Pick<Profile, "username"> | null
            const hostProfile = hostProfileData as Pick<Profile, "username"> | null

            updateHostProgress({
              id: updatedLobby.host_id,
              username: hostProfile?.username || "Player 1",
            })
            updateGuestProgress({
              id: updatedLobby.guest_id,
              username: guestProfile?.username || "Player 2",
            })

            if (status === "idle") {
              setStatus("waiting")
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user, router, profile])

  useEffect(() => {
    if (lobby?.guest_id && lobby?.host_id && status === "idle") {
      setStatus("waiting")
    }
  }, [lobby, status, setStatus])

  const startGame = useCallback(() => {
    if (!isHost) return

    setStatus("countdown")
    broadcastGameStart()

    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      setCountdown(count)
      broadcastCountdown(count)

      if (count === 0) {
        clearInterval(countdownInterval)
        setStatus("racing")
        startTimeRef.current = Date.now()
        inputRef.current?.focus()

        let time = 60
        const timerInterval = setInterval(() => {
          time--
          setTimeLeft(time)
          broadcastTimerTick(time)

          if (time <= 0) {
            clearInterval(timerInterval)
            setStatus("finished")
            broadcastGameEnd()
          }
        }, 1000)
      }
    }, 1000)
  }, [
    isHost,
    setStatus,
    setCountdown,
    setTimeLeft,
    broadcastGameStart,
    broadcastCountdown,
    broadcastTimerTick,
    broadcastGameEnd,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (status !== "racing") return

      if (e.key.length === 1) {
        const expectedChar = textToType[currentIndex]
        const isCorrect = e.key === expectedChar

        if (isCorrect) {
          const newCorrectChars = correctChars + 1
          const newIndex = currentIndex + 1
          const newStreak = streak + 1

          setCorrectChars(newCorrectChars)
          setCurrentIndex(newIndex)
          setStreak(newStreak)
          setIsMistake(false)

          const elapsedMinutes = (Date.now() - startTimeRef.current!) / 60000
          const wordsTyped = newCorrectChars / 5
          const newWpm =
            elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0
          setWpm(newWpm)

          const progress = calculateProgress(newIndex, textToType.length)
          const finished = newIndex >= textToType.length

          if (isHost) {
            updateHostProgress({
              progress,
              wpm: newWpm,
              mistakes,
              finished,
            })
          } else {
            updateGuestProgress({
              progress,
              wpm: newWpm,
              mistakes,
              finished,
            })
          }

          broadcastProgress(progress, newWpm, mistakes, finished)

          if (finished) {
            setStatus("finished")
            broadcastGameEnd()
          }
        } else {
          setMistakes((prev) => prev + 1)
          setStreak(0)
          setIsMistake(true)

          setTimeout(() => setIsMistake(false), 200)
        }
      }
    },
    [
      status,
      textToType,
      currentIndex,
      correctChars,
      streak,
      mistakes,
      isHost,
      updateHostProgress,
      updateGuestProgress,
      broadcastProgress,
      broadcastGameEnd,
      setStatus,
    ]
  )

  const getWinner = () => {
    if (hostProgress.progress >= 100) return hostProgress.username
    if (guestProgress.progress >= 100) return guestProgress.username
    if (hostProgress.wpm > guestProgress.wpm) return hostProgress.username
    if (guestProgress.wpm > hostProgress.wpm) return guestProgress.username
    return hostProgress.username
  }

  const handleRestart = () => {
    router.push("/race")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950">
      <div className="absolute top-4 left-4 z-50">
        {lobby?.room_code && (
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-zinc-800">
            <p className="text-xs text-zinc-500">Room Code</p>
            <p className="text-xl font-bold text-cyan-400 tracking-wider">
              {lobby.room_code}
            </p>
          </div>
        )}
      </div>

      {status === "waiting" && isHost && lobby?.guest_id && (
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
            id: hostProgress.id,
            username: hostProgress.username || "Player 1",
            progress: hostProgress.progress,
            wpm: hostProgress.wpm,
            streak: isHost ? streak : 0,
            isMistake: isHost ? isMistake : false,
          }}
          player2={
            guestProgress.id
              ? {
                  id: guestProgress.id,
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
          status={
            status === "idle"
              ? "waiting"
              : (status as "waiting" | "countdown" | "racing" | "finished")
          }
          countdown={countdown}
          timeLeft={timeLeft}
          player1={{
            username: hostProgress.username || "Player 1",
            progress: hostProgress.progress,
            wpm: hostProgress.wpm,
          }}
          player2={
            guestProgress.id
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
              <p className="text-center text-zinc-500 text-sm mt-4">
                Start typing to race!
              </p>
            )}
          </div>
        </div>
      )}

      {status === "idle" && !lobby?.guest_id && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6"
            />
            <p className="text-2xl font-bold text-zinc-300 mb-2">
              Waiting for opponent...
            </p>
            <p className="text-zinc-500">
              Share the room code:{" "}
              <span className="text-cyan-400 font-bold">
                {lobby?.room_code}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
