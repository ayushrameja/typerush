"use client"

import { useEffect } from "react"
import { useConvexAuth } from "convex/react"
import { useAnonymousIdentity } from "@/lib/hooks/useAnonymousIdentity"
import { useIdentityStore, loadStoredAnon } from "@/lib/stores/identityStore"
import { useUserStore } from "@/lib/stores/userStore"

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { user } = useUserStore()
  const { setIdentity, setReady, setShowMergePrompt } = useIdentityStore()

  useAnonymousIdentity()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) return

    setIdentity({
      playerId: user.id,
      username: user.name,
      discriminator: "",
      avatarSeed: "",
      isAuthenticated: true,
      token: null,
      email: user.email,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
    })
    setReady(true)

    const storedAnon = loadStoredAnon()
    if (storedAnon) {
      const raceHistory = localStorage.getItem("typerush_race_history")
      const practiceHistory = localStorage.getItem("typerush_practice_history")
      if (raceHistory || practiceHistory) {
        setShowMergePrompt(true)
      }
    }
  }, [authLoading, isAuthenticated, user, setIdentity, setReady, setShowMergePrompt])

  return <>{children}</>
}
