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
        relative rounded-2xl
        bg-zinc-900/80 backdrop-blur-sm
        border border-zinc-800
        ${glow ? "shadow-lg shadow-cyan-500/10" : ""}
        ${className}
      `}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl" />
      )}
      {children}
    </motion.div>
  )
}
