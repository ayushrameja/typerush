"use client"

import { useCallback, useEffect, useState } from "react"
import { useConvexAuth, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAnonymousIdentity } from "@/lib/hooks/useAnonymousIdentity"
import { useLocalHistory } from "@/lib/hooks/useLocalHistory"
import {
  useIdentityStore,
  loadStoredAnon,
  clearStoredAnon,
  ANON_STORAGE_KEY,
} from "@/lib/stores/identityStore"
import { useUserStore } from "@/lib/stores/userStore"
import { MergePrompt } from "@/components/auth/MergePrompt"
import type { LocalRaceResult, LocalPracticeResult } from "@/lib/hooks/useLocalHistory"

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { user } = useUserStore()
  const { showMergePrompt, setIdentity, setReady, setShowMergePrompt } = useIdentityStore()
  const mergeAnonymousData = useMutation(api.users.mergeAnonymousData)
  const { clearAll, exportForMerge } = useLocalHistory()
  const [isMerging, setIsMerging] = useState(false)
  const [mergeData, setMergeData] = useState<{
    races: LocalRaceResult[]
    practices: LocalPracticeResult[]
    anonPlayerId: string
    anonToken: string
  } | null>(null)

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
        const { races, practices } = exportForMerge()
        setMergeData({
          races,
          practices,
          anonPlayerId: storedAnon.playerId,
          anonToken: storedAnon.token,
        })
        setShowMergePrompt(true)
      } else {
        clearStoredAnon()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user])

  const handleMerge = useCallback(async () => {
    if (!mergeData) return
    setIsMerging(true)

    try {
      await mergeAnonymousData({
        anonymousPlayerId: mergeData.anonPlayerId,
        anonymousToken: mergeData.anonToken,
        raceResults: mergeData.races,
        practiceResults: mergeData.practices,
      })
    } finally {
      clearAll()
      clearStoredAnon()
      setIsMerging(false)
      setShowMergePrompt(false)
      setMergeData(null)
    }
  }, [mergeData, mergeAnonymousData, clearAll, setShowMergePrompt])

  const handleFresh = useCallback(() => {
    clearAll()
    clearStoredAnon()
    setShowMergePrompt(false)
    setMergeData(null)
  }, [clearAll, setShowMergePrompt])

  const raceCount = mergeData?.races.length ?? 0
  const practiceCount = mergeData?.practices.length ?? 0
  const raceBestWpm = mergeData?.races.length
    ? Math.max(...mergeData.races.map((r) => r.wpm))
    : 0
  const practiceBestWpm = mergeData?.practices.length
    ? Math.max(...mergeData.practices.map((p) => p.wpm))
    : 0

  return (
    <>
      {children}
      {showMergePrompt && (
        <MergePrompt
          anonymousRaceCount={raceCount}
          anonymousBestWpm={raceBestWpm}
          anonymousPracticeCount={practiceCount}
          anonymousPracticeBestWpm={practiceBestWpm}
          onMerge={handleMerge}
          onFresh={handleFresh}
          isLoading={isMerging}
        />
      )}
    </>
  )
}
