"use client"

import { create } from "zustand"

export type GameMode = "solo" | "multiplayer"
export type GameStatus = "idle" | "countdown" | "playing" | "finished"

export interface WpmDataPoint {
  time: number
  wpm: number
}

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
  charResults: boolean[]
  wpm: number
  accuracy: number
  streak: number
  maxStreak: number
  startTime: number | null
  wpmHistory: WpmDataPoint[]
  totalWords: number
  totalChars: number

  setMode: (mode: GameMode) => void
  setDuration: (duration: number) => void
  setText: (text: string) => void
  startGame: () => void
  startCountdown: () => void
  typeChar: (char: string) => void
  deleteChar: () => void
  tick: () => void
  recordWpm: () => void
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
  charResults: [],
  wpm: 0,
  accuracy: 100,
  streak: 0,
  maxStreak: 0,
  startTime: null,
  wpmHistory: [],
  totalWords: 0,
  totalChars: 0,

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
      charResults: [],
      wpm: 0,
      accuracy: 100,
      streak: 0,
      maxStreak: 0,
      wpmHistory: [],
      totalWords: 0,
      totalChars: 0,
    }),

  typeChar: (char) => {
    const state = get()
    if (state.status !== "playing") return

    const expectedChar = state.text[state.currentIndex]
    const isCorrect = char === expectedChar

    const newIndex = state.currentIndex + 1
    const newCharResults = [...state.charResults, isCorrect]
    const newCorrectChars = isCorrect ? state.correctChars + 1 : state.correctChars
    const newMistakes = isCorrect ? state.mistakes : state.mistakes + 1
    const newStreak = isCorrect ? state.streak + 1 : 0
    const newAccuracy = newIndex > 0 ? Math.round((newCorrectChars / newIndex) * 100) : 100

    const elapsedMinutes = (Date.now() - state.startTime!) / 60000
    const wordsTyped = newCorrectChars / 5
    const newWpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0

    const typedSoFar = state.typedText + char
    const wordsCompleted = typedSoFar.split(" ").filter(w => w.length > 0).length

    set({
      typedText: typedSoFar,
      currentIndex: newIndex,
      charResults: newCharResults,
      correctChars: newCorrectChars,
      mistakes: newMistakes,
      streak: newStreak,
      maxStreak: Math.max(state.maxStreak, newStreak),
      wpm: newWpm,
      accuracy: newAccuracy,
      totalWords: wordsCompleted,
      totalChars: newIndex,
    })

    if (newIndex >= state.text.length) {
      get().endGame()
    }
  },

  deleteChar: () => {
    const state = get()
    if (state.status !== "playing" || state.currentIndex === 0) return

    const newIndex = state.currentIndex - 1
    const wasCorrect = state.charResults[newIndex]
    const newCharResults = state.charResults.slice(0, -1)
    const newCorrectChars = wasCorrect ? state.correctChars - 1 : state.correctChars

    const newAccuracy = newIndex > 0 ? Math.round((newCorrectChars / newIndex) * 100) : 100
    const elapsedMinutes = (Date.now() - state.startTime!) / 60000
    const wordsTyped = newCorrectChars / 5
    const newWpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0

    set({
      typedText: state.typedText.slice(0, -1),
      currentIndex: newIndex,
      charResults: newCharResults,
      correctChars: newCorrectChars,
      wpm: newWpm,
      accuracy: newAccuracy,
      streak: 0,
      totalChars: newIndex,
    })
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

  recordWpm: () => {
    const state = get()
    if (state.status !== "playing" || !state.startTime) return

    const elapsedSeconds = (Date.now() - state.startTime) / 1000
    set({
      wpmHistory: [...state.wpmHistory, { time: elapsedSeconds, wpm: state.wpm }]
    })
  },

  endGame: () => {
    const state = get()
    const finalTime = state.duration - state.timeLeft
    set({ 
      status: "finished",
      wpmHistory: [...state.wpmHistory, { time: finalTime, wpm: state.wpm }]
    })
  },

  reset: () =>
    set({
      status: "idle",
      timeLeft: get().duration,
      typedText: "",
      currentIndex: 0,
      mistakes: 0,
      correctChars: 0,
      charResults: [],
      wpm: 0,
      accuracy: 100,
      streak: 0,
      maxStreak: 0,
      startTime: null,
      wpmHistory: [],
      totalWords: 0,
      totalChars: 0,
    }),
}))
