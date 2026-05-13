import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import logo from '../assets/logo.svg'

interface Props { onDone: () => void }

function getGreeting() {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })).getHours()
  if (h >= 5 && h < 12) return 'Good Morning'
  if (h >= 12 && h < 14) return 'Good Midday'
  if (h >= 14 && h < 18) return 'Good Afternoon'
  if (h >= 18 && h < 23) return 'Good Evening'
  return 'Good Night'
}

export function IntroScreen({ onDone }: Props) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => { setPhase(4); onDone() }, 4000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  if (phase === 4) return null

  return (
    <motion.div
      animate={{ opacity: phase === 3 ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#060606',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24,
      }}
    >
      {/* Skip */}
      <button
        onClick={onDone}
        style={{
          position: 'absolute', bottom: 32, right: 32,
          background: 'transparent', border: '0.5px solid #252525',
          color: '#444', padding: '6px 16px', borderRadius: 7,
          fontSize: 10, cursor: 'pointer', letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Skip
      </button>

      {/* Logo */}
      <motion.img
        src={logo}
        alt="My Space"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        style={{ width: 56, height: 56 }}
      />

      {/* MY SPACE letters */}
      {phase >= 1 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {'MY SPACE'.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 200, damping: 18 }}
              style={{
                fontSize: char === ' ' ? 16 : 32,
                fontWeight: 500,
                color: '#c8c8c8',
                letterSpacing: '0.1em',
                display: 'inline-block',
              }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          ))}
        </div>
      )}

      {/* Chrome line */}
      {phase >= 1 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          style={{ height: 0.5, background: '#333', marginTop: -16 }}
        />
      )}

      {/* Greeting */}
      {phase >= 2 && (
        <motion.div
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7 }}
          style={{ fontSize: 14, color: '#555', letterSpacing: '0.06em' }}
        >
          {getGreeting()}, Stefano
        </motion.div>
      )}
    </motion.div>
  )
}
