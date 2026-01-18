"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { GridBackground } from "@/components/home/GridBackground"

export default function LeaderboardPage() {
  return (
    <div className="relative min-h-screen px-4 pt-28 pb-20">
      <GridBackground />
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            Coming soon
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Leaderboards
          </h1>
          <p className="text-white/60 mt-2 max-w-md mx-auto">
            Global rankings are coming with our Convex migration. Stay tuned!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="glass-panel rounded-[32px] p-12 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Leaderboards Coming Soon
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              We&apos;re migrating to Convex for real-time leaderboards. 
              In the meantime, practice your typing skills!
            </p>
            <Link
              href="/practice"
              className="inline-flex px-8 py-4 rounded-2xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
            >
              Go to Practice
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="glass-panel rounded-[32px] p-6 text-center">
            <div className="text-4xl mb-4">🥇</div>
            <div className="text-lg font-semibold text-white/50">1st Place</div>
            <div className="text-sm text-white/30 mt-1">Coming soon</div>
          </div>
          <div className="glass-panel rounded-[32px] p-6 text-center">
            <div className="text-4xl mb-4">🥈</div>
            <div className="text-lg font-semibold text-white/50">2nd Place</div>
            <div className="text-sm text-white/30 mt-1">Coming soon</div>
          </div>
          <div className="glass-panel rounded-[32px] p-6 text-center">
            <div className="text-4xl mb-4">🥉</div>
            <div className="text-lg font-semibold text-white/50">3rd Place</div>
            <div className="text-sm text-white/30 mt-1">Coming soon</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
