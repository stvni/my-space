import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Dumbbell, Trash2, History, Pencil, Check, CheckCheck, BookOpen, ImageOff, Moon, Zap } from 'lucide-react'
import {
  db, type GymPlanDay, type GymPlanSection, type Exercise,
  type WorkoutExercise, getTodayDay, getTodayPlanIndex, seedExerciseLibrary,
} from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { GymVerlauf } from '../../components/Timeline/GymVerlauf'
import { today } from '../../utils/date'

const DAYS_ORDER = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const SPRING = { type: 'spring', stiffness: 400, damping: 25 } as const
const MUSCLE_GROUPS = ['Schultern', 'Rücken / Lats', 'Brust', 'Arme / Unterarme', 'Beine', 'Bauch']

function parseReps(reps?: string): number {
  if (!reps) return 10
  const m = reps.match(/\d+/)
  return m ? parseInt(m[0]) : 10
}

export function Gym() {
  const todayDay = getTodayDay()
  const todayDayIndex = getTodayPlanIndex()

  const [gymTab, setGymTab] = useState<'plan' | 'library'>('plan')
  const [selectedDay, setSelectedDay] = useState(todayDay)
  const [showVerlauf, setShowVerlauf] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [setsOverride, setSetsOverride] = useState<Record<string, number>>({})
  const [repsOverride, setRepsOverride] = useState<Record<string, number>>({})
  const [weightOverride, setWeightOverride] = useState<Record<string, number>>({})
  const [newExInputs, setNewExInputs] = useState<Record<string, string>>({})
  const [showExPicker, setShowExPicker] = useState<string | null>(null)
  const [newOptionalInput, setNewOptionalInput] = useState('')
  const [allDoneFlash, setAllDoneFlash] = useState(false)

  // Exercise library state
  const [showAddEx, setShowAddEx] = useState(false)
  const [editingEx, setEditingEx] = useState<Exercise | null>(null)
  const [exForm, setExForm] = useState({ name: '', muscleGroup: MUSCLE_GROUPS[0], description: '' })
  const [imagePreview, setImagePreview] = useState<string>('')
  const [libSearch, setLibSearch] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const gymPlan = useLiveQuery(() => db.gymPlan.toArray(), []) ?? []
  const gymDayOverrides = useLiveQuery(() => db.gymDayOverrides.toArray(), []) ?? []
  const todaySession = useLiveQuery(() => db.workoutSessions.where('date').equals(today()).first(), [])
  const weekSessions = useLiveQuery(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return db.workoutSessions.where('date').aboveOrEqual(cutoffStr).toArray()
  }, []) ?? []
  const allExercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), []) ?? []

  const planDay = gymPlan.find(p => p.day === selectedDay)
  const todayPlanDay = gymPlan.find(p => p.day === todayDay)

  const isDayRest = (day: string) => {
    const idx = DAYS_ORDER.indexOf(day)
    const override = gymDayOverrides.find(o => o.dayIndex === idx)
    if (override) return override.isRest
    return gymPlan.find(p => p.day === day)?.rest ?? false
  }

  const toggleRestDay = async (day: string) => {
    const idx = DAYS_ORDER.indexOf(day)
    const override = gymDayOverrides.find(o => o.dayIndex === idx)
    if (override) {
      await db.gymDayOverrides.delete(override.id!)
    } else {
      const planIsRest = gymPlan.find(p => p.day === day)?.rest ?? false
      await db.gymDayOverrides.add({ dayIndex: idx, isRest: !planIsRest })
    }
  }

  const exKey = (section: string, ex: string) => `${section}::${ex}`
  const getSets = (s: string, e: string, def: number) => setsOverride[exKey(s, e)] ?? def
  const getReps = (s: string, e: string, def: number) => repsOverride[exKey(s, e)] ?? def
  const getWeight = (s: string, e: string) => weightOverride[exKey(s, e)] ?? 0

  const adjustSets = (section: string, ex: string, def: number, delta: number) =>
    setSetsOverride(prev => ({ ...prev, [exKey(section, ex)]: Math.max(1, (getSets(section, ex, def)) + delta) }))
  const adjustReps = (section: string, ex: string, def: number, delta: number) =>
    setRepsOverride(prev => ({ ...prev, [exKey(section, ex)]: Math.max(1, (getReps(section, ex, def)) + delta) }))
  const adjustWeight = (section: string, ex: string, delta: number) =>
    setWeightOverride(prev => ({ ...prev, [exKey(section, ex)]: Math.max(0, (getWeight(section, ex)) + delta) }))

  const exStatus = (name: string) => todaySession?.exercises.find(e => e.name === name)?.status

  const markExercise = async (exerciseName: string, sets: number, reps: number, weight: number, status: 'done' | 'skip') => {
    const entry: WorkoutExercise = { name: exerciseName, sets, reps, weight, status }
    const existing = await db.workoutSessions.where('date').equals(today()).first()
    if (existing) {
      const exs = existing.exercises ?? []
      const idx = exs.findIndex(e => e.name === exerciseName)
      let updated: WorkoutExercise[]
      if (idx >= 0 && exs[idx].status === status) {
        updated = exs.filter((_, i) => i !== idx)
      } else if (idx >= 0) {
        updated = exs.map((e, i) => i === idx ? entry : e)
      } else {
        updated = [...exs, entry]
      }
      await db.workoutSessions.update(existing.id!, { exercises: updated })
    } else {
      await db.workoutSessions.add({
        date: today(),
        dayIndex: todayDayIndex,
        dayLabel: todayPlanDay?.label ?? '',
        exercises: [entry],
      })
    }
  }

  // Plan editing
  const updatePlan = async (day: GymPlanDay, sections: GymPlanSection[]) => {
    if (!day.id) return
    await db.gymPlan.update(day.id, { sections })
  }

  const removeExercise = async (day: GymPlanDay, sectionName: string, exName: string) => {
    const newSections = day.sections.map(s =>
      s.name === sectionName ? { ...s, exercises: s.exercises.filter(e => e.name !== exName) } : s
    )
    await updatePlan(day, newSections)
  }

  const moveExercise = async (day: GymPlanDay, sectionName: string, exIdx: number, dir: -1 | 1) => {
    const newSections = day.sections.map(s => {
      if (s.name !== sectionName) return s
      const exs = [...s.exercises]
      const target = exIdx + dir
      if (target < 0 || target >= exs.length) return s
      ;[exs[exIdx], exs[target]] = [exs[target], exs[exIdx]]
      return { ...s, exercises: exs }
    })
    await updatePlan(day, newSections)
  }

  const addExFromLibrary = async (day: GymPlanDay, sectionName: string, ex: Exercise) => {
    const newSections = day.sections.map(s =>
      s.name === sectionName
        ? { ...s, exercises: [...s.exercises, { name: ex.name, sets: 3, reps: '10–12' }] }
        : s
    )
    await updatePlan(day, newSections)
    setShowExPicker(null)
  }

  const addExerciseToPlan = async (day: GymPlanDay, sectionName: string) => {
    const name = (newExInputs[sectionName] ?? '').trim()
    if (!name) return
    const newSections = day.sections.map(s =>
      s.name === sectionName ? { ...s, exercises: [...s.exercises, { name, sets: 3 }] } : s
    )
    await updatePlan(day, newSections)
    setNewExInputs(prev => ({ ...prev, [sectionName]: '' }))
  }

  const removeOptional = async (day: GymPlanDay, item: string) => {
    if (!day.id) return
    await db.gymPlan.update(day.id, { optional: (day.optional ?? []).filter(o => o !== item) })
  }

  const addOptional = async (day: GymPlanDay) => {
    const name = newOptionalInput.trim()
    if (!name || !day.id) return
    await db.gymPlan.update(day.id, { optional: [...(day.optional ?? []), name] })
    setNewOptionalInput('')
  }

  const markAsTraining = async (day: GymPlanDay) => {
    if (!day.id) return
    await db.gymPlan.update(day.id, { rest: false, label: 'Training', sections: [] })
  }

  // ── Alles erledigt ──────────────────────────────────────────────────────────
  const todayPlanExercises = !isDayRest(todayDay)
    ? (todayPlanDay?.sections.flatMap(s => s.exercises) ?? [])
    : []

  const allExercisesDone =
    todayPlanExercises.length > 0 &&
    todayPlanExercises.every(ex =>
      todaySession?.exercises.find(e => e.name === ex.name)?.status === 'done'
    )

  const markAllGymDone = async () => {
    if (!todayPlanDay || isDayRest(todayDay)) return
    const allEntries: import('../../db/db').WorkoutExercise[] =
      todayPlanDay.sections.flatMap(section =>
        section.exercises.map(ex => ({
          name:   ex.name,
          sets:   getSets(section.name, ex.name, ex.sets),
          reps:   getReps(section.name, ex.name, parseReps(ex.reps)),
          weight: getWeight(section.name, ex.name),
          status: 'done' as const,
        }))
      )
    const existing = await db.workoutSessions.where('date').equals(today()).first()
    if (existing) {
      await db.workoutSessions.update(existing.id!, { exercises: allEntries })
    } else {
      await db.workoutSessions.add({
        date:     today(),
        dayIndex: todayDayIndex,
        dayLabel: todayPlanDay.label ?? '',
        exercises: allEntries,
      })
    }
    setAllDoneFlash(true)
    setTimeout(() => setAllDoneFlash(false), 1800)
  }

  // Exercise library CRUD
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const saveExercise = async () => {
    if (!exForm.name.trim()) return
    const data = { ...exForm, image: imagePreview || undefined }
    if (editingEx?.id) {
      await db.exercises.update(editingEx.id, data)
    } else {
      await db.exercises.add(data)
    }
    resetExForm()
  }

  const resetExForm = () => {
    setExForm({ name: '', muscleGroup: MUSCLE_GROUPS[0], description: '' })
    setImagePreview('')
    setEditingEx(null)
    setShowAddEx(false)
  }

  const startEditEx = (ex: Exercise) => {
    setEditingEx(ex)
    setExForm({ name: ex.name, muscleGroup: ex.muscleGroup, description: ex.description })
    setImagePreview(ex.image ?? '')
    setShowAddEx(true)
  }

  const deleteExercise = async (id: number) => { await db.exercises.delete(id) }

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(libSearch.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(libSearch.toLowerCase())
  )

  const weeklyVolume = weekSessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, e) => es + e.sets * e.reps * e.weight, 0), 0)

  const todayDone = todaySession?.exercises.filter(e => e.status === 'done').length ?? 0
  const todayTotal = (() => {
    if (isDayRest(todayDay)) return 0
    return todayPlanDay?.sections.flatMap(s => s.exercises).length ?? 0
  })()

  if (showVerlauf) {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          <GymVerlauf onBack={() => setShowVerlauf(false)} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-6">
          <div>
            <SectionLabel>Gym</SectionLabel>
            <h1 className="chrome-text text-2xl font-semibold mt-1">Training Log</h1>
            {todayPlanDay && (
              <p className="text-xs text-chrome-dim mt-0.5">
                {isDayRest(todayDay) ? 'Heute: Rest Day 😴' : `Heute: ${todayPlanDay.label}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
              {(['plan', 'library'] as const).map(t => (
                <motion.button key={t}
                  onClick={() => setGymTab(t)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${gymTab === t ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                  {t === 'plan' ? 'Plan' : 'Übungen'}
                </motion.button>
              ))}
            </div>
            <motion.button onClick={() => setShowVerlauf(true)}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
              className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
              <History size={14} /> Verlauf
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===== PLAN TAB ===== */}
          {gymTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'This Week', value: `${weekSessions.length}`, sub: 'sessions' },
                  { label: 'Volume', value: weeklyVolume > 0 ? `${Math.round(weeklyVolume / 100) / 10}k` : '—', sub: weeklyVolume > 0 ? 'kg' : '' },
                  { label: 'Heute', value: isDayRest(todayDay) ? '😴' : todayTotal > 0 ? `${todayDone}/${todayTotal}` : '—', sub: isDayRest(todayDay) ? 'Rest Day' : todayTotal > 0 ? 'done' : '' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ background: '#0d0d0d', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: '12px 8px', textAlign: 'center', overflow: 'hidden' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.12em', color: '#333', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: '#c8c8c8', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#555', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Week day strip */}
              <Card className="mb-4 !p-2">
                <div className="flex gap-1">
                  {DAYS_ORDER.map(day => {
                    const isRest = isDayRest(day)
                    const isOverridden = gymDayOverrides.some(o => o.dayIndex === DAYS_ORDER.indexOf(day))
                    return (
                      <motion.button key={day} onClick={() => setSelectedDay(day)}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all flex flex-col items-center gap-0.5 ${
                          selectedDay === day
                            ? 'bg-surface2 border border-chrome/20 text-chrome-bright'
                            : day === todayDay
                            ? 'border border-border text-chrome'
                            : 'text-chrome-dim hover:text-chrome'
                        }`}>
                        {day}
                        {isRest && <span style={{ fontSize: 7, color: isOverridden ? '#8b5cf6' : '#333' }}>●</span>}
                      </motion.button>
                    )
                  })}
                </div>
              </Card>

              {/* Plan for selected day */}
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <SectionLabel>{selectedDay}</SectionLabel>
                    {planDay && <p className="text-sm text-chrome mt-0.5">{planDay.label}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Alles erledigt — only for today's training day */}
                    {selectedDay === todayDay && planDay && !isDayRest(selectedDay) && (
                      allExercisesDone ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 10, color: '#4ade80', letterSpacing: '0.06em',
                        }}>
                          <Check size={11} />
                          Abgeschlossen
                        </div>
                      ) : (
                        <motion.button
                          className="all-done-btn"
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={markAllGymDone}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px',
                            border: '0.5px solid rgba(74,222,128,0.4)',
                            borderRadius: 8,
                            background: 'rgba(74,222,128,0.06)',
                            color: '#4ade80',
                            fontSize: 10, fontWeight: 500,
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCheck size={12} />
                          Alles erledigt
                        </motion.button>
                      )
                    )}
                    {planDay && (
                      <motion.button onClick={() => toggleRestDay(selectedDay)}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                        title={isDayRest(selectedDay) ? 'Als Trainingstag markieren' : 'Als Ruhetag markieren'}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                          gymDayOverrides.some(o => o.dayIndex === DAYS_ORDER.indexOf(selectedDay))
                            ? 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                            : 'border-border text-chrome-dim hover:border-chrome/20'
                        }`}>
                        {isDayRest(selectedDay) ? <Zap size={11} /> : <Moon size={11} />}
                      </motion.button>
                    )}
                    {planDay && (
                      <motion.button onClick={() => setEditMode(e => !e)}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                          editMode ? 'border-chrome/30 text-chrome bg-surface2' : 'border-border text-chrome-dim'
                        }`}>
                        {editMode ? <Check size={12} /> : <Pencil size={12} />}
                        {editMode ? 'Fertig' : 'Edit'}
                      </motion.button>
                    )}
                  </div>
                </div>

                {!planDay ? (
                  <p className="text-chrome-dim text-sm">Kein Plan für diesen Tag.</p>
                ) : isDayRest(selectedDay) ? (
                  <div className="space-y-3">
                    <p className="text-chrome-dim text-sm">Rest Day 🛌</p>
                    <div className="flex gap-2 flex-wrap">
                      {(planDay.optional ?? []).map(o => (
                        <span key={o} className="flex items-center gap-1.5 text-xs px-2 py-1 bg-surface2 border border-border rounded-lg text-chrome-dim">
                          {o}
                          {editMode && (
                            <button onClick={() => removeOptional(planDay, o)} className="text-chrome-dim hover:text-red-400 transition-colors">
                              <X size={10} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {editMode && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input value={newOptionalInput} onChange={e => setNewOptionalInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addOptional(planDay)}
                            placeholder="Optionale Aktivität…"
                            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-chrome outline-none focus:border-chrome/30" />
                          <motion.button onClick={() => addOptional(planDay)}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className="px-3 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-chrome-dim hover:text-chrome transition-colors">
                            <Plus size={12} />
                          </motion.button>
                        </div>
                        {planDay.rest && (
                          <motion.button onClick={() => markAsTraining(planDay)}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className="text-xs text-chrome-dim border border-border rounded-lg px-3 py-1.5 hover:border-chrome/30 hover:text-chrome transition-all">
                            Als Trainingstag markieren
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {planDay.sections.map(section => (
                      <div key={section.name}>
                        <p className="text-xs text-chrome-dim font-mono uppercase tracking-widest mb-2">{section.name}</p>
                        <div className="space-y-1.5">
                          {section.exercises.map((ex, exIdx) => {
                            const sets = getSets(section.name, ex.name, ex.sets)
                            const reps = getReps(section.name, ex.name, parseReps(ex.reps))
                            const weight = getWeight(section.name, ex.name)
                            const status = exStatus(ex.name)
                            const isToday = selectedDay === todayDay
                            return (
                              <div key={ex.name} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 10px', borderRadius: 8, background: '#0a0a0a',
                                border: `0.5px solid ${status === 'done' ? '#22c55e22' : status === 'skip' ? '#ef444422' : '#1a1a1a'}`,
                              }}>
                                {editMode && (
                                  <div className="flex flex-col gap-0.5">
                                    <motion.button onClick={() => moveExercise(planDay, section.name, exIdx, -1)}
                                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
                                      className="text-chrome-dim hover:text-chrome" style={{ fontSize: 10, lineHeight: 1 }}>▲</motion.button>
                                    <motion.button onClick={() => moveExercise(planDay, section.name, exIdx, 1)}
                                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
                                      className="text-chrome-dim hover:text-chrome" style={{ fontSize: 10, lineHeight: 1 }}>▼</motion.button>
                                  </div>
                                )}
                                <span style={{ flex: 1, fontSize: 13, color: '#c0c0c0' }}>{ex.name}</span>

                                {!editMode && isToday && (
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {/* Sets counter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                        onClick={() => adjustSets(section.name, ex.name, ex.sets, -1)}
                                        style={{ width: 20, height: 20, border: '0.5px solid #252525', borderRadius: 5,
                                          background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                                      <span style={{ fontSize: 10, color: '#c8c8c8', minWidth: 44, textAlign: 'center' }}>
                                        {sets} sets
                                      </span>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                        onClick={() => adjustSets(section.name, ex.name, ex.sets, 1)}
                                        style={{ width: 20, height: 20, border: '0.5px solid #252525', borderRadius: 5,
                                          background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                                    </div>
                                    {/* Reps counter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                        onClick={() => adjustReps(section.name, ex.name, parseReps(ex.reps), -1)}
                                        style={{ width: 20, height: 20, border: '0.5px solid #252525', borderRadius: 5,
                                          background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                                      <span style={{ fontSize: 10, color: '#c8c8c8', minWidth: 44, textAlign: 'center' }}>
                                        {reps} reps
                                      </span>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                        onClick={() => adjustReps(section.name, ex.name, parseReps(ex.reps), 1)}
                                        style={{ width: 20, height: 20, border: '0.5px solid #252525', borderRadius: 5,
                                          background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                                    </div>
                                    {/* Weight counter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                        onClick={() => adjustWeight(section.name, ex.name, -2.5)}
                                        style={{ width: 20, height: 20, border: '0.5px solid #252525', borderRadius: 5,
                                          background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                                      <span style={{ fontSize: 10, color: '#c8c8c8', minWidth: 44, textAlign: 'center' }}>
                                        {weight}kg
                                      </span>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                        onClick={() => adjustWeight(section.name, ex.name, 2.5)}
                                        style={{ width: 20, height: 20, border: '0.5px solid #252525', borderRadius: 5,
                                          background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                                    </div>
                                    {/* ✓ / ✗ */}
                                    <motion.button onClick={() => markExercise(ex.name, sets, reps, weight, 'done')}
                                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
                                      style={{ width: 28, height: 28, borderRadius: 7,
                                        border: `0.5px solid ${status === 'done' ? '#22c55e66' : '#252525'}`,
                                        background: status === 'done' ? '#22c55e15' : 'transparent',
                                        color: status === 'done' ? '#22c55e' : '#555',
                                        fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</motion.button>
                                    <motion.button onClick={() => markExercise(ex.name, sets, reps, weight, 'skip')}
                                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
                                      style={{ width: 28, height: 28, borderRadius: 7,
                                        border: `0.5px solid ${status === 'skip' ? '#ef444466' : '#252525'}`,
                                        background: status === 'skip' ? '#ef444415' : 'transparent',
                                        color: status === 'skip' ? '#ef4444' : '#555',
                                        fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</motion.button>
                                  </div>
                                )}
                                {!editMode && !isToday && (
                                  <span style={{ fontSize: 10, color: '#333' }}>{ex.sets}×{ex.reps ?? '10'}</span>
                                )}
                                {editMode && (
                                  <motion.button onClick={() => removeExercise(planDay, section.name, ex.name)}
                                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}
                                    className="text-chrome-dim hover:text-red-400 transition-colors">
                                    <X size={12} />
                                  </motion.button>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {editMode && (
                          <div className="mt-2">
                            <motion.button
                              onClick={() => setShowExPicker(showExPicker === section.name ? null : section.name)}
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                              className="flex items-center gap-1.5 text-xs text-chrome-dim border border-border rounded-lg px-3 py-1.5 hover:text-chrome hover:border-chrome/30 transition-all">
                              <Plus size={11} /> Übung aus Bibliothek
                            </motion.button>
                            <AnimatePresence>
                              {showExPicker === section.name && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-1">
                                  <div className="max-h-40 overflow-y-auto space-y-0.5 bg-surface2 border border-border rounded-lg p-1">
                                    {allExercises.filter(e => !section.exercises.find(se => se.name === e.name)).map(e => (
                                      <motion.button key={e.id}
                                        onClick={() => addExFromLibrary(planDay, section.name, e)}
                                        whileHover={{ scale: 1.01 }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-chrome-dim hover:text-chrome hover:bg-surface transition-colors text-left">
                                        <span className="flex-1">{e.name}</span>
                                        <span className="text-chrome-dim/50 text-xs">{e.muscleGroup}</span>
                                      </motion.button>
                                    ))}
                                    {allExercises.length === 0 && (
                                      <p className="text-chrome-dim text-xs p-2">Keine Übungen in Bibliothek</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <input value={newExInputs[section.name] ?? ''}
                                      onChange={e => setNewExInputs(prev => ({ ...prev, [section.name]: e.target.value }))}
                                      onKeyDown={e => e.key === 'Enter' && addExerciseToPlan(planDay, section.name)}
                                      placeholder="Oder Name eingeben…"
                                      className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-chrome outline-none focus:border-chrome/30" />
                                    <motion.button onClick={() => addExerciseToPlan(planDay, section.name)}
                                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                                      className="px-3 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-chrome-dim hover:text-chrome transition-colors">
                                      <Plus size={12} />
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    ))}

                    {planDay.optional && planDay.optional.length > 0 && (
                      <div className="flex gap-2 items-center flex-wrap pt-1">
                        <span className="text-xs text-chrome-dim">Optional:</span>
                        {planDay.optional.map(o => (
                          <span key={o} className="text-xs px-2 py-0.5 bg-surface2 border border-border rounded text-chrome-dim">{o}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* ===== LIBRARY TAB ===== */}
          {gymTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <input
                  value={libSearch}
                  onChange={e => setLibSearch(e.target.value)}
                  placeholder="Suchen…"
                  className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30"
                />
                <motion.button
                  onClick={() => { resetExForm(); setShowAddEx(true) }}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
                  <Plus size={14} /> Neue Übung
                </motion.button>
              </div>

              <AnimatePresence>
                {showAddEx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                    <Card>
                      <SectionLabel>{editingEx ? 'Übung bearbeiten' : 'Neue Übung'}</SectionLabel>
                      <div className="mt-3 space-y-3">
                        <label style={{ cursor: 'pointer', width: '100%', height: 100,
                          background: '#0d0d0d', border: '0.5px dashed #252525', borderRadius: 9,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {imagePreview ? (
                            <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <ImageOff size={20} style={{ color: '#333' }} />
                              <span style={{ color: '#333', fontSize: 10 }}>Bild hochladen</span>
                            </div>
                          )}
                          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                        <input value={exForm.name} onChange={e => setExForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Übungsname"
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                        <select value={exForm.muscleGroup} onChange={e => setExForm(f => ({ ...f, muscleGroup: e.target.value }))}
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome-dim outline-none">
                          {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <textarea value={exForm.description} onChange={e => setExForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Beschreibung / Ausführung…" rows={2}
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome resize-none outline-none focus:border-chrome/30" />
                        <div className="flex gap-2">
                          <motion.button onClick={saveExercise}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className="flex-1 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome hover:border-chrome/30 transition-colors">
                            {editingEx ? 'Speichern' : 'Hinzufügen'}
                          </motion.button>
                          <motion.button onClick={resetExForm}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className="px-4 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome transition-colors">
                            Abbrechen
                          </motion.button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredExercises.length === 0 ? (
                <Card>
                  <div className="flex flex-col items-center py-8 gap-2">
                    <BookOpen size={24} className="text-chrome-dim/40" />
                    <p className="text-chrome-dim text-sm">
                      {libSearch ? 'Keine Übungen gefunden' : 'Noch keine Übungen. Füge deine erste hinzu!'}
                    </p>
                    {!libSearch && (
                      <motion.button onClick={() => seedExerciseLibrary().then(() => window.location.reload())}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                        className="text-xs text-chrome-dim border border-border rounded-lg px-3 py-1.5 hover:text-chrome hover:border-chrome/30 transition-all mt-2">
                        Aus Plan importieren
                      </motion.button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredExercises.map(ex => (
                    <motion.div key={ex.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: '#0a0a0a', border: '0.5px solid #1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: 80, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ex.image ? (
                          <img src={ex.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Dumbbell size={24} style={{ color: '#222' }} />
                        )}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: '#c0c0c0', fontWeight: 500, marginBottom: 3 }}>{ex.name}</p>
                            <span style={{ fontSize: 9, color: '#555', background: '#151515', border: '0.5px solid #222',
                              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em' }}>
                              {ex.muscleGroup}
                            </span>
                            {ex.description && (
                              <p style={{ fontSize: 10, color: '#333', marginTop: 6, lineHeight: 1.4,
                                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                                {ex.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <motion.button onClick={() => startEditEx(ex)}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}>
                              <Pencil size={11} />
                            </motion.button>
                            <motion.button onClick={() => deleteExercise(ex.id!)}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}>
                              <Trash2 size={11} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── "Alles erledigt" toast ── */}
      <AnimatePresence>
        {allDoneFlash && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(74,222,128,0.12)',
              border: '0.5px solid rgba(74,222,128,0.4)',
              borderRadius: 10, padding: '8px 20px',
              fontSize: 12, color: '#4ade80', fontWeight: 500,
              zIndex: 999,
              display: 'flex', alignItems: 'center', gap: 8,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Check size={14} />
            Training abgeschlossen!
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
