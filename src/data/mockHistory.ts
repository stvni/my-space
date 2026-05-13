export interface GymEntry {
  date: string
  muscles: string[]
  exercises: number
  volume: number
  duration: number
}

export interface FoodEntry {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface HealthEntry {
  date: string
  weight: number
  sleep: number
  water: number
  mood: number
  steps: number
  amDone: number
  amTotal: number
  pmDone: number
  pmTotal: number
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const GYM_HISTORY: GymEntry[] = [
  { date: daysAgo(1),  muscles: ['Chest', 'Triceps'], exercises: 5, volume: 8400,  duration: 55 },
  { date: daysAgo(2),  muscles: ['Back', 'Biceps'],   exercises: 6, volume: 9200,  duration: 62 },
  { date: daysAgo(4),  muscles: ['Legs'],             exercises: 4, volume: 12500, duration: 50 },
  { date: daysAgo(5),  muscles: ['Shoulders'],        exercises: 5, volume: 6800,  duration: 48 },
  { date: daysAgo(7),  muscles: ['Chest', 'Triceps'], exercises: 5, volume: 8700,  duration: 57 },
  { date: daysAgo(8),  muscles: ['Back', 'Biceps'],   exercises: 6, volume: 9500,  duration: 65 },
  { date: daysAgo(9),  muscles: ['Legs'],             exercises: 4, volume: 13100, duration: 52 },
  { date: daysAgo(11), muscles: ['Full Body'],        exercises: 7, volume: 10200, duration: 70 },
  { date: daysAgo(12), muscles: ['Chest'],            exercises: 4, volume: 7600,  duration: 45 },
  { date: daysAgo(14), muscles: ['Back', 'Biceps'],   exercises: 6, volume: 8900,  duration: 60 },
]

export const FOOD_HISTORY: FoodEntry[] = [
  { date: daysAgo(0),  calories: 2180, protein: 168, carbs: 215, fat: 62 },
  { date: daysAgo(1),  calories: 2340, protein: 175, carbs: 240, fat: 68 },
  { date: daysAgo(2),  calories: 1980, protein: 152, carbs: 190, fat: 58 },
  { date: daysAgo(3),  calories: 2510, protein: 182, carbs: 265, fat: 72 },
  { date: daysAgo(4),  calories: 2090, protein: 160, carbs: 205, fat: 60 },
  { date: daysAgo(5),  calories: 1870, protein: 145, carbs: 178, fat: 54 },
  { date: daysAgo(6),  calories: 2420, protein: 178, carbs: 252, fat: 70 },
  { date: daysAgo(7),  calories: 2260, protein: 170, carbs: 230, fat: 65 },
  { date: daysAgo(8),  calories: 2100, protein: 158, carbs: 210, fat: 61 },
  { date: daysAgo(9),  calories: 1950, protein: 148, carbs: 195, fat: 56 },
  { date: daysAgo(10), calories: 2380, protein: 176, carbs: 248, fat: 69 },
  { date: daysAgo(11), calories: 2200, protein: 165, carbs: 225, fat: 63 },
  { date: daysAgo(12), calories: 2050, protein: 155, carbs: 200, fat: 59 },
  { date: daysAgo(13), calories: 2300, protein: 172, carbs: 238, fat: 67 },
]

export const HEALTH_HISTORY: HealthEntry[] = [
  { date: daysAgo(0),  weight: 74.2, sleep: 7.5, water: 7, mood: 8, steps: 8400,  amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(1),  weight: 74.4, sleep: 6.5, water: 6, mood: 7, steps: 7200,  amDone: 4, amTotal: 4, pmDone: 4, pmTotal: 5 },
  { date: daysAgo(2),  weight: 74.1, sleep: 8.0, water: 8, mood: 9, steps: 10200, amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(3),  weight: 74.3, sleep: 7.0, water: 5, mood: 6, steps: 6800,  amDone: 3, amTotal: 4, pmDone: 4, pmTotal: 5 },
  { date: daysAgo(4),  weight: 74.0, sleep: 7.5, water: 7, mood: 8, steps: 9100,  amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(5),  weight: 74.5, sleep: 5.5, water: 4, mood: 5, steps: 5200,  amDone: 2, amTotal: 4, pmDone: 3, pmTotal: 5 },
  { date: daysAgo(6),  weight: 74.2, sleep: 9.0, water: 8, mood: 9, steps: 11500, amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(7),  weight: 74.6, sleep: 7.0, water: 6, mood: 7, steps: 7800,  amDone: 4, amTotal: 4, pmDone: 4, pmTotal: 5 },
  { date: daysAgo(8),  weight: 74.3, sleep: 6.5, water: 7, mood: 6, steps: 7100,  amDone: 3, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(9),  weight: 74.1, sleep: 8.0, water: 8, mood: 8, steps: 9400,  amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(10), weight: 74.4, sleep: 7.5, water: 6, mood: 7, steps: 8200,  amDone: 4, amTotal: 4, pmDone: 4, pmTotal: 5 },
  { date: daysAgo(11), weight: 74.7, sleep: 6.0, water: 5, mood: 5, steps: 5900,  amDone: 3, amTotal: 4, pmDone: 3, pmTotal: 5 },
  { date: daysAgo(12), weight: 74.2, sleep: 7.5, water: 7, mood: 8, steps: 8700,  amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
  { date: daysAgo(13), weight: 74.0, sleep: 8.5, water: 8, mood: 9, steps: 10800, amDone: 4, amTotal: 4, pmDone: 5, pmTotal: 5 },
]
