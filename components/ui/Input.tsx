"use client"

import { forwardRef, InputHTMLAttributes } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/58">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-2xl border border-white/14 bg-[#10141b]/90 px-4 py-3
            text-white placeholder:text-white/35
            focus:outline-none focus:ring-2 focus:ring-[#ff4655]/40 focus:border-[#ff4655]/55
            transition-all duration-200
            ${error ? "border-[#ff5f6b] focus:ring-[#ff5f6b]/35" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-[#ff858f]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"
