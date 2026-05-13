import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  delay?: number
}

export const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

export function Card({ children, className, onClick, delay = 0 }: CardProps) {
  return (
    <motion.div
      custom={delay}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      className={clsx(
        'bg-surface border border-border rounded-xl p-4 card-hover',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-mono text-chrome-dim uppercase tracking-widest">
      {children}
    </span>
  )
}

interface AnimatedBarProps {
  value: number
  max: number
  color?: string
  delay?: number
  height?: number
}

export function AnimatedBar({ value, max, color = '#c0c0c0', delay = 0, height = 4 }: AnimatedBarProps) {
  const pct = Math.min(value / Math.max(max, 1), 1)
  return (
    <div className="w-full bg-surface2 rounded-full overflow-hidden" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      />
    </div>
  )
}
