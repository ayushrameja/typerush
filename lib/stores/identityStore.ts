"use client"

import { create } from "zustand"

export interface PlayerIdentity {
  playerId: string
  username: string
  discriminator: string
  avatarSeed: string
  isAuthenticated: boolean
  token: string | null
  email: string | null
  avatarUrl: string | null
  displayName: string
}

interface IdentityState {
  identity: PlayerIdentity | null
  isReady: boolean
  showMergePrompt: boolean

  setIdentity: (identity: PlayerIdentity) => void
  clear: () => void
  setReady: (ready: boolean) => void
  updateUsername: (username: string) => void
  setShowMergePrompt: (show: boolean) => void
}

export const ANON_STORAGE_KEY = "typerush_anon"

export interface StoredAnonIdentity {
  token: string
  playerId: string
  username: string
  discriminator: string
  avatarSeed: string
  createdAt: number
}

export function loadStoredAnon(): StoredAnonIdentity | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ANON_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredAnonIdentity
  } catch {
    return null
  }
}

export function saveStoredAnon(data: StoredAnonIdentity): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(data))
}

export function clearStoredAnon(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ANON_STORAGE_KEY)
}

export const useIdentityStore = create<IdentityState>((set) => ({
  identity: null,
  isReady: false,
  showMergePrompt: false,

  setIdentity: (identity) => set({ identity }),
  clear: () => set({ identity: null, isReady: false }),
  setReady: (isReady) => set({ isReady }),
  updateUsername: (username) =>
    set((state) => {
      if (!state.identity) return state
      const displayName = state.identity.isAuthenticated
        ? username
        : `${username}#${state.identity.discriminator}`
      return {
        identity: {
          ...state.identity,
          username,
          displayName,
        },
      }
    }),
  setShowMergePrompt: (showMergePrompt) => set({ showMergePrompt }),
}))
