import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion'

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v))
}

function ei(frame: number, s: number, e: number, from: number, to: number) {
  return interpolate(frame, [s, e], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function computeGreeting(): string {
  const hour = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })
  ).getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 22) return 'Good Evening'
  return 'Good Night'
}

const GREETING = computeGreeting()
const LETTERS = ['M', 'Y', ' ', 'S', 'P', 'A', 'C', 'E']

export function DashboardIntro() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Phase 1 (0–15): shockwave ring
  const ringScale = ei(frame, 0, 15, 0, 22)
  const ringOpacity = ei(frame, 0, 15, 0.7, 0)
  const dotOpacity = ei(frame, 0, 4, 0, 1) * ei(frame, 10, 15, 1, 0)

  // Phase 2 (15–45): letters stagger in with spring
  const lettersVisible = frame >= 15

  // Phase 3 (45–65): line draws + greeting blur
  const lineScale = ei(frame, 45, 65, 0, 1)
  const lineOpacity = ei(frame, 45, 50, 0, 1)
  const greetingOpacity = ei(frame, 50, 65, 0, 1)
  const greetingBlur = ei(frame, 50, 65, 8, 0)

  // Phase 4 (65–90): scale down + fade to black
  const globalScale = ei(frame, 65, 90, 1, 0.96)
  const globalOpacity = ei(frame, 65, 90, 1, 0)

  return (
    <AbsoluteFill style={{ background: '#060606' }}>
      {/* Dot grid bg */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, #161616 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.6,
      }} />

      <AbsoluteFill style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        transform: `scale(${globalScale})`,
        opacity: globalOpacity,
      }}>
        {/* Shockwave ring */}
        <div style={{
          position: 'absolute',
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '1.5px solid #c8c8c8',
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
          pointerEvents: 'none',
        }} />

        {/* Center dot */}
        <div style={{
          position: 'absolute',
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#e8e8e8',
          opacity: dotOpacity,
          boxShadow: '0 0 12px #c8c8c8',
        }} />

        {/* Wordmark */}
        {lettersVisible && (
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 20, gap: 0 }}>
            {LETTERS.map((letter, i) => {
              const s = clamp(spring({
                frame: frame - 15 - i * 4,
                fps,
                config: { stiffness: 200, damping: 18 },
              }))
              return (
                <span key={i} style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 58,
                  fontWeight: 700,
                  letterSpacing: -1,
                  display: 'inline-block',
                  transform: `scale(${s})`,
                  opacity: s,
                  color: '#c8c8c8',
                  width: letter === ' ' ? 20 : undefined,
                }}>
                  {letter}
                </span>
              )
            })}
          </div>
        )}

        {/* Divider line */}
        {frame >= 45 && (
          <div style={{
            width: 200,
            height: 1,
            background: '#333',
            opacity: lineOpacity,
            transform: `scaleX(${lineScale})`,
            transformOrigin: 'left center',
            marginBottom: 16,
          }} />
        )}

        {/* Greeting */}
        {frame >= 50 && (
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 400,
            color: '#666',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
            opacity: greetingOpacity,
            filter: `blur(${greetingBlur}px)`,
          }}>
            {GREETING}, Stefano
          </p>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
