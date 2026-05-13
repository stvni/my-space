import { motion, AnimatePresence } from 'framer-motion'
import { X, Dumbbell } from 'lucide-react'
import { GYM_HISTORY } from '../../data/mockHistory'
import { SectionLabel } from '../ui/Card'

interface Props {
  open: boolean
  onClose: () => void
}

const maxVolume = Math.max(...GYM_HISTORY.map(e => e.volume))

export function GymTimeline({ open, onClose }: Props) {
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
                <Dumbbell size={14} className="text-chrome-dim" />
                <SectionLabel>Gym Verlauf</SectionLabel>
              </div>
              <button onClick={onClose} className="text-chrome-dim hover:text-chrome transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {GYM_HISTORY.map((entry, i) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
                  className="bg-surface2 border border-border rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-chrome-dim">{entry.date.slice(5)}</span>
                    <span className="text-xs text-chrome-dim">{entry.duration}min</span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {entry.muscles.map(m => (
                      <span key={m} className="text-xs px-1.5 py-0.5 bg-surface border border-border rounded text-chrome-dim">{m}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-chrome-dim"
                        initial={{ width: 0 }}
                        animate={{ width: `${(entry.volume / maxVolume) * 100}%` }}
                        transition={{ delay: i * 0.04 + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span className="text-xs font-mono text-chrome shrink-0">{(entry.volume / 1000).toFixed(1)}t</span>
                  </div>
                  <p className="text-xs text-chrome-dim mt-1">{entry.exercises} exercises</p>
                </motion.div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
