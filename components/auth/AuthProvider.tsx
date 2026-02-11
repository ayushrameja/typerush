"use client"

import { useEffect } from "react"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUserStore } from "@/lib/stores/userStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip"
  )
  const { setUser, setProfile, clear, setLoading } = useUserStore()

  useEffect(() => {
    if (isLoading) {
      setLoading(true)
      return
    }

    if (isAuthenticated && currentUser) {
      const username = currentUser.name || currentUser.email?.split("@")[0] || "Player"

      setUser({
        id: currentUser._id,
        isAnonymous: false,
        name: username,
        displayName: username,
        email: currentUser.email ?? null,
        avatarUrl: currentUser.image ?? null,
        avatarSeed: null,
        token: null,
      })

      setProfile({
        id: currentUser._id,
        username,
        avatar_url: currentUser.image ?? null,
        created_at: new Date(currentUser._creationTime).toISOString(),
      })

      setLoading(false)
      return
    }

    if (!isLoading && !isAuthenticated) {
      clear()
      setLoading(false)
    }
  }, [clear, currentUser, isAuthenticated, isLoading, setLoading, setProfile, setUser])

  return <>{children}</>
}
