import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion'

interface GymSummaryProps {
  sessions: number
  volume: number
  streak: number
  topExercise: string
}

function ease(frame: number, start: number, end: number, from: number, to: number) {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })
}

function AnimatedNumber({ value, frame, startFrame }: { value: number; frame: number; startFrame: number }) {
  const displayed = Math.round(ease(frame, startFrame, startFrame + 40, 0, value))
  return <span>{displayed.toLocaleString()}</span>
}

export function GymSummaryComposition({
  sessions = 5,
  volume = 42500,
  streak = 4,
  topExercise = 'Bench Press',
}: Partial<GymSummaryProps>) {
  const frame = useCurrentFrame()
  useVideoConfig()

  const bgOpacity = ease(frame, 0, 20, 0, 1)
  const titleY = ease(frame, 5, 30, 40, 0)
  const titleOpacity = ease(frame, 5, 30, 0, 1)

  const stats = [
    { label: 'Sessions', value: sessions, unit: 'this week' },
    { label: 'Volume', value: volume, unit: 'kg total' },
    { label: 'Streak', value: streak, unit: 'days' },
  ]

  return (
    <AbsoluteFill style={{ background: '#060606', opacity: bgOpacity }}>
      {/* Background grid */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />

      {/* Content */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 60, padding: 80 }}>
        {/* Header */}
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#666', letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 16px' }}>
            Weekly Summary
          </p>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 64, fontWeight: 700, margin: 0, letterSpacing: -3,
            background: 'linear-gradient(135deg, #888 0%, #e8e8e8 45%, #888 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Gym Report
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%' }}>
          {stats.map((s, i) => {
            const appear = ease(frame, i * 10 + 20, i * 10 + 50, 0, 1)
            const yShift = ease(frame, i * 10 + 20, i * 10 + 50, 40, 0)
            return (
              <div key={s.label} style={{ opacity: appear, transform: `translateY(${yShift}px)` }}>
                <div style={{
                  background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 20,
                  padding: '40px 32px', textAlign: 'center',
                  boxShadow: '0 0 40px rgba(192,192,192,0.04)',
                }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 72, fontWeight: 700, letterSpacing: -3,
                    background: 'linear-gradient(135deg, #888 0%, #e8e8e8 45%, #888 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1 }}>
                    <AnimatedNumber value={s.value} frame={frame} startFrame={i * 10 + 20} />
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#888', marginTop: 12, fontWeight: 500 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#555', marginTop: 4 }}>
                    {s.unit}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top exercise */}
        <div style={{ opacity: ease(frame, 70, 90, 0, 1), transform: `translateY(${ease(frame, 70, 90, 20, 0)}px)` }}>
          <div style={{
            background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 16,
            padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c0c0c0' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#888' }}>Top exercise this week:</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#c0c0c0' }}>{topExercise}</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
