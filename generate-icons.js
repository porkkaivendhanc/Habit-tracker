#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

try {
  const { createCanvas } = await import('canvas')

  function generateIcon(size) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Dark background
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, size, size)

    // Blue circle
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2)
    ctx.fill()

    // White checkmark
    ctx.strokeStyle = 'white'
    ctx.lineWidth = size * 0.06
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(size * 0.31, size * 0.52)
    ctx.lineTo(size * 0.42, size * 0.63)
    ctx.lineTo(size * 0.73, size * 0.31)
    ctx.stroke()

    return canvas.toBuffer('image/png')
  }

  const iconDir = path.join(__dirname, '..', 'public', 'icons')
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true })
  }

  // Generate 192x192
  fs.writeFileSync(path.join(iconDir, 'icon-192.png'), generateIcon(192))
  console.log('✓ Generated icon-192.png')

  // Generate 512x512
  fs.writeFileSync(path.join(iconDir, 'icon-512.png'), generateIcon(512))
  console.log('✓ Generated icon-512.png')

  // Generate favicon
  fs.writeFileSync(path.join(iconDir, 'favicon.png'), generateIcon(32))
  console.log('✓ Generated favicon.png')

  console.log('\n✓ All PWA icons generated successfully!')
} catch {
  console.error('Canvas module not available. Skipping icon generation.')
  console.error(
    'To generate icons properly, install: npm install --save-dev canvas',
  )
  console.error('For now, please use online tools to create icon-192.png and icon-512.png')
  console.error('Saved as placeholder SVG files in public/icons/')
}
