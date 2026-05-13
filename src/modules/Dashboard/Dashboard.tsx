import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { db, getTodayDay, getTodayPlanIndex } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { RingWidget } from '../../components/ui/RingWidget'
import { DashboardGreeting } from '../../components/DashboardGreeting'
import { CheckSquare, Apple, Droplets, Dumbbell } from 'lucide-react'
import { format } from '../../utils/date'
import { useCountUp } from '../../hooks/useCountUp'

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
}

export function Dashboard() {
  const navigate = useNavigate()
  const today = format(new Date())

  const todos = useLiveQuery(() => db.todos.where('done').equals(0).toArray(), []) ?? []
  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(today).toArray(), [today]) ?? []
  const todayHealth = useLiveQuery(() => db.healthMetrics.where('date').equals(today).first(), [today])
  const zhawTasks = useLiveQuery(() => db.zhawTasks.where('done').equals(0).toArray(), []) ?? []
  const upcomingEvents = useLiveQuery(() =>
    db.calendarEvents.where('date').aboveOrEqual(today).limit(5).toArray(), [today]
  ) ?? []
  const todaySession = useLiveQuery(() => db.workoutSessions.where('date').equals(today).first(), [today])
  const gymPlanData = useLiveQuery(() => db.gymPlan.toArray(), []) ?? []
  const gymDayOverrides = useLiveQuery(() => db.gymDayOverrides.toArray(), []) ?? []
  const todaySkincare = useLiveQuery(() => db.skincareDayLogs.where('date').equals(today).first(), [today])

  const healthGoals = useLiveQuery(() => db.healthGoals.get(1), [])
  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0)
  const calGoal = healthGoals?.calories ?? 2600
  const waterGoal = 8
  const water = todayHealth?.water ?? 0

  // Gym completion
  const todayDay = getTodayDay()
  const todayPlanDay = gymPlanData.find(p => p.day === todayDay)
  const todayDayIndex = getTodayPlanIndex()
  const restOverride = gymDayOverrides.find(o => o.dayIndex === todayDayIndex)
  const isRestToday = restOverride ? restOverride.isRest : (todayPlanDay?.rest ?? false)
  const totalExercises = !isRestToday && todayPlanDay
    ? todayPlanDay.sections.flatMap(s => s.exercises).length
    : 0
  const gymDone = todaySession?.exercises.filter(e => e.status === 'done').length ?? 0
  const gymPct = totalExercises > 0 ? gymDone / totalExercises : 0
  const gymLabel = totalExercises > 0
    ? `${gymDone}/${totalExercises}`
    : isRestToday ? '😴' : '—'
  const gymSub = totalExercises > 0
    ? `${Math.round(gymPct * 100)}%`
    : isRestToday ? 'rest' : 'no plan'

  const animatedCalories = useCountUp(totalCalories)
  const animatedWater = useCountUp(water)
  const animatedTasks = useCountUp(zhawTasks.length)

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 md:mb-8"
        >
          <p className="text-chrome-dim text-xs font-mono uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="chrome-text text-2xl md:text-3xl font-semibold tracking-tight">{getGreeting()}, Stefano</h1>
          <DashboardGreeting progressData={{
            gymDone,
            gymTotal: totalExercises,
            calories: totalCalories,
            calorieGoal: calGoal,
            zhawDone: 0,
            zhawTodos: zhawTasks.length,
            skincareDone: todaySkincare?.morningDone ?? 0,
            skincareSteps: todaySkincare?.morningTotal ?? 4,
          }} />
        </motion.div>

        {/* Rings row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6"
        >
          <Card delay={0} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/food')}>
            <RingWidget value={totalCalories} max={calGoal} size={96} strokeWidth={7} color="#f97316" label={`${animatedCalories}`} sublabel="kcal" />
            <SectionLabel>Calories</SectionLabel>
          </Card>
          <Card delay={0.07} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/health')}>
            <RingWidget value={water} max={waterGoal} size={96} strokeWidth={7} color="#3b82f6" label={`${animatedWater}/${waterGoal}`} sublabel="glasses" />
            <SectionLabel>Hydration</SectionLabel>
          </Card>
          <Card delay={0.14} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/zhaw')}>
            <RingWidget value={zhawTasks.filter(t => {
              const due = new Date(t.dueDate)
              const diff = (due.getTime() - Date.now()) / 86400000
              return diff <= 7
            }).length} max={Math.max(zhawTasks.length, 1)} size={96} strokeWidth={7} color="#8b5cf6"
              label={`${animatedTasks}`} sublabel="tasks" />
            <SectionLabel>ZHAW</SectionLabel>
          </Card>
          <Card delay={0.21} className="flex flex-col items-center gap-2 py-5 cursor-pointer" onClick={() => navigate('/gym')}>
            <RingWidget value={gymPct} max={1} size={96} strokeWidth={7} color="#22c55e"
              label={gymLabel} sublabel={gymSub} />
            <SectionLabel>Gym</SectionLabel>
          </Card>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left col */}
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
                  {todos.slice(0, 6).map((t) => (
                    <li key={t.id} className="flex items-start gap-2 text-xs text-chrome">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-chrome-dim/60 shrink-0" />
                      <span className="line-clamp-1">{t.text}</span>
                    </li>
                  ))}
                  {todos.length > 6 && (
                    <li className="text-xs text-chrome-dim">+{todos.length - 6} more</li>
                  )}
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
                  {zhawTasks.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-chrome line-clamp-1 flex-1">{t.title}</span>
                      <span className={`ml-2 font-mono shrink-0 ${urgencyColor(t.dueDate)}`}>
                        {daysUntil(t.dueDate)}
                      </span>
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
                    <motion.div
                      animate={{ width: `${gymPct * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: '#22c55e', borderRadius: 1 }}
                    />
                  </div>
                  {todayPlanDay && <p className="text-chrome-dim text-xs mt-1">{todayPlanDay.label}</p>}
                </>
              )}
            </Card>
          </motion.div>

          {/* Right col */}
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
                  {todayMeals.map((m) => (
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
                  {upcomingEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                      <span className="text-chrome flex-1 line-clamp-1">{e.title}</span>
                      <span className="text-chrome-dim font-mono shrink-0">{e.date}</span>
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
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: waterGoal }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-md border transition-colors ${
                      i < water
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-surface2 border-border'
                    }`}
                  />
                ))}
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
