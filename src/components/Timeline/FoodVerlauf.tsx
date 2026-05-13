import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { db } from '../../db/db'

interface Props { onBack: () => void }

const MACRO_GOALS = { calories: 2200, protein: 160, carbs: 260, fat: 70 }

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

export function FoodVerlauf({ onBack }: Props) {
  const allMeals = useLiveQuery(() => db.meals.orderBy('date').toArray(), []) ?? []
  const savedGoals = useLiveQuery(() => db.healthGoals.get(1), [])
  const calorieGoal = savedGoals?.calories ?? MACRO_GOALS.calories
  const days = getLast30()

  const mealsByDate = new Map<string, typeof allMeals>()
  allMeals.forEach(m => {
    const arr = mealsByDate.get(m.date) ?? []
    arr.push(m)
    mealsByDate.set(m.date, arr)
  })

  // Chart data — last 30 days ascending, only days with data
  const datesWithData = [...mealsByDate.keys()].sort()
  const chartData = datesWithData.map(date => {
    const meals = mealsByDate.get(date) ?? []
    const t = meals.reduce((a, m) => ({
      calories: a.calories + m.calories,
      protein: a.protein + m.protein,
      carbs: a.carbs + m.carbs,
      fat: a.fat + m.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    return { date: formatShort(date), ...t }
  })

  const hasAny = allMeals.length > 0

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
          Food · Verlauf 30 Tage
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
            {/* Calories line chart */}
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Kalorien
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#333', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 10, color: '#888' }}
                  labelStyle={{ color: '#c8c8c8' }}
                  formatter={(v: number) => [`${v} kcal`, '']}
                />
                <ReferenceLine y={calorieGoal} stroke="#252525" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="calories" stroke="#c8c8c8" strokeWidth={1.5}
                  dot={false} activeDot={{ r: 4, fill: '#c8c8c8' }} />
              </LineChart>
            </ResponsiveContainer>

            {/* Macro stacked bar chart */}
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 16, marginBottom: 6 }}>
              Makros
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={chartData} barSize={6} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0d0d0d', border: '0.5px solid #252525', borderRadius: 8, fontSize: 10 }}
                  labelStyle={{ color: '#c8c8c8' }}
                  formatter={(v: number, name: string) => [
                    `${v}g`,
                    name === 'protein' ? 'Protein' : name === 'carbs' ? 'Carbs' : 'Fett',
                  ]}
                />
                <Bar dataKey="protein" stackId="a" fill="#888" radius={[0, 0, 0, 0]} />
                <Bar dataKey="carbs" stackId="a" fill="#555" />
                <Bar dataKey="fat" stackId="a" fill="#333" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}>
              {([['#888', 'Protein'], ['#555', 'Carbs'], ['#333', 'Fett']] as const).map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 9, color: '#444' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline ── */}
          <div>
            {days.map((date, index) => {
              const meals = mealsByDate.get(date) ?? []
              const totals = meals.reduce(
                (acc, m) => ({
                  calories: acc.calories + m.calories,
                  protein: acc.protein + m.protein,
                  carbs: acc.carbs + m.carbs,
                  fat: acc.fat + m.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              )
              const hasData = meals.length > 0
              const calPct = Math.min(totals.calories / calorieGoal, 1)

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
                      background: hasData ? '#888' : 'transparent',
                      border: '1px solid #333', marginTop: 2,
                    }} />
                    <div style={{ width: 1, flex: 1, background: '#1a1a1a', minHeight: 40 }} />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    style={{ flex: 1, background: '#0d0d0d', border: '0.5px solid #1a1a1a',
                      borderRadius: 9, padding: '10px 12px' }}>
                    {hasData ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                            {totals.calories} kcal
                          </span>
                          <span style={{ fontSize: 10, color: '#444' }}>
                            /{calorieGoal}
                          </span>
                        </div>
                        <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calPct * 100}%` }}
                            transition={{ delay: index * 0.03 + 0.1, duration: 0.5 }}
                            style={{ height: '100%', background: '#2a2a2a', borderRadius: 1 }}
                          />
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
