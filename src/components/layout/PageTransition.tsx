import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { getNavDirection } from '../../store/navDirection'
import { ease } from '../../motion.config'

export function PageTransition({ children }: { children: ReactNode }) {
  const dir = getNavDirection()
  const xIn = dir === 'right' ? 28 : -28
  const xOut = dir === 'right' ? -16 : 16

  return (
    <motion.div
      initial={{ opacity: 0, x: xIn, scale: 0.99, filter: 'blur(4px)' }}
      animate={{
        opacity: 1, x: 0, scale: 1, filter: 'blur(0px)',
        transition: { duration: 0.32, ease: ease.out },
      }}
      exit={{
        opacity: 0, x: xOut, scale: 1.005, filter: 'blur(4px)',
        transition: { duration: 0.2, ease: [0.7, 0, 1, 0.4] as [number, number, number, number] },
      }}
      className="h-full w-full overflow-y-auto"
    >
      {children}
    </motion.div>
  )
}
