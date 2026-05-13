import { useEffect, useRef } from 'react'

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number
    let frame = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // [yFrac, speed, amplitude, freq, opacity, lineWidth, rgb]
    const layers: [number, number, number, number, number, number, string][] = [
      [0.12, 0.0004, 22, 0.0025, 0.06, 0.5, '200,200,200'],
      [0.25, 0.0003, 14, 0.003,  0.04, 0.5, '180,180,180'],
      [0.38, 0.0005, 30, 0.002,  0.07, 0.8, '220,220,220'],
      [0.50, 0.0002, 18, 0.0035, 0.03, 0.5, '160,160,160'],
      [0.62, 0.0006, 25, 0.0022, 0.05, 0.5, '200,200,200'],
      [0.74, 0.0003, 12, 0.0028, 0.04, 0.5, '180,180,180'],
      [0.87, 0.0005, 20, 0.002,  0.06, 0.8, '220,220,220'],
    ]

    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1,
      speed: 0.00003 + Math.random() * 0.00004,
      opacity: 0.02 + Math.random() * 0.04,
    }))

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight

    const draw = () => {
      ctx.clearRect(0, 0, W(), H())

      layers.forEach(([yFrac, speed, amp, freq, opacity, lineW, rgb]) => {
        const baseY = yFrac * H()

        // Primary chrome line
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${rgb},${opacity})`
        ctx.lineWidth = lineW
        for (let x = 0; x <= W(); x += 1.5) {
          const y = baseY
            + Math.sin(x * freq + frame * speed * 1000) * amp
            + Math.sin(x * freq * 0.5 + frame * speed * 600) * (amp * 0.3)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Chrome sheen highlight — thinner, brighter, 1px above
        ctx.beginPath()
        ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.4})`
        ctx.lineWidth = lineW * 0.5
        for (let x = 0; x <= W(); x += 1.5) {
          const y = baseY - 1
            + Math.sin(x * freq + frame * speed * 1000) * amp
            + Math.sin(x * freq * 0.5 + frame * speed * 600) * (amp * 0.3)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      // Particles
      particles.forEach(p => {
        p.y -= p.speed
        if (p.y < 0) { p.y = 1; p.x = Math.random() }
        ctx.beginPath()
        ctx.arc(p.x * W(), p.y * H(), p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,200,200,${p.opacity})`
        ctx.fill()
      })

      frame++
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
