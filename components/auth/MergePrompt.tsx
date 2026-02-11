"use client"

import { motion, AnimatePresence } from "framer-motion"

interface MergePromptProps {
  anonymousRaceCount: number
  anonymousBestWpm: number
  anonymousPracticeCount: number
  anonymousPracticeBestWpm: number
  onMerge: () => Promise<void>
  onFresh: () => void
  isLoading: boolean
}

export function MergePrompt({
  anonymousRaceCount,
  anonymousBestWpm,
  anonymousPracticeCount,
  anonymousPracticeBestWpm,
  onMerge,
  onFresh,
  isLoading,
}: MergePromptProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-9999 flex items-center justify-center bg-[#090b0f]/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mx-4 w-full max-w-md rounded-3xl border border-white/14 bg-[#0f131b] p-8 shadow-2xl"
        >
          <h2 className="arena-heading text-4xl leading-none text-white text-center">
            Welcome back!
          </h2>
          <p className="mt-3 text-center text-white/60">
            We found data from your anonymous session:
          </p>

          <div className="mt-6 space-y-3">
            {anonymousRaceCount > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">&#127937;</span>
                  <span className="text-sm text-white/80">
                    {anonymousRaceCount} multiplayer {anonymousRaceCount === 1 ? "race" : "races"}
                  </span>
                </div>
                {anonymousBestWpm > 0 && (
                  <span className="text-sm font-semibold text-[#ff9ea7]">
                    Best: {anonymousBestWpm} WPM
                  </span>
                )}
              </div>
            )}

            {anonymousPracticeCount > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">&#9000;&#65039;</span>
                  <span className="text-sm text-white/80">
                    {anonymousPracticeCount} practice {anonymousPracticeCount === 1 ? "session" : "sessions"}
                  </span>
                </div>
                {anonymousPracticeBestWpm > 0 && (
                  <span className="text-sm font-semibold text-[#ff9ea7]">
                    Best: {anonymousPracticeBestWpm} WPM
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-sm text-white/50">
            Would you like to add this to your account?
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onFresh}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-white/14 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Start Fresh
            </button>
            <button
              onClick={() => void onMerge()}
              disabled={isLoading}
              className="arena-button flex-1 px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  />
                  Merging...
                </span>
              ) : (
                "Merge & Keep"
              )}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
            <p className="text-xs text-white/40 text-center">
              Merging will combine anonymous stats with your existing account data. This cannot be undone.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
