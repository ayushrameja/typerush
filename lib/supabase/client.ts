"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("Supabase credentials not configured. Some features will be disabled.")
    return null as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  return createBrowserClient<Database>(url, key)
}
