import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { getAllMeals, getHealthGoals, type SupaMeal } from '../../lib/dataService'

interface Props { onBack: () => void }

const TT = {
  contentStyle: { background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 11, color: '#c8c8c8', boxShadow: 'none' },
  labelStyle: { color: '#888', fontSize: 10 },
  cursor: { stroke: '#2a2a2a', strokeWidth: 1 },
}

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

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#c8c8c8', marginTop: 2 }}>{value}</div>
    </div>
  )
}

export function FoodVerlauf({ onBack }: Props) {
  const [allMeals, setAllMeals]     = useState<SupaMeal[]>([])
  const [calorieGoal, setCalorieGoal] = useState(2600)
  const [proteinGoal, setProteinGoal] = useState(150)

  const load = useCallback(async () => {
    const [meals, goals] = await Promise.all([getAllMeals(), getHealthGoals()])
    setAllMeals(meals)
    if (goals) {
      setCalorieGoal(goals.calories)
      setProteinGoal(goals.protein)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const days = getLast30()

  const mealsByDate = new Map<string, SupaMeal[]>()
  allMeals.forEach(m => {
    const arr = mealsByDate.get(m.date) ?? []
    arr.push(m)
    mealsByDate.set(m.date, arr)
  })

  const datesWithData = [...mealsByDate.keys()].sort()
  const chartData = datesWithData.map(date => {
    const meals = mealsByDate.get(date) ?? []
    const t = meals.reduce((a, m) => ({
      calories: a.calories + m.calories,
      protein:  a.protein  + m.protein,
      carbs:    a.carbs    + m.carbs,
      fat:      a.fat      + m.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    return { date: formatShort(date), ...t }
  })

  const hasAny = allMeals.length > 0
  const avgCal  = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.calories, 0) / chartData.length) : 0
  const avgProt = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.protein,  0) / chartData.length) : 0
  const bestCal = chartData.length > 0 ? Math.max(...chartData.map(d => d.calories)) : 0

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
        <span style={{ fontSize: 10, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Food · Verlauf 30 Tage</span>
      </div>

      {!hasAny ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333', fontSize: 13 }}>Noch keine Daten. Starte heute mit dem Tracking.</div>
      ) : (
        <>
          {/* Calories area chart */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Kalorien</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#c8a040" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#c8a040" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                  domain={['dataMin - 100', 'dataMax + 100']} tickFormatter={v => `${v}`} />
                <Tooltip {...TT} formatter={(v) => [`${v ?? 0} kcal`, 'Kalorien']} />
                <ReferenceLine y={calorieGoal} stroke="#c8a040" strokeDasharray="4 4" strokeWidth={0.5}
                  label={{ value: 'Ziel', fill: '#c8a040', fontSize: 9, position: 'right' }} />
                <Area type="monotone" dataKey="calories" stroke="#c8a040" strokeWidth={1.5}
                  fill="url(#cGrad)"
                  dot={{ r: 2.5, fill: '#888', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#c8a040', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, padding: '10px 0 16px', borderBottom: '0.5px solid #1a1a1a' }}>
              <StatCell label="Ø Kcal"   value={avgCal  > 0 ? `${avgCal} kcal`  : '—'} />
              <StatCell label="Ø Protein" value={avgProt > 0 ? `${avgProt}g`      : '—'} />
              <StatCell label="Ziel"      value={`${calorieGoal} kcal`} />
              <StatCell label="Best"      value={bestCal > 0 ? `${bestCal} kcal`  : '—'} />
              <StatCell label="Tage"      value={String(chartData.length)} />
            </div>
          </div>

          {/* Macro stacked bar chart */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Makros</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={chartData} barSize={6} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v, name) => [
                  `${v ?? 0}g`,
                  String(name) === 'protein' ? 'Protein' : String(name) === 'carbs' ? 'Carbs' : 'Fett',
                ]} />
                <ReferenceLine y={proteinGoal} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={0.5} />
                <Bar dataKey="protein" stackId="a" fill="rgba(59,130,246,0.5)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="carbs"   stackId="a" fill="rgba(34,197,94,0.35)" />
                <Bar dataKey="fat"     stackId="a" fill="rgba(249,115,22,0.35)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, padding: '6px 0 0' }}>
              {([
                ['rgba(59,130,246,0.7)', 'Protein'],
                ['rgba(34,197,94,0.6)',  'Carbs'],
                ['rgba(249,115,22,0.6)', 'Fett'],
              ] as const).map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 9, color: '#444' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            {days.map((date, index) => {
              const meals = mealsByDate.get(date) ?? []
              const totals = meals.reduce(
                (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              )
              const hasData = meals.length > 0
              const calPct = Math.min(totals.calories / calorieGoal, 1)

              return (
                <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 24 }}>
                  <div style={{ width: 72, flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 500, letterSpacing: '0.08em' }}>{dayName(date)}</div>
                    <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>{formatDate(date)}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: hasData ? '#888' : 'transparent', border: '1px solid #333', marginTop: 2 }} />
                    <div style={{ width: 1, flex: 1, background: '#1a1a1a', minHeight: 40 }} />
                  </div>

                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    style={{ flex: 1, background: '#0d0d0d', border: '0.5px solid #1a1a1a', borderRadius: 9, padding: '10px 12px' }}>
                    {hasData ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: '#c8a040', fontWeight: 500 }}>{totals.calories} kcal</span>
                          <span style={{ fontSize: 10, color: '#444' }}>/{calorieGoal}</span>
                        </div>
                        <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${calPct * 100}%` }}
                            transition={{ delay: index * 0.03 + 0.1, duration: 0.5 }}
                            style={{ height: '100%', background: calPct >= 1 ? '#c8a040' : '#555', borderRadius: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#555' }}>
                          <span>P: <span style={{ color: '#3b82f6' }}>{totals.protein}g</span></span>
                          <span>C: <span style={{ color: '#22c55e' }}>{totals.carbs}g</span></span>
                          <span>F: <span style={{ color: '#f97316' }}>{totals.fat}g</span></span>
                        </div>
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
