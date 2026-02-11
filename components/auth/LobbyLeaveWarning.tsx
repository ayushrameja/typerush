"use client"

import { motion, AnimatePresence } from "framer-motion"

interface LobbyLeaveWarningProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LobbyLeaveWarning({ isOpen, onConfirm, onCancel }: LobbyLeaveWarningProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-200 flex items-center justify-center bg-[#0d1118]/85 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 w-full max-w-md rounded-2xl border border-white/14 bg-[#0f141d] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#f0ad4e]/30 bg-[#f0ad4e]/10">
              <svg className="h-7 w-7 text-[#f0ad4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="arena-heading text-3xl leading-none text-white text-center mb-2">Leave this lobby?</h3>
            <p className="text-white/58 text-center text-sm mb-8">
              Signing in will remove you from the current race. Your opponent will be notified.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-white/14 bg-white/5 px-4 py-3 font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="arena-button flex-1 px-4 py-3 font-semibold"
              >
                Sign in & Leave
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
