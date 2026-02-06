"use client"

import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { ConvexReactClient } from "convex/react"
import { useMemo } from "react"

const localConvexUrl = "http://127.0.0.1:3210"

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    const configuredUrl = process.env.NEXT_PUBLIC_CONVEX_URL

    if (!configuredUrl && process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Falling back to local Convex deployment at http://127.0.0.1:3210."
      )
    }

    return new ConvexReactClient(configuredUrl ?? localConvexUrl)
  }, [])

  return (
    <ConvexAuthProvider client={client}>
      {children}
    </ConvexAuthProvider>
  )
}
