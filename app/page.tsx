"use client"

import Link from "next/link"
import { motion } from "framer-motion"
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
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-[#333]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-medium text-white">
            TypeRush
          </Link>

          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/profile"
                      className="text-[#888] hover:text-white transition-colors text-sm"
                    >
                      {profile?.username || "Profile"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-[#888] hover:text-white transition-colors text-sm"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/login"
                      className="text-[#888] hover:text-white transition-colors text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-[#ededed] transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Practice typing.
              <br />
              <span className="text-[#888]">Get faster.</span>
            </h1>
            <p className="text-lg text-[#888] max-w-md mx-auto mb-12">
              Improve your typing speed and accuracy with focused practice sessions. Track your progress over time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-[#ededed] transition-colors"
            >
              Start Practice
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-8 text-center"
          >
            <div>
              <p className="text-3xl font-bold text-white">5</p>
              <p className="text-sm text-[#888] mt-1">Difficulty levels</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">∞</p>
              <p className="text-sm text-[#888] mt-1">Practice texts</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">WPM</p>
              <p className="text-sm text-[#888] mt-1">Track your speed</p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="py-6 text-center text-[#888] text-sm border-t border-[#333]">
        Built with Next.js & Supabase
      </footer>
    </div>
  )
}
