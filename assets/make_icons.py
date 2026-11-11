# Draws every Sparkworks icon from one design: a spark steered along a path over the board grid.
# The ring at the start is the SOURCE, the bright spark at the end is the spark reaching the VAULT.
# Run: python3 assets/make_icons.py     (needs: pip install pillow numpy)
# Then: npm run android:icons           (writes android/app/src/main/res/... from assets/*.png and then calls
#                                        this script with --android-layers to make the adaptive layers sharp)
# Owner: AI-1 (redrawn by the manager, 2026-11-11)
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(os.path.dirname(HERE), 'public')
RES = os.path.join(os.path.dirname(HERE), 'android', 'app', 'src', 'main', 'res')

BG_TOP = (23, 29, 40)       # graphite, a little lighter at the top
BG_BOT = (9, 12, 18)        # #090C12
PAGE = (11, 14, 20)         # #0B0E14, the game page colour (splash background)
AMBER = (255, 200, 87)      # #FFC857
HOT = (255, 244, 208)       # #FFF4D0 spark core
DEEP = (232, 156, 36)       # tail of the trail

SS = 2                      # draw at 2x, then shrink for smooth edges

# The design in a 1024 square. Everything that matters stays inside a circle of radius ~370 around the
# centre, which is the part Android never crops from an adaptive icon.
FULL = {
    'path': [(238, 712), (428, 712), (428, 448), (644, 448)],
    'corner': 84,
    'width': (30, 54),      # trail thickness: tail, head
    'tips': 178,            # length of the long spark tips
    'core': 44,
    'ring': True,
    'glow': 1.0,
}
# Favicon: fewer details, bigger spark, so it is readable at 16 px.
SMALL = {
    'path': [(200, 690), (410, 690), (410, 400), (610, 400)],
    'corner': 90,
    'width': (56, 92),
    'tips': 290,
    'core': 92,
    'ring': False,
    'glow': 1.0,
}


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return tuple(int(round(lerp(c1[i], c2[i], t))) for i in range(3))


def radial(size, cx, cy, radius, color, strength, power):
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float32)
    d = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / radius
    a = np.clip(1.0 - d, 0.0, 1.0) ** power * strength
    arr = np.zeros((size, size, 4), np.uint8)
    arr[..., 0], arr[..., 1], arr[..., 2] = color
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


def star_points(cx, cy, tip, waist, turn=0.0):
    # 4 long tips, pinched in between (turn rotates the whole star, in degrees).
    pts = []
    for i in range(8):
        r = tip if i % 2 == 0 else tip * waist
        a = math.radians(-90 + turn + i * 45)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def rounded_path(points, radius, step):
    # A polyline with smooth rounded corners, sampled every `step` pixels.
    pts = [np.array(p, np.float32) for p in points]
    dense = []

    def add_line(a, b):
        n = max(int(np.linalg.norm(b - a) / step), 1)
        for k in range(n):
            dense.append(a + (b - a) * (k / n))

    cur = pts[0]
    for i in range(1, len(pts) - 1):
        p0, p1, p2 = pts[i - 1], pts[i], pts[i + 1]
        v1 = (p0 - p1) / np.linalg.norm(p0 - p1)
        v2 = (p2 - p1) / np.linalg.norm(p2 - p1)
        l1 = min(radius, np.linalg.norm(p0 - p1) / 2)
        l2 = min(radius, np.linalg.norm(p2 - p1) / 2)
        a, b = p1 + v1 * l1, p1 + v2 * l2
        add_line(cur, a)
        n = 24
        for k in range(n):
            t = k / n
            dense.append((1 - t) ** 2 * a + 2 * (1 - t) * t * p1 + t ** 2 * b)
        cur = b
    add_line(cur, pts[-1])
    dense.append(pts[-1])
    return dense


def foreground(size, cfg, scale_glow=1.0, mono=False):
    # mono=True draws a flat white silhouette (no glow, full alpha) for Android themed icons.
    amber, hot = ((255, 255, 255), (255, 255, 255)) if mono else (AMBER, HOT)
    # Transparent layer: ring, glowing trail and the spark. size = final pixels.
    big = size * SS
    k = big / 1024.0
    layer = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    path = rounded_path([(x * k, y * k) for x, y in cfg['path']], cfg['corner'] * k, max(1.5, k))
    n = len(path)

    trail = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    td = ImageDraw.Draw(trail)  # no blending: later (brighter) stamps replace earlier ones
    for i, p in enumerate(path):
        t = i / max(n - 1, 1)
        w = lerp(cfg['width'][0], cfg['width'][1], t ** 0.9) * k / 2
        col = lerp_color(DEEP, AMBER, min(1.0, t * 1.5))
        col = lerp_color(col, HOT, max(0.0, (t - 0.85) / 0.15) * 0.8)
        alpha = int(255 * (0.38 + 0.62 * t ** 0.7))
        if mono:
            col, alpha = (255, 255, 255), 255
        td.ellipse([p[0] - w, p[1] - w, p[0] + w, p[1] + w], fill=col + (alpha,))

    sx, sy = path[-1]
    spark = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    if not mono:
        spark = Image.alpha_composite(spark, radial(big, sx, sy, 330 * k * scale_glow, AMBER, 0.55 * cfg['glow'], 2.2))
    if not mono:
        spark = Image.alpha_composite(spark, radial(big, sx, sy, 170 * k * scale_glow, HOT, 0.75 * cfg['glow'], 2.4))

    glow = trail.filter(ImageFilter.GaussianBlur(30 * k))
    ga = np.array(glow)
    ga[..., 3] = (ga[..., 3].astype(np.float32) * 0.85).astype(np.uint8)
    if not mono:
        layer = Image.alpha_composite(layer, Image.fromarray(ga, 'RGBA'))
    layer = Image.alpha_composite(layer, spark)
    layer = Image.alpha_composite(layer, trail)

    if cfg['ring']:
        rx, ry = path[0]
        rd = ImageDraw.Draw(layer)
        rr = 38 * k
        rd.ellipse([rx - rr, ry - rr, rx + rr, ry + rr], outline=amber + (235,), width=int(11 * k))
        r2 = 11 * k
        rd.ellipse([rx - r2, ry - r2, rx + r2, ry + r2], fill=hot + (235,))

    flare = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    fd = ImageDraw.Draw(flare)
    fd.polygon(star_points(sx, sy, cfg['tips'] * 0.56 * k, 0.17, 45), fill=amber + (170,))
    fd.polygon(star_points(sx, sy, cfg['tips'] * k, 0.12), fill=amber + (255,))
    fd.polygon(star_points(sx, sy, cfg['tips'] * 0.58 * k, 0.2), fill=hot + (255,))
    bloom = flare.filter(ImageFilter.GaussianBlur(14 * k))
    if not mono:
        layer = Image.alpha_composite(layer, bloom)
    layer = Image.alpha_composite(layer, flare)
    cd = ImageDraw.Draw(layer)
    cr = cfg['core'] * k / 2 * 1.25
    cd.ellipse([sx - cr, sy - cr, sx + cr, sy + cr], fill=hot + (255,))
    return layer.resize((size, size), Image.LANCZOS)


def background(size, with_grid=True):
    s = size * SS
    t = np.linspace(0, 1, s, dtype=np.float32)[:, None]
    arr = np.zeros((s, s, 4), np.float32)
    for c in range(3):
        arr[..., c] = BG_TOP[c] * (1 - t) + BG_BOT[c] * t
    arr[..., 3] = 255
    img = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    if with_grid:
        grid = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        d = ImageDraw.Draw(grid)
        cells = 4
        cs = s / cells
        m, ln, w = cs * 0.12, cs * 0.17, max(2, int(s * 0.0065))
        col = (255, 255, 255, 20)
        for i in range(cells):
            for j in range(cells):
                x0, y0 = i * cs, j * cs
                x1, y1 = x0 + cs, y0 + cs
                for (cx, cy, dx, dy) in ((x0 + m, y0 + m, 1, 1), (x1 - m, y0 + m, -1, 1),
                                         (x0 + m, y1 - m, 1, -1), (x1 - m, y1 - m, -1, -1)):
                    d.line([(cx, cy), (cx + dx * ln, cy)], fill=col, width=w)
                    d.line([(cx, cy), (cx, cy + dy * ln)], fill=col, width=w)
        img = Image.alpha_composite(img, grid)
    k = s / 1024.0
    sx, sy = FULL['path'][-1]
    img = Image.alpha_composite(img, radial(s, sx * k, sy * k, 560 * k, AMBER, 0.20, 2.0))
    return img.resize((size, size), Image.LANCZOS)


def rounded_mask(size, frac):
    m = Image.new('L', (size * SS, size * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=int(size * SS * frac), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def save(path, img):
    img.save(path)
    print('wrote', os.path.relpath(path, os.path.dirname(HERE)))


# Android adaptive icon: the 108 dp canvas shows a 72 dp window, and our 1024 art fills exactly that window
# (the XML insets it by 16.7%). So each layer is written at 72 dp in every density, which makes it sharp.
LAYER_PX = {'ldpi': 54, 'mdpi': 72, 'hdpi': 108, 'xhdpi': 144, 'xxhdpi': 216, 'xxxhdpi': 288}
ADAPTIVE_XML = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background>
        <inset android:drawable="@mipmap/ic_launcher_background" android:inset="16.7%" />
    </background>
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />
    </foreground>
    <monochrome>
        <inset android:drawable="@mipmap/ic_launcher_monochrome" android:inset="16.7%" />
    </monochrome>
</adaptive-icon>
'''


def android_layers():
    fg = Image.open(os.path.join(HERE, 'icon-foreground.png')).convert('RGBA')
    bg = Image.open(os.path.join(HERE, 'icon-background.png')).convert('RGBA')
    # Monochrome (Android 13 themed icons): the solid shapes only (no soft glow), white, the system tints it.
    mono = foreground(1024, FULL, mono=True)
    for dens, px in LAYER_PX.items():
        folder = os.path.join(RES, 'mipmap-' + dens)
        if not os.path.isdir(folder):
            continue
        fg.resize((px, px), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_foreground.png'))
        bg.resize((px, px), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_background.png'))
        mono.resize((px, px), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_monochrome.png'))
    xml_dir = os.path.join(RES, 'mipmap-anydpi-v26')
    for name in ('ic_launcher.xml', 'ic_launcher_round.xml'):
        with open(os.path.join(xml_dir, name), 'w') as f:
            f.write(ADAPTIVE_XML)
    print('wrote sharp adaptive layers + monochrome layer + adaptive xml')


def main():
    import sys
    if '--android-layers' in sys.argv:
        android_layers()
        return
    os.makedirs(PUBLIC, exist_ok=True)
    fg = foreground(1024, FULL)
    bg = background(1024, True)
    icon = Image.alpha_composite(bg, fg)

    # Capacitor assets (Android adaptive icon layers, legacy icon, splash).
    save(os.path.join(HERE, 'icon-foreground.png'), fg)
    save(os.path.join(HERE, 'icon-background.png'), bg)
    save(os.path.join(HERE, 'icon-only.png'), icon)
    splash_mark = fg.resize((int(2732 * 0.44),) * 2, Image.LANCZOS)
    splash = Image.new('RGBA', (2732, 2732), PAGE + (255,))
    off = (2732 - splash_mark.width) // 2
    splash.alpha_composite(splash_mark, (off, off))
    save(os.path.join(HERE, 'splash.png'), splash)
    save(os.path.join(HERE, 'splash-dark.png'), splash)

    # Web: favicon (small design, rounded square), PNG sizes, .ico, apple-touch, PWA icons.
    fav = Image.alpha_composite(background(512, False), foreground(512, SMALL))
    fav.putalpha(rounded_mask(512, 0.22))
    save(os.path.join(PUBLIC, 'favicon-32.png'), fav.resize((32, 32), Image.LANCZOS))
    save(os.path.join(PUBLIC, 'favicon-64.png'), fav.resize((64, 64), Image.LANCZOS))
    fav.resize((48, 48), Image.LANCZOS).save(os.path.join(PUBLIC, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    print('wrote public/favicon.ico')
    save(os.path.join(PUBLIC, 'apple-touch-icon.png'), icon.resize((180, 180), Image.LANCZOS).convert('RGB'))
    save(os.path.join(PUBLIC, 'icon-192.png'), icon.resize((192, 192), Image.LANCZOS).convert('RGB'))
    save(os.path.join(PUBLIC, 'icon-512.png'), icon.resize((512, 512), Image.LANCZOS).convert('RGB'))


if __name__ == '__main__':
    main()
