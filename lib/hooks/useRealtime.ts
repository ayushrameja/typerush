"use client"

import { useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRaceStore } from "@/lib/stores/raceStore"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface PlayerUpdate {
  player_id: string
  progress: number
  wpm: number
  mistakes: number
  finished: boolean
}

export function useRealtime(lobbyId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const {
    isHost,
    updateHostProgress,
    updateGuestProgress,
    setStatus,
    setCountdown,
    setTimeLeft,
  } = useRaceStore()

  const supabase = createClient()

  useEffect(() => {
    if (!lobbyId) return

    const channel = supabase.channel(`race:${lobbyId}`, {
      config: {
        broadcast: { self: false },
      },
    })

    channel
      .on("broadcast", { event: "player_update" }, ({ payload }) => {
        const update = payload as PlayerUpdate & { is_host: boolean }
        if (update.is_host) {
          updateHostProgress({
            progress: update.progress,
            wpm: update.wpm,
            mistakes: update.mistakes,
            finished: update.finished,
          })
        } else {
          updateGuestProgress({
            progress: update.progress,
            wpm: update.wpm,
            mistakes: update.mistakes,
            finished: update.finished,
          })
        }
      })
      .on("broadcast", { event: "game_start" }, ({ payload }) => {
        setStatus("countdown")
        if (payload.countdown !== undefined) {
          setCountdown(payload.countdown)
        }
      })
      .on("broadcast", { event: "countdown" }, ({ payload }) => {
        setCountdown(payload.count)
        if (payload.count === 0) {
          setStatus("racing")
        }
      })
      .on("broadcast", { event: "timer_tick" }, ({ payload }) => {
        setTimeLeft(payload.timeLeft)
        if (payload.timeLeft <= 0) {
          setStatus("finished")
        }
      })
      .on("broadcast", { event: "game_end" }, () => {
        setStatus("finished")
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [
    lobbyId,
    supabase,
    isHost,
    updateHostProgress,
    updateGuestProgress,
    setStatus,
    setCountdown,
    setTimeLeft,
  ])

  const broadcastProgress = useCallback(
    (progress: number, wpm: number, mistakes: number, finished: boolean) => {
      if (!channelRef.current) return

      channelRef.current.send({
        type: "broadcast",
        event: "player_update",
        payload: {
          is_host: isHost,
          progress,
          wpm,
          mistakes,
          finished,
        },
      })
    },
    [isHost]
  )

  const broadcastGameStart = useCallback(() => {
    if (!channelRef.current || !isHost) return

    channelRef.current.send({
      type: "broadcast",
      event: "game_start",
      payload: { countdown: 3 },
    })
  }, [isHost])

  const broadcastCountdown = useCallback(
    (count: number) => {
      if (!channelRef.current || !isHost) return

      channelRef.current.send({
        type: "broadcast",
        event: "countdown",
        payload: { count },
      })
    },
    [isHost]
  )

  const broadcastTimerTick = useCallback(
    (timeLeft: number) => {
      if (!channelRef.current || !isHost) return

      channelRef.current.send({
        type: "broadcast",
        event: "timer_tick",
        payload: { timeLeft },
      })
    },
    [isHost]
  )

  const broadcastGameEnd = useCallback(() => {
    if (!channelRef.current) return

    channelRef.current.send({
      type: "broadcast",
      event: "game_end",
      payload: {},
    })
  }, [])

  return {
    broadcastProgress,
    broadcastGameStart,
    broadcastCountdown,
    broadcastTimerTick,
    broadcastGameEnd,
  }
}
