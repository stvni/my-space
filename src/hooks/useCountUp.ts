import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    start.current = null
    const step = (ts: number) => {
      if (start.current === null) start.current = ts
      const progress = Math.min((ts - start.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target
      setValue(decimals > 0 ? Math.round(current * 10 ** decimals) / 10 ** decimals : Math.round(current))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, decimals])

  return value
}
