import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { HealthVerlauf } from '../../components/Timeline/HealthVerlauf'
import { today } from '../../utils/date'
import {
  getHealthLog, upsertHealthLog, getHealthGoals, upsertHealthGoals,
} from '../../lib/dataService'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

const SPRING = { type: 'spring', stiffness: 400, damping: 25 } as const

const DEFAULT_GOALS = {
  calories: 2600, protein: 150, carbs: 330, fat: 75,
  water: 3.0, weight: 72, steps: 10000, sleep: 8,
}

type GoalKeys = keyof typeof DEFAULT_GOALS

export function Health() {
  const [tab, setTab] = useState<'heute' | 'verlauf' | 'ziele'>('heute')
  const [metrics, setMetrics] = useState({ weight: 0, sleep: 0, water: 0, mood: 5, steps: 0 })
  const [goals, setGoals] = useState(DEFAULT_GOALS)

  const loadData = useCallback(async () => {
    const [log, savedGoals] = await Promise.all([
      getHealthLog(today()),
      getHealthGoals(),
    ])
    if (log) {
      setMetrics({
        weight: log.weight ?? 0,
        sleep:  log.sleep  ?? 0,
        water:  log.water  ?? 0,
        mood:   log.mood   ?? 5,
        steps:  log.steps  ?? 0,
      })
    }
    if (savedGoals) {
      setGoals({
        calories: savedGoals.calories,
        protein:  savedGoals.protein  ?? DEFAULT_GOALS.protein,
        carbs:    savedGoals.carbs    ?? DEFAULT_GOALS.carbs,
        fat:      savedGoals.fat      ?? DEFAULT_GOALS.fat,
        water:    savedGoals.water,
        weight:   savedGoals.weight,
        steps:    savedGoals.steps,
        sleep:    savedGoals.sleep,
      })
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useRealtimeSync('health_logs', loadData)

  const saveMetrics = async () => {
    await upsertHealthLog({ date: today(), ...metrics })
  }

  const updateGoal = async (key: GoalKeys, delta: number) => {
    const next = { ...goals, [key]: Math.max(0, +(goals[key] + delta).toFixed(2)) }
    setGoals(next)
    await upsertHealthGoals(next)
  }

  const METRICS_CONFIG = [
    { key: 'weight', label: 'Weight', unit: 'kg',    max: goals.weight * 1.5 || 120, color: '#c0c0c0', step: 0.1 },
    { key: 'sleep',  label: 'Sleep',  unit: 'hrs',   max: goals.sleep * 1.25 || 10,  color: '#8b5cf6', step: 0.5 },
    { key: 'water',  label: 'Water',  unit: 'L',     max: goals.water,                color: '#3b82f6', step: 0.25 },
    { key: 'steps',  label: 'Steps',  unit: 'steps', max: goals.steps,                color: '#22c55e', step: 100 },
  ]

  const GOALS_CONFIG: { key: GoalKeys; label: string; unit: string; step: number; hint: string }[] = [
    { key: 'calories', label: 'Kalorienziel',  unit: 'kcal', step: 50,   hint: 'Lean Bulk — Überschuss' },
    { key: 'protein',  label: 'Protein',        unit: 'g',    step: 5,    hint: '2.2g × Körpergewicht' },
    { key: 'carbs',    label: 'Kohlenhydrate',  unit: 'g',    step: 5,    hint: 'Energie für Training' },
    { key: 'fat',      label: 'Fett',           unit: 'g',    step: 2.5,  hint: 'Hormone & Erholung' },
    { key: 'water',    label: 'Hydration',      unit: 'L',    step: 0.25, hint: 'inkl. Training' },
    { key: 'weight',   label: 'Zielgewicht',    unit: 'kg',   step: 0.5,  hint: 'Zielgewicht' },
    { key: 'steps',    label: 'Steps',          unit: '/Tag', step: 500,  hint: 'Tägliche Schritte' },
    { key: 'sleep',    label: 'Schlaf',         unit: 'h',    step: 0.5,  hint: 'Erholungsschlaf' },
  ]

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-6">
          <div>
            <SectionLabel>Health</SectionLabel>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="chrome-text text-2xl font-semibold">Daily Metrics</h1>
            </div>
          </div>
          <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
            {(['heute', 'verlauf', 'ziele'] as const).map(t => (
              <motion.button key={t} onClick={() => setTab(t)}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                {t === 'heute' ? 'Heute' : t === 'verlauf' ? 'Verlauf' : 'Ziele'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === 'heute' && (
            <motion.div key="heute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                {METRICS_CONFIG.map((m, i) => (
                  <motion.div
                    key={m.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    style={{
                      background: '#0d0d0d', border: '0.5px solid #1a1a1a',
                      borderRadius: 12, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#333', textTransform: 'uppercase', marginBottom: 4 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 500, color: m.color, lineHeight: 1.1 }}>
                        {metrics[m.key as keyof typeof metrics]}
                      </div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{m.unit}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }} transition={SPRING}
                        onClick={() => setMetrics(prev => {
                          const curr = prev[m.key as keyof typeof prev] as number
                          return { ...prev, [m.key]: Math.max(0, +(curr - m.step).toFixed(2)) }
                        })}
                        style={{ width: 36, height: 36, borderRadius: 8, border: '0.5px solid #252525',
                          background: 'transparent', color: '#666', fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }} transition={SPRING}
                        onClick={() => setMetrics(prev => {
                          const curr = prev[m.key as keyof typeof prev] as number
                          return { ...prev, [m.key]: +(curr + m.step).toFixed(2) }
                        })}
                        style={{ width: 36, height: 36, borderRadius: 8, border: '0.5px solid #252525',
                          background: 'transparent', color: '#666', fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                    </div>
                  </motion.div>
                ))}

                <Card delay={0.32}>
                  <SectionLabel>Mood</SectionLabel>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                      <motion.button key={v} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                        onClick={() => setMetrics(m => ({ ...m, mood: v }))}
                        className={`w-9 h-9 rounded-lg border text-xs font-medium transition-all ${
                          metrics.mood === v ? 'border-chrome/40 text-chrome-bright bg-surface2' : 'border-border text-chrome-dim hover:border-chrome/20'
                        }`}>
                        {v}
                      </motion.button>
                    ))}
                  </div>
                </Card>

                <motion.button onClick={saveMetrics}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className="w-full py-2.5 bg-surface2 border border-border rounded-xl text-sm text-chrome hover:border-chrome/30 transition-colors">
                  Save Today's Metrics
                </motion.button>
              </div>
            </motion.div>
          )}

          {tab === 'verlauf' && (
            <motion.div key="verlauf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HealthVerlauf onBack={() => setTab('heute')} />
            </motion.div>
          )}

          {tab === 'ziele' && (
            <motion.div key="ziele" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ background: '#0d0d0d', border: '0.5px solid #1a1a1a', borderRadius: 12, padding: '4px 16px' }}>
                <p className="text-xs text-chrome-dim" style={{ padding: '10px 0 6px', borderBottom: '0.5px solid #1a1a1a' }}>
                  Tagesziele — werden als Referenz in der App verwendet.
                </p>
                {GOALS_CONFIG.map((g, i) => (
                  <div key={g.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < GOALS_CONFIG.length - 1 ? '0.5px solid #1a1a1a' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#888' }}>{g.label}</div>
                      <div style={{ fontSize: 9, color: '#333', marginTop: 2, letterSpacing: '0.1em' }}>{g.hint}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={SPRING}
                        onClick={() => updateGoal(g.key, -g.step)}
                        style={{ width: 28, height: 28, border: '0.5px solid #252525', borderRadius: 6,
                          background: 'transparent', color: '#555', fontSize: 16, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#c8c8c8', minWidth: 80, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {+goals[g.key].toFixed(2)} {g.unit}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={SPRING}
                        onClick={() => updateGoal(g.key, g.step)}
                        style={{ width: 28, height: 28, border: '0.5px solid #252525', borderRadius: 6,
                          background: 'transparent', color: '#666', fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
