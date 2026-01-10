"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { useUserStore } from "@/lib/stores/userStore"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user, profile, isLoading } = useUserStore()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Type
            </span>
            <span className="text-zinc-300">Rush</span>
          </Link>

          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/profile"
                      className="text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {profile?.username || "Profile"}
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-glow">
                Race to Type
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
              Challenge friends in real-time typing battles. Improve your speed,
              track your progress, and climb the global leaderboards.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            <Link href="/practice" className="block">
              <Card
                glow
                className="p-8 h-full cursor-pointer hover:border-cyan-500/50 transition-colors group"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-16 h-16 mb-6 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                  <svg
                    className="w-8 h-8 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-3">
                  Solo Practice
                </h2>
                <p className="text-zinc-500">
                  Train at your own pace. Choose duration and track your
                  improvement over time.
                </p>
              </Card>
            </Link>

            <Link href="/race" className="block">
              <Card
                glow
                className="p-8 h-full cursor-pointer hover:border-purple-500/50 transition-colors group"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-16 h-16 mb-6 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                  <svg
                    className="w-8 h-8 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-3">
                  1v1 Race
                </h2>
                <p className="text-zinc-500">
                  Challenge a friend or find a random opponent. Race through a
                  neon tunnel!
                </p>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center gap-6"
          >
            <Link
              href="/leaderboard"
              className="text-zinc-500 hover:text-cyan-400 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Leaderboards
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="py-8 text-center text-zinc-600 text-sm">
        Built with Next.js, Three.js & Supabase
      </footer>
    </div>
  )
}
