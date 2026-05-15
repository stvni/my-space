/**
 * dataService.ts — All Supabase database operations
 * Replaces direct Dexie db.* calls throughout the app.
 */
import { supabase } from './supabase'
import type { WorkoutExercise } from '../db/db'

// ── Exported Types ────────────────────────────────────────────────────────────

export interface SupaEvent {
  id: string
  title: string
  date: string
  start_ts?: number | null
  end_ts?: number | null
  location?: string | null
  category: string
  color: string
  notes?: string | null
  created_at?: string
}

export interface SupaMeal {
  id: string
  date: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  created_at?: string
}

export interface SupaRecipe {
  id: string
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string
  instructions: string
  created_at?: string
}

export interface SupaHealthLog {
  id: string
  date: string
  weight: number
  sleep: number
  water: number
  mood: number
  steps: number
  created_at?: string
}

export interface SupaHealthGoals {
  id: number
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  weight: number
  steps: number
  sleep: number
}

export interface SupaWorkoutSession {
  id: string
  date: string
  day_index: number
  day_label: string
  exercises: WorkoutExercise[]
  created_at?: string
}

export interface SupaGymDayOverride {
  id: string
  day_index: number
  is_rest: boolean
}

export interface SupaZhawTask {
  id: string
  title: string
  module: string
  due_date: string
  done: boolean
  priority: string
  notes: string
  created_at?: string
}

export interface SupaSkincareLog {
  id: string
  date: string
  morning_done: number
  morning_total: number
  evening_done: number
  evening_total: number
  created_at?: string
}

export interface SupaStyleItem {
  id: string
  name: string
  category: string
  image_url?: string | null
  tags: string[]
  notes: string
  owned: boolean
  wishlist: boolean
  created_at?: string
}

// ── CALENDAR ─────────────────────────────────────────────────────────────────

export async function getCalendarEvents(): Promise<SupaEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('date', { ascending: true })
  if (error) { console.error('[DB] getCalendarEvents:', error); return [] }
  return (data ?? []) as SupaEvent[]
}

export async function getCalendarEventsForMonth(monthStr: string): Promise<SupaEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('date', `${monthStr}-01`)
    .lte('date', `${monthStr}-31`)
    .order('date', { ascending: true })
  if (error) { console.error('[DB] getCalendarEventsForMonth:', error); return [] }
  return (data ?? []) as SupaEvent[]
}

export async function getUpcomingEvents(fromDate: string, limit = 6): Promise<SupaEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('date', fromDate)
    .order('date', { ascending: true })
    .limit(limit)
  if (error) { console.error('[DB] getUpcomingEvents:', error); return [] }
  return (data ?? []) as SupaEvent[]
}

export async function addCalendarEvent(ev: Omit<SupaEvent, 'id' | 'created_at'>): Promise<SupaEvent | null> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(ev)
    .select()
    .single()
  if (error) { console.error('[DB] addCalendarEvent:', error); return null }
  return data as SupaEvent
}

export async function updateCalendarEvent(id: string, updates: Partial<SupaEvent>): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('[DB] updateCalendarEvent:', error)
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) console.error('[DB] deleteCalendarEvent:', error)
}

// ── FOOD ─────────────────────────────────────────────────────────────────────

export async function getFoodMeals(date: string): Promise<SupaMeal[]> {
  const { data, error } = await supabase
    .from('food_meals')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true })
  if (error) { console.error('[DB] getFoodMeals:', error); return [] }
  return (data ?? []) as SupaMeal[]
}

export async function getAllMealDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('food_meals')
    .select('date')
    .order('date', { ascending: true })
  if (error) { console.error('[DB] getAllMealDates:', error); return [] }
  return [...new Set((data ?? []).map((r: { date: string }) => r.date))]
}

export async function getAllMeals(limit = 365): Promise<SupaMeal[]> {
  const { data, error } = await supabase
    .from('food_meals')
    .select('*')
    .order('date', { ascending: true })
    .limit(limit)
  if (error) { console.error('[DB] getAllMeals:', error); return [] }
  return (data ?? []) as SupaMeal[]
}

export async function addFoodMeal(meal: Omit<SupaMeal, 'id' | 'created_at'>): Promise<SupaMeal | null> {
  const { data, error } = await supabase
    .from('food_meals')
    .insert(meal)
    .select()
    .single()
  if (error) { console.error('[DB] addFoodMeal:', error); return null }
  return data as SupaMeal
}

export async function deleteFoodMeal(id: string): Promise<void> {
  const { error } = await supabase.from('food_meals').delete().eq('id', id)
  if (error) console.error('[DB] deleteFoodMeal:', error)
}

export async function getRecipes(): Promise<SupaRecipe[]> {
  const { data, error } = await supabase
    .from('food_recipes')
    .select('*')
    .order('name', { ascending: true })
  if (error) { console.error('[DB] getRecipes:', error); return [] }
  return (data ?? []) as SupaRecipe[]
}

export async function addRecipe(recipe: Omit<SupaRecipe, 'id' | 'created_at'>): Promise<SupaRecipe | null> {
  const { data, error } = await supabase
    .from('food_recipes')
    .insert(recipe)
    .select()
    .single()
  if (error) { console.error('[DB] addRecipe:', error); return null }
  return data as SupaRecipe
}

export async function updateRecipe(id: string, updates: Partial<SupaRecipe>): Promise<void> {
  const { error } = await supabase.from('food_recipes').update(updates).eq('id', id)
  if (error) console.error('[DB] updateRecipe:', error)
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('food_recipes').delete().eq('id', id)
  if (error) console.error('[DB] deleteRecipe:', error)
}

// ── HEALTH ───────────────────────────────────────────────────────────────────

export async function getHealthLog(date: string): Promise<SupaHealthLog | null> {
  const { data, error } = await supabase
    .from('health_logs')
    .select('*')
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') console.error('[DB] getHealthLog:', error)
  return (data ?? null) as SupaHealthLog | null
}

export async function getAllHealthLogs(limit = 120): Promise<SupaHealthLog[]> {
  const { data, error } = await supabase
    .from('health_logs')
    .select('*')
    .order('date', { ascending: true })
    .limit(limit)
  if (error) { console.error('[DB] getAllHealthLogs:', error); return [] }
  return (data ?? []) as SupaHealthLog[]
}

export async function upsertHealthLog(log: Omit<SupaHealthLog, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('health_logs')
    .upsert(log, { onConflict: 'date' })
  if (error) console.error('[DB] upsertHealthLog:', error)
}

export async function getHealthGoals(): Promise<SupaHealthGoals | null> {
  const { data, error } = await supabase
    .from('health_goals')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) { console.error('[DB] getHealthGoals:', error); return null }
  return data as SupaHealthGoals
}

export async function upsertHealthGoals(goals: Partial<Omit<SupaHealthGoals, 'id'>>): Promise<void> {
  const { error } = await supabase
    .from('health_goals')
    .upsert({ id: 1, ...goals })
  if (error) console.error('[DB] upsertHealthGoals:', error)
}

// ── GYM ──────────────────────────────────────────────────────────────────────

export async function getWorkoutSession(date: string): Promise<SupaWorkoutSession | null> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') console.error('[DB] getWorkoutSession:', error)
  return (data ?? null) as SupaWorkoutSession | null
}

export async function getAllWorkoutSessions(limit = 120): Promise<SupaWorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('date', { ascending: true })
    .limit(limit)
  if (error) { console.error('[DB] getAllWorkoutSessions:', error); return [] }
  return (data ?? []) as SupaWorkoutSession[]
}

export async function getRecentWorkoutSessions(days = 7): Promise<SupaWorkoutSession[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .gte('date', cutoffStr)
    .order('date', { ascending: true })
  if (error) { console.error('[DB] getRecentWorkoutSessions:', error); return [] }
  return (data ?? []) as SupaWorkoutSession[]
}

export async function upsertWorkoutSession(
  session: Omit<SupaWorkoutSession, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .upsert(session, { onConflict: 'date' })
  if (error) console.error('[DB] upsertWorkoutSession:', error)
}

export async function getGymDayOverrides(): Promise<SupaGymDayOverride[]> {
  const { data, error } = await supabase.from('gym_day_overrides').select('*')
  if (error) { console.error('[DB] getGymDayOverrides:', error); return [] }
  return (data ?? []) as SupaGymDayOverride[]
}

export async function upsertGymDayOverride(day_index: number, is_rest: boolean): Promise<void> {
  const { error } = await supabase
    .from('gym_day_overrides')
    .upsert({ day_index, is_rest }, { onConflict: 'day_index' })
  if (error) console.error('[DB] upsertGymDayOverride:', error)
}

export async function deleteGymDayOverride(day_index: number): Promise<void> {
  const { error } = await supabase
    .from('gym_day_overrides')
    .delete()
    .eq('day_index', day_index)
  if (error) console.error('[DB] deleteGymDayOverride:', error)
}

// ── ZHAW TASKS ───────────────────────────────────────────────────────────────

export async function getZhawTasks(filter: 'all' | 'open' | 'done' = 'all'): Promise<SupaZhawTask[]> {
  let query = supabase.from('zhaw_tasks').select('*').order('due_date', { ascending: true })
  if (filter === 'open') query = query.eq('done', false)
  if (filter === 'done') query = query.eq('done', true)
  const { data, error } = await query
  if (error) { console.error('[DB] getZhawTasks:', error); return [] }
  return (data ?? []) as SupaZhawTask[]
}

export async function addZhawTask(task: Omit<SupaZhawTask, 'id' | 'created_at'>): Promise<SupaZhawTask | null> {
  const { data, error } = await supabase
    .from('zhaw_tasks')
    .insert(task)
    .select()
    .single()
  if (error) { console.error('[DB] addZhawTask:', error); return null }
  return data as SupaZhawTask
}

export async function toggleZhawTask(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('zhaw_tasks').update({ done }).eq('id', id)
  if (error) console.error('[DB] toggleZhawTask:', error)
}

export async function deleteZhawTask(id: string): Promise<void> {
  const { error } = await supabase.from('zhaw_tasks').delete().eq('id', id)
  if (error) console.error('[DB] deleteZhawTask:', error)
}

// ── SKINCARE ─────────────────────────────────────────────────────────────────

export async function getSkincareLog(date: string): Promise<SupaSkincareLog | null> {
  const { data, error } = await supabase
    .from('skincare_logs')
    .select('*')
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') console.error('[DB] getSkincareLog:', error)
  return (data ?? null) as SupaSkincareLog | null
}

export async function getAllSkincareLogs(limit = 60): Promise<SupaSkincareLog[]> {
  const { data, error } = await supabase
    .from('skincare_logs')
    .select('*')
    .order('date', { ascending: true })
    .limit(limit)
  if (error) { console.error('[DB] getAllSkincareLogs:', error); return [] }
  return (data ?? []) as SupaSkincareLog[]
}

export async function upsertSkincareLog(log: Omit<SupaSkincareLog, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('skincare_logs')
    .upsert(log, { onConflict: 'date' })
  if (error) console.error('[DB] upsertSkincareLog:', error)
}

// ── STYLE BOARD ───────────────────────────────────────────────────────────────

export async function getStyleItems(): Promise<SupaStyleItem[]> {
  const { data, error } = await supabase
    .from('style_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('[DB] getStyleItems:', error); return [] }
  return (data ?? []) as SupaStyleItem[]
}

export async function addStyleItem(item: Omit<SupaStyleItem, 'id' | 'created_at'>): Promise<SupaStyleItem | null> {
  const { data, error } = await supabase
    .from('style_items')
    .insert(item)
    .select()
    .single()
  if (error) { console.error('[DB] addStyleItem:', error); return null }
  return data as SupaStyleItem
}

export async function updateStyleItem(id: string, updates: Partial<SupaStyleItem>): Promise<void> {
  const { error } = await supabase.from('style_items').update(updates).eq('id', id)
  if (error) console.error('[DB] updateStyleItem:', error)
}

export async function deleteStyleItem(id: string): Promise<void> {
  const { error } = await supabase.from('style_items').delete().eq('id', id)
  if (error) console.error('[DB] deleteStyleItem:', error)
}
