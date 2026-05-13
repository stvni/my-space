import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { db } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { daysInMonth, startDayOfMonth, today } from '../../utils/date'

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ec4899', '#c0c0c0']
const CATEGORIES = ['Personal', 'ZHAW', 'Gym', 'Health', 'Other']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseICS(text: string) {
  const events: { title: string; date: string; id: number }[] = []
  const blocks = text.split('BEGIN:VEVENT')
  blocks.slice(1).forEach(block => {
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\\r\\n]+)`))
      return match ? match[1].trim() : ''
    }
    const rawDate = get('DTSTART')
    const dateStr = rawDate.replace(/T.*/, '')
    const date = dateStr.length === 8
      ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      : rawDate
    const title = get('SUMMARY')
    if (title && date) events.push({ title, date, id: Date.now() + Math.random() })
  })
  return events
}

export function Kalender() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', time: '', category: 'Personal', color: '#3b82f6', notes: '' })

  const events = useLiveQuery(() =>
    db.calendarEvents
      .where('date')
      .between(`${year}-${String(month + 1).padStart(2, '0')}-01`, `${year}-${String(month + 1).padStart(2, '0')}-31`, true, true)
      .toArray(), [year, month]) ?? []

  const selectedEvents = events.filter(e => e.date === selected)

  const handleICSImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseICS(ev.target?.result as string)
      parsed.forEach(event =>
        db.calendarEvents.add({ title: event.title, date: event.date, category: 'Personal', color: '#c0c0c0', notes: '' })
      )
      alert(`${parsed.length} Events importiert`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const days = daysInMonth(year, month)
  const startDay = startDayOfMonth(year, month)

  const addEvent = async () => {
    if (!form.title.trim() || !selected) return
    await db.calendarEvents.add({ ...form, date: selected })
    setShowForm(false)
    setForm({ title: '', time: '', category: 'Personal', color: '#3b82f6', notes: '' })
  }

  const deleteEvent = async (id: number) => {
    await db.calendarEvents.delete(id)
  }

  const eventsOnDay = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <SectionLabel>Kalender</SectionLabel>
            <h1 className="chrome-text text-2xl font-semibold mt-1">
              {new Date(year, month).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-chrome-dim uppercase tracking-widest hover:border-chrome/30 hover:text-chrome transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="8 14 10 16 16 12"/></svg>
              Import .ics
              <input type="file" accept=".ics" onChange={handleICSImport} className="hidden" />
            </label>
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-surface2 border border-border text-chrome-dim hover:text-chrome flex items-center justify-center transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-surface2 border border-border text-chrome-dim hover:text-chrome flex items-center justify-center transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-[1fr_280px] gap-4">
          {/* Calendar grid */}
          <Card>
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs text-chrome-dim font-mono py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const d = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const isToday = dateStr === today()
                const isSelected = dateStr === selected
                const dayEvents = eventsOnDay(d)

                return (
                  <motion.button
                    key={d}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelected(isSelected ? null : dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-start pt-1 gap-0.5 text-xs font-medium transition-colors relative
                      ${isSelected ? 'bg-surface2 border border-chrome/20 text-chrome-bright' :
                        isToday ? 'border' :
                        'hover:bg-surface2 text-chrome-dim'}`}
                    style={isToday && !isSelected ? {
                      background: 'rgba(74,222,128,0.12)',
                      borderColor: 'rgba(74,222,128,0.4)',
                      color: '#4ade80',
                      fontWeight: 600,
                    } : {}}
                  >
                    {d}
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} className="w-1 h-1 rounded-full" style={{ background: e.color }} />
                      ))}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          {/* Side panel */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="space-y-3"
                >
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <SectionLabel>{selected}</SectionLabel>
                      <button onClick={() => setShowForm(s => !s)} className="w-6 h-6 rounded bg-surface2 border border-border text-chrome-dim hover:text-chrome flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showForm && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                          <div className="space-y-2 pb-3 border-b border-border">
                            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title…" className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-chrome outline-none focus:border-chrome/30" />
                            <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} type="time" className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-chrome outline-none focus:border-chrome/30" />
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-chrome-dim outline-none">
                              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <div className="flex gap-1">
                              {EVENT_COLORS.map(c => (
                                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                                  className={`w-5 h-5 rounded-full border-2 transition-all ${form.color === c ? 'border-chrome-bright scale-110' : 'border-transparent'}`}
                                  style={{ background: c }} />
                              ))}
                            </div>
                            <button onClick={addEvent} className="w-full py-1.5 bg-surface2 border border-border rounded-lg text-xs text-chrome hover:border-chrome/30 transition-colors">Add Event</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedEvents.length === 0 ? (
                      <p className="text-chrome-dim text-xs">No events</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedEvents.map((e) => (
                          <li key={e.id} className="flex items-center gap-2 text-xs group">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                            <span className="flex-1 text-chrome">{e.time && <span className="text-chrome-dim font-mono mr-1">{e.time}</span>}{e.title}</span>
                            <button onClick={() => deleteEvent(e.id!)} className="opacity-0 group-hover:opacity-100 text-chrome-dim hover:text-red-400 transition-all">
                              <X size={10} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <Card>
                  <p className="text-chrome-dim text-xs text-center py-4">Select a day to view events</p>
                </Card>
              )}
            </AnimatePresence>

            {/* Upcoming */}
            <Card>
              <SectionLabel>Upcoming</SectionLabel>
              <ul className="mt-3 space-y-2">
                {events.filter(e => e.date >= today()).slice(0, 6).map(e => (
                  <li key={e.id} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-chrome flex-1 line-clamp-1">{e.title}</span>
                    <span className="text-chrome-dim font-mono shrink-0">{e.date.slice(5)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
