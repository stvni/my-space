interface RateLimitEntry {
  count:       number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * In-memory rate limiter for frontend API calls.
 * Resets on page refresh (intentional — prevents accidental loops, not abuse).
 */
export function checkRateLimit(
  key:         string,
  maxAttempts: number = 5,
  windowMs:    number = 15 * 60 * 1000, // 15 min default
): { allowed: boolean; remainingMs: number; attempts: number } {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remainingMs: 0, attempts: 1 }
  }

  if (entry.count >= maxAttempts) {
    const remainingMs = windowMs - (now - entry.windowStart)
    return { allowed: false, remainingMs, attempts: entry.count }
  }

  entry.count++
  return { allowed: true, remainingMs: 0, attempts: entry.count }
}

export function resetRateLimit(key: string): void {
  store.delete(key)
}

export function formatRemainingTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000)
  return `${minutes} Minute${minutes !== 1 ? 'n' : ''}`
}
