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
        relative rounded-[32px]
        bg-zinc-900/80 backdrop-blur-sm
        border border-zinc-800
        ${glow ? "shadow-lg shadow-[#f5a524]/10" : ""}
        ${className}
      `}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 -z-10 rounded-[32px] bg-linear-to-r from-[#f5a524]/20 to-white/5 blur-xl" />
      )}
      {children}
    </motion.div>
  )
}
