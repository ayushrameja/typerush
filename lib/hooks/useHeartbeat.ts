"use client"

import { useEffect, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

type PresenceStatus = "online" | "idle" | "in_lobby" | "in_race"

interface UseHeartbeatOptions {
  playerId: string
  playerToken?: string
  username: string
  enabled: boolean
  lobbyId?: string
  status?: PresenceStatus
}

function getHeartbeatInterval(lastActivityMs: number): number {
  const idleTime = Date.now() - lastActivityMs
  if (idleTime < 30_000) return 10_000
  if (idleTime < 300_000) return 25_000
  return -1
}

export function useHeartbeat({
  playerId,
  playerToken,
  username,
  enabled,
  lobbyId,
  status = "online",
}: UseHeartbeatOptions) {
  const registerPresence = useMutation(api.presence.registerPresence)
  const keepAliveMutation = useMutation(api.presence.keepAlive)
  const removePresenceMutation = useMutation(api.presence.removePresence)

  const lastActivityRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isIdleRef = useRef(false)
  const registeredRef = useRef(false)
  const propsRef = useRef({ enabled, status, lobbyId, keepAliveMutation, playerId, playerToken })
  const scheduleRef = useRef<() => void>(() => {})

  useEffect(() => {
    propsRef.current = { enabled, status, lobbyId, keepAliveMutation, playerId, playerToken }
  }, [enabled, status, lobbyId, keepAliveMutation, playerId, playerToken])

  const sendKeepAlive = useCallback(() => {
    const {
      enabled: en,
      status: st,
      lobbyId: lid,
      keepAliveMutation: ka,
      playerId: pid,
      playerToken: ptoken,
    } = propsRef.current
    if (!en) return

    const interval = getHeartbeatInterval(lastActivityRef.current)
    if (interval === -1) {
      isIdleRef.current = true
      return
    }

    const lobbyArg = lid ? (lid as Id<"lobbies">) : undefined

    ka({
      playerId: pid,
      playerToken: ptoken,
      status: st,
      currentLobbyId: lobbyArg,
    }).catch(() => {
      setTimeout(() => {
        const {
          enabled: retryEnabled,
          status: retryStatus,
          lobbyId: retryLobbyId,
          keepAliveMutation: retryKeepAliveMutation,
          playerId: retryPlayerId,
          playerToken: retryPlayerToken,
        } = propsRef.current
        if (!retryEnabled) return

        const retryLobbyArg = retryLobbyId ? (retryLobbyId as Id<"lobbies">) : undefined

        retryKeepAliveMutation({
          playerId: retryPlayerId,
          playerToken: retryPlayerToken,
          status: retryStatus,
          currentLobbyId: retryLobbyArg,
        }).catch(() => {})
      }, 5000)
    })
  }, [])

  useEffect(() => {
    scheduleRef.current = () => {
      if (intervalRef.current !== null) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }

      if (!propsRef.current.enabled) return

      const interval = getHeartbeatInterval(lastActivityRef.current)
      if (interval === -1) {
        isIdleRef.current = true
        return
      }

      intervalRef.current = setTimeout(() => {
        sendKeepAlive()
        scheduleRef.current()
      }, interval)
    }
  }, [sendKeepAlive])

  useEffect(() => {
    if (!enabled || !playerId) {
      if (registeredRef.current) {
        removePresenceMutation({ playerId, playerToken }).catch(() => {})
        registeredRef.current = false
      }
      return
    }

    lastActivityRef.current = Date.now()

    registerPresence({ playerId, playerToken, username })
      .then(() => {
        registeredRef.current = true
        scheduleRef.current()
      })
      .catch(() => {})

    const resetActivity = () => {
      const wasIdle = isIdleRef.current
      lastActivityRef.current = Date.now()
      isIdleRef.current = false
      if (wasIdle) {
        sendKeepAlive()
        scheduleRef.current()
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current !== null) {
          clearTimeout(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        lastActivityRef.current = Date.now()
        isIdleRef.current = false
        sendKeepAlive()
        scheduleRef.current()
      }
    }

    document.addEventListener("mousemove", resetActivity)
    document.addEventListener("keydown", resetActivity)
    document.addEventListener("touchstart", resetActivity)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      if (intervalRef.current !== null) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }

      document.removeEventListener("mousemove", resetActivity)
      document.removeEventListener("keydown", resetActivity)
      document.removeEventListener("touchstart", resetActivity)
      document.removeEventListener("visibilitychange", onVisibilityChange)

      if (registeredRef.current) {
        removePresenceMutation({ playerId, playerToken }).catch(() => {})
        registeredRef.current = false
      }
    }
  }, [enabled, playerId, playerToken, username, registerPresence, removePresenceMutation, sendKeepAlive])

  useEffect(() => {
    if (!enabled || !registeredRef.current) return

    const lobbyArg = lobbyId ? (lobbyId as Id<"lobbies">) : undefined

    keepAliveMutation({
      playerId,
      playerToken,
      status,
      currentLobbyId: lobbyArg,
    }).catch(() => {})
  }, [status, lobbyId, enabled, playerId, playerToken, keepAliveMutation])
}
