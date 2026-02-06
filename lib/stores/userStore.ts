"use client"

import { create } from "zustand"
import type { AppUser, Profile, Stats } from "@/lib/types/user"

interface UserState {
  user: AppUser | null
  profile: Profile | null
  stats: Stats | null
  isLoading: boolean

  setUser: (user: AppUser | null) => void
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
