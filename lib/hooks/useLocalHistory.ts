"use client"

import { useCallback, useSyncExternalStore } from "react"

export interface LocalRaceResult {
  opponentUsername: string
  opponentId: string
  wpm: number
  accuracy: number
  won: boolean
  completedAt: number
  lobbyId: string
}

export interface LocalPracticeResult {
  wpm: number
  accuracy: number
  duration: number
  difficulty: string
  completedAt: number
}

const RACE_KEY = "typerush_race_history"
const PRACTICE_KEY = "typerush_practice_history"
const MAX_ITEMS = 20

const EMPTY_RACE_HISTORY: LocalRaceResult[] = []
const EMPTY_PRACTICE_HISTORY: LocalPracticeResult[] = []

let raceListeners: Array<() => void> = []
let practiceListeners: Array<() => void> = []

function emitRaceChange() {
  for (const listener of raceListeners) listener()
}

function emitPracticeChange() {
  for (const listener of practiceListeners) listener()
}

function readRace(): LocalRaceResult[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RACE_KEY) || "[]")
  } catch {
    return []
  }
}

function readPractice(): LocalPracticeResult[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(PRACTICE_KEY) || "[]")
  } catch {
    return []
  }
}

let raceCache: LocalRaceResult[] | null = null
let practiceCache: LocalPracticeResult[] | null = null

function getRaceSnapshot(): LocalRaceResult[] {
  if (raceCache === null) raceCache = readRace()
  return raceCache
}

function getPracticeSnapshot(): LocalPracticeResult[] {
  if (practiceCache === null) practiceCache = readPractice()
  return practiceCache
}

function getServerRaceSnapshot(): LocalRaceResult[] {
  return EMPTY_RACE_HISTORY
}

function getServerPracticeSnapshot(): LocalPracticeResult[] {
  return EMPTY_PRACTICE_HISTORY
}

function subscribeRace(cb: () => void) {
  raceListeners.push(cb)
  return () => {
    raceListeners = raceListeners.filter((l) => l !== cb)
  }
}

function subscribePractice(cb: () => void) {
  practiceListeners.push(cb)
  return () => {
    practiceListeners = practiceListeners.filter((l) => l !== cb)
  }
}

export function useLocalHistory() {
  const raceHistory = useSyncExternalStore(subscribeRace, getRaceSnapshot, getServerRaceSnapshot)
  const practiceHistory = useSyncExternalStore(subscribePractice, getPracticeSnapshot, getServerPracticeSnapshot)

  const addRaceResult = useCallback((result: LocalRaceResult) => {
    const current = readRace()
    const updated = [result, ...current].slice(0, MAX_ITEMS)
    localStorage.setItem(RACE_KEY, JSON.stringify(updated))
    raceCache = updated
    emitRaceChange()
  }, [])

  const addPracticeResult = useCallback((result: LocalPracticeResult) => {
    const current = readPractice()
    const updated = [result, ...current].slice(0, MAX_ITEMS)
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(updated))
    practiceCache = updated
    emitPracticeChange()
  }, [])

  const clearAll = useCallback(() => {
    localStorage.removeItem(RACE_KEY)
    localStorage.removeItem(PRACTICE_KEY)
    raceCache = []
    practiceCache = []
    emitRaceChange()
    emitPracticeChange()
  }, [])

  const exportForMerge = useCallback(() => {
    return {
      races: readRace(),
      practices: readPractice(),
    }
  }, [])

  return {
    raceHistory,
    practiceHistory,
    addRaceResult,
    addPracticeResult,
    clearAll,
    exportForMerge,
  }
}
