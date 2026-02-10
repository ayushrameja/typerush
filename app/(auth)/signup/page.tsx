"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth } from "convex/react"
import { Card } from "@/components/ui/Card"
import { GridBackground } from "@/components/home/GridBackground"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/")
    }
  }, [router, isAuthenticated])

  return (
    <div className="arena-shell flex min-h-screen items-center justify-center px-4">
      <GridBackground />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card glow className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">✨</div>
            <h1 className="arena-heading text-6xl leading-none text-white">Create account</h1>
            <p className="mt-2 text-white/58">Use Google to create your profile</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => void signIn("google")}
              className="arena-button w-full py-4 font-semibold tracking-wide"
            >
              Sign up with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/12" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0f131b] px-4 text-white/45">or</span>
              </div>
            </div>

            <Link
              href="/practice"
              className="arena-button-secondary block w-full py-4 text-center font-semibold tracking-wide"
            >
              Continue to Practice
            </Link>
          </div>

          <p className="mt-6 text-center text-white/48">You can still use practice mode without signing in.</p>
        </Card>
      </motion.div>
    </div>
  )
}
