# Draws the Sparkworks icon and splash PNGs (amber spark on a dark square).
# Run: python3 assets/make_icons.py   then: npm run android:icons
# Owner: AI-1
from PIL import Image, ImageDraw, ImageFilter
import os

BG = (11, 14, 20, 255)          # #0B0E14
AMBER = (255, 200, 87, 255)     # #FFC857 spark
HOT = (255, 241, 194, 255)      # #FFF1C2 spark core
OUT = os.path.dirname(os.path.abspath(__file__))


def star_points(cx, cy, radius, waist):
    # A 4-point spark: long tips up/down/left/right, pinched in between.
    pts = []
    for i in range(8):
        r = radius if i % 2 == 0 else radius * waist
        # angle in quarter steps of 45 degrees, tips on the axes
        import math
        a = math.radians(-90 + i * 45)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def spark_layer(size, scale, with_glow=True):
    # Draw big, shrink for smooth edges.
    big = size * 2
    layer = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    c = big / 2
    radius = big * scale
    if with_glow:
        glow = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.polygon(star_points(c, c, radius, 0.22), fill=(255, 200, 87, 200))
        gd.ellipse([c - radius * 0.28, c - radius * 0.28, c + radius * 0.28, c + radius * 0.28], fill=(255, 200, 87, 220))
        glow = glow.filter(ImageFilter.GaussianBlur(big * 0.035))
        layer = Image.alpha_composite(layer, glow)
    d = ImageDraw.Draw(layer)
    d.polygon(star_points(c, c, radius, 0.22), fill=AMBER)
    inner = radius * 0.45
    d.polygon(star_points(c, c, inner, 0.3), fill=HOT)
    return layer.resize((size, size), Image.LANCZOS)


def save(name, img):
    img.convert('RGBA').save(os.path.join(OUT, name))
    print('wrote', name)


def with_bg(size, scale):
    img = Image.new('RGBA', (size, size), BG)
    return Image.alpha_composite(img, spark_layer(size, scale))


# Icon: the spark fills about 60% so it stays inside Android's adaptive-icon safe zone.
save('icon-only.png', with_bg(1024, 0.30))
save('icon-foreground.png', spark_layer(1024, 0.28))
save('icon-background.png', Image.new('RGBA', (1024, 1024), BG))
# Splash: dark page with a small spark in the middle.
save('splash.png', with_bg(2732, 0.07))
save('splash-dark.png', with_bg(2732, 0.07))
