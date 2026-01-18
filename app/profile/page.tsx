"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { GridBackground } from "@/components/home/GridBackground"

export default function ProfilePage() {
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
            Your Profile
          </h1>
          <p className="text-white/60 mt-2 max-w-md mx-auto">
            User profiles are coming with our Convex migration
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <Card glow className="p-12 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6">
              👤
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Profile Coming Soon
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              We&apos;re migrating to Convex for user profiles, stats tracking, and match history.
              In the meantime, enjoy practice mode!
            </p>
            <Link
              href="/practice"
              className="inline-flex px-8 py-4 rounded-2xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
            >
              Go to Practice
            </Link>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">What&apos;s Coming</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/60">
                <span className="text-[#f5a524]">•</span>
                Personal stats dashboard
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <span className="text-[#f5a524]">•</span>
                Match history
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <span className="text-[#f5a524]">•</span>
                Achievement badges
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <span className="text-[#f5a524]">•</span>
                Custom profile settings
              </li>
            </ul>
          </div>
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Demo Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-2xl bg-white/5">
                <div className="text-2xl font-bold text-white/40">—</div>
                <div className="text-xs text-white/40 mt-1">Avg WPM</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5">
                <div className="text-2xl font-bold text-white/40">—</div>
                <div className="text-xs text-white/40 mt-1">Best WPM</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5">
                <div className="text-2xl font-bold text-white/40">0</div>
                <div className="text-xs text-white/40 mt-1">Races</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5">
                <div className="text-2xl font-bold text-white/40">—</div>
                <div className="text-xs text-white/40 mt-1">Accuracy</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
