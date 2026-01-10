"use client"

import { create } from "zustand"
import type { User } from "@supabase/supabase-js"
import type { Profile, Stats } from "@/lib/supabase/database.types"

interface UserState {
  user: User | null
  profile: Profile | null
  stats: Stats | null
  isLoading: boolean

  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setStats: (stats: Stats | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  stats: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, profile: null, stats: null }),
}))
