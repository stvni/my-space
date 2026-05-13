export const spring = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 28 },
  smooth: { type: 'spring' as const, stiffness: 180, damping: 22 },
  slow:   { type: 'spring' as const, stiffness: 80,  damping: 20 },
}

export const ease = {
  out:     [0.16, 1, 0.3, 1]     as [number, number, number, number],
  inOut:   [0.25, 0.1, 0.25, 1]  as [number, number, number, number],
  premium: [0.22, 1, 0.36, 1]    as [number, number, number, number],
}

export const hover = { scale: 1.06 }
export const tap   = { scale: 0.97 }
