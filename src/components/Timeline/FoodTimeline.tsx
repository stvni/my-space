import { motion, AnimatePresence } from 'framer-motion'
import { X, UtensilsCrossed } from 'lucide-react'
import { FOOD_HISTORY } from '../../data/mockHistory'
import { SectionLabel } from '../ui/Card'

interface Props {
  open: boolean
  onClose: () => void
}

const MACRO_COLORS = { protein: '#22c55e', carbs: '#3b82f6', fat: '#f97316' }
const maxCals = Math.max(...FOOD_HISTORY.map(e => e.calories))

export function FoodTimeline({ open, onClose }: Props) {
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
                <UtensilsCrossed size={14} className="text-chrome-dim" />
                <SectionLabel>Food Verlauf</SectionLabel>
              </div>
              <button onClick={onClose} className="text-chrome-dim hover:text-chrome transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {FOOD_HISTORY.map((entry, i) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 28 }}
                  className="bg-surface2 border border-border rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-chrome-dim">{entry.date.slice(5)}</span>
                    <span className="text-xs font-mono text-chrome">{entry.calories} kcal</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden flex mb-2">
                    {(['protein', 'carbs', 'fat'] as const).map(macro => (
                      <motion.div
                        key={macro}
                        style={{ background: MACRO_COLORS[macro] }}
                        className="h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(entry[macro] / (entry.protein + entry.carbs + entry.fat)) * 100}%` }}
                        transition={{ delay: i * 0.035 + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-chrome-dim">
                    <span><span className="text-green-400">{entry.protein}g</span> P</span>
                    <span><span className="text-blue-400">{entry.carbs}g</span> C</span>
                    <span><span className="text-orange-400">{entry.fat}g</span> F</span>
                  </div>
                  <div className="mt-2 h-0.5 bg-surface rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-chrome-dim/40 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(entry.calories / maxCals) * 100}%` }}
                      transition={{ delay: i * 0.035 + 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
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
