"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

interface WordDisplayProps {
  text: string
  currentIndex: number
  mistakes: Set<number>
}

export function WordDisplay({
  text,
  currentIndex,
  mistakes,
}: WordDisplayProps) {
  const characters = useMemo(() => {
    return text.split("").map((char, index) => {
      let status: "pending" | "correct" | "incorrect" | "current" = "pending"

      if (index < currentIndex) {
        status = mistakes.has(index) ? "incorrect" : "correct"
      } else if (index === currentIndex) {
        status = "current"
      }

      return { char, status, index }
    })
  }, [text, currentIndex, mistakes])

  return (
    <div className="relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5" />
      
      <div className="relative text-2xl leading-relaxed font-mono tracking-wide">
        {characters.map(({ char, status, index }) => (
          <span
            key={index}
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
