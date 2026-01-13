"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameStore } from "@/lib/stores/gameStore"
import { generateTextForDuration } from "@/lib/utils/words"
import { WordDisplay } from "./WordDisplay"
import { StatsDisplay } from "./StatsDisplay"
import { Button } from "@/components/ui/Button"

interface TypingTestProps {
  onComplete?: (stats: {
    wpm: number
    accuracy: number
    mistakes: number
    duration: number
  }) => void
}

export function TypingTest({ onComplete }: TypingTestProps) {
  const {
    status,
    duration,
    timeLeft,
    text,
    currentIndex,
    mistakes,
    wpm,
    accuracy,
    streak,
    charResults,
    setText,
    startCountdown,
    startGame,
    typeChar,
    deleteChar,
    tick,
    reset,
    setDuration,
  } = useGameStore()

  const [countdown, setCountdown] = useState(3)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInitializedRef = useRef(false)

  const durations = [15, 30, 60, 120]

  useEffect(() => {
    if (status === "idle" && !hasInitializedRef.current) {
      setText(generateTextForDuration(duration))
      hasInitializedRef.current = true
    }
    if (status !== "idle") {
      hasInitializedRef.current = false
    }
  }, [status, duration, setText])

  useEffect(() => {
    if (status === "countdown") {
      setCountdown(3)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status])

  useEffect(() => {
    if (status === "countdown" && countdown === 0) {
      startGame()
      inputRef.current?.focus()
    }
  }, [status, countdown, startGame])

  useEffect(() => {
    if (status === "playing") {
      const timer = setInterval(tick, 1000)
      return () => clearInterval(timer)
    }
  }, [status, tick])

  useEffect(() => {
    if (status === "finished" && onComplete) {
      onComplete({ wpm, accuracy, mistakes, duration })
    }
  }, [status, wpm, accuracy, mistakes, duration, onComplete])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (status !== "playing") return

      if (e.key === "Backspace") {
        e.preventDefault()
        deleteChar()
      } else if (e.key.length === 1) {
        typeChar(e.key)
      }
    },
    [status, typeChar, deleteChar]
  )

  const handleStart = () => {
    startCountdown()
  }

  const handleRestart = () => {
    reset()
    setText(generateTextForDuration(duration))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => {
                if (status === "idle") {
                  setDuration(d)
                  setText(generateTextForDuration(d))
                }
              }}
              disabled={status !== "idle"}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  duration === d
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {d}s
            </button>
          ))}
        </div>

        {status === "idle" && (
          <Button onClick={handleStart} size="lg">
            Start Test
          </Button>
        )}

        {(status === "playing" || status === "finished") && (
          <Button onClick={handleRestart} variant="secondary">
            Restart
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center justify-center h-48"
          >
            <motion.span
              key={countdown}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="text-8xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-glow"
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}

        {(status === "playing" || status === "finished") && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <StatsDisplay
              wpm={wpm}
              accuracy={accuracy}
              timeLeft={timeLeft}
              streak={streak}
              mistakes={mistakes}
            />

            <WordDisplay
              text={text}
              currentIndex={currentIndex}
              charResults={charResults}
            />

            <input
              ref={inputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none"
              onKeyDown={handleKeyDown}
              autoFocus={status === "playing"}
              disabled={status !== "playing"}
            />

            {status === "playing" && (
              <p className="text-center text-zinc-500 text-sm">
                Start typing to begin...
              </p>
            )}
          </motion.div>
        )}

        {status === "finished" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-8 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-center"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Test Complete!
            </h2>
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div>
                <p className="text-4xl font-bold text-cyan-400">{wpm}</p>
                <p className="text-zinc-500 text-sm">WPM</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-emerald-400">{accuracy}%</p>
                <p className="text-zinc-500 text-sm">Accuracy</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-red-400">{mistakes}</p>
                <p className="text-zinc-500 text-sm">Mistakes</p>
              </div>
            </div>
          </motion.div>
        )}

        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="text-2xl leading-relaxed font-mono tracking-wide text-zinc-600">
                {text.slice(0, 200)}...
              </div>
            </div>
            <p className="text-center text-zinc-500">
              Select duration and click Start to begin
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
