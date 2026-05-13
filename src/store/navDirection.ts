const NAV_ORDER = ['/', '/kalender', '/zhaw', '/gym', '/food', '/health', '/style']

let _direction: 'left' | 'right' = 'right'

export function getNavDirection() {
  return _direction
}

export function setNavDirection(from: string, to: string) {
  const fromIdx = NAV_ORDER.indexOf(from)
  const toIdx = NAV_ORDER.indexOf(to)
  _direction = toIdx >= fromIdx ? 'right' : 'left'
}
