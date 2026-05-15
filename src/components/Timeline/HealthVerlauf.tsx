import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, CartesianGrid,
} from 'recharts'
import { getAllHealthLogs, getHealthGoals, type SupaHealthLog } from '../../lib/dataService'

interface Props { onBack: () => void }

const TT = {
  contentStyle: { background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 11, color: '#c8c8c8', boxShadow: 'none' },
  labelStyle: { color: '#888', fontSize: 10 },
  cursor: { stroke: '#2a2a2a', strokeWidth: 1 },
}

function fmt(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast30(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
}

function dayName(ds: string) {
  return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(ds).getDay()]
}

function formatDate(ds: string) {
  const d = new Date(ds)
  return `${d.getDate()}. ${ ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][d.getMonth()]}`
}

function weightTrend(metrics: SupaHealthLog[], date: string) {
  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date))
  const idx = sorted.findIndex(m => m.date === date)
  if (idx <= 0) return null
  const diff = (sorted[idx].weight ?? 0) - (sorted[idx - 1].weight ?? 0)
  if (Math.abs(diff) < 0.05) return null
  return diff > 0 ? '↑' : '↓'
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#c8c8c8', marginTop: 2 }}>{value}</div>
    </div>
  )
}

export function HealthVerlauf({ onBack }: Props) {
  const [allMetrics, setAllMetrics] = useState<SupaHealthLog[]>([])
  const [weightGoal, setWeightGoal] = useState(72)
  const [sleepGoal,  setSleepGoal]  = useState(8)
  const [waterGoal,  setWaterGoal]  = useState(3.0)

  const load = useCallback(async () => {
    const [logs, goals] = await Promise.all([getAllHealthLogs(), getHealthGoals()])
    setAllMetrics(logs)
    if (goals) {
      setWeightGoal(goals.weight)
      setSleepGoal(goals.sleep)
      setWaterGoal(goals.water)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const days = getLast30()
  const metricMap = new Map(allMetrics.map(m => [m.date, m]))
  const hasAny = allMetrics.length > 0

  const weightData = allMetrics
    .filter(m => (m.weight ?? 0) > 0)
    .map(m => ({ date: fmt(m.date), weight: m.weight }))

  const recent14 = allMetrics.slice(-14)
  const sleepData = recent14.filter(m => m.sleep != null).map(m => ({ date: fmt(m.date), sleep: m.sleep }))
  const waterData = recent14.filter(m => m.water != null).map(m => ({ date: fmt(m.date), water: m.water }))

  const first = weightData[0]?.weight
  const last  = weightData[weightData.length - 1]?.weight
  const trend = weightData.length > 1 && first != null && last != null ? (last - first) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }} onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: '0.5px solid #252525', borderRadius: 7, padding: '6px 12px',
            color: '#888', fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em' }}>
          <ArrowLeft size={12} /> Zurück
        </motion.button>
        <span style={{ fontSize: 10, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Health · Verlauf</span>
      </div>

      {!hasAny ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333', fontSize: 13 }}>Noch keine Daten.</div>
      ) : (
        <>
          {/* Weight chart */}
          {weightData.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Gewichtsverlauf</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#c8c8c8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#c8c8c8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={v => `${v}kg`} />
                  <Tooltip {...TT} formatter={(v) => [`${v ?? 0} kg`, 'Gewicht']} />
                  <ReferenceLine y={weightGoal} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={0.5}
                    label={{ value: 'Ziel', fill: '#4ade80', fontSize: 9, position: 'right' }} />
                  <Area type="monotone" dataKey="weight" stroke="#c8c8c8" strokeWidth={1.5}
                    fill="url(#wGrad)"
                    dot={{ r: 2.5, fill: '#888', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#c8c8c8', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, padding: '10px 0 16px', borderBottom: '0.5px solid #1a1a1a' }}>
                <StatCell label="Start"    value={first != null ? `${first} kg` : '—'} />
                <StatCell label="Aktuell"  value={last  != null ? `${last} kg`  : '—'} />
                <StatCell label="Ziel"     value={`${weightGoal} kg`} />
                <StatCell label="Trend"    value={trend != null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)} kg` : '—'} />
                <StatCell label="Einträge" value={String(weightData.length)} />
              </div>
            </div>
          )}

          {/* Sleep chart */}
          {sleepData.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Schlaf (letzte 14 Tage)</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={sleepData} barSize={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false}
                    domain={[0, 10]} tickFormatter={v => `${v}h`} />
                  <Tooltip {...TT} formatter={(v) => [`${v ?? 0}h`, 'Schlaf']} />
                  <ReferenceLine y={sleepGoal} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={0.5} />
                  <Bar dataKey="sleep" radius={[3, 3, 0, 0]}>
                    {sleepData.map((d, i) => (
                      <Cell key={i} fill={d.sleep >= sleepGoal ? 'rgba(74,222,128,0.4)' : 'rgba(107,114,128,0.25)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Water chart */}
          {waterData.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Wasser (letzte 14 Tage)</div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={waterData} barSize={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v) => [`${v ?? 0}L`, 'Wasser']} />
                  <ReferenceLine y={waterGoal} stroke="#4b7c9e" strokeDasharray="4 4" strokeWidth={0.5} />
                  <Bar dataKey="water" radius={[3, 3, 0, 0]}>
                    {waterData.map((d, i) => (
                      <Cell key={i} fill={d.water >= waterGoal ? 'rgba(96,165,250,0.4)' : 'rgba(75,124,158,0.2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline */}
          <div>
            {days.map((date, index) => {
              const m = metricMap.get(date)
              const trendArrow = m ? weightTrend(allMetrics, date) : null
              return (
                <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 24 }}>
                  <div style={{ width: 72, flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 500, letterSpacing: '0.08em' }}>{dayName(date)}</div>
                    <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>{formatDate(date)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m ? '#888' : 'transparent', border: '1px solid #333', marginTop: 2 }} />
                    <div style={{ width: 1, flex: 1, background: '#1a1a1a', minHeight: 40 }} />
                  </div>
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                    style={{ flex: 1, background: '#0d0d0d', border: '0.5px solid #1a1a1a', borderRadius: 9, padding: '10px 12px' }}>
                    {m ? (
                      <>
                        {m.weight != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 14, color: '#c0c0c0', fontWeight: 500 }}>{m.weight} kg</span>
                            {trendArrow && <span style={{ fontSize: 10, color: trendArrow === '↑' ? '#ef4444' : '#22c55e' }}>{trendArrow}</span>}
                            {m.mood != null && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#555' }}>Mood {m.mood}/10</span>}
                          </div>
                        )}
                        {m.sleep != null && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#444', marginBottom: 3 }}>
                              <span>Schlaf</span><span>{m.sleep}h</span>
                            </div>
                            <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.sleep / sleepGoal * 100, 100)}%` }}
                                transition={{ delay: index * 0.03 + 0.1, duration: 0.4 }}
                                style={{ height: '100%', background: '#8b5cf6', borderRadius: 1 }} />
                            </div>
                          </div>
                        )}
                        {m.water != null && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#444', marginBottom: 3 }}>
                              <span>Wasser</span><span>{m.water}L</span>
                            </div>
                            <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.water / waterGoal * 100, 100)}%` }}
                                transition={{ delay: index * 0.03 + 0.15, duration: 0.4 }}
                                style={{ height: '100%', background: '#3b82f6', borderRadius: 1 }} />
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
