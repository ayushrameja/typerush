"use client"

import Link from "next/link"
import { loadStoredAnon } from "@/lib/stores/identityStore"

export function DataExpiryBanner() {
  const anon = loadStoredAnon()
  if (!anon) return null

  const createdAt = anon.createdAt || Date.now()
  const expiresAt = createdAt + 30 * 24 * 60 * 60 * 1000
  const daysRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
  const isUrgent = daysRemaining <= 7

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${
        isUrgent
          ? "border-[#f0ad4e]/30 bg-[#f0ad4e]/8"
          : "border-white/14 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm">
          {isUrgent ? "\u23F1" : "\u2139\uFE0F"}
        </span>
        <div className="text-sm">
          <span className={isUrgent ? "font-semibold text-[#f0ad4e]" : "text-white/60"}>
            Your anonymous data expires in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}.
          </span>{" "}
          <span className="text-white/50">
            Sign in to keep your history permanently.
          </span>
        </div>
      </div>
      <Link
        href="/login"
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          isUrgent
            ? "bg-[#f0ad4e] text-black hover:bg-[#f0ad4e]/80"
            : "border border-white/14 bg-white/5 text-white/70 hover:bg-white/10"
        }`}
      >
        Sign in
      </Link>
    </div>
  )
}
