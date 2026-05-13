import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { db, type HealthGoals } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel, AnimatedBar } from '../../components/ui/Card'
import { RingWidget } from '../../components/ui/RingWidget'
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
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
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
              <div className="grid grid-cols-2 gap-4">
                {METRICS_CONFIG.map((m, i) => (
                  <Card key={m.key} delay={i * 0.07} className="flex items-center gap-4">
                    <RingWidget value={metrics[m.key as keyof typeof metrics]} max={m.max}
                      size={72} strokeWidth={6} color={m.color}
                      label={String(metrics[m.key as keyof typeof metrics])} sublabel={m.unit} />
                    <div className="flex-1">
                      <SectionLabel>{m.label}</SectionLabel>
                      <input type="number" step={m.step}
                        value={metrics[m.key as keyof typeof metrics]}
                        onChange={e => setMetrics(prev => ({ ...prev, [m.key]: +e.target.value }))}
                        className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm text-chrome outline-none focus:border-chrome/30" />
                      <div className="mt-2">
                        <AnimatedBar value={metrics[m.key as keyof typeof metrics] as number} max={m.max} color={m.color} delay={i * 0.07 + 0.1} />
                      </div>
                    </div>
                  </Card>
                ))}

                <Card delay={0.28} className="col-span-2">
                  <SectionLabel>Mood</SectionLabel>
                  <div className="flex gap-2 mt-3 justify-center">
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
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className="col-span-2 py-2.5 bg-surface2 border border-border rounded-xl text-sm text-chrome hover:border-chrome/30 transition-colors">
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
