"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth } from "convex/react"
import { Card } from "@/components/ui/Card"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/")
    }
  }, [router, isAuthenticated])

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
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Sign in
            </h1>
            <p className="text-zinc-400 mt-2">Use Google to continue</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => void signIn("google")}
              className="w-full py-4 rounded-2xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
            >
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-zinc-900 text-zinc-500">or</span>
              </div>
            </div>

            <Link
              href="/practice"
              className="block w-full py-4 rounded-2xl bg-white/10 text-white font-medium text-center hover:bg-white/20 transition-colors"
            >
              Continue to Practice
            </Link>
          </div>

          <p className="text-center text-zinc-500 mt-6">
            Multiplayer requires a Google login.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
