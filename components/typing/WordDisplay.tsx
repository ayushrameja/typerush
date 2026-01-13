"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

interface WordDisplayProps {
  text: string
  currentIndex: number
  charResults: boolean[]
}

export function WordDisplay({
  text,
  currentIndex,
  charResults,
}: WordDisplayProps) {
  const { visibleChars } = useMemo(() => {
    const words = text.split(" ")
    let charCount = 0
    let startWordIndex = 0
    let currentWordIndex = 0
    
    for (let i = 0; i < words.length; i++) {
      const wordEnd = charCount + words[i].length
      if (currentIndex >= charCount && currentIndex <= wordEnd) {
        currentWordIndex = i
        break
      }
      charCount += words[i].length + 1
    }
    
    startWordIndex = Math.max(0, currentWordIndex - 3)
    
    let startChar = 0
    for (let i = 0; i < startWordIndex; i++) {
      startChar += words[i].length + 1
    }
    
    const visibleWords = words.slice(startWordIndex, startWordIndex + 20)
    const visibleText = visibleWords.join(" ")
    
    return {
      visibleChars: visibleText.split("").map((char, localIndex) => {
        const globalIndex = startChar + localIndex
        let status: "pending" | "correct" | "incorrect" | "current" = "pending"
        
        if (globalIndex < currentIndex) {
          status = charResults[globalIndex] ? "correct" : "incorrect"
        } else if (globalIndex === currentIndex) {
          status = "current"
        }
        
        return { char, status, globalIndex }
      })
    }
  }, [text, currentIndex, charResults])

  return (
    <div className="relative rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-cyan-500/5 to-blue-500/5" />
      
      <div className="relative p-6 text-2xl leading-[48px] font-mono tracking-wide min-h-[144px]">
        {visibleChars.map(({ char, status, globalIndex }) => (
          <span
            key={globalIndex}
            className={`
              relative inline
              ${status === "pending" ? "text-zinc-600" : ""}
              ${status === "correct" ? "text-cyan-400" : ""}
              ${status === "incorrect" ? "text-red-400 bg-red-500/20" : ""}
              ${status === "current" ? "text-zinc-100" : ""}
              transition-colors duration-75
            `}
          >
            {status === "current" && (
              <motion.span
                layoutId="cursor"
                className="absolute -left-[2px] top-0 w-[3px] h-full bg-cyan-400 typing-cursor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>
    </div>
  )
}
