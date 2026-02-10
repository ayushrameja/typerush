"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { GridBackground } from "@/components/home/GridBackground"

export default function ProfilePage() {
  return (
    <div className="arena-shell px-4 pb-20 pt-28">
      <GridBackground />
      <div className="relative mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="arena-chip">Coming soon</div>
          <h1 className="arena-heading mt-5 text-7xl leading-none text-white md:text-8xl">Your Profile</h1>
          <p className="mx-auto mt-2 max-w-md text-white/60">Profiles and long-term stats are shipping with the Convex migration.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <Card glow className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/6 text-4xl">
              👤
            </div>
            <h2 className="arena-heading text-5xl leading-none text-white">Profile Coming Soon</h2>
            <p className="mx-auto mb-8 mt-4 max-w-md text-white/60">
              We&apos;re wiring profile stats, match history, and custom identity settings. Yes, eventually your ego gets a dashboard.
            </p>
            <Link href="/practice" className="arena-button inline-flex px-8 py-4 font-semibold tracking-wide">
              Go to Practice
            </Link>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div className="arena-card rounded-[32px] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">What&apos;s Coming</h3>
            <ul className="space-y-3 text-white/66">
              <li className="flex items-center gap-3">
                <span className="text-[#ff8f9a]">•</span>
                Personal stats dashboard
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#ff8f9a]">•</span>
                Match history
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#ff8f9a]">•</span>
                Achievement badges
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#ff8f9a]">•</span>
                Custom profile settings
              </li>
            </ul>
          </div>
          <div className="arena-card rounded-[32px] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Preview Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-white/45">—</div>
                <div className="mt-1 text-xs text-white/42">Avg WPM</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-white/45">—</div>
                <div className="mt-1 text-xs text-white/42">Best WPM</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-white/45">0</div>
                <div className="mt-1 text-xs text-white/42">Races</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-white/45">—</div>
                <div className="mt-1 text-xs text-white/42">Accuracy</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
