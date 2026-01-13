"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CountdownScreenProps {
  previewText: string
  onComplete: () => void
}

export function CountdownScreen({ previewText, onComplete }: CountdownScreenProps) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count === 0) {
      onComplete()
      return
    }

    const timer = setTimeout(() => {
      setCount(count - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  const firstLine = previewText.split(" ").slice(0, 8).join(" ")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px]"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className="text-8xl font-bold text-white mb-16"
        >
          {count}
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="text-xl font-mono text-[#888] blur-[2px] max-w-2xl text-center"
      >
        {firstLine}...
      </motion.div>

      <p className="text-sm text-[#888] mt-8">Get ready to type</p>
    </motion.div>
  )
}
