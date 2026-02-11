"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

interface IdleOverlayProps {
  playerId: string
  playerToken?: string
  lobbyId?: string
  enabled: boolean
}

const IDLE_THRESHOLD_MS = 5 * 60 * 1000

export function IdleOverlay({ playerId, playerToken, lobbyId, enabled }: IdleOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const lastActivityRef = useRef(0)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enabledRef = useRef(enabled)

  const keepAlive = useMutation(api.presence.keepAlive)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const dismiss = useCallback(() => {
    lastActivityRef.current = Date.now()
    setIsVisible(false)

    const lobbyArg = lobbyId ? (lobbyId as Id<"lobbies">) : undefined
    keepAlive({
      playerId,
      playerToken,
      status: "in_lobby",
      currentLobbyId: lobbyArg,
    }).catch(() => {})
  }, [playerId, playerToken, lobbyId, keepAlive])

  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      queueMicrotask(() => setIsVisible(false))
      return
    }

    lastActivityRef.current = Date.now()

    const onActivity = () => {
      lastActivityRef.current = Date.now()
      setIsVisible(false)
    }

    document.addEventListener("mousemove", onActivity)
    document.addEventListener("keydown", onActivity)
    document.addEventListener("touchstart", onActivity)

    checkIntervalRef.current = setInterval(() => {
      if (!enabledRef.current) return
      const idle = Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS
      if (idle) setIsVisible(true)
    }, 10_000)

    return () => {
      document.removeEventListener("mousemove", onActivity)
      document.removeEventListener("keydown", onActivity)
      document.removeEventListener("touchstart", onActivity)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }, [enabled])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-[#0d1118]/85 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/14 bg-white/5">
              <span className="text-4xl">💤</span>
            </div>
            <p className="arena-heading text-5xl leading-none text-white mb-2">You&apos;re idle</p>
            <p className="text-white/58 mb-8 max-w-sm mx-auto">
              You&apos;ll be removed from the lobby in 5 minutes if inactive.
            </p>
            <button
              onClick={dismiss}
              className="arena-button px-8 py-3 font-semibold"
            >
              I&apos;m here!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
