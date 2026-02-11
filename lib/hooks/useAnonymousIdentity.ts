"use client"

import { useEffect, useRef, useState } from "react"
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
  const latestAuthRef = useRef({ isAuthenticated, authLoading })
  const [anonToken, setAnonToken] = useState<string | null>(
    () => loadStoredAnon()?.token ?? null
  )

  useEffect(() => {
    latestAuthRef.current = { isAuthenticated, authLoading }
    hasInitialized.current = false
  }, [authLoading, isAuthenticated])

  const serverPlayer = useQuery(
    api.anonymous.getAnonymousPlayer,
    !authLoading && !isAuthenticated && anonToken
      ? { token: anonToken }
      : "skip"
  )

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) return
    if (hasInitialized.current && isReady && serverPlayer != null) return

    if (anonToken && serverPlayer === undefined) return

    if (anonToken && serverPlayer) {
      const anonIdentity: PlayerIdentity = {
        playerId: serverPlayer.playerId,
        username: serverPlayer.username,
        discriminator: serverPlayer.discriminator,
        avatarSeed: serverPlayer.avatarSeed,
        isAuthenticated: false,
        token: anonToken,
        email: null,
        avatarUrl: null,
        displayName: `${serverPlayer.username}#${serverPlayer.discriminator}`,
      }
      setIdentity(anonIdentity)
      setReady(true)
      hasInitialized.current = true
      return
    }

    if (anonToken && serverPlayer === null) {
      clearStoredAnon()
      queueMicrotask(() => setAnonToken(null))
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true
      void registerAnonymous({})
        .then((result) => {
          if (
            latestAuthRef.current.authLoading ||
            latestAuthRef.current.isAuthenticated
          ) {
            return
          }

          const newAnon = {
            token: result.token,
            playerId: result.playerId,
            username: result.username,
            discriminator: result.discriminator,
            avatarSeed: result.avatarSeed,
            createdAt: Date.now(),
          }
          saveStoredAnon(newAnon)
          setAnonToken(result.token)

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
        .catch((error) => {
          if (
            latestAuthRef.current.authLoading ||
            latestAuthRef.current.isAuthenticated
          ) {
            return
          }

          console.error("Failed to register anonymous identity", error)
          hasInitialized.current = false
          setReady(false)
        })
    }
  }, [
    authLoading,
    isAuthenticated,
    anonToken,
    serverPlayer,
    setIdentity,
    setReady,
    registerAnonymous,
    isReady,
  ])
}
