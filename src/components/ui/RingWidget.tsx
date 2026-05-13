import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

interface RingWidgetProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  sublabel?: string
  smooth?: boolean
  children?: ReactNode
}

export function RingWidget({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  label,
  sublabel,
  smooth = false,
  children,
}: RingWidgetProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)

  const spring = useSpring(0, { stiffness: 80, damping: 18 })
  const dashOffset = useTransform(spring, (v) => circumference * (1 - v))

  useEffect(() => {
    if (!smooth) spring.set(pct)
  }, [pct, spring, smooth])

  const smoothOffset = circumference * (1 - pct)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={strokeWidth}
        />
        {smooth ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={smoothOffset}
            style={{ transition: 'stroke-dashoffset 1s linear', willChange: 'stroke-dashoffset' }}
          />
        ) : (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            {label && <span className="text-chrome-bright font-semibold text-sm leading-tight">{label}</span>}
            {sublabel && <span className="text-chrome-dim text-xs mt-0.5">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  )
}
