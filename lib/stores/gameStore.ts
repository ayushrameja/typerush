"use client"

import { create } from "zustand"

export type GameMode = "solo" | "multiplayer"
export type GameStatus = "idle" | "countdown" | "playing" | "finished"

interface GameState {
  mode: GameMode
  status: GameStatus
  duration: number
  timeLeft: number
  text: string
  typedText: string
  currentIndex: number
  mistakes: number
  correctChars: number
  wpm: number
  accuracy: number
  streak: number
  maxStreak: number
  startTime: number | null

  setMode: (mode: GameMode) => void
  setDuration: (duration: number) => void
  setText: (text: string) => void
  startGame: () => void
  startCountdown: () => void
  typeChar: (char: string) => void
  tick: () => void
  endGame: () => void
  reset: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: "solo",
  status: "idle",
  duration: 60,
  timeLeft: 60,
  text: "",
  typedText: "",
  currentIndex: 0,
  mistakes: 0,
  correctChars: 0,
  wpm: 0,
  accuracy: 100,
  streak: 0,
  maxStreak: 0,
  startTime: null,

  setMode: (mode) => set({ mode }),
  setDuration: (duration) => set({ duration, timeLeft: duration }),
  setText: (text) => set({ text }),

  startCountdown: () => set({ status: "countdown" }),

  startGame: () =>
    set({
      status: "playing",
      startTime: Date.now(),
      timeLeft: get().duration,
      typedText: "",
      currentIndex: 0,
      mistakes: 0,
      correctChars: 0,
      wpm: 0,
      accuracy: 100,
      streak: 0,
      maxStreak: 0,
    }),

  typeChar: (char) => {
    const state = get()
    if (state.status !== "playing") return

    const expectedChar = state.text[state.currentIndex]
    const isCorrect = char === expectedChar

    if (isCorrect) {
      const newStreak = state.streak + 1
      const newCorrectChars = state.correctChars + 1
      const totalTyped = state.currentIndex + 1
      const newAccuracy =
        totalTyped > 0 ? Math.round((newCorrectChars / totalTyped) * 100) : 100

      const elapsedMinutes = (Date.now() - state.startTime!) / 60000
      const wordsTyped = newCorrectChars / 5
      const newWpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0

      set({
        typedText: state.typedText + char,
        currentIndex: state.currentIndex + 1,
        correctChars: newCorrectChars,
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        wpm: newWpm,
        accuracy: newAccuracy,
      })

      if (state.currentIndex + 1 >= state.text.length) {
        get().endGame()
      }
    } else {
      const totalTyped = state.currentIndex + 1
      const newAccuracy =
        totalTyped > 0
          ? Math.round((state.correctChars / totalTyped) * 100)
          : 100

      set({
        mistakes: state.mistakes + 1,
        streak: 0,
        accuracy: newAccuracy,
      })
    }
  },

  tick: () => {
    const state = get()
    if (state.status !== "playing") return

    const newTimeLeft = state.timeLeft - 1
    if (newTimeLeft <= 0) {
      get().endGame()
    } else {
      set({ timeLeft: newTimeLeft })
    }
  },

  endGame: () => set({ status: "finished" }),

  reset: () =>
    set({
      status: "idle",
      timeLeft: get().duration,
      typedText: "",
      currentIndex: 0,
      mistakes: 0,
      correctChars: 0,
      wpm: 0,
      accuracy: 100,
      streak: 0,
      maxStreak: 0,
      startTime: null,
    }),
}))
