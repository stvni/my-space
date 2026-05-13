import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
} from 'remotion'

function ease(frame: number, start: number, end: number, from: number, to: number) {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })
}

function ChromeText({ children, style }: { children: string; style?: React.CSSProperties }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #888 0%, #e8e8e8 45%, #c0c0c0 65%, #888 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...style,
    }}>
      {children}
    </span>
  )
}

function Screen1() {
  const frame = useCurrentFrame()
  const logoScale = ease(frame, 0, 20, 0.6, 1)
  const logoOpacity = ease(frame, 0, 15, 0, 1)
  const titleY = ease(frame, 10, 35, 30, 0)
  const titleOpacity = ease(frame, 10, 35, 0, 1)
  const subY = ease(frame, 20, 45, 24, 0)
  const subOpacity = ease(frame, 20, 45, 0, 1)

  return (
    <AbsoluteFill style={{ background: '#060606', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      {/* Logo mark */}
      <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: '#0f0f0f',
          border: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(192,192,192,0.08)',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#c0c0c0' }}>MS</span>
        </div>
      </div>

      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 48, fontWeight: 600, margin: 0, letterSpacing: -2 }}>
          <ChromeText>My Space</ChromeText>
        </h1>
      </div>

      <div style={{ opacity: subOpacity, transform: `translateY(${subY}px)` }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#888', letterSpacing: 1, margin: 0 }}>
          Your personal dashboard
        </p>
      </div>
    </AbsoluteFill>
  )
}

function Screen2() {
  const frame = useCurrentFrame()

  const modules = [
    { icon: '◉', label: 'Dashboard' },
    { icon: '◈', label: 'Kalender' },
    { icon: '◎', label: 'ZHAW Hub' },
    { icon: '◆', label: 'Gym' },
    { icon: '◇', label: 'Food' },
    { icon: '♡', label: 'Health' },
    { icon: '◈', label: 'Style' },
  ]

  return (
    <AbsoluteFill style={{ background: '#060606', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40 }}>
      <div style={{ opacity: ease(frame, 0, 20, 0, 1), transform: `translateY(${ease(frame, 0, 20, -20, 0)}px)`, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#888', letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 12px' }}>
          Seven modules
        </p>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 600, margin: 0, letterSpacing: -1 }}>
          <ChromeText>Everything in one place</ChromeText>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: 380 }}>
        {modules.map((m, i) => {
          const appear = ease(frame, i * 5 + 5, i * 5 + 20, 0, 1)
          const yShift = ease(frame, i * 5 + 5, i * 5 + 20, 20, 0)
          return (
            <div key={m.label} style={{ opacity: appear, transform: `translateY(${yShift}px)` }}>
              <div style={{
                background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 12,
                padding: '16px 8px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
              }}>
                <span style={{ fontSize: 20, color: '#888' }}>{m.icon}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#666', letterSpacing: 0.5 }}>{m.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function Screen3() {
  const frame = useCurrentFrame()

  const features = ['Offline first', 'IndexedDB sync', 'Push notifications', 'Installable PWA']

  return (
    <AbsoluteFill style={{ background: '#060606', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 48 }}>
      <div style={{ opacity: ease(frame, 0, 20, 0, 1), transform: `translateY(${ease(frame, 0, 20, -20, 0)}px)`, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 36, fontWeight: 600, margin: 0, letterSpacing: -1 }}>
          <ChromeText>Built for you</ChromeText>
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666', margin: '12px 0 0' }}>
          Precision-crafted. Always available.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 280 }}>
        {features.map((f, i) => {
          const appear = ease(frame, i * 6 + 8, i * 6 + 22, 0, 1)
          const xShift = ease(frame, i * 6 + 8, i * 6 + 22, -20, 0)
          return (
            <div key={f} style={{ opacity: appear, transform: `translateX(${xShift}px)` }}>
              <div style={{
                background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 10,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c0c0c0' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#c0c0c0' }}>{f}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ opacity: ease(frame, 40, 55, 0, 1) }}>
        <div style={{
          background: 'linear-gradient(135deg, #888 0%, #e8e8e8 45%, #888 100%)',
          borderRadius: 12, padding: '14px 40px', cursor: 'pointer',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: '#060606' }}>
            Get started →
          </span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function OnboardingComposition() {
  const { fps } = useVideoConfig()
  const screenDuration = 3 * fps

  return (
    <AbsoluteFill style={{ background: '#060606' }}>
      <Sequence from={0} durationInFrames={screenDuration}>
        <Screen1 />
      </Sequence>
      <Sequence from={screenDuration} durationInFrames={screenDuration}>
        <Screen2 />
      </Sequence>
      <Sequence from={screenDuration * 2} durationInFrames={screenDuration}>
        <Screen3 />
      </Sequence>
    </AbsoluteFill>
  )
}
