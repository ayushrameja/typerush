"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/Card"
import { GridBackground } from "@/components/home/GridBackground"
import { LobbyLeaveWarning } from "@/components/auth/LobbyLeaveWarning"
import { useIdentityStore } from "@/lib/stores/identityStore"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()
  const { identity, currentLobbyId } = useIdentityStore()
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const removePresence = useMutation(api.presence.removePresence)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/")
    }
  }, [router, isAuthenticated])

  const handleSignIn = useCallback(() => {
    if (currentLobbyId) {
      setShowLeaveWarning(true)
      return
    }
    void signIn("google")
  }, [currentLobbyId, signIn])

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveWarning(false)
    if (identity) {
      removePresence({
        playerId: identity.playerId,
        playerToken: identity.token ?? undefined,
      }).catch(() => {})
    }
    void signIn("google")
  }, [identity, removePresence, signIn])

  return (
    <div className="arena-shell flex min-h-screen items-center justify-center px-4">
      <GridBackground />

      <LobbyLeaveWarning
        isOpen={showLeaveWarning}
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveWarning(false)}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card glow className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">🔐</div>
            <h1 className="arena-heading text-6xl leading-none text-white">Sign in</h1>
            <p className="mt-2 text-white/58">Use Google to continue</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSignIn}
              className="arena-button w-full py-4 font-semibold tracking-wide"
            >
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/12" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0f131b] px-4 text-white/45">or</span>
              </div>
            </div>

            <Link
              href="/practice"
              className="arena-button-secondary block w-full py-4 text-center font-semibold tracking-wide"
            >
              Continue to Practice
            </Link>

            <Link
              href="/race"
              className="block w-full py-3 text-center text-sm text-white/50 transition-colors hover:text-white/75"
            >
              Play multiplayer as guest →
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-white/38">
            Sign in to save your race history, track stats, and sync across devices.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
