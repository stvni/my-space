import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { db, type HealthMetric } from '../../db/db'

interface Props { onBack: () => void }

function formatShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast30(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
}

function dayName(dateStr: string) {
  return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(dateStr).getDay()]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
  return `${d.getDate()}. ${months[d.getMonth()]}`
}

function weightTrend(metrics: HealthMetric[], date: string) {
  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date))
  const idx = sorted.findIndex(m => m.date === date)
  if (idx <= 0) return null
  const prev = sorted[idx - 1]
  const curr = sorted[idx]
  if (!prev.weight || !curr.weight) return null
  const diff = curr.weight - prev.weight
  if (Math.abs(diff) < 0.05) return null
  return diff > 0 ? '↑' : '↓'
}

export function HealthVerlauf({ onBack }: Props) {
  const allMetrics = useLiveQuery(() => db.healthMetrics.orderBy('date').toArray(), []) ?? []
  const savedGoals = useLiveQuery(() => db.healthGoals.get(1), [])
  const weightGoal = savedGoals?.weight ?? 70
  const sleepGoal = savedGoals?.sleep ?? 8
  const waterGoal = savedGoals?.water ?? 8

  const days = getLast30()
  const metricMap = new Map(allMetrics.map(m => [m.date, m]))
  const hasAny = allMetrics.length > 0

  // Weight chart data — all entries with weight, ascending
  const weightData = allMetrics
    .filter(m => (m.weight ?? 0) > 0)
    .map(m => ({ date: formatShort(m.date), weight: m.weight! }))

  // Last 14 entries for sleep + water bar charts
  const recent14 = allMetrics.slice(-14)
  const sleepData = recent14
    .filter(m => m.sleep != null)
    .map(m => ({ date: formatShort(m.date), sleep: m.sleep! }))
  const waterData = recent14
    .filter(m => m.water != null)
    .map(m => ({ date: formatShort(m.date), water: m.water! }))

  const first = weightData[0]?.weight
  const last = weightData[weightData.length - 1]?.weight
  const diff = weightData.length > 1 ? (last - first).toFixed(1) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <motion.button
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: '0.5px solid #252525', borderRadius: 7, padding: '6px 12px',
            color: '#888', fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em' }}>
          <ArrowLeft size={12} /> Zurück
        </motion.button>
        <span style={{ fontSize: 10, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Health · Verlauf
        </span>
      </div>

      {!hasAny ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333', fontSize: 13 }}>
          Noch keine Daten. Starte heute mit dem Tracking.
        </div>
      ) : (
        <>
          {/* ── Weight chart (prominent) ── */}
          {weightData.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                Gewichtsverlauf
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weightData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c8c8c8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#c8c8c8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                    domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 11, color: '#c8c8c8' }}
                    formatter={(v: number) => [`${v} kg`, 'Gewicht']}
                  />
                  <ReferenceLine y={weightGoal} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={0.5}
                    label={{ value: 'Ziel', fill: '#4ade80', fontSize: 9 }} />
                  <Area type="monotone" dataKey="weight" stroke="#c8c8c8" strokeWidth={2}
                    fill="url(#weightGrad)"
                    dot={{ r: 3, fill: '#888', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#c8c8c8', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Weight stats row */}
              <div style={{ display: 'flex', gap: 20, padding: '10px 0', borderBottom: '0.5px solid #1a1a1a', marginTop: 4 }}>
                {([
                  ['START', first != null ? `${first} kg` : '—'],
                  ['AKTUELL', last != null ? `${last} kg` : '—'],
                  ['ZIEL', `${weightGoal} kg`],
                  ['DIFFERENZ', diff != null ? `${Number(diff) > 0 ? '+' : ''}${diff} kg` : '—'],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#c8c8c8', fontWeight: 500, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sleep chart ── */}
          {sleepData.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Schlaf (letzte 14 Tage)
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={sleepData} barSize={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={sleepGoal} stroke="#252525" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 10 }}
                    formatter={(v: number) => [`${v}h`, 'Schlaf']}
                  />
                  <Bar dataKey="sleep" radius={[3, 3, 0, 0]}>
                    {sleepData.map((d, i) => (
                      <Cell key={i} fill={d.sleep >= sleepGoal ? 'rgba(74,222,128,0.4)' : '#252525'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Water chart ── */}
          {waterData.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Wasser (letzte 14 Tage)
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={waterData} barSize={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={waterGoal} stroke="#252525" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 10 }}
                    formatter={(v: number) => [`${v} Gläser`, 'Wasser']}
                  />
                  <Bar dataKey="water" radius={[3, 3, 0, 0]}>
                    {waterData.map((d, i) => (
                      <Cell key={i} fill={d.water >= waterGoal ? 'rgba(96,165,250,0.35)' : '#252525'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Timeline ── */}
          <div>
            {days.map((date, index) => {
              const m = metricMap.get(date)
              const trend = m ? weightTrend(allMetrics, date) : null

              return (
                <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 24 }}>
                  <div style={{ width: 72, flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 500, letterSpacing: '0.08em' }}>
                      {dayName(date)}
                    </div>
                    <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>
                      {formatDate(date)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: m ? '#888' : 'transparent',
                      border: '1px solid #333', marginTop: 2,
                    }} />
                    <div style={{ width: 1, flex: 1, background: '#1a1a1a', minHeight: 40 }} />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    style={{ flex: 1, background: '#0d0d0d', border: '0.5px solid #1a1a1a',
                      borderRadius: 9, padding: '10px 12px' }}>
                    {m ? (
                      <>
                        {m.weight != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 14, color: '#c0c0c0', fontWeight: 500 }}>
                              {m.weight} kg
                            </span>
                            {trend && (
                              <span style={{ fontSize: 10, color: trend === '↑' ? '#ef4444' : '#22c55e' }}>
                                {trend}
                              </span>
                            )}
                            {m.mood != null && (
                              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#555' }}>
                                Mood {m.mood}/10
                              </span>
                            )}
                          </div>
                        )}
                        {m.sleep != null && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#444', marginBottom: 3 }}>
                              <span>Schlaf</span><span>{m.sleep}h</span>
                            </div>
                            <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(m.sleep / sleepGoal * 100, 100)}%` }}
                                transition={{ delay: index * 0.03 + 0.1, duration: 0.4 }}
                                style={{ height: '100%', background: '#8b5cf6', borderRadius: 1 }}
                              />
                            </div>
                          </div>
                        )}
                        {m.water != null && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#444', marginBottom: 3 }}>
                              <span>Wasser</span><span>{m.water} Gläser</span>
                            </div>
                            <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(m.water / waterGoal * 100, 100)}%` }}
                                transition={{ delay: index * 0.03 + 0.15, duration: 0.4 }}
                                style={{ height: '100%', background: '#3b82f6', borderRadius: 1 }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: '#2a2a2a' }}>Kein Eintrag</span>
                    )}
                  </motion.div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
