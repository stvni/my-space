import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { db } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { RingWidget } from '../../components/ui/RingWidget'
import { today } from '../../utils/date'

export const SKINCARE_ROUTINE = {
  morning: {
    Mo: ['Vitamin C', 'Beta-Glucan', 'Celimax', 'SPF 50+'],
    Di: ['Liquid Refiner', 'Beta-Glucan', 'Celimax', 'SPF 50+'],
    Mi: ['Azelaic Acid', 'Beta-Glucan', 'Celimax', 'SPF 50+'],
    Do: ['Vitamin C', 'Beta-Glucan', 'Celimax', 'SPF 50+'],
    Fr: ['Azelaic Acid', 'Beta-Glucan', 'Celimax', 'SPF 50+'],
    Sa: ['Liquid Refiner', 'Beta-Glucan', 'Celimax', 'SPF 50+'],
    So: ['Beta-Glucan', 'Moisturizer'],
  },
  evening: {
    Mo: ['Cleanser', 'Beta-Glucan', 'Adapalen', 'Moisturizer', 'Eye Serum'],
    Di: ['Cleanser', 'Beta-Glucan', 'Self Tanning Drops', 'Eye Serum'],
    Mi: ['Cleanser', 'Beta-Glucan', 'Moisturizer', 'Eye Serum'],
    Do: ['Cleanser', 'Beta-Glucan', 'Self Tanning Drops', 'Eye Serum'],
    Fr: ['Cleanser', 'Beta-Glucan', 'Adapalen', 'Moisturizer', 'Eye Serum'],
    Sa: ['Cleanser', 'Beta-Glucan', 'Self Tanning Drops', 'Eye Serum'],
    So: ['Cleanser', 'Beta-Glucan', 'Moisturizer', 'Eye Serum'],
  },
  notes: {
    adapalen: 'Nur Mo + Fr bis Haut stabiler (ca. Januar)',
    shaving: 'Do Abend oder So — danach nur Beta-Glucan + Moisturizer',
    irritated: 'Morgens nur Wasser statt Cleanser',
  },
  supplements: ['Omega 3', 'Zink', 'Vitamin D3 + K2', 'Eisen + Folsäure', 'Vitamin B12', 'Kreatin'],
  extras: ['Whitening Strips', 'Kokosöl / Oil Pulling', 'Jawline Kaugummi'],
  goals: ['Akne reduzieren', 'Rötungen & Pigmentflecken entfernen', 'Hauttextur glätten', 'Glow & ebenmässige Haut', 'Stabile Hautbarriere'],
}

const DAY_MAP: Record<number, keyof typeof SKINCARE_ROUTINE.morning> = {
  0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa',
}

const SPRING = { type: 'spring', stiffness: 400, damping: 25 } as const

function getDoneKey(routine: 'am' | 'pm') {
  return `skincare_done_${today()}_${routine}`
}

function loadDone(routine: 'am' | 'pm'): Set<number> {
  try {
    const raw = localStorage.getItem(getDoneKey(routine))
    if (raw) return new Set(JSON.parse(raw) as number[])
  } catch { /* ignore */ }
  return new Set()
}

function formatShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function Skincare() {
  const [tab, setTab] = useState<'heute' | 'verlauf'>('heute')
  const [routine, setRoutine] = useState<'am' | 'pm'>('am')
  const [doneAM, setDoneAM] = useState<Set<number>>(() => loadDone('am'))
  const [donePM, setDonePM] = useState<Set<number>>(() => loadDone('pm'))

  const skincareLogs = useLiveQuery(() =>
    db.skincareDayLogs.orderBy('date').toArray(), []
  ) ?? []

  const todayKey = DAY_MAP[new Date().getDay()]
  const amSteps = SKINCARE_ROUTINE.morning[todayKey]
  const pmSteps = SKINCARE_ROUTINE.evening[todayKey]
  const steps = routine === 'am' ? amSteps : pmSteps

  const done = routine === 'am' ? doneAM : donePM
  const setDone = routine === 'am' ? setDoneAM : setDonePM

  const saveToDB = async (amDone: Set<number>, pmDone: Set<number>) => {
    const dateStr = today()
    const existing = await db.skincareDayLogs.where('date').equals(dateStr).first()
    const record = {
      date: dateStr,
      morningDone: amDone.size,
      morningTotal: amSteps.length,
      eveningDone: pmDone.size,
      eveningTotal: pmSteps.length,
    }
    if (existing) {
      await db.skincareDayLogs.update(existing.id!, record)
    } else {
      await db.skincareDayLogs.add(record)
    }
  }

  const toggleStep = async (i: number) => {
    const next = new Set(done)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setDone(next)
    localStorage.setItem(getDoneKey(routine), JSON.stringify([...next]))
    const newAM = routine === 'am' ? next : doneAM
    const newPM = routine === 'pm' ? next : donePM
    await saveToDB(newAM, newPM)
  }

  const doneCount = done.size

  // Verlauf chart data
  const chartData = skincareLogs.slice(-21).map(l => ({
    date: formatShort(l.date),
    morningPct: l.morningTotal > 0 ? Math.round((l.morningDone / l.morningTotal) * 100) : 0,
    eveningPct: l.eveningTotal > 0 ? Math.round((l.eveningDone / l.eveningTotal) * 100) : 0,
  }))

  return (
    <PageTransition>
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <SectionLabel>Skincare</SectionLabel>
            <h1 className="chrome-text text-2xl font-semibold mt-1">Daily Routine</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
              {(['heute', 'verlauf'] as const).map(t => (
                <motion.button key={t} onClick={() => setTab(t)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                  {t === 'heute' ? 'Heute' : 'Verlauf'}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === 'heute' && (
            <motion.div key="heute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
                  {(['am', 'pm'] as const).map(r => (
                    <motion.button key={r} onClick={() => setRoutine(r)}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                      className={`px-6 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${routine === r ? 'bg-surface border border-border text-chrome-bright' : 'text-chrome-dim hover:text-chrome'}`}>
                      {r}
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-chrome-dim">{todayKey}</span>
                  <span className="text-xs text-chrome-dim">{doneCount}/{steps.length} done</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_280px] gap-4">
                <div className="space-y-4">
                  <Card>
                    <SectionLabel>{routine === 'am' ? 'Morning Routine' : 'Evening Routine'}</SectionLabel>
                    <div className="mt-3 space-y-2">
                      {steps.map((step, i) => (
                        <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }} className="flex items-center gap-3">
                          <span className="text-xs text-chrome-dim font-mono w-4 text-right shrink-0">{i + 1}</span>
                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => toggleStep(i)}
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${done.has(i) ? 'bg-chrome/10 border-chrome/40' : 'border-border hover:border-chrome/30'}`}>
                            {done.has(i) && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                                <Check size={11} className="text-chrome" />
                              </motion.div>
                            )}
                          </motion.button>
                          <span className={`flex-1 text-sm transition-colors ${done.has(i) ? 'text-chrome-dim line-through' : 'text-chrome'}`}>
                            {step}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <SectionLabel>Notes</SectionLabel>
                    <div className="mt-3 space-y-2">
                      {Object.entries(SKINCARE_ROUTINE.notes).map(([key, val]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="text-chrome-dim font-mono shrink-0 w-20">{key}</span>
                          <span className="text-chrome-dim">{val}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <SectionLabel>Supplements</SectionLabel>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SKINCARE_ROUTINE.supplements.map(s => (
                        <span key={s} className="text-xs px-2 py-1 bg-surface2 border border-border rounded-lg text-chrome-dim">{s}</span>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="flex flex-col items-center gap-3 py-6">
                    <RingWidget value={doneCount} max={Math.max(steps.length, 1)} size={140} strokeWidth={10}
                      color={routine === 'am' ? '#f97316' : '#8b5cf6'}
                      label={`${doneCount}/${steps.length}`} sublabel={`${routine.toUpperCase()} · ${todayKey}`} />
                    <p className="text-xs text-chrome-dim text-center">
                      {doneCount === steps.length && steps.length > 0 ? '✓ Routine complete!' : `${steps.length - doneCount} steps remaining`}
                    </p>
                  </Card>

                  <Card>
                    <SectionLabel>Extras</SectionLabel>
                    <ul className="mt-3 space-y-1.5">
                      {SKINCARE_ROUTINE.extras.map(e => (
                        <li key={e} className="flex items-center gap-2 text-xs text-chrome-dim">
                          <span className="w-1 h-1 rounded-full bg-chrome-dim/40 shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card>
                    <SectionLabel>Goals</SectionLabel>
                    <ul className="mt-3 space-y-1.5">
                      {SKINCARE_ROUTINE.goals.map(g => (
                        <li key={g} className="flex items-center gap-2 text-xs text-chrome-dim">
                          <span className="w-1 h-1 rounded-full bg-chrome-dim/40 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'verlauf' && (
            <motion.div key="verlauf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {chartData.length === 0 ? (
                <Card>
                  <div className="flex flex-col items-center py-12 gap-2">
                    <p className="text-chrome-dim text-sm">Noch keine Verlaufsdaten vorhanden.</p>
                    <p className="text-chrome-dim/50 text-xs">Markiere heute deine Routine-Schritte als erledigt.</p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Graph */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Routine-Erfüllung (letzte 21 Tage)
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={chartData} barGap={2} barSize={8} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#333', fontSize: 9 }} axisLine={false} tickLine={false}
                          domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                        <Tooltip
                          contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 10 }}
                          labelStyle={{ color: '#c8c8c8' }}
                          formatter={(v: number, name: string) => [`${v}%`, name === 'morningPct' ? 'Morgens' : 'Abends']}
                        />
                        <Bar dataKey="morningPct" fill="rgba(200,200,200,0.5)" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="eveningPct" fill="rgba(120,120,120,0.3)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: 16, padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                      {([['rgba(200,200,200,0.5)', 'Morgens'], ['rgba(120,120,120,0.3)', 'Abends']] as const).map(([c, l]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                          <span style={{ fontSize: 9, color: '#444' }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History list */}
                  <div className="space-y-2">
                    {[...skincareLogs].reverse().map(l => {
                      const amPct = l.morningTotal > 0 ? Math.round(l.morningDone / l.morningTotal * 100) : 0
                      const pmPct = l.eveningTotal > 0 ? Math.round(l.eveningDone / l.eveningTotal * 100) : 0
                      return (
                        <div key={l.id} style={{ background: '#0a0a0a', border: '0.5px solid #1a1a1a', borderRadius: 9, padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{l.date}</span>
                            <div style={{ display: 'flex', gap: 14 }}>
                              <span style={{ fontSize: 11, color: amPct === 100 ? '#f97316' : '#444' }}>AM {amPct}%</span>
                              <span style={{ fontSize: 11, color: pmPct === 100 ? '#8b5cf6' : '#444' }}>PM {pmPct}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
