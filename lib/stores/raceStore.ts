"use client"

import { create } from "zustand"

export type RaceStatus = "idle" | "waiting" | "countdown" | "racing" | "finished"

interface PlayerProgress {
  id: string
  username: string
  progress: number
  wpm: number
  mistakes: number
  finished: boolean
}

interface RaceState {
  status: RaceStatus
  roomCode: string | null
  lobbyId: string | null
  textToType: string
  countdown: number
  timeLeft: number
  hostProgress: PlayerProgress
  guestProgress: PlayerProgress
  isHost: boolean

  setRoomCode: (code: string | null) => void
  setLobbyId: (id: string | null) => void
  setTextToType: (text: string) => void
  setStatus: (status: RaceStatus) => void
  setCountdown: (count: number) => void
  setTimeLeft: (time: number) => void
  setIsHost: (isHost: boolean) => void
  updateHostProgress: (progress: Partial<PlayerProgress>) => void
  updateGuestProgress: (progress: Partial<PlayerProgress>) => void
  reset: () => void
}

const initialProgress: PlayerProgress = {
  id: "",
  username: "",
  progress: 0,
  wpm: 0,
  mistakes: 0,
  finished: false,
}

export const useRaceStore = create<RaceState>((set) => ({
  status: "idle",
  roomCode: null,
  lobbyId: null,
  textToType: "",
  countdown: 3,
  timeLeft: 60,
  hostProgress: { ...initialProgress },
  guestProgress: { ...initialProgress },
  isHost: false,

  setRoomCode: (roomCode) => set({ roomCode }),
  setLobbyId: (lobbyId) => set({ lobbyId }),
  setTextToType: (textToType) => set({ textToType }),
  setStatus: (status) => set({ status }),
  setCountdown: (countdown) => set({ countdown }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setIsHost: (isHost) => set({ isHost }),

  updateHostProgress: (progress) =>
    set((state) => ({
      hostProgress: { ...state.hostProgress, ...progress },
    })),

  updateGuestProgress: (progress) =>
    set((state) => ({
      guestProgress: { ...state.guestProgress, ...progress },
    })),

  reset: () =>
    set({
      status: "idle",
      roomCode: null,
      lobbyId: null,
      textToType: "",
      countdown: 3,
      timeLeft: 60,
      hostProgress: { ...initialProgress },
      guestProgress: { ...initialProgress },
      isHost: false,
    }),
}))
