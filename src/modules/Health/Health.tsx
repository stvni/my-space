import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { db, type HealthGoals } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { HealthVerlauf } from '../../components/Timeline/HealthVerlauf'
import { today } from '../../utils/date'

const SPRING = { type: 'spring', stiffness: 400, damping: 25 } as const

const DEFAULT_GOALS: Omit<HealthGoals, 'id'> = { calories: 2200, water: 8, weight: 70, steps: 10000, sleep: 8 }

export function Health() {
  const [tab, setTab] = useState<'heute' | 'verlauf' | 'ziele'>('heute')
  const [metrics, setMetrics] = useState({ weight: 0, sleep: 0, water: 0, mood: 5, steps: 0 })
  const [goals, setGoals] = useState(DEFAULT_GOALS)

  const todayMetrics = useLiveQuery(() => db.healthMetrics.where('date').equals(today()).first(), [])
  const profile = useLiveQuery(() => db.profile.toArray().then(arr => arr[0]), [])
  const savedGoals = useLiveQuery(() => db.healthGoals.get(1), [])

  useEffect(() => {
    if (todayMetrics) {
      setMetrics({
        weight: todayMetrics.weight ?? (profile?.weight ?? 0),
        sleep: todayMetrics.sleep ?? 0,
        water: todayMetrics.water ?? 0,
        mood: todayMetrics.mood ?? 5,
        steps: todayMetrics.steps ?? 0,
      })
    } else if (profile && metrics.weight === 0) {
      setMetrics(prev => ({ ...prev, weight: profile.weight }))
    }
  }, [todayMetrics, profile])

  useEffect(() => {
    if (savedGoals) setGoals({ calories: savedGoals.calories, water: savedGoals.water, weight: savedGoals.weight, steps: savedGoals.steps, sleep: savedGoals.sleep })
  }, [savedGoals])

  const saveMetrics = async () => {
    const existing = await db.healthMetrics.where('date').equals(today()).first()
    if (existing) {
      await db.healthMetrics.update(existing.id!, { ...metrics, date: today() })
    } else {
      await db.healthMetrics.add({ ...metrics, date: today() })
    }
  }

  const updateGoal = async (key: keyof typeof goals, delta: number) => {
    const next = { ...goals, [key]: Math.max(0, goals[key] + delta) }
    setGoals(next)
    const existing = await db.healthGoals.get(1)
    if (existing) {
      await db.healthGoals.update(1, next)
    } else {
      await db.healthGoals.put({ id: 1, ...next })
    }
  }

  const METRICS_CONFIG = [
    { key: 'weight', label: 'Weight', unit: 'kg', max: goals.weight * 1.5 || 120, color: '#c0c0c0', step: 0.1 },
    { key: 'sleep', label: 'Sleep', unit: 'hrs', max: goals.sleep * 1.25 || 10, color: '#8b5cf6', step: 0.5 },
    { key: 'water', label: 'Water', unit: 'glasses', max: goals.water, color: '#3b82f6', step: 1 },
    { key: 'steps', label: 'Steps', unit: 'steps', max: goals.steps, color: '#22c55e', step: 100 },
  ]

  const GOALS_CONFIG: { key: keyof typeof goals; label: string; unit: string; step: number }[] = [
    { key: 'calories', label: 'Kalorien', unit: 'kcal', step: 50 },
    { key: 'water', label: 'Wasser', unit: 'Gläser', step: 1 },
    { key: 'weight', label: 'Zielgewicht', unit: 'kg', step: 0.5 },
    { key: 'steps', label: 'Schritte', unit: 'steps', step: 500 },
    { key: 'sleep', label: 'Schlaf', unit: 'Std', step: 0.5 },
  ]

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-6">
          <div>
            <SectionLabel>Health</SectionLabel>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="chrome-text text-2xl font-semibold">Daily Metrics</h1>
              {profile && (
                <span className="text-xs text-chrome-dim font-mono">{profile.height} cm · {profile.weight} kg</span>
              )}
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
              <div className="space-y-3">
                <p className="text-xs text-chrome-dim mb-4">Tagesziele — werden als Referenz in der App verwendet.</p>
                {GOALS_CONFIG.map((g, i) => (
                  <Card key={g.key} delay={i * 0.06}>
                    <div className="flex items-center justify-between">
                      <div>
                        <SectionLabel>{g.label}</SectionLabel>
                        <p className="text-xs text-chrome-dim mt-0.5">{g.unit}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <motion.button
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={SPRING}
                          onClick={() => updateGoal(g.key, -g.step)}
                          style={{ width: 32, height: 32, border: '0.5px solid #252525', borderRadius: 8,
                            background: 'transparent', color: '#666', fontSize: 18, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                        <span style={{ fontSize: 18, color: '#c8c8c8', minWidth: 80, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                          {goals[g.key]}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={SPRING}
                          onClick={() => updateGoal(g.key, g.step)}
                          style={{ width: 32, height: 32, border: '0.5px solid #252525', borderRadius: 8,
                            background: 'transparent', color: '#666', fontSize: 18, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
