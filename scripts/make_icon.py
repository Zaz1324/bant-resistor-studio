from pathlib import Path
from PIL import Image, ImageDraw


root = Path(__file__).resolve().parents[1] / 'src-tauri' / 'icons'
root.mkdir(parents=True, exist_ok=True)
size = 512
im = Image.new('RGBA', (size, size), '#1d5f69')
draw = ImageDraw.Draw(im)
draw.rounded_rectangle((48, 48, 464, 464), radius=96, fill='#1d5f69')
draw.rounded_rectangle((92, 199, 420, 315), radius=54, fill='#e7d8b7')
draw.rounded_rectangle((56, 248, 456, 266), radius=8, fill='#a9c4c5')
draw.rounded_rectangle((92, 199, 420, 315), radius=54, fill='#e7d8b7')
for x, color in [(154, '#e6bb42'), (205, '#8663a3'), (256, '#252827'), (321, '#c8473d'), (376, '#805033')]:
    draw.rectangle((x, 201, x + 17, 313), fill=color)

for px, name in [(32, '32x32.png'), (128, '128x128.png'), (256, '128x128@2x.png')]:
    im.resize((px, px), Image.Resampling.LANCZOS).save(root / name)
im.save(root / 'icon.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
