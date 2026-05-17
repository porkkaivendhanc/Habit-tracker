import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const iconDir = './public/icons'

async function generateIcons() {
  try {
    // Generate 192x192 icon
    await sharp('./public/icons/icon-192.svg')
      .png()
      .toFile(path.join(iconDir, 'icon-192.png'))
    console.log('Generated icon-192.png')

    // Generate 512x512 icon
    await sharp('./public/icons/icon-512.svg')
      .png()
      .toFile(path.join(iconDir, 'icon-512.png'))
    console.log('Generated icon-512.png')

    // Generate favicon
    await sharp('./public/icons/icon-192.svg')
      .resize(32, 32)
      .png()
      .toFile(path.join(iconDir, 'favicon.png'))
    console.log('Generated favicon.png')

    console.log('All icons generated successfully!')
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()
