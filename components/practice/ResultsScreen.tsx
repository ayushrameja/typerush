"use client"

import { motion } from "framer-motion"
import { WpmChart } from "./WpmChart"
import { WpmDataPoint } from "@/lib/stores/gameStore"

interface ResultsScreenProps {
  wpm: number
  accuracy: number
  duration: number
  timeUsed: number
  totalChars: number
  totalWords: number
  mistakes: number
  wpmHistory: WpmDataPoint[]
  onTryAgain: () => void
  onChangeSettings: () => void
}

export function ResultsScreen({
  wpm,
  accuracy,
  duration,
  timeUsed,
  totalChars,
  totalWords,
  mistakes,
  wpmHistory,
  onTryAgain,
  onChangeSettings,
}: ResultsScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-10">
        <h1 className="arena-heading text-6xl leading-none text-white mb-2">Results</h1>
        <p className="text-white/60">Here&apos;s how you did</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        <div className="arena-card rounded-2xl p-5">
          <p className="text-5xl font-bold text-white">{wpm}</p>
          <p className="text-sm text-white/60 mt-2">Words per minute</p>
        </div>
        
        <div className="arena-card rounded-2xl p-5">
          <p className="text-5xl font-bold text-white">{accuracy}%</p>
          <p className="text-sm text-white/60 mt-2">Accuracy</p>
        </div>
        
        <div className="arena-card rounded-2xl p-5">
          <p className="text-5xl font-bold text-white">{timeUsed}s</p>
          <p className="text-sm text-white/60 mt-2">Time taken</p>
        </div>
        
        <div className="arena-card rounded-2xl p-5">
          <p className="text-5xl font-bold text-white">{totalChars}</p>
          <p className="text-sm text-white/60 mt-2">Characters typed</p>
        </div>
        
        <div className="arena-card rounded-2xl p-5">
          <p className="text-5xl font-bold text-white">{totalWords}</p>
          <p className="text-sm text-white/60 mt-2">Words typed</p>
        </div>
        
        <div className="arena-card rounded-2xl p-5">
          <p className="text-5xl font-bold text-[#ff5f6b]">{mistakes}</p>
          <p className="text-sm text-white/60 mt-2">Mistakes</p>
        </div>
      </div>

      <div className="arena-card rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-medium text-white mb-6">WPM over time</h2>
        <div className="flex justify-center">
          <WpmChart data={wpmHistory} width={560} height={180} />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onTryAgain}
          className="arena-button flex-1 py-4 font-semibold"
        >
          Try Again
        </button>
        <button
          onClick={onChangeSettings}
          className="arena-button-secondary flex-1 py-4 font-semibold"
        >
          Change Settings
        </button>
      </div>
    </motion.div>
  )
}
