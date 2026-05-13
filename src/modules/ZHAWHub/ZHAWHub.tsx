import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Play, Pause, RotateCcw, Check, Flag } from 'lucide-react'
import { db, type ZHAWTask } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { RingWidget } from '../../components/ui/RingWidget'

const PRIORITIES = ['low', 'medium', 'high'] as const
const FOCUS_PRESETS = [30, 60, 90]
const SPRING = { type: 'spring', stiffness: 400, damping: 25 } as const

export function ZHAWHub() {
  const [tab, setTab] = useState<'tasks' | 'pomodoro'>('tasks')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', module: '', dueDate: '', priority: 'medium' as ZHAWTask['priority'], notes: '' })
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')

  // Focus timer
  const [pomPreset, setPomPreset] = useState<number>(30)
  const [pomTotal, setPomTotal] = useState(30 * 60)
  const [pomSeconds, setPomSeconds] = useState(30 * 60)
  const [pomRunning, setPomRunning] = useState(false)
  const [pomTask, setPomTask] = useState('')
  const [pomRound, setPomRound] = useState(0)
  const [inputTime, setInputTime] = useState('30:00')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tasks = useLiveQuery(async () => {
    let result
    if (filter === 'all') result = await db.zhawTasks.orderBy('dueDate').toArray()
    else if (filter === 'done') result = await db.zhawTasks.where('done').equals(1).toArray()
    else result = await db.zhawTasks.where('done').equals(0).toArray()
    return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [filter]) ?? []

  useEffect(() => {
    if (pomRunning) {
      intervalRef.current = setInterval(() => {
        setPomSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setPomRunning(false)
            setPomRound(r => r + 1)
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('Fokus fertig!', { body: `Session abgeschlossen.`, icon: '/pwa-192x192.png' })
            }
            return pomTotal
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [pomRunning, pomTotal])

  const selectPreset = (min: number) => {
    setPomPreset(min)
    setPomTotal(min * 60)
    setPomSeconds(min * 60)
    setPomRunning(false)
    setInputTime(`${String(min).padStart(2, '0')}:00`)
  }

  const applyInputTime = () => {
    const parts = inputTime.split(':')
    let totalSecs = 0
    if (parts.length === 2) {
      const m = parseInt(parts[0]) || 0
      const s = parseInt(parts[1]) || 0
      totalSecs = m * 60 + s
    } else {
      totalSecs = (parseInt(parts[0]) || 0) * 60
    }
    if (totalSecs < 60) return
    totalSecs = Math.min(180 * 60, totalSecs)
    setPomPreset(0)
    setPomTotal(totalSecs)
    setPomSeconds(totalSecs)
  }

  const addTask = async () => {
    if (!form.title.trim()) return
    await db.zhawTasks.add({ ...form, done: false, createdAt: Date.now() })
    setForm({ title: '', module: '', dueDate: '', priority: 'medium', notes: '' })
    setShowForm(false)
  }

  const toggleTask = async (t: ZHAWTask) => {
    await db.zhawTasks.update(t.id!, { done: !t.done })
  }

  const deleteTask = async (id: number) => {
    await db.zhawTasks.delete(id)
  }

  const resetPom = () => {
    setPomRunning(false)
    setPomSeconds(pomTotal)
  }

  const mins = Math.floor(pomSeconds / 60)
  const secs = pomSeconds % 60
  const pomPct = pomTotal > 0 ? pomSeconds / pomTotal : 0

  return (
    <PageTransition>
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <SectionLabel>ZHAW Hub</SectionLabel>
            <h1 className="chrome-text text-2xl font-semibold mt-1">Study Central</h1>
          </div>
          <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
            {(['tasks', 'pomodoro'] as const).map(t => (
              <motion.button key={t} onClick={() => setTab(t)}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                {t === 'tasks' ? 'Tasks' : 'Fokus'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === 'tasks' ? (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
                  {(['open', 'all', 'done'] as const).map(f => (
                    <motion.button key={f} onClick={() => setFilter(f)}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                      className={`px-3 py-1 rounded-md text-xs transition-all ${filter === f ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </motion.button>
                  ))}
                </div>
                <motion.button onClick={() => setShowForm(s => !s)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
                  <Plus size={12} /> Add Task
                </motion.button>
              </div>

              <AnimatePresence>
                {showForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                    <Card className="space-y-2">
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title…" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} placeholder="Module (e.g. PROG2)" className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                        <div>
                          <label className="block text-xs text-chrome-dim mb-1 tracking-widest uppercase" style={{ fontSize: 9 }}>Deadline</label>
                          <input value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} type="date" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome-dim outline-none focus:border-chrome/30" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {PRIORITIES.map(p => (
                          <motion.button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className={`px-3 py-1 rounded-lg text-xs border transition-all ${form.priority === p ? priorityActive(p) : 'border-border text-chrome-dim'}`}>
                            {p}
                          </motion.button>
                        ))}
                      </div>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes…" rows={2} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome resize-none outline-none focus:border-chrome/30" />
                      <motion.button onClick={addTask}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                        className="w-full py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome hover:border-chrome/30 transition-colors">
                        Add Task
                      </motion.button>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <Card><p className="text-chrome-dim text-sm text-center py-4">No tasks here.</p></Card>
                ) : tasks.map((t: typeof tasks[0], i: number) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="group">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleTask(t)} className="mt-0.5 shrink-0">
                          <motion.div whileTap={{ scale: 0.8 }}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${t.done ? 'bg-chrome/20 border-chrome/40' : 'border-border hover:border-chrome/40'}`}>
                            {t.done && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                <Check size={10} className="text-chrome" />
                              </motion.div>
                            )}
                          </motion.div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.done ? 'text-chrome-dim line-through' : 'text-chrome'}`}>{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.module && <span className="text-xs text-chrome-dim font-mono">{t.module}</span>}
                            {t.dueDate && <span className={`text-xs font-mono ${urgencyColor(t.dueDate)}`}>{daysUntil(t.dueDate)}</span>}
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityBadge(t.priority)}`}>{t.priority}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteTask(t.id!)} className="opacity-0 group-hover:opacity-100 text-chrome-dim hover:text-red-400 transition-all mt-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="pomodoro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4">
              <Card className="w-full max-w-sm">
                {/* Task input */}
                <input value={pomTask} onChange={e => setPomTask(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-transparent border-b border-border pb-2 text-sm text-chrome outline-none focus:border-chrome/40 transition-colors mb-5" />

                {/* Preset buttons */}
                <div className="flex gap-2 justify-center mb-3">
                  {FOCUS_PRESETS.map(min => (
                    <motion.button key={min}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                      onClick={() => selectPreset(min)}
                      style={{
                        padding: '5px 14px',
                        border: `0.5px solid ${pomPreset === min ? '#888' : '#252525'}`,
                        borderRadius: 7, background: 'transparent',
                        color: pomPreset === min ? '#c8c8c8' : '#555',
                        fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        letterSpacing: '0.08em',
                      }}>
                      {min} min
                    </motion.button>
                  ))}
                </div>

                {/* Ring with editable center */}
                <div className="flex justify-center mb-5">
                  <RingWidget
                    value={1 - pomPct}
                    max={1}
                    size={180}
                    strokeWidth={10}
                    color={pomRunning ? '#22c55e' : '#3b82f6'}
                    smooth
                  >
                    <div style={{ textAlign: 'center' }}>
                      {pomRunning ? (
                        <span style={{ fontSize: 22, color: '#e0e0e0', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </span>
                      ) : (
                        <input
                          value={inputTime}
                          onChange={e => setInputTime(e.target.value)}
                          onBlur={applyInputTime}
                          onKeyDown={e => e.key === 'Enter' && applyInputTime()}
                          style={{
                            width: 80, textAlign: 'center', background: 'transparent',
                            border: 'none', outline: 'none', fontSize: 22, fontWeight: 600,
                            color: '#e0e0e0', fontFamily: 'monospace', letterSpacing: '0.04em',
                          }}
                        />
                      )}
                      <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{pomTask || 'Fokus'}</div>
                    </div>
                  </RingWidget>
                </div>

                {/* Controls */}
                <div className="flex gap-3 justify-center">
                  <motion.button onClick={resetPom}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                    className="w-10 h-10 rounded-full border border-border text-chrome-dim hover:text-chrome flex items-center justify-center transition-colors">
                    <RotateCcw size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                    onClick={() => setPomRunning(r => !r)}
                    className="w-14 h-14 rounded-full border border-chrome/30 text-chrome-bright hover:bg-surface2 flex items-center justify-center transition-colors"
                  >
                    {pomRunning ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </motion.button>
                  <div className="w-10 h-10 rounded-full border border-border text-chrome-dim flex items-center justify-center text-xs font-mono">
                    {pomRound}
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Flag size={12} className="text-chrome-dim mt-0.5" />
                <span className="text-chrome-dim text-xs">{pomRound} sessions completed today</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}

function daysUntil(date: string) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 0) return 'due today'
  return `${d}d left`
}

function urgencyColor(date: string) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (d < 0) return 'text-red-400'
  if (d <= 2) return 'text-orange-400'
  if (d <= 7) return 'text-yellow-400/80'
  return 'text-chrome-dim'
}

function priorityBadge(p: string) {
  if (p === 'high') return 'border-red-500/30 text-red-400/80'
  if (p === 'medium') return 'border-orange-500/30 text-orange-400/80'
  return 'border-border text-chrome-dim'
}

function priorityActive(p: string) {
  if (p === 'high') return 'border-red-500/50 text-red-400 bg-red-500/10'
  if (p === 'medium') return 'border-orange-500/50 text-orange-400 bg-orange-500/10'
  return 'border-chrome/30 text-chrome bg-surface'
}
