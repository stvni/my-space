import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart } from 'lucide-react'
import { HEALTH_HISTORY } from '../../data/mockHistory'
import { SectionLabel } from '../ui/Card'

interface Props {
  open: boolean
  onClose: () => void
}

function moodColor(m: number) {
  if (m >= 8) return '#22c55e'
  if (m >= 6) return '#f97316'
  return '#ef4444'
}

export function HealthTimeline({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-bg/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-80 z-50 bg-surface border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-chrome-dim" />
                <SectionLabel>Health Verlauf</SectionLabel>
              </div>
              <button onClick={onClose} className="text-chrome-dim hover:text-chrome transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {HEALTH_HISTORY.map((entry, i) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 28 }}
                  className="bg-surface2 border border-border rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-chrome-dim">{entry.date.slice(5)}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: moodColor(entry.mood) }} />
                      <span className="text-xs text-chrome-dim">{entry.mood}/10</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      { label: 'kg', value: entry.weight.toFixed(1), color: '#c0c0c0' },
                      { label: 'hr', value: entry.sleep.toFixed(1), color: '#8b5cf6' },
                      { label: 'H₂O', value: String(entry.water), color: '#3b82f6' },
                      { label: 'k steps', value: (entry.steps / 1000).toFixed(1), color: '#22c55e' },
                    ].map(m => (
                      <div key={m.label} className="bg-surface rounded-lg p-1.5 text-center">
                        <p className="text-xs font-mono font-medium" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-[10px] text-chrome-dim">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-chrome-dim">
                    <span>AM <span className="text-chrome">{entry.amDone}/{entry.amTotal}</span></span>
                    <span>PM <span className="text-chrome">{entry.pmDone}/{entry.pmTotal}</span></span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
