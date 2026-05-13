const { createCanvas } = require('@napi-rs/canvas')
const fs = require('fs')

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Dark background with rounded corners (approximated by fill + clip)
  const r = size * 0.22
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#030303'
  ctx.fill()
  ctx.clip()

  // Outer hexagon
  const cx = size / 2, cy = size / 2
  ctx.strokeStyle = '#b8b8b8'
  ctx.lineWidth = size * 0.03
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const hr = size * 0.38
    const x = cx + hr * Math.cos(angle)
    const y = cy + hr * Math.sin(angle)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()

  // Inner hexagon
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = size * 0.015
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const hr = size * 0.26
    const x = cx + hr * Math.cos(angle)
    const y = cy + hr * Math.sin(angle)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()

  // MS text
  ctx.fillStyle = '#c8c8c8'
  ctx.font = `500 ${Math.round(size * 0.27)}px -apple-system, Helvetica, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('MS', cx, cy + size * 0.02)

  return canvas.toBuffer('image/png')
}

if (!fs.existsSync('public/icons')) fs.mkdirSync('public/icons', { recursive: true })
fs.writeFileSync('public/apple-touch-icon.png', generateIcon(180))
fs.writeFileSync('public/icons/icon-192.png', generateIcon(192))
fs.writeFileSync('public/icons/icon-512.png', generateIcon(512))
console.log('Icons generated: apple-touch-icon.png, icons/icon-192.png, icons/icon-512.png')
