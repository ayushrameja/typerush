"use client"

import { useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { useGameStore } from "@/lib/stores/gameStore"

interface TypingScreenProps {
  onComplete: () => void
}

export function TypingScreen({ onComplete }: TypingScreenProps) {
  const {
    text,
    currentIndex,
    charResults,
    timeLeft,
    duration,
    status,
    typeChar,
    deleteChar,
    tick,
    recordWpm,
  } = useGameStore()

  const inputRef = useRef<HTMLInputElement>(null)
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (status === "playing") {
      const timer = setInterval(tick, 1000)
      return () => clearInterval(timer)
    }
  }, [status, tick])

  useEffect(() => {
    if (status === "playing") {
      wpmIntervalRef.current = setInterval(recordWpm, 2000)
      return () => {
        if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current)
      }
    }
  }, [status, recordWpm])

  useEffect(() => {
    if (status === "finished") {
      onComplete()
    }
  }, [status, onComplete])

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

  const words = text.split(" ")
  let charCount = 0
  let currentWordIndex = 0
  
  for (let i = 0; i < words.length; i++) {
    const wordEnd = charCount + words[i].length
    if (currentIndex >= charCount && currentIndex <= wordEnd) {
      currentWordIndex = i
      break
    }
    charCount += words[i].length + 1
  }

  const startWordIndex = Math.max(0, currentWordIndex - 1)
  let startChar = 0
  for (let i = 0; i < startWordIndex; i++) {
    startChar += words[i].length + 1
  }

  let visibleWords: string[] = []
  let totalChars = 0
  const targetChars = 180
  
  for (let i = startWordIndex; i < words.length && totalChars < targetChars; i++) {
    visibleWords.push(words[i])
    totalChars += words[i].length + 1
  }
  
  const visibleText = visibleWords.join(" ")

  const progress = (currentIndex / text.length) * 100
  const timeProgress = ((duration - timeLeft) / duration) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[400px] flex flex-col"
    >
      <div className="absolute top-0 right-0 text-2xl font-mono text-[#888]">
        {formatTime(timeLeft)}
      </div>

      <div className="flex-1 flex items-center justify-center py-16 overflow-hidden">
        <div className="max-w-4xl w-full">
          <motion.div 
            key={startWordIndex}
            initial={{ x: 20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl font-mono leading-relaxed tracking-wide"
          >
            {visibleText.split("").map((char, localIndex) => {
              const globalIndex = startChar + localIndex
              let charStatus: "pending" | "correct" | "incorrect" | "current" = "pending"

              if (globalIndex < currentIndex) {
                charStatus = charResults[globalIndex] ? "correct" : "incorrect"
              } else if (globalIndex === currentIndex) {
                charStatus = "current"
              }

              return (
                <span
                  key={globalIndex}
                  className={`
                    relative inline transition-colors duration-75
                    ${charStatus === "pending" ? "text-[#444]" : ""}
                    ${charStatus === "correct" ? "text-white" : ""}
                    ${charStatus === "incorrect" ? "text-red-500" : ""}
                    ${charStatus === "current" ? "text-[#888]" : ""}
                  `}
                >
                  {charStatus === "current" && (
                    <span className="absolute -left-[2px] top-[10%] w-[3px] h-[80%] bg-white typing-cursor" />
                  )}
                  {char === " " ? "\u00A0" : char}
                </span>
              )
            })}
          </motion.div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        autoFocus
        onBlur={() => inputRef.current?.focus()}
      />

      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-[2px] bg-[#222] rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#666]">
          <span>{Math.round(progress)}% complete</span>
          <span>{Math.round(timeProgress)}% time elapsed</span>
        </div>
      </div>
    </motion.div>
  )
}
