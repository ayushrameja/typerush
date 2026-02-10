"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { GridBackground } from "@/components/home/GridBackground"

export default function LeaderboardPage() {
  return (
    <div className="arena-shell px-4 pb-20 pt-28">
      <GridBackground />
      <div className="relative mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="arena-chip">Coming soon</div>
          <h1 className="arena-heading mt-5 text-7xl leading-none text-white md:text-8xl">Leaderboards</h1>
          <p className="mx-auto mt-2 max-w-md text-white/60">
            Global rankings are on the roadmap. For now, sharpen your speed in practice and race rooms.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="arena-card rounded-[32px] p-12 text-center">
            <div className="mb-6 text-6xl">🏆</div>
            <h2 className="arena-heading text-5xl leading-none text-white">Leaderboard Coming Soon</h2>
            <p className="mx-auto mb-8 mt-4 max-w-md text-white/60">
              Real-time rankings are being wired up with Convex. Until then, keep farming clean runs.
            </p>
            <Link href="/practice" className="arena-button inline-flex px-8 py-4 font-semibold tracking-wide">
              Go to Practice
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="arena-card rounded-[32px] p-6 text-center">
            <div className="mb-4 text-4xl">🥇</div>
            <div className="text-lg font-semibold text-white/60">1st Place</div>
            <div className="mt-1 text-sm text-white/35">Coming soon</div>
          </div>
          <div className="arena-card rounded-[32px] p-6 text-center">
            <div className="mb-4 text-4xl">🥈</div>
            <div className="text-lg font-semibold text-white/60">2nd Place</div>
            <div className="mt-1 text-sm text-white/35">Coming soon</div>
          </div>
          <div className="arena-card rounded-[32px] p-6 text-center">
            <div className="mb-4 text-4xl">🥉</div>
            <div className="text-lg font-semibold text-white/60">3rd Place</div>
            <div className="mt-1 text-sm text-white/35">Coming soon</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
