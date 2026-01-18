"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card glow className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Sign Up Coming Soon
            </h1>
            <p className="text-zinc-400 mt-2">
              We&apos;re migrating to Convex for authentication
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70">
                Account creation is temporarily disabled while we migrate to Convex.
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full py-4 rounded-2xl bg-white/20 text-white/40 font-medium cursor-not-allowed"
            >
              Create Account (Coming Soon)
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-zinc-900 text-zinc-500">
                  in the meantime
                </span>
              </div>
            </div>

            <Link
              href="/practice"
              className="block w-full py-4 rounded-2xl bg-white text-black font-medium text-center hover:bg-white/90 transition-colors"
            >
              Try Practice Mode
            </Link>
          </div>

          <p className="text-center text-zinc-500 mt-6">
            Practice mode works without an account!
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
