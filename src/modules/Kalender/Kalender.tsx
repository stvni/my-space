import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, X, Download } from 'lucide-react'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { today } from '../../utils/date'
import {
  getCalendarEventsForMonth, getUpcomingEvents,
  addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  getCalendarEvents,
  type SupaEvent,
} from '../../lib/dataService'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ec4899', '#c0c0c0']
const CATEGORIES   = ['Personal', 'ZHAW', 'Gym', 'Health', 'Other']
const WEEKDAYS     = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getSwissDay(date: Date): number {
  const d = date.getDay(); return d === 0 ? 6 : d - 1
}
function formatSwissDate(dateStr: string): string {
  const p = dateStr.split('-')
  if (p.length !== 3) return dateStr
  return `${parseInt(p[2])}.${parseInt(p[1])}.${p[0]}`
}
function parseICSDateTime(dt: string): Date | null {
  if (!dt || dt.length < 15) return null
  const year = dt.slice(0,4), month = dt.slice(4,6), day = dt.slice(6,8)
  const hour = dt.slice(9,11), min = dt.slice(11,13)
  const d = new Date(`${year}-${month}-${day}T${hour}:${min}:00`)
  return isNaN(d.getTime()) ? null : d
}
function formatTime(ts: number | undefined | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zurich' })
}
function parseICS(text: string) {
  const events: { title: string; date: string; start: number|undefined; end: number|undefined; location: string }[] = []
  text.split('BEGIN:VEVENT').slice(1).forEach(block => {
    const get = (key: string) => { const m = block.match(new RegExp(`${key}[^:]*:([^\\r\\n]+)`)); return m ? m[1].trim() : '' }
    const rawStart = get('DTSTART'), rawEnd = get('DTEND')
    const rawDate = rawStart.replace(/T.*/, '')
    const dateStr = rawDate.length === 8 ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}` : rawStart
    const title = get('SUMMARY')
    const startDt = parseICSDateTime(rawStart), endDt = parseICSDateTime(rawEnd)
    if (title && dateStr) events.push({ title, date: dateStr, start: startDt?.getTime(), end: endDt?.getTime(), location: get('LOCATION') })
  })
  return events
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: '#0e0e0e', border: '0.5px solid #252525',
  borderRadius: 7, padding: '6px 10px', fontSize: 12, color: '#d0d0d0', outline: 'none',
}
const TIME_NUM: React.CSSProperties = {
  width: 44, background: '#0e0e0e', border: '0.5px solid #252525',
  borderRadius: 7, padding: '5px 6px', fontSize: 12, color: '#d0d0d0', outline: 'none', textAlign: 'center',
}

function TimeRow({ h, m, onH, onM, ph1, ph2 }: { h: string; m: string; onH:(v:string)=>void; onM:(v:string)=>void; ph1:string; ph2:string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <input type="number" min={0} max={23} placeholder={ph1} value={h} onChange={e => onH(e.target.value)} style={TIME_NUM} />
      <span style={{ color: '#333', fontSize: 14 }}>:</span>
      <input type="number" min={0} max={59} placeholder={ph2} value={m} onChange={e => onM(e.target.value)} style={TIME_NUM} />
    </div>
  )
}
function buildTs(dateStr: string, h: string, m: string): number | undefined {
  if (!h && !m) return undefined
  const d = new Date(`${dateStr}T${String(parseInt(h)||0).padStart(2,'0')}:${String(parseInt(m)||0).padStart(2,'0')}:00`)
  return isNaN(d.getTime()) ? undefined : d.getTime()
}
function tsToHM(ts: number | undefined | null): { h: string; m: string } {
  if (!ts) return { h: '', m: '' }
  const d = new Date(ts)
  return { h: String(d.getHours()), m: String(d.getMinutes()).padStart(2, '0') }
}

export function Kalender() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', startH: '', startM: '', endH: '', endM: '', location: '', category: 'Personal', color: '#3b82f6', notes: '' })
  const [editingEvent, setEditingEvent] = useState<SupaEvent | null>(null)
  const [editForm, setEditForm] = useState({ title: '', startH: '', startM: '', endH: '', endM: '', location: '', notes: '' })

  const [events, setEvents]       = useState<SupaEvent[]>([])
  const [upcoming, setUpcoming]   = useState<SupaEvent[]>([])

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const loadMonth = useCallback(async () => {
    const data = await getCalendarEventsForMonth(monthStr)
    setEvents(data)
  }, [monthStr])

  const loadUpcoming = useCallback(async () => {
    const data = await getUpcomingEvents(today(), 6)
    setUpcoming(data)
  }, [])

  const reload = useCallback(() => { loadMonth(); loadUpcoming() }, [loadMonth, loadUpcoming])

  useEffect(() => { reload() }, [reload])
  useRealtimeSync('calendar_events', reload)

  const handleICSImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const parsed = parseICS(ev.target?.result as string)
      for (const ev2 of parsed) {
        await addCalendarEvent({ title: ev2.title, date: ev2.date, start_ts: ev2.start ?? null, end_ts: ev2.end ?? null, location: ev2.location || null, category: 'Personal', color: '#c0c0c0', notes: null })
      }
      alert(`${parsed.length} Events importiert`)
      reload()
    }
    reader.readAsText(file); e.target.value = ''
  }

  const exportICS = async () => {
    const all = await getCalendarEvents()
    const fmt = (ts: number|undefined|null) => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace('.000','') : ''
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//My Space//Calendar//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH']
    all.forEach(ev => {
      lines.push('BEGIN:VEVENT', `SUMMARY:${ev.title}`)
      if (ev.start_ts) lines.push(`DTSTART:${fmt(ev.start_ts)}`)
      if (ev.end_ts)   lines.push(`DTEND:${fmt(ev.end_ts)}`)
      if (ev.location) lines.push(`LOCATION:${ev.location}`)
      lines.push(`UID:${ev.id}@myspace`, 'END:VEVENT')
    })
    lines.push('END:VCALENDAR')
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'myspace-kalender.ics'; a.click(); URL.revokeObjectURL(url)
  }

  const prevMonth = () => { if (month === 0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1) }
  const nextMonth = () => { if (month === 11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1) }

  const handleAdd = async () => {
    if (!form.title.trim() || !selected) return
    await addCalendarEvent({
      title: form.title, date: selected,
      start_ts: buildTs(selected, form.startH, form.startM) ?? null,
      end_ts:   buildTs(selected, form.endH,   form.endM)   ?? null,
      location: form.location || null, category: form.category, color: form.color, notes: form.notes || null,
    })
    setShowForm(false)
    setForm({ title: '', startH: '', startM: '', endH: '', endM: '', location: '', category: 'Personal', color: '#3b82f6', notes: '' })
  }

  const handleDelete = async (id: string) => {
    await deleteCalendarEvent(id)
    if (editingEvent?.id === id) setEditingEvent(null)
  }

  const openEdit = (ev: SupaEvent) => {
    const s = tsToHM(ev.start_ts), e2 = tsToHM(ev.end_ts)
    setEditingEvent(ev)
    setEditForm({ title: ev.title, startH: s.h, startM: s.m, endH: e2.h, endM: e2.m, location: ev.location ?? '', notes: ev.notes ?? '' })
    setShowForm(false)
  }

  const saveEdit = async () => {
    if (!editingEvent) return
    await updateCalendarEvent(editingEvent.id, {
      title: editForm.title,
      start_ts: buildTs(editingEvent.date, editForm.startH, editForm.startM) ?? null,
      end_ts:   buildTs(editingEvent.date, editForm.endH,   editForm.endM)   ?? null,
      location: editForm.location || null, notes: editForm.notes || null,
    })
    setEditingEvent(null)
  }

  const selectedEvents = events.filter(e => e.date === selected)
  const firstDayOffset = getSwissDay(new Date(year, month, 1))
  const daysCount      = new Date(year, month + 1, 0).getDate()
  const eventsOnDay = (d: number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return events.filter(e => e.date === ds)
  }

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 mb-5 md:mb-6">
          <div>
            <SectionLabel>Kalender</SectionLabel>
            <h1 className="chrome-text text-2xl font-semibold mt-1">
              {new Date(year, month).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
            </h1>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-chrome-dim uppercase tracking-widest hover:border-chrome/30 hover:text-chrome transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="8 14 10 16 16 12"/></svg>
              Import .ics
              <input type="file" accept=".ics" onChange={handleICSImport} className="hidden" />
            </label>
            <button onClick={exportICS} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-chrome-dim uppercase tracking-widest hover:border-chrome/30 hover:text-chrome transition-colors">
              <Download size={12} /> Export .ics
            </button>
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-surface2 border border-border text-chrome-dim hover:text-chrome flex items-center justify-center transition-colors"><ChevronLeft size={14} /></button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-surface2 border border-border text-chrome-dim hover:text-chrome flex items-center justify-center transition-colors"><ChevronRight size={14} /></button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
          <Card>
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => <div key={d} className="text-center text-xs text-chrome-dim font-mono py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysCount }).map((_, i) => {
                const d = i + 1
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const isToday    = dateStr === today()
                const isSelected = dateStr === selected
                const dayEvents  = eventsOnDay(d)
                return (
                  <motion.button key={d} whileTap={{ scale: 0.92 }}
                    onClick={() => { setSelected(isSelected ? null : dateStr); setShowForm(false); setEditingEvent(null) }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-start pt-1 gap-0.5 text-xs font-medium transition-colors
                      ${isSelected ? 'bg-surface2 border border-chrome/20 text-chrome-bright' :
                        isToday    ? 'border' : 'hover:bg-surface2 text-chrome-dim'}`}
                    style={isToday && !isSelected ? { background: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.4)', color: '#4ade80', fontWeight: 600 } : {}}>
                    {d}
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map(e => <div key={e.id} className="w-1 h-1 rounded-full" style={{ background: e.color }} />)}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-3">
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <SectionLabel>{formatSwissDate(selected)}</SectionLabel>
                      <button onClick={() => { setShowForm(s => !s); setEditingEvent(null) }}
                        className="w-6 h-6 rounded bg-surface2 border border-border text-chrome-dim hover:text-chrome flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showForm && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                          <div className="space-y-2 pb-3 border-b border-border">
                            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title…" style={INPUT_STYLE} />
                            <div>
                              <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>Start — Ende</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <TimeRow h={form.startH} m={form.startM} ph1="09" ph2="00" onH={v => setForm(f => ({ ...f, startH: v }))} onM={v => setForm(f => ({ ...f, startM: v }))} />
                                <span style={{ color: '#333', fontSize: 11 }}>—</span>
                                <TimeRow h={form.endH} m={form.endM} ph1="10" ph2="00" onH={v => setForm(f => ({ ...f, endH: v }))} onM={v => setForm(f => ({ ...f, endM: v }))} />
                              </div>
                            </div>
                            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ort…" style={INPUT_STYLE} />
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...INPUT_STYLE, color: '#888' }}>
                              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <div className="flex gap-1">
                              {EVENT_COLORS.map(c => (
                                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                                  className={`w-5 h-5 rounded-full border-2 transition-all ${form.color === c ? 'border-chrome-bright scale-110' : 'border-transparent'}`}
                                  style={{ background: c }} />
                              ))}
                            </div>
                            <button onClick={handleAdd} style={{ width: '100%', padding: '7px', background: '#0e0e0e', border: '0.5px solid #252525', borderRadius: 7, color: '#c0c0c0', fontSize: 12, cursor: 'pointer' }}>
                              Add Event
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {editingEvent && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                          <div style={{ padding: 10, background: '#080808', borderRadius: 8, border: '0.5px solid #1a1a1a' }}>
                            <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>Bearbeiten</div>
                            <div className="space-y-2">
                              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Titel…" style={INPUT_STYLE} />
                              <div>
                                <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>Start — Ende</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <TimeRow h={editForm.startH} m={editForm.startM} ph1="09" ph2="00" onH={v => setEditForm(f => ({ ...f, startH: v }))} onM={v => setEditForm(f => ({ ...f, startM: v }))} />
                                  <span style={{ color: '#333', fontSize: 11 }}>—</span>
                                  <TimeRow h={editForm.endH} m={editForm.endM} ph1="10" ph2="00" onH={v => setEditForm(f => ({ ...f, endH: v }))} onM={v => setEditForm(f => ({ ...f, endM: v }))} />
                                </div>
                              </div>
                              <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} placeholder="Ort…" style={INPUT_STYLE} />
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={saveEdit} style={{ flex: 1, padding: '7px', background: '#0e0e0e', border: '0.5px solid #252525', borderRadius: 7, color: '#c0c0c0', fontSize: 12, cursor: 'pointer' }}>Speichern</button>
                                <button onClick={() => handleDelete(editingEvent.id)} style={{ padding: '7px 12px', background: 'transparent', border: '0.5px solid #3a1a1a', borderRadius: 7, color: '#7f1d1d', fontSize: 12, cursor: 'pointer' }}>Löschen</button>
                              </div>
                              <button onClick={() => setEditingEvent(null)} style={{ width: '100%', padding: '5px', background: 'transparent', border: 'none', color: '#444', fontSize: 11, cursor: 'pointer' }}>Abbrechen</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedEvents.length === 0 ? (
                      <p className="text-chrome-dim text-xs">Keine Events</p>
                    ) : (
                      <div>
                        {selectedEvents.map(e => {
                          const duration = (e.start_ts && e.end_ts) ? e.end_ts - e.start_ts : 0
                          return (
                            <div key={e.id} style={{ padding: '8px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ width: 3, borderRadius: 2, background: e.color, alignSelf: 'stretch', minHeight: 32, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0' }}>{e.title}</div>
                                  {(e.start_ts || e.end_ts) && (
                                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                                      {formatTime(e.start_ts)}{e.end_ts ? ` — ${formatTime(e.end_ts)}` : ''}
                                    </div>
                                  )}
                                  {e.location && <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{e.location}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                  <button onClick={() => openEdit(e)} style={{ padding: '3px 8px', border: '0.5px solid #252525', borderRadius: 5, background: 'transparent', color: '#555', fontSize: 9, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Edit</button>
                                  <button onClick={() => handleDelete(e.id)} className="text-chrome-dim hover:text-red-400 transition-colors"><X size={10} /></button>
                                </div>
                              </div>
                              {duration > 0 && (
                                <div style={{ height: 2, background: '#1a1a1a', borderRadius: 2, marginLeft: 11, marginTop: 6 }}>
                                  <div style={{ height: 2, background: e.color, borderRadius: 2, opacity: 0.5, width: `${Math.min(100,(duration/(8*3600000))*100)}%` }} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <Card><p className="text-chrome-dim text-xs text-center py-4">Tag auswählen</p></Card>
              )}
            </AnimatePresence>

            <Card>
              <SectionLabel>Upcoming</SectionLabel>
              <div className="mt-3">
                {upcoming.length === 0 ? (
                  <p className="text-chrome-dim text-xs py-2">Keine Events</p>
                ) : upcoming.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid #111' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#c0c0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                      {e.start_ts && <div style={{ fontSize: 9, color: '#444', marginTop: 1 }}>{formatTime(e.start_ts)}</div>}
                    </div>
                    <div style={{ fontSize: 9, color: '#444', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatSwissDate(e.date)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
