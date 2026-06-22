# Python script to generate high-resolution PNG icons for PWA compatibility.
# Uses Pillow to draw a neon brutalist logo matching our SVG design.

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not found. Installing Pillow...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont

def draw_neon_icon(size):
    # Create background image
    image = Image.new("RGBA", (size, size), "#08080c")
    draw = ImageDraw.Draw(image)
    
    # Scale coordinates based on size
    scale = size / 512.0
    
    # Draw dark grid lines
    grid_gap = int(64 * scale)
    for i in range(0, size, grid_gap):
        draw.line([(i, 0), (i, size)], fill="#12121e", width=int(2 * scale))
        draw.line([(0, i), (size, i)], fill="#12121e", width=int(2 * scale))
        
    # Draw brutalist outer neon pink border
    border_offset = int(52 * scale)
    border_width = int(8 * scale)
    draw.rectangle(
        [(border_offset, border_offset), (size - border_offset, size - border_offset)],
        outline="#ff007f",
        width=border_width
    )
    
    # Draw double offset cyan border
    cyan_offset = int(44 * scale)
    draw.rectangle(
        [(cyan_offset, cyan_offset), (size - cyan_offset, size - cyan_offset)],
        outline="#00f0ff",
        width=border_width
    )
    
    # Draw microphone stand
    stand_width = int(16 * scale)
    draw.line(
        [(256 * scale, 340 * scale), (256 * scale, 420 * scale)],
        fill="#39ff14",
        width=stand_width
    )
    draw.line(
        [(176 * scale, 420 * scale), (336 * scale, 420 * scale)],
        fill="#39ff14",
        width=stand_width
    )
    
    # Draw microphone holder (U-shape)
    draw.arc(
        [(166 * scale, 150 * scale), (346 * scale, 310 * scale)],
        start=0,
        end=180,
        fill="#00f0ff",
        width=stand_width
    )
    
    # Draw microphone body
    body_width = int(80 * scale)
    body_height = int(180 * scale)
    draw.rounded_rectangle(
        [
            (256 * scale - body_width/2, 100 * scale),
            (256 * scale + body_width/2, 100 * scale + body_height)
        ],
        radius=int(40 * scale),
        fill="#0d0d1a",
        outline="#ff007f",
        width=int(12 * scale)
    )
    
    # Draw grille lines
    for y in [140, 165, 190]:
        draw.line(
            [(256 * scale - body_width/2 + 6, y * scale), (256 * scale + body_width/2 - 6, y * scale)],
            fill="#ff007f",
            width=int(8 * scale)
        )
        
    # Draw center neon stripe
    draw.line(
        [(256 * scale, 106 * scale), (256 * scale, 274 * scale)],
        fill="#00f0ff",
        width=int(6 * scale)
    )
    
    # Draw neon green glitch block
    draw.rectangle(
        [(150 * scale, 80 * scale), (190 * scale, 95 * scale)],
        fill="#39ff14"
    )
    # Draw pink glitch block
    draw.rectangle(
        [(330 * scale, 300 * scale), (360 * scale, 315 * scale)],
        fill="#ff007f"
    )
    
    return image

if __name__ == "__main__":
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate 192x192
    print("Generating 192x192 PWA Icon...")
    icon192 = draw_neon_icon(192)
    icon192.save(os.path.join(icons_dir, "icon-192.png"), "PNG")
    
    # Generate 512x512 PWA Icon
    print("Generating 512x512 PWA Icon...")
    icon512 = draw_neon_icon(512)
    icon512.save(os.path.join(icons_dir, "icon-512.png"), "PNG")
    
    # Generate Electron Base Icon
    app_icons_dir = "../icons"
    os.makedirs(app_icons_dir, exist_ok=True)
    print("Generating 512x512 Electron Icon...")
    icon512.save(os.path.join(app_icons_dir, "icon.png"), "PNG")
    
    print("All Icons generated successfully!")
