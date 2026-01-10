"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/lib/stores/userStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setStats, setLoading, clear } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    const fetchUserData = async (userId: string) => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      const { data: statsData } = await supabase
        .from("stats")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
      if (statsData) {
        setStats(statsData)
      }
    }

    const initAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        await fetchUserData(user.id)
      }
      setLoading(false)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        await fetchUserData(session.user.id)
      } else if (event === "SIGNED_OUT") {
        clear()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setStats, setLoading, clear])

  return <>{children}</>
}