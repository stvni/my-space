interface CacheEntry {
  headline:  string
  lines:     string[]
  timestamp: number
  dataHash:  string
}

/** Round significant values so tiny fluctuations don't trigger a re-fetch */
export function createDataHash(data: {
  calories: number
  protein:  number
  water:    number
  sleep:    number
  gymDone:  number
  gymTotal: number
  zhawDone: number
}): string {
  const significant = {
    cal:  Math.round(data.calories / 200) * 200,  // nearest 200 kcal
    pro:  Math.round(data.protein  / 20)  * 20,   // nearest 20 g
    wat:  Math.round(data.water    / 0.5) * 0.5,  // nearest 0.5 L
    slp:  Math.round(data.sleep),                  // nearest 1 h
    gym:  data.gymDone,
    gtot: data.gymTotal,
    zhaw: data.zhawDone,
  }
  return JSON.stringify(significant)
}

const CACHE_KEY  = 'peak_coach_cache'
const MAX_AGE_MS = 3 * 60 * 60 * 1000 // 3 hours hard limit

export function getCachedCoach(currentHash: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    const age = Date.now() - entry.timestamp
    if (entry.dataHash === currentHash && age < MAX_AGE_MS) return entry
    return null
  } catch {
    return null
  }
}

export function setCachedCoach(headline: string, lines: string[], dataHash: string): void {
  try {
    const entry: CacheEntry = { headline, lines, timestamp: Date.now(), dataHash }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch { /* storage full — fail silently */ }
}

export function clearCoachCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
