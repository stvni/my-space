import Dexie, { type Table } from 'dexie'

export interface Todo {
  id?: number
  text: string
  done: boolean
  module: string
  dueDate?: string
  createdAt: number
}

export interface GymLog {
  id?: number
  date: string
  exercises: { name: string; sets: number; reps: number; weight: number }[]
  notes: string
  duration: number
}

export interface Meal {
  id?: number
  date: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export interface SkincareStep {
  id?: number
  name: string
  order: number
  routine: 'am' | 'pm'
  done: boolean
  lastDone?: string
  product?: string
}

export interface StyleItem {
  id?: number
  name: string
  category: string
  imageUrl?: string
  tags: string[]
  notes: string
  owned: boolean
  wishlist: boolean
  createdAt: number
}

export interface ZHAWTask {
  id?: number
  title: string
  module: string
  dueDate: string
  done: boolean
  priority: 'low' | 'medium' | 'high'
  notes: string
  createdAt: number
}

export interface CalendarEvent {
  id?: number
  title: string
  date: string
  time?: string
  category: string
  color: string
  notes?: string
}

export interface HealthMetric {
  id?: number
  date: string
  weight?: number
  sleep?: number
  water?: number
  mood?: number
  steps?: number
}

export interface PomodoroSession {
  id?: number
  date: string
  task: string
  duration: number
  completed: boolean
}

export interface GymPlanExercise {
  name: string
  sets: number
  reps?: string
}

export interface ExerciseLog {
  id?: number
  date: string
  exerciseName: string
  status: 'done' | 'skip'
}

export interface GymLogEntry {
  id?: number
  date: string
  exerciseName: string
  sets: number
  reps: number
  status: 'done' | 'skip'
}

export interface Exercise {
  id?: number
  name: string
  muscleGroup: string
  description: string
  image?: string
}

export interface GymPlanSection {
  name: string
  exercises: GymPlanExercise[]
}

export interface GymPlanDay {
  id?: number
  day: string
  label: string
  sections: GymPlanSection[]
  rest?: boolean
  optional?: string[]
}

export interface Profile {
  id?: number
  height: number
  weight: number
  weightUnit: string
  heightUnit: string
}

export interface GymDayOverride {
  id?: number
  dayIndex: number
  isRest: boolean
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: number
  weight: number
  status: 'done' | 'skip'
}

export interface WorkoutSession {
  id?: number
  date: string
  dayIndex: number
  dayLabel: string
  exercises: WorkoutExercise[]
}

export interface Recipe {
  id?: number
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string
  instructions: string
}

export interface HealthGoals {
  id?: number
  calories: number
  water: number
  weight: number
  steps: number
  sleep: number
}

export interface SkincareDayLog {
  id?: number
  date: string
  morningDone: number
  morningTotal: number
  eveningDone: number
  eveningTotal: number
}

class MySpaceDB extends Dexie {
  todos!: Table<Todo>
  gymLogs!: Table<GymLog>
  meals!: Table<Meal>
  skincareSteps!: Table<SkincareStep>
  styleItems!: Table<StyleItem>
  zhawTasks!: Table<ZHAWTask>
  calendarEvents!: Table<CalendarEvent>
  healthMetrics!: Table<HealthMetric>
  pomodoroSessions!: Table<PomodoroSession>
  gymPlan!: Table<GymPlanDay>
  profile!: Table<Profile>
  exerciseLogs!: Table<ExerciseLog>
  gymLog!: Table<GymLogEntry>
  exercises!: Table<Exercise>
  gymDayOverrides!: Table<GymDayOverride>
  workoutSessions!: Table<WorkoutSession>
  recipes!: Table<Recipe>
  healthGoals!: Table<HealthGoals>
  skincareDayLogs!: Table<SkincareDayLog>

  constructor() {
    super('MySpaceDB')
    this.version(1).stores({
      todos: '++id, module, done, dueDate, createdAt',
      gymLogs: '++id, date',
      meals: '++id, date, mealType',
      skincareSteps: '++id, routine, order',
      styleItems: '++id, category, owned, wishlist, createdAt',
      zhawTasks: '++id, module, dueDate, done, priority, createdAt',
      calendarEvents: '++id, date, category',
      healthMetrics: '++id, date',
      pomodoroSessions: '++id, date, completed',
    })
    this.version(2).stores({
      todos: '++id, module, done, dueDate, createdAt',
      gymLogs: '++id, date',
      meals: '++id, date, mealType',
      skincareSteps: '++id, routine, order',
      styleItems: '++id, category, owned, wishlist, createdAt',
      zhawTasks: '++id, module, dueDate, done, priority, createdAt',
      calendarEvents: '++id, date, category',
      healthMetrics: '++id, date',
      pomodoroSessions: '++id, date, completed',
      gymPlan: '++id, day',
      profile: '++id',
    })
    this.version(3).stores({
      todos: '++id, module, done, dueDate, createdAt',
      gymLogs: '++id, date',
      meals: '++id, date, mealType',
      skincareSteps: '++id, routine, order',
      styleItems: '++id, category, owned, wishlist, createdAt',
      zhawTasks: '++id, module, dueDate, done, priority, createdAt',
      calendarEvents: '++id, date, category',
      healthMetrics: '++id, date',
      pomodoroSessions: '++id, date, completed',
      gymPlan: '++id, day',
      profile: '++id',
      exerciseLogs: '++id, date, exerciseName',
    })
    this.version(4).stores({
      todos: '++id, module, done, dueDate, createdAt',
      gymLogs: '++id, date',
      meals: '++id, date, mealType',
      skincareSteps: '++id, routine, order',
      styleItems: '++id, category, owned, wishlist, createdAt',
      zhawTasks: '++id, module, dueDate, done, priority, createdAt',
      calendarEvents: '++id, date, category',
      healthMetrics: '++id, date',
      pomodoroSessions: '++id, date, completed',
      gymPlan: '++id, day',
      profile: '++id',
      exerciseLogs: '++id, date, exerciseName',
      gymLog: '++id, date, exerciseName, status',
      exercises: '++id, name, muscleGroup',
    })
    this.version(5).stores({
      todos: '++id, module, done, dueDate, createdAt',
      gymLogs: '++id, date',
      meals: '++id, date, mealType',
      skincareSteps: '++id, routine, order',
      styleItems: '++id, category, owned, wishlist, createdAt',
      zhawTasks: '++id, module, dueDate, done, priority, createdAt',
      calendarEvents: '++id, date, category',
      healthMetrics: '++id, date',
      pomodoroSessions: '++id, date, completed',
      gymPlan: '++id, day',
      profile: '++id',
      exerciseLogs: '++id, date, exerciseName',
      gymLog: '++id, date, exerciseName, status',
      exercises: '++id, name, muscleGroup',
      gymDayOverrides: '++id, dayIndex',
      workoutSessions: '++id, date, dayIndex',
      recipes: '++id, name, category',
      healthGoals: '++id',
    })
    this.version(6).stores({
      todos: '++id, module, done, dueDate, createdAt',
      gymLogs: '++id, date',
      meals: '++id, date, mealType',
      skincareSteps: '++id, routine, order',
      styleItems: '++id, category, owned, wishlist, createdAt',
      zhawTasks: '++id, module, dueDate, done, priority, createdAt',
      calendarEvents: '++id, date, category',
      healthMetrics: '++id, date',
      pomodoroSessions: '++id, date, completed',
      gymPlan: '++id, day',
      profile: '++id',
      exerciseLogs: '++id, date, exerciseName',
      gymLog: '++id, date, exerciseName, status',
      exercises: '++id, name, muscleGroup',
      gymDayOverrides: '++id, dayIndex',
      workoutSessions: '++id, date, dayIndex',
      recipes: '++id, name, category',
      healthGoals: '++id',
      skincareDayLogs: '++id, date',
    })
  }
}

export const db = new MySpaceDB()

export async function seedDefaultSkincareSteps() {
  const count = await db.skincareSteps.count()
  if (count > 0) return
  await db.skincareSteps.bulkAdd([
    { name: 'Cleanser', order: 1, routine: 'am', done: false, product: '' },
    { name: 'Toner', order: 2, routine: 'am', done: false, product: '' },
    { name: 'Serum', order: 3, routine: 'am', done: false, product: '' },
    { name: 'Moisturizer', order: 4, routine: 'am', done: false, product: '' },
    { name: 'SPF', order: 5, routine: 'am', done: false, product: '' },
    { name: 'Cleanser', order: 1, routine: 'pm', done: false, product: '' },
    { name: 'Exfoliant', order: 2, routine: 'pm', done: false, product: '' },
    { name: 'Serum', order: 3, routine: 'pm', done: false, product: '' },
    { name: 'Eye Cream', order: 4, routine: 'pm', done: false, product: '' },
    { name: 'Moisturizer', order: 5, routine: 'pm', done: false, product: '' },
  ])
}

const GYM_PLAN_SEED_VERSION = 'v2'

const GYM_PLAN_SEED: Omit<GymPlanDay, 'id'>[] = [
  {
    day: 'Mo', label: 'Schultern / Brust / Unterarme',
    sections: [
      { name: 'Schultern', exercises: [
        { name: 'Lateral Raises', sets: 4, reps: '12–15' },
        { name: 'Machine Shoulder Press', sets: 3, reps: '10–12' },
        { name: 'Rear Delt Fly', sets: 3, reps: '12–15' },
      ]},
      { name: 'Brust', exercises: [
        { name: 'Incline Press', sets: 3, reps: '10–12' },
        { name: 'Chest Press', sets: 3, reps: '10–12' },
      ]},
      { name: 'Unterarme / Brachioradialis', exercises: [
        { name: 'Reverse Curls', sets: 3, reps: '12–15' },
        { name: 'Hammer Curls', sets: 3, reps: '12–15' },
      ]},
    ],
  },
  {
    day: 'Di', label: 'Lats / Rücken / Arme',
    sections: [
      { name: 'Lats / Rücken', exercises: [
        { name: 'Lat Pulldown', sets: 4, reps: '10–12' },
        { name: 'Straight-Arm Pulldown', sets: 3, reps: '12–15' },
        { name: 'Cable Row', sets: 3, reps: '12–15' },
        { name: 'Chest Supported Row', sets: 3, reps: '10–12' },
      ]},
      { name: 'Arme', exercises: [
        { name: 'Heavy Hammer Curls', sets: 3, reps: '10–12' },
      ]},
      { name: 'Rear Delts', exercises: [
        { name: 'Rear Delt Work', sets: 3, reps: '15–20' },
      ]},
    ],
  },
  {
    day: 'Mi', label: 'Rest',
    sections: [],
    rest: true,
    optional: ['Spaziergang', 'Mobility', 'Leichtes Stretching'],
  },
  {
    day: 'Do', label: 'Schultern / Brust / Unterarme',
    sections: [
      { name: 'Schultern', exercises: [
        { name: 'Lateral Raises', sets: 4, reps: '12–15' },
        { name: 'Arnold Press', sets: 3, reps: '10–12' },
        { name: 'Rear Delt Machine', sets: 3, reps: '15–20' },
      ]},
      { name: 'Brust', exercises: [
        { name: 'Cable Fly', sets: 3, reps: '15–20' },
      ]},
      { name: 'Unterarme', exercises: [
        { name: 'Wrist Roller', sets: 3, reps: '12–15' },
        { name: 'Reverse Cable Curls', sets: 3, reps: '15–20' },
      ]},
    ],
  },
  {
    day: 'Fr', label: 'Lats / Rücken / Arme',
    sections: [
      { name: 'Rücken / Lats', exercises: [
        { name: 'Pull-Ups', sets: 4, reps: '6–10' },
        { name: 'Meadows Row', sets: 3, reps: '10–12' },
        { name: 'Face Pull', sets: 3, reps: '15–20' },
      ]},
      { name: 'Arme', exercises: [
        { name: 'Cross-Body Hammer Curls', sets: 3, reps: '12–15' },
      ]},
    ],
  },
  {
    day: 'Sa', label: 'Legs',
    sections: [
      { name: 'Beine', exercises: [
        { name: 'Leg Press', sets: 4, reps: '12–15' },
        { name: 'Hamstring Curl', sets: 3, reps: '12–15' },
        { name: 'Calves', sets: 4, reps: '15–20' },
        { name: 'Hip Thrust / Glute Bridge', sets: 3, reps: '12–15' },
      ]},
    ],
  },
  {
    day: 'So', label: 'Schultern / Upper Pump',
    sections: [
      { name: 'Schultern', exercises: [
        { name: 'Cable Lateral Raises', sets: 4, reps: '15–20' },
        { name: 'Rear Delt Fly', sets: 3, reps: '15–20' },
      ]},
      { name: 'Upper Back Pump', exercises: [
        { name: 'Light Pulldown', sets: 3, reps: '15–20' },
      ]},
      { name: 'Unterarme', exercises: [
        { name: 'Reverse Curl Burnout', sets: 3, reps: '15–20' },
      ]},
    ],
    optional: ['Abs'],
  },
]

export async function seedGymPlan() {
  const seeded = localStorage.getItem('gymPlan_seed')
  if (seeded === GYM_PLAN_SEED_VERSION) return
  await db.gymPlan.clear()
  await db.gymPlan.bulkAdd(GYM_PLAN_SEED)
  localStorage.setItem('gymPlan_seed', GYM_PLAN_SEED_VERSION)
}

export async function seedProfile() {
  const count = await db.profile.count()
  if (count > 0) return
  await db.profile.add({ height: 172, weight: 49, weightUnit: 'kg', heightUnit: 'cm' })
}

const EXERCISE_SEED_VERSION = 'v1'

export async function seedExerciseLibrary() {
  const seeded = localStorage.getItem('exercises_seed')
  if (seeded === EXERCISE_SEED_VERSION) return
  await db.exercises.clear()
  const seen = new Set<string>()
  const list: Omit<Exercise, 'id'>[] = []
  GYM_PLAN_SEED.forEach(day => {
    day.sections.forEach(section => {
      section.exercises.forEach(ex => {
        if (!seen.has(ex.name)) {
          seen.add(ex.name)
          list.push({ name: ex.name, muscleGroup: section.name, description: '' })
        }
      })
    })
  })
  await db.exercises.bulkAdd(list)
  localStorage.setItem('exercises_seed', EXERCISE_SEED_VERSION)
}

export function getTodayPlanIndex(): number {
  const d = new Date()
  const zurich = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
  const map: Record<number, number> = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }
  return map[zurich.getDay()]
}

export function getTodayDay(): string {
  const d = new Date()
  const zurich = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
  const map: Record<number, string> = { 0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa' }
  return map[zurich.getDay()]
}
