export function toSwissDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return input as string
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

export function toSwissDateShort(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return input as string
  return `${d.getDate()}.${d.getMonth() + 1}.`
}

export function toSwissDateTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const time = d.toLocaleTimeString('de-CH', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
  })
  return `${toSwissDate(d)} ${time}`
}
