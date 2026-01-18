"use client"

import { useEffect } from "react"
import { useUserStore } from "@/lib/stores/userStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading } = useUserStore()

  useEffect(() => {
    setLoading(false)
  }, [setLoading])

  return <>{children}</>
}
