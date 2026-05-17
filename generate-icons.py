#!/usr/bin/env python3
"""
Generate simple PNG icons for PWA
This is a fallback for when Node canvas module is not available.
"""

import struct
import zlib
import os

def create_simple_png(width, height, filename):
    """Create a simple PNG file with a solid color and a checkmark pattern"""
    
    # Create image data (4 bytes per pixel: RGBA)
    pixels = bytearray()
    
    for y in range(height):
        # Filter byte (0 = no filter)
        pixels.append(0)
        
        for x in range(width):
            # Dark background #1f2937 with blue circle and white checkmark
            r, g, b, a = 31, 41, 55, 255  # Dark gray default
            
            # Create blue circle in center
            cx, cy = width // 2, height // 2
            radius = width * 0.42
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            
            if dist < radius:
                r, g, b = 59, 130, 246  # Blue circle
                
                # Add white checkmark pattern
                if width > 100:  # Only for larger icons
                    # Simple diagonal lines for checkmark effect
                    if (y > height * 0.45 and y < height * 0.65 and 
                        x > width * 0.3 and x < width * 0.75):
                        if (x - width * 0.31) * 0.5 == (y - height * 0.52):
                            r, g, b = 255, 255, 255
            
            pixels.extend([r, g, b, a])
    
    # PNG signature
    png_data = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png_data += struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (compressed image data)
    idat_data = zlib.compress(bytes(pixels))
    idat_crc = zlib.crc32(b'IDAT' + idat_data) & 0xffffffff
    png_data += struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png_data += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    # Write file
    with open(filename, 'wb') as f:
        f.write(png_data)

if __name__ == '__main__':
    icon_dir = os.path.join(os.path.dirname(__file__), 'public', 'icons')
    os.makedirs(icon_dir, exist_ok=True)
    
    print('Generating PWA icons...')
    create_simple_png(192, 192, os.path.join(icon_dir, 'icon-192.png'))
    print('✓ Generated icon-192.png')
    
    create_simple_png(512, 512, os.path.join(icon_dir, 'icon-512.png'))
    print('✓ Generated icon-512.png')
    
    create_simple_png(32, 32, os.path.join(icon_dir, 'favicon.png'))
    print('✓ Generated favicon.png')
    
    print('\n✓ All icons generated successfully!')
