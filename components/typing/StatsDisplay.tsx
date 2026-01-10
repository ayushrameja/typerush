"use client"

import { motion } from "framer-motion"
import { formatTime } from "@/lib/utils/calculateStats"

interface StatsDisplayProps {
  wpm: number
  accuracy: number
  timeLeft: number
  streak: number
  mistakes: number
}

export function StatsDisplay({
  wpm,
  accuracy,
  timeLeft,
  streak,
  mistakes,
}: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard
        label="WPM"
        value={wpm}
        color="cyan"
        animate
      />
      <StatCard
        label="Accuracy"
        value={`${accuracy}%`}
        color={accuracy >= 90 ? "green" : accuracy >= 70 ? "yellow" : "red"}
      />
      <StatCard
        label="Time"
        value={formatTime(timeLeft)}
        color="blue"
        pulse={timeLeft <= 10}
      />
      <StatCard
        label="Streak"
        value={streak}
        color="purple"
        animate={streak >= 10}
      />
      <StatCard
        label="Mistakes"
        value={mistakes}
        color="red"
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  color: "cyan" | "blue" | "green" | "yellow" | "red" | "purple"
  animate?: boolean
  pulse?: boolean
}

const colorMap = {
  cyan: "from-cyan-500 to-cyan-400",
  blue: "from-blue-500 to-blue-400",
  green: "from-emerald-500 to-emerald-400",
  yellow: "from-yellow-500 to-yellow-400",
  red: "from-red-500 to-red-400",
  purple: "from-purple-500 to-purple-400",
}

function StatCard({ label, value, color, animate, pulse }: StatCardProps) {
  return (
    <motion.div
      className={`
        relative p-4 rounded-xl
        bg-zinc-900/50 border border-zinc-800
        text-center overflow-hidden
        ${pulse ? "animate-pulse" : ""}
      `}
      animate={animate ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3, repeat: animate ? Infinity : 0, repeatDelay: 1 }}
    >
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${colorMap[color]}`} />
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold bg-gradient-to-r ${colorMap[color]} bg-clip-text text-transparent`}>
        {value}
      </p>
    </motion.div>
  )
}
