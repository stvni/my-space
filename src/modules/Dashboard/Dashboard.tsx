import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { db, getTodayDay, getTodayPlanIndex } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { RingWidget } from '../../components/ui/RingWidget'
import { PeakCoach } from '../../components/PeakCoach'
import { CheckSquare, Apple, Droplets, Dumbbell } from 'lucide-react'
import { format } from '../../utils/date'
import { toSwissDate } from '../../utils/dateFormat'
import { useCountUp } from '../../hooks/useCountUp'
import {
  getFoodMeals, getHealthLog, getZhawTasks, getUpcomingEvents,
  getWorkoutSession, getGymDayOverrides, getSkincareLog, getHealthGoals,
  type SupaMeal, type SupaHealthLog, type SupaZhawTask,
  type SupaEvent, type SupaWorkoutSession, type SupaGymDayOverride, type SupaSkincareLog,
} from '../../lib/dataService'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

const stagger = { show: { transition: { staggerChildren: 0.07 } } }

export function Dashboard() {
  const navigate = useNavigate()
  const today = format(new Date())

  // ── Dexie (local-only, no sync needed) ──
  const todos       = useLiveQuery(() => db.todos.where('done').equals(0).toArray(), []) ?? []
  const gymPlanData = useLiveQuery(() => db.gymPlan.toArray(), []) ?? []
  const profile     = useLiveQuery(() => db.profile.toArray().then(a => a[0]), [])

  // ── Supabase state ──
  const [todayMeals,     setTodayMeals]     = useState<SupaMeal[]>([])
  const [todayHealth,    setTodayHealth]     = useState<SupaHealthLog | null>(null)
  const [zhawTasks,      setZhawTasks]       = useState<SupaZhawTask[]>([])
  const [upcomingEvents, setUpcomingEvents]  = useState<SupaEvent[]>([])
  const [todaySession,   setTodaySession]    = useState<SupaWorkoutSession | null>(null)
  const [gymDayOverrides,setGymDayOverrides] = useState<SupaGymDayOverride[]>([])
  const [todaySkincare,  setTodaySkincare]   = useState<SupaSkincareLog | null>(null)
  const [calGoal,        setCalGoal]         = useState(2600)
  const [proteinGoal,    setProteinGoal]     = useState(150)
  const [waterGoal,      setWaterGoal]       = useState(3.0)
  const [sleepGoal,      setSleepGoal]       = useState(8)

  const loadAll = useCallback(async () => {
    const [meals, health, tasks, events, session, overrides, skincare, goals] = await Promise.all([
      getFoodMeals(today),
      getHealthLog(today),
      getZhawTasks('open'),
      getUpcomingEvents(today, 5),
      getWorkoutSession(today),
      getGymDayOverrides(),
      getSkincareLog(today),
      getHealthGoals(),
    ])
    setTodayMeals(meals)
    setTodayHealth(health)
    setZhawTasks(tasks)
    setUpcomingEvents(events)
    setTodaySession(session)
    setGymDayOverrides(overrides)
    setTodaySkincare(skincare)
    if (goals) {
      setCalGoal(goals.calories)
      setProteinGoal(goals.protein)
      setWaterGoal(goals.water)
      setSleepGoal(goals.sleep)
    }
  }, [today])

  useEffect(() => { loadAll() }, [loadAll])
  useRealtimeSync('food_meals',       loadAll)
  useRealtimeSync('health_logs',      loadAll)
  useRealtimeSync('zhaw_tasks',       loadAll)
  useRealtimeSync('calendar_events',  loadAll)
  useRealtimeSync('workout_sessions', loadAll)
  useRealtimeSync('gym_day_overrides',loadAll)
  useRealtimeSync('skincare_logs',    loadAll)

  // ── Derived values ──
  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0)
  const totalProtein  = todayMeals.reduce((s, m) => s + m.protein, 0)
  const water         = todayHealth?.water  ?? 0
  const sleep         = todayHealth?.sleep  ?? 0
  const weight        = todayHealth?.weight ?? profile?.weight ?? 0

  // Gym
  const todayDay      = getTodayDay()
  const todayPlanDay  = gymPlanData.find(p => p.day === todayDay)
  const todayDayIndex = getTodayPlanIndex()
  const restOverride  = gymDayOverrides.find(o => o.day_index === todayDayIndex)
  const isRestToday   = restOverride ? restOverride.is_rest : (todayPlanDay?.rest ?? false)
  const totalExercises = !isRestToday && todayPlanDay
    ? todayPlanDay.sections.flatMap(s => s.exercises).length : 0
  const gymDone  = todaySession?.exercises.filter(e => e.status === 'done').length ?? 0
  const gymPct   = totalExercises > 0 ? gymDone / totalExercises : 0
  const gymLabel = totalExercises > 0 ? `${gymDone}/${totalExercises}` : isRestToday ? '😴' : '—'
  const gymSub   = totalExercises > 0 ? `${Math.round(gymPct * 100)}%` : isRestToday ? 'rest' : 'no plan'

  const animatedCalories = useCountUp(totalCalories)
  const animatedWater    = useCountUp(water)
  const animatedTasks    = useCountUp(zhawTasks.length)

  const peakCoachData = {
    gymDone, gymTotal: totalExercises, isRestDay: isRestToday,
    calories: totalCalories, calorieGoal: calGoal,
    protein: totalProtein, proteinGoal,
    water, waterGoal, sleep, sleepGoal,
    zhawDone: 0, zhawTotal: zhawTasks.length,
    skincareDone:  todaySkincare?.morning_done  ?? 0,
    skincareTotal: todaySkincare?.morning_total ?? 4,
    weight,
  }

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>

        {/* 1 — Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="dashboard-greeting mb-4 md:mb-5"
        >
          <p className="text-chrome-dim text-xs font-mono uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="chrome-text text-2xl md:text-3xl font-semibold tracking-tight">{getGreeting()}, Stefano</h1>
        </motion.div>

        {/* 2 — Peak Coach — full width */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 md:mb-5"
        >
          <PeakCoach progressData={peakCoachData} />
        </motion.div>

        {/* 3 — Rings */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="stat-cards-grid grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
          <Card delay={0} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/food')}>
            <RingWidget value={totalCalories} max={calGoal} size={96} strokeWidth={7} color="#f97316" label={`${animatedCalories}`} sublabel="kcal" />
            <SectionLabel>Calories</SectionLabel>
          </Card>
          <Card delay={0.07} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/health')}>
            <RingWidget value={water} max={waterGoal} size={96} strokeWidth={7} color="#3b82f6" label={`${animatedWater}`} sublabel="L" />
            <SectionLabel>Hydration</SectionLabel>
          </Card>
          <Card delay={0.14} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/zhaw')}>
            <RingWidget value={zhawTasks.filter(t => {
              const diff = (new Date(t.due_date).getTime() - Date.now()) / 86400000
              return diff <= 7
            }).length} max={Math.max(zhawTasks.length, 1)} size={96} strokeWidth={7} color="#8b5cf6"
              label={`${animatedTasks}`} sublabel="tasks" />
            <SectionLabel>ZHAW</SectionLabel>
          </Card>
          <Card delay={0.21} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/gym')}>
            <RingWidget value={gymPct} max={1} size={96} strokeWidth={7} color="#22c55e" label={gymLabel} sublabel={gymSub} />
            <SectionLabel>Gym</SectionLabel>
          </Card>
        </motion.div>

        {/* 4 — Two-column content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            <Card delay={0.28} className="cursor-pointer" onClick={() => navigate('/zhaw')}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Open Tasks</SectionLabel>
                <CheckSquare size={14} className="text-chrome-dim" />
              </div>
              {todos.length === 0 ? (
                <p className="text-chrome-dim text-xs">All clear ✓</p>
              ) : (
                <ul className="space-y-2">
                  {todos.slice(0, 6).map(t => (
                    <li key={t.id} className="flex items-start gap-2 text-xs text-chrome">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-chrome-dim/60 shrink-0" />
                      <span className="line-clamp-1">{t.text}</span>
                    </li>
                  ))}
                  {todos.length > 6 && <li className="text-xs text-chrome-dim">+{todos.length - 6} more</li>}
                </ul>
              )}
            </Card>

            <Card delay={0.35} className="cursor-pointer" onClick={() => navigate('/zhaw')}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>ZHAW Deadlines</SectionLabel>
                <span className="text-chrome-dim text-xs">{zhawTasks.length} open</span>
              </div>
              {zhawTasks.length === 0 ? (
                <p className="text-chrome-dim text-xs">No upcoming tasks</p>
              ) : (
                <ul className="space-y-2">
                  {zhawTasks.slice(0, 4).map(t => (
                    <li key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-chrome line-clamp-1 flex-1">{t.title}</span>
                      <span className={`ml-2 font-mono shrink-0 ${urgencyColor(t.due_date)}`}>{daysUntil(t.due_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card delay={0.42} className="cursor-pointer" onClick={() => navigate('/gym')}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Gym Today</SectionLabel>
                <Dumbbell size={14} className="text-chrome-dim" />
              </div>
              {todayPlanDay?.rest ? (
                <p className="text-chrome-dim text-xs">Rest Day 😴</p>
              ) : totalExercises === 0 ? (
                <p className="text-chrome-dim text-xs">No plan loaded</p>
              ) : (
                <>
                  <p className="text-chrome text-sm font-medium mb-1">{gymDone} / {totalExercises} Übungen · {Math.round(gymPct * 100)}%</p>
                  <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${gymPct * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: '#22c55e', borderRadius: 1 }} />
                  </div>
                  {todayPlanDay && <p className="text-chrome-dim text-xs mt-1">{todayPlanDay.label}</p>}
                </>
              )}
            </Card>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            <Card delay={0.28} className="cursor-pointer" onClick={() => navigate('/food')}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Today's Meals</SectionLabel>
                <Apple size={14} className="text-chrome-dim" />
              </div>
              {todayMeals.length === 0 ? (
                <p className="text-chrome-dim text-xs">No meals logged yet</p>
              ) : (
                <ul className="space-y-2">
                  {todayMeals.map(m => (
                    <li key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-chrome">{m.name}</span>
                      <span className="text-chrome-dim font-mono">{m.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card delay={0.35} className="cursor-pointer" onClick={() => navigate('/kalender')}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Calendar</SectionLabel>
                <span className="text-chrome-dim text-xs">{upcomingEvents.length} upcoming</span>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-chrome-dim text-xs">Nothing scheduled</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingEvents.map(e => (
                    <li key={e.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                      <span className="text-chrome flex-1 line-clamp-1">{e.title}</span>
                      <span className="text-chrome-dim font-mono shrink-0">{toSwissDate(e.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card delay={0.42} className="cursor-pointer" onClick={() => navigate('/health')}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Hydration</SectionLabel>
                <Droplets size={14} className="text-chrome-dim" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#3b82f6', borderRadius: 2,
                    width: `${Math.min((water / Math.max(waterGoal, 1)) * 100, 100)}%`,
                    transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 11, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{water}/{waterGoal}L</span>
              </div>
            </Card>
          </motion.div>
        </div>

      </div>
    </PageTransition>
  )
}

function getGreeting() {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })).getHours()
  if (h >= 5 && h < 12) return 'Good Morning'
  if (h >= 12 && h < 14) return 'Good Midday'
  if (h >= 14 && h < 18) return 'Good Afternoon'
  if (h >= 18 && h < 23) return 'Good Evening'
  return 'Good Night'
}

function daysUntil(date: string) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  return `${d}d`
}

function urgencyColor(date: string) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (d < 0) return 'text-red-400'
  if (d <= 2) return 'text-orange-400'
  if (d <= 7) return 'text-yellow-400/80'
  return 'text-chrome-dim'
}
