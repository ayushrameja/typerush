"use client"

import { useEffect, useMemo, useRef } from "react"
import { useAction, useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  useIdentityStore,
  loadStoredAnon,
  saveStoredAnon,
  clearStoredAnon,
} from "@/lib/stores/identityStore"
import type { PlayerIdentity } from "@/lib/stores/identityStore"

export function useAnonymousIdentity() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { setIdentity, setReady, isReady } = useIdentityStore()
  const registerAnonymous = useAction(api.anonymous.registerAnonymous)
  const hasInitialized = useRef(false)

  const storedToken = useMemo(() => loadStoredAnon()?.token ?? null, [])
  const serverPlayer = useQuery(
    api.anonymous.getAnonymousPlayer,
    !authLoading && !isAuthenticated && storedToken
      ? { token: storedToken }
      : "skip"
  )

  useEffect(() => {
    const stored = loadStoredAnon()

    if (authLoading) return
    if (isAuthenticated) return
    if (hasInitialized.current && isReady) return

    if (storedToken && serverPlayer === undefined) return

    if (storedToken && serverPlayer) {
      const anonIdentity: PlayerIdentity = {
        playerId: serverPlayer.playerId,
        username: serverPlayer.username,
        discriminator: serverPlayer.discriminator,
        avatarSeed: serverPlayer.avatarSeed,
        isAuthenticated: false,
        token: stored?.token ?? storedToken,
        email: null,
        avatarUrl: null,
        displayName: `${serverPlayer.username}#${serverPlayer.discriminator}`,
      }
      setIdentity(anonIdentity)
      setReady(true)
      hasInitialized.current = true
      return
    }

    if (storedToken && serverPlayer === null) {
      clearStoredAnon()
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true
      void registerAnonymous({}).then((result) => {
        const newAnon = {
          token: result.token,
          playerId: result.playerId,
          username: result.username,
          discriminator: result.discriminator,
          avatarSeed: result.avatarSeed,
          createdAt: Date.now(),
        }
        saveStoredAnon(newAnon)

        setIdentity({
          playerId: result.playerId,
          username: result.username,
          discriminator: result.discriminator,
          avatarSeed: result.avatarSeed,
          isAuthenticated: false,
          token: result.token,
          email: null,
          avatarUrl: null,
          displayName: `${result.username}#${result.discriminator}`,
        })
        setReady(true)
      })
    }
  }, [
    authLoading,
    isAuthenticated,
    storedToken,
    serverPlayer,
    setIdentity,
    setReady,
    registerAnonymous,
    isReady,
  ])
}
