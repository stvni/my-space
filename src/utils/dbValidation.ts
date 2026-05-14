import { sanitizeString, sanitizeNumber, sanitizeDate } from './sanitize'

/** Validate + sanitize a meal before writing to Dexie. */
export function validateMeal(data: unknown) {
  if (typeof data !== 'object' || !data) return null
  const d = data as Record<string, unknown>
  return {
    name:     sanitizeString(d.name,     'title'),
    date:     sanitizeDate(d.date),
    calories: sanitizeNumber(d.calories, 0, 9999),
    protein:  sanitizeNumber(d.protein,  0, 999),
    carbs:    sanitizeNumber(d.carbs,    0, 999),
    fat:      sanitizeNumber(d.fat,      0, 999),
  }
}

/** Validate + sanitize a single exercise before writing to Dexie. */
export function validateExercise(data: unknown) {
  if (typeof data !== 'object' || !data) return null
  const d = data as Record<string, unknown>
  const ALLOWED_STATUS = ['done', 'skip', 'pending'] as const
  return {
    name:   sanitizeString(d.name, 'title'),
    sets:   sanitizeNumber(d.sets,   1, 20),
    reps:   sanitizeNumber(d.reps,   1, 100),
    weight: sanitizeNumber(d.weight, 0, 500),
    status: ALLOWED_STATUS.includes(d.status as typeof ALLOWED_STATUS[number])
      ? (d.status as typeof ALLOWED_STATUS[number])
      : 'pending',
  }
}

/** Validate + sanitize a health metric before writing to Dexie. */
export function validateHealthMetric(data: unknown) {
  if (typeof data !== 'object' || !data) return null
  const d = data as Record<string, unknown>
  return {
    date:   sanitizeDate(d.date),
    weight: sanitizeNumber(d.weight, 20,     300),
    sleep:  sanitizeNumber(d.sleep,  0,      24),
    water:  sanitizeNumber(d.water,  0,      20),
    steps:  sanitizeNumber(d.steps,  0,      100000),
    mood:   sanitizeNumber(d.mood,   1,      10),
  }
}

/** Validate + sanitize a todo before writing to Dexie. */
export function validateTodo(data: unknown) {
  if (typeof data !== 'object' || !data) return null
  const d = data as Record<string, unknown>
  return {
    text: sanitizeString(d.text, 'title'),
    done: d.done ? 1 : 0,
    date: sanitizeDate(d.date),
  }
}

/** Validate + sanitize a calendar event before writing to Dexie. */
export function validateCalendarEvent(data: unknown) {
  if (typeof data !== 'object' || !data) return null
  const d = data as Record<string, unknown>
  return {
    title:    sanitizeString(d.title,    'title'),
    date:     sanitizeDate(d.date),
    notes:    sanitizeString(d.notes,    'description'),
    location: sanitizeString(d.location, 'description'),
    category: sanitizeString(d.category, 'name'),
    color:    /^#[0-9a-fA-F]{6}$/.test(d.color as string) ? (d.color as string) : '#888888',
  }
}

/** Validate + sanitize a ZHAW task before writing to Dexie. */
export function validateZhawTask(data: unknown) {
  if (typeof data !== 'object' || !data) return null
  const d = data as Record<string, unknown>
  return {
    title:   sanitizeString(d.title,   'title'),
    subject: sanitizeString(d.subject, 'name'),
    dueDate: sanitizeDate(d.dueDate),
    done:    d.done ? 1 : 0,
  }
}
