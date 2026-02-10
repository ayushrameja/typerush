"use client"

import { ReactNode } from "react"
import { motion, HTMLMotionProps } from "framer-motion"

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  glow?: boolean
  children?: ReactNode
}

export function Card({
  glow = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-[28px] arena-card
        ${glow ? "shadow-[0_24px_60px_-42px_rgba(255,70,85,0.95)]" : ""}
        ${className}
      `}
      {...props}
    >
      {glow && (
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] bg-linear-to-r from-[#ff4655]/20 to-transparent blur-2xl" />
      )}
      {children}
    </motion.div>
  )
}
