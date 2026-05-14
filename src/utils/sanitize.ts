const MAX_LENGTHS = {
  title:       100,
  description: 500,
  note:        1000,
  chat:        2000,
  name:        50,
  url:         200,
  number:      10,
} as const

type InputType = keyof typeof MAX_LENGTHS

/**
 * Sanitize a string input:
 * - Trim whitespace
 * - Enforce max length
 * - Remove null bytes and control characters
 * - Strip HTML tags to prevent XSS
 * - Escape HTML special characters
 */
export function sanitizeString(
  input: unknown,
  type: InputType = 'description',
): string {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, MAX_LENGTHS[type])
    .replace(/\0/g, '')                   // null bytes
    .replace(/<[^>]*>/g, '')              // HTML tags
    .replace(/[<>"'`]/g, (c) => ({
      '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#x27;', '`': '&#x60;',
    }[c] ?? c))
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
}

/**
 * Clamp a number within [min, max], returning fallback for NaN/Infinity.
 */
export function sanitizeNumber(
  input:    unknown,
  min:      number,
  max:      number,
  fallback: number = 0,
): number {
  const n = typeof input === 'string' ? parseFloat(input) : Number(input)
  if (!isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

/**
 * Accept only YYYY-MM-DD date strings within a sane year range.
 */
export function sanitizeDate(input: unknown): string {
  if (typeof input !== 'string') return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return ''
  const d = new Date(input)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  if (year < 2000 || year > 2100) return ''
  return input
}

/**
 * Extra-strict sanitizer for text sent to Claude API.
 * Strips prompt-injection patterns on top of normal sanitization.
 */
export function sanitizeForAI(input: string): string {
  return sanitizeString(input, 'chat')
    .replace(/\bignore\b.{0,30}\binstructions?\b/gi, '')
    .replace(/\bsystem\s*prompt\b/gi, '')
    .replace(/\bjailbreak\b/gi, '')
    .replace(/\bDAN\b/g, '')
    .slice(0, 2000)
}

/**
 * Validate an image file before processing/uploading.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!ALLOWED.includes(file.type)) {
    return { valid: false, error: 'Nur JPG, PNG, WebP und GIF erlaubt.' }
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Bild darf max. 5 MB gross sein.' }
  }
  return { valid: true }
}
