"use client"

import { useState, useRef, useEffect } from "react"
import { useIdentityStore, saveStoredAnon, loadStoredAnon } from "@/lib/stores/identityStore"

interface UsernameEditorProps {
  currentName: string
  discriminator: string
  onSave: (newName: string) => Promise<void>
}

export function UsernameEditor({ currentName, discriminator, onSave }: UsernameEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateUsername } = useIdentityStore()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === currentName) {
      setEditing(false)
      setValue(currentName)
      return
    }

    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("2-20 characters")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Letters, numbers, _ only")
      return
    }

    setSaving(true)
    setError("")

    try {
      await onSave(trimmed)
      updateUsername(trimmed)

      const stored = loadStoredAnon()
      if (stored) {
        saveStoredAnon({ ...stored, username: trimmed })
      }

      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSave()
    }
    if (e.key === "Escape") {
      setValue(currentName)
      setEditing(false)
      setError("")
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void handleSave()}
          onKeyDown={handleKeyDown}
          maxLength={20}
          disabled={saving}
          className="w-36 rounded-lg border border-white/20 bg-white/8 px-2.5 py-1 text-sm font-semibold text-white outline-none transition-colors focus:border-[#ff4655]/60"
        />
        <span className="text-sm text-white/40">#{discriminator}</span>
        {error && <span className="text-xs text-[#ff6876]">{error}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 transition-colors"
    >
      <span className="text-sm font-semibold text-white">{currentName}</span>
      <span className="text-sm text-white/40">#{discriminator}</span>
      <svg
        className="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-white/60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
  )
}
