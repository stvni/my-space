export function format(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function today(): string {
  return format(new Date())
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function startDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}
