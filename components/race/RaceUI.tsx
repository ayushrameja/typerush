"use client"

import { motion, AnimatePresence } from "framer-motion"
import { formatTime } from "@/lib/utils/calculateStats"

interface RaceUIProps {
  status: "waiting" | "countdown" | "racing" | "finished"
  countdown: number
  timeLeft: number
  player1: {
    username: string
    progress: number
    wpm: number
  }
  player2?: {
    username: string
    progress: number
    wpm: number
  }
  winner?: string
  onRestart?: () => void
}

export function RaceUI({
  status,
  countdown,
  timeLeft,
  player1,
  player2,
  winner,
  onRestart,
}: RaceUIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence mode="wait">
        {status === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-2xl font-bold text-zinc-300">
                Waiting for opponent...
              </p>
            </div>
          </motion.div>
        )}

        {status === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              key={countdown}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="text-9xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 60px rgba(34, 211, 238, 0.5)",
              }}
            >
              {countdown === 0 ? "GO!" : countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {status === "racing" && (
        <>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-sm rounded-2xl px-8 py-4 border border-zinc-800">
            <p className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {formatTime(timeLeft)}
            </p>
          </div>

          <div className="absolute top-6 left-6 right-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-cyan-400">{player1.username}</span>
              {player2 && (
                <span className="text-sm text-purple-400">
                  {player2.username}
                </span>
              )}
            </div>

            <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${player1.progress}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
              {player2 && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full h-1 top-1"
                  initial={{ width: 0 }}
                  animate={{ width: `${player2.progress}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              )}
            </div>
          </div>
        </>
      )}

      {status === "finished" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm pointer-events-auto"
        >
          <div className="text-center">
            <motion.h2
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-5xl font-bold mb-4"
            >
              {winner === player1.username ? (
                <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  Victory!
                </span>
              ) : (
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Defeat
                </span>
              )}
            </motion.h2>

            <div className="flex gap-12 justify-center mb-8">
              <div className="text-center">
                <p className="text-zinc-500 text-sm mb-1">{player1.username}</p>
                <p className="text-4xl font-bold text-cyan-400">
                  {player1.wpm}
                </p>
                <p className="text-zinc-500 text-xs">WPM</p>
              </div>
              {player2 && (
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-1">
                    {player2.username}
                  </p>
                  <p className="text-4xl font-bold text-purple-400">
                    {player2.wpm}
                  </p>
                  <p className="text-zinc-500 text-xs">WPM</p>
                </div>
              )}
            </div>

            {onRestart && (
              <button
                onClick={onRestart}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all"
              >
                Race Again
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
