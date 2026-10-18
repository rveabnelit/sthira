"""
STHIRA — генератор атмосферных текстур (свет на штукатурке, лён, песок, тень листвы).
Никаких стоковых лиц и эзотерических символов: только материал, свет и зерно.
Обложки практик в интерфейсе — типографические «пластины» на CSS, поэтому фото не нужны.
"""
import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images")
os.makedirs(OUT, exist_ok=True)

IVORY = (243, 240, 232)
PAPER = (251, 250, 247)
SAGE = (164, 173, 150)
FOREST = (36, 57, 47)
SAND = (216, 201, 181)


def hexarr(c):
    return np.array(c, dtype=np.float32)


def lerp(a, b, t):
    return a + (b - a) * t


def value_noise(h, w, scale, rng, octaves=5):
    total = np.zeros((h, w), dtype=np.float32)
    norm = 0.0
    amp = 1.0
    for o in range(octaves):
        s = max(2, int(scale / (2 ** o)))
        gh, gw = max(2, h // s + 2), max(2, w // s + 2)
        g = (rng.random((gh, gw)) * 255).astype(np.uint8)
        img = Image.fromarray(g).resize((w, h), Image.BICUBIC)
        total += amp * (np.asarray(img, dtype=np.float32) / 255.0)
        norm += amp
        amp *= 0.55
    return total / norm


def gradient(h, w, top, bottom, curve=1.0):
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None, None] ** curve
    return lerp(hexarr(top), hexarr(bottom), y) + np.zeros((h, w, 1), dtype=np.float32)


def soft_rect(h, w, rect, blur, angle=0.0):
    """Мягкое световое пятно-прямоугольник с поворотом (свет из окна)."""
    x0, y0, x1, y1 = rect
    pad = int(blur * 3)
    W, H = w + pad * 2, h + pad * 2
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    d.rectangle([x0 + pad, y0 + pad, x1 + pad, y1 + pad], fill=255)
    if angle:
        m = m.rotate(angle, resample=Image.BICUBIC, center=(W / 2, H / 2))
    m = m.filter(ImageFilter.GaussianBlur(blur))
    m = m.crop((pad, pad, pad + w, pad + h))
    return np.asarray(m, dtype=np.float32)[:, :, None] / 255.0


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def finish(img, rng, path, quality=88, vignette=0.12, grain=3.0):
    h, w = img.shape[:2]
    y, x = np.mgrid[0:h, 0:w]
    r = np.sqrt(((x - w / 2) / (w * 0.7)) ** 2 + ((y - h / 2) / (h * 0.7)) ** 2)
    img = img * np.clip(1 - (r ** 2.4) * vignette, 0, 1)[:, :, None]
    img = img + rng.normal(0, grain, (h, w, 1))
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
    im.save(path, quality=quality, optimize=True)
    return im


def plaster(h, w, seed, top=(246, 241, 231), bottom=(224, 213, 197), warm=SAND, angle=-16,
            light_rect=(0.46, -0.1, 1.25, 0.86), mullion=0.55):
    rng = np.random.default_rng(seed)
    img = gradient(h, w, top, bottom, 0.85)
    n = value_noise(h, w, 120, rng, 5)[:, :, None]
    fine = value_noise(h, w, 14, rng, 3)[:, :, None]
    img = img + (n - 0.5) * 13 + (fine - 0.5) * 5

    light = soft_rect(h, w, (light_rect[0] * w, light_rect[1] * h, light_rect[2] * w, light_rect[3] * h), max(h, w) * 0.06, angle)
    img = img + (hexarr(PAPER) - img) * light * 0.55
    core = soft_rect(h, w, (light_rect[0] * w, light_rect[1] * h, light_rect[2] * w, light_rect[3] * h), max(h, w) * 0.16, angle)
    img = img + (hexarr((255, 252, 244)) - img) * core * 0.30

    # тень от переплёта окна
    if mullion:
        mx = (light_rect[0] + (light_rect[2] - light_rect[0]) * mullion) * w
        band = soft_rect(h, w, (mx - w * 0.012, light_rect[1] * h, mx + w * 0.012, light_rect[3] * h), max(h, w) * 0.012, angle)
        img = img - band * 26

    # тёплая полоса у пола
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    floor = np.clip((y - 0.86) / 0.14, 0, 1)
    img = img + (hexarr(warm) - img) * floor * 0.20
    return img, rng


def linen(h, w, seed, top=(251, 248, 242), bottom=(224, 214, 199), freq=2.4, angle=-14, contrast=0.34):
    rng = np.random.default_rng(seed)
    img = gradient(h, w, top, bottom, 0.7)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    a = math.radians(angle)
    u = (x * math.cos(a) + y * math.sin(a)) / w
    bands = np.sin(u * math.pi * 2 * freq + 0.9)
    shade = np.clip(bands, -1, 1)
    img = img + shade[:, :, None] * np.array([16, 15, 12], dtype=np.float32) * contrast
    # ткацкая текстура
    weave = (np.sin(x * 2.1) * np.sin(y * 1.7))[:, :, None] * 3.4
    fine = value_noise(h, w, 8, rng, 3)[:, :, None]
    img = img + weave + (fine - 0.5) * 9
    # мягкий свет сверху слева
    light = soft_rect(h, w, (-0.2 * w, -0.2 * h, 0.6 * w, 0.5 * h), max(h, w) * 0.2)
    img = img + (hexarr(PAPER) - img) * light * 0.25
    return img, rng


def dune(h, w, seed, top=(244, 238, 228), bottom=(214, 204, 188), accent=(196, 202, 184), dark=False):
    rng = np.random.default_rng(seed)
    img = gradient(h, w, top, bottom, 1.0)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xn = xx / w
    line = h * (0.66 + 0.13 * np.sin(xn * 2.4 + 0.5) - 0.12 * xn)
    m = smoothstep(0, 1, (yy - line) / (h * 0.14))[:, :, None]
    img = img + (hexarr(accent) - img) * m * (0.5 if not dark else 0.35)
    upper = 1 - m
    img = img + (hexarr(PAPER) - img) * upper * 0.12
    n = value_noise(h, w, 90, rng, 5)[:, :, None]
    img = img + (n - 0.5) * 9
    return img, rng


def shadow_leaves(h, w, seed, base=FOREST, leaf=(22, 34, 28), spots=(236, 240, 226)):
    rng = np.random.default_rng(seed)
    img = gradient(h, w, base, tuple(int(c * 0.82) for c in base), 0.9)
    n = value_noise(h, w, 140, rng, 5)[:, :, None]
    img = img + (n - 0.5) * 16

    def leaves_mask(d, w_, h_):
        for _ in range(26):
            cx, cy = rng.uniform(-0.1, 1.1) * w_, rng.uniform(-0.15, 1.15) * h_
            rx = rng.uniform(0.07, 0.22) * w_
            ry = rx * rng.uniform(0.3, 0.55)
            ang = rng.uniform(0, 180)
            box = Image.new("L", (max(4, int(rx * 2)) + 4, max(4, int(ry * 2)) + 4), 0)
            bd = ImageDraw.Draw(box)
            bd.ellipse([2, 2, box.width - 2, box.height - 2], fill=255)
            box = box.rotate(ang, expand=True)
            layer = Image.new("L", (w_, h_), 0)
            layer.paste(box, (int(cx - box.width / 2), int(cy - box.height / 2)), box)
            d.bitmap((0, 0), layer, fill=255)

    m = Image.new("L", (w, h), 0)
    leaves_mask(ImageDraw.Draw(m), w, h)
    lm = np.asarray(m.filter(ImageFilter.GaussianBlur(max(h, w) * 0.02)), dtype=np.float32)[:, :, None] / 255
    img = img + (hexarr(leaf) - img) * lm * 0.75

    def spot_mask(d, w_, h_):
        for _ in range(14):
            cx, cy = rng.uniform(0, 1) * w_, rng.uniform(0, 1) * h_
            r = rng.uniform(0.02, 0.09) * w_
            d.ellipse([cx - r, cy - r * 0.8, cx + r, cy + r * 0.8], fill=255)

    s = Image.new("L", (w, h), 0)
    spot_mask(ImageDraw.Draw(s), w, h)
    sm = np.asarray(s.filter(ImageFilter.GaussianBlur(max(h, w) * 0.035)), dtype=np.float32)[:, :, None] / 255
    img = img + (hexarr(spots) - img) * sm * 0.22
    return img, rng


def stone(h, w, seed):
    rng = np.random.default_rng(seed)
    img = gradient(h, w, (243, 236, 226), (222, 211, 195), 0.9)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    # мягкие горизонтальные слои камня
    for i, cy in enumerate([0.26, 0.44, 0.62, 0.8]):
        yy = cy + 0.018 * np.sin(x / w * 5 + i)
        band = np.exp(-((y / h - yy) ** 2) / (2 * 0.012 ** 2))[:, :, None]
        img = img + (hexarr(PAPER) - img) * band * 0.35
        shadow = np.exp(-((y / h - yy - 0.012) ** 2) / (2 * 0.016 ** 2))[:, :, None]
        img = img - shadow * 12
    n = value_noise(h, w, 60, rng, 5)[:, :, None]
    img = img + (n - 0.5) * 12
    light = smoothstep(0.3, 1.0, 1 - x / w)[:, :, None]
    img = img + (hexarr(IVORY) - img) * light * 0.12
    return img, rng


def og(h=630, w=1200):
    rng = np.random.default_rng(7)
    img = gradient(h, w, IVORY, (236, 231, 220))
    light = soft_rect(h, w, (w * 0.62, -h * 0.3, w * 1.2, h * 1.1), 90, -12)
    img = img + (hexarr(SAGE) - img) * light * 0.5
    im = finish(img, rng, os.path.join(OUT, "og-raw.jpg"), vignette=0.04)
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 116)
    f2 = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 34)
    f3 = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 19)
    d.text((80, 140), "STHIRA", font=f1, fill=(41, 43, 39))
    d.text((84, 300), "Йога, которая знает,", font=f2, fill=(41, 43, 39))
    d.text((84, 346), "что тебе делать сегодня", font=f2, fill=(41, 43, 39))
    d.text((84, 470), "АВТОРСКАЯ ШКОЛА МАРИИ ВАСИЛЬЕВОЙ", font=f3, fill=(110, 113, 104))
    im.save(os.path.join(OUT, "og.jpg"), quality=90, optimize=True)
    os.remove(os.path.join(OUT, "og-raw.jpg"))


def main():
    specs = [
        ("hero-light", lambda: plaster(1400, 1120, 3, angle=-14, light_rect=(0.35, -0.15, 1.15, 0.95))),
        ("hero-light-wide", lambda: plaster(900, 1800, 4, angle=-8, light_rect=(0.1, -0.2, 0.85, 1.0))),
        ("light-wall", lambda: plaster(1200, 900, 5, angle=-22, top=(248, 243, 233), bottom=(228, 217, 201))),
        ("light-wall-dark", lambda: plaster(1200, 900, 6, top=(48, 64, 53), bottom=(27, 41, 34), warm=(30, 44, 36), angle=-18, light_rect=(0.2, -0.2, 0.95, 0.8))),
        ("linen", lambda: linen(1200, 900, 7)),
        ("linen-soft", lambda: linen(1000, 1600, 8, freq=1.7, angle=-6, contrast=0.24)),
        ("dune", lambda: dune(1200, 900, 9)),
        ("dune-dark", lambda: dune(1200, 900, 10, top=(44, 60, 50), bottom=(24, 38, 31), accent=(18, 29, 23), dark=True)),
        ("leaves", lambda: shadow_leaves(1200, 900, 11)),
        ("stone", lambda: stone(1200, 900, 12)),
        ("teacher", lambda: plaster(1500, 1200, 13, angle=-10, light_rect=(0.05, -0.15, 0.8, 0.9), mullion=0.0)),
        ("studio", lambda: plaster(900, 1400, 14, angle=-30, light_rect=(0.25, -0.3, 1.1, 0.7))),
    ]
    names = []
    for name, fn in specs:
        img, rng = fn()
        finish(img, rng, os.path.join(OUT, name + ".jpg"))
        names.append(name)
    og()
    thumbs = [Image.open(os.path.join(OUT, n + ".jpg")).resize((320, 240)) for n in names]
    cols = 4
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * 330, rows * 250), (255, 255, 255))
    for i, t in enumerate(thumbs):
        sheet.paste(t, ((i % cols) * 330 + 5, (i // cols) * 250 + 5))
    sheet.save(os.path.join(OUT, "_contact-sheet.jpg"), quality=82)
    print("done", len(names))


if __name__ == "__main__":
    main()
