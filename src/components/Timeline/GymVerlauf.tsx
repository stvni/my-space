import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { getAllWorkoutSessions, type SupaWorkoutSession } from '../../lib/dataService'

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

export function GymVerlauf({ onBack }: Props) {
  const [sessions, setSessions] = useState<SupaWorkoutSession[]>([])

  const load = useCallback(async () => {
    const data = await getAllWorkoutSessions()
    setSessions([...data].reverse())
  }, [])

  useEffect(() => { load() }, [load])

  const days = getLast30()
  const sessionMap = new Map(sessions.map(s => [s.date, s]))
  const hasAny = sessions.length > 0

  // Chart data — ascending order, only sessions with data
  const chartData = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({
      date: formatShort(s.date),
      volume: s.exercises
        .filter(e => e.status === 'done')
        .reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0),
      done: s.exercises.filter(e => e.status === 'done').length,
      total: s.exercises.length,
    }))

  const maxVolume  = chartData.length > 0 ? Math.max(...chartData.map(d => d.volume)) : 0
  const avgVolume  = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.volume, 0) / chartData.length) : 0
  const completionData = chartData.map(d => ({ date: d.date, pct: d.total > 0 ? Math.round((d.done / d.total) * 100) : 0 }))

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
          Gym · Verlauf 30 Tage
        </span>
      </div>

      {!hasAny ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333', fontSize: 13 }}>
          Noch keine Daten. Starte heute mit dem Tracking.
        </div>
      ) : (
        <>
          {/* ── Graph section ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Volumen pro Session
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gymGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}kg`} />
                <Tooltip
                  contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 11, color: '#c8c8c8', boxShadow: 'none' }}
                  labelStyle={{ color: '#888', fontSize: 10 }}
                  cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }}
                  formatter={(v) => [`${v ?? 0} kg`, 'Volumen']}
                />
                <Area type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={1.5}
                  fill="url(#gymGrad)"
                  dot={{ r: 2.5, fill: '#888', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, padding: '10px 0 16px', borderBottom: '0.5px solid #1a1a1a' }}>
              {[
                { label: 'Best Session', value: maxVolume > 0 ? `${maxVolume} kg` : '—' },
                { label: 'Sessions',     value: String(sessions.length) },
                { label: 'Ø Volumen',    value: avgVolume > 0 ? `${avgVolume} kg` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#c8c8c8', marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Completion % bar chart */}
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 20, marginBottom: 6 }}>Completion %</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={completionData} barSize={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 11, color: '#c8c8c8', boxShadow: 'none' }}
                  labelStyle={{ color: '#888', fontSize: 10 }}
                  formatter={(v) => [`${v}%`, 'Completion']}
                />
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  {completionData.map((d, i) => (
                    <Cell key={i} fill={d.pct >= 80 ? 'rgba(34,197,94,0.4)' : d.pct >= 50 ? 'rgba(234,179,8,0.3)' : 'rgba(107,114,128,0.2)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Timeline ── */}
          <div>
            {days.map((date, index) => {
              const session = sessionMap.get(date)
              const done = session?.exercises.filter(e => e.status === 'done') ?? []
              const skipped = session?.exercises.filter(e => e.status === 'skip') ?? []
              const total = session?.exercises.length ?? 0
              return (
                <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 20 }}>
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
                      background: session ? (done.length > 0 ? '#22c55e' : '#ef4444') : 'transparent',
                      border: `1px solid ${session ? (done.length > 0 ? '#22c55e44' : '#ef444444') : '#1a1a1a'}`,
                      marginTop: 2,
                    }} />
                    <div style={{ width: 1, flex: 1, background: '#1a1a1a', minHeight: 36 }} />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    style={{ flex: 1, background: '#0d0d0d', border: '0.5px solid #1a1a1a',
                      borderRadius: 9, padding: '10px 12px' }}>
                    {session ? (
                      <>
                        {session.day_label && (
                          <p style={{ fontSize: 9, color: '#333', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                            {session.day_label}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                          {session.exercises.map(e => (
                            <span key={e.name} style={{
                              fontSize: 10,
                              color: e.status === 'done' ? '#22c55e' : '#ef4444',
                              background: e.status === 'done' ? '#22c55e0a' : '#ef44440a',
                              border: `0.5px solid ${e.status === 'done' ? '#22c55e22' : '#ef444422'}`,
                              borderRadius: 4, padding: '2px 6px',
                            }}>
                              {e.status === 'done' ? '✓' : '✗'} {e.name}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#555' }}>
                          {done.length > 0 && <span style={{ color: '#22c55e' }}>{done.length} done</span>}
                          {skipped.length > 0 && <span style={{ color: '#ef4444' }}>{skipped.length} skip</span>}
                          <span>{total} total</span>
                        </div>
                        {total > 0 && (
                          <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden', marginTop: 6 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(done.length / Math.max(total, 1) * 100, 100)}%` }}
                              transition={{ delay: index * 0.02 + 0.1, duration: 0.5 }}
                              style={{ height: '100%', background: '#22c55e', borderRadius: 1 }}
                            />
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
