"use client"

import { useEffect, useCallback, useRef, useState } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorSpanRef = useRef<HTMLSpanElement>(null)
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const scrollOffsetRef = useRef(0)
  
  const [scrollOffset, setScrollOffset] = useState(0)

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

  useEffect(() => {
    if (!cursorSpanRef.current || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const cursorRect = cursorSpanRef.current.getBoundingClientRect()
    
    const containerWidth = containerRect.width
    const targetPosition = containerWidth * 0.2
    
    const cursorVisualLeft = cursorRect.left - containerRect.left
    const cursorOriginalLeft = cursorVisualLeft + scrollOffsetRef.current

    const progress = currentIndex / text.length

    if (progress < 0.95 && cursorVisualLeft > targetPosition) {
      const newOffset = cursorOriginalLeft - targetPosition
      scrollOffsetRef.current = newOffset
      setScrollOffset(newOffset)
    }
  }, [currentIndex, text.length])

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

      <div className="flex-1 flex items-center py-16">
        <div ref={containerRef} className="w-full overflow-hidden">
          <div 
            style={{ transform: `translateX(-${scrollOffset}px)` }}
            className="text-4xl md:text-5xl font-mono tracking-wide whitespace-nowrap transition-transform duration-150 ease-out"
          >
            {text.split("").map((char, index) => {
              let charStatus: "pending" | "correct" | "incorrect" | "current" = "pending"

              if (index < currentIndex) {
                charStatus = charResults[index] ? "correct" : "incorrect"
              } else if (index === currentIndex) {
                charStatus = "current"
              }

              const isCursor = charStatus === "current"

              return (
                <span
                  key={index}
                  ref={isCursor ? cursorSpanRef : null}
                  className={`
                    relative
                    ${charStatus === "pending" ? "text-[#444]" : ""}
                    ${charStatus === "correct" ? "text-white" : ""}
                    ${charStatus === "incorrect" ? "text-red-500" : ""}
                    ${charStatus === "current" ? "text-[#888]" : ""}
                  `}
                >
                  {isCursor && (
                    <span className="absolute -left-[2px] top-[10%] w-[3px] h-[80%] bg-white typing-cursor" />
                  )}
                  {char === " " ? "\u00A0" : char}
                </span>
              )
            })}
          </div>
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
