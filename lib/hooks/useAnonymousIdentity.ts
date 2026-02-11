"use client"

import { useEffect, useRef } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
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
  const { identity, setIdentity, setReady, isReady } = useIdentityStore()
  const registerAnonymous = useMutation(api.anonymous.registerAnonymous)
  const hasInitialized = useRef(false)

  const stored = loadStoredAnon()
  const serverPlayer = useQuery(
    api.anonymous.getAnonymousPlayer,
    !authLoading && !isAuthenticated && stored?.token
      ? { token: stored.token }
      : "skip"
  )

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) return
    if (hasInitialized.current && isReady) return

    if (stored && serverPlayer === undefined) return

    if (stored && serverPlayer) {
      const anonIdentity: PlayerIdentity = {
        playerId: serverPlayer.playerId,
        username: serverPlayer.username,
        discriminator: serverPlayer.discriminator,
        avatarSeed: serverPlayer.avatarSeed,
        isAuthenticated: false,
        token: stored.token,
        email: null,
        avatarUrl: null,
        displayName: `${serverPlayer.username}#${serverPlayer.discriminator}`,
      }
      setIdentity(anonIdentity)
      setReady(true)
      hasInitialized.current = true
      return
    }

    if (stored && serverPlayer === null) {
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
    stored,
    serverPlayer,
    setIdentity,
    setReady,
    registerAnonymous,
    isReady,
  ])
}
