"""Render a dreamy, seamlessly looping hero video from the AI-generated stills.

Sub-pixel Ken Burns moves + crossfades + soft bloom + drifting firefly bokeh.
usage: python3 tools/make_hero_video.py assets/img assets/video/hero-desktop.mp4 desktop
       python3 tools/make_hero_video.py assets/img assets/video/hero-mobile.mp4 mobile
Then make the WebM fallback:
       ffmpeg -i assets/video/hero-desktop.mp4 -c:v libvpx-vp9 -crf 36 -b:v 0 -an assets/video/hero-desktop.webm
Requires: python3, numpy, pillow, ffmpeg (libx264).
Swap in your own photos by editing the SCENES lists (file, focus point, zoom in/out, pan).
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

raw, out, mode = sys.argv[1:4]
FPS = 24
if mode == "desktop":
    W, H = 1280, 720
    SCENES = [  # file, (cx, cy) focus 0..1, zoom start, zoom end, pan dx (fraction of width)
        ("lavender-field.webp", (0.62, 0.52), 1.00, 1.14, 0.00),
        ("sparklers.webp", (0.53, 0.52), 1.16, 1.02, 0.00),
        ("church.webp", (0.50, 0.56), 1.00, 1.16, 0.00),
        ("reception.webp", (0.42, 0.55), 1.12, 1.12, 0.10),
    ]
else:
    W, H = 720, 1280
    SCENES = [
        ("couple-field.webp", (0.60, 0.48), 1.00, 1.14, 0.00),
        ("couple-arch.webp", (0.55, 0.50), 1.16, 1.03, 0.00),
        ("couple-walk.webp", (0.54, 0.60), 1.00, 1.15, 0.00),
        ("rings.webp", (0.50, 0.50), 1.04, 1.16, 0.00),
    ]

SCENE_LEN, XF = 7.2, 1.2                      # seconds per scene, crossfade length
STEP = SCENE_LEN - XF
T = STEP * len(SCENES)                        # loop length; last xfade returns to scene 0 @ t=0
N = int(round(T * FPS))
imgs = [Image.open(f"{raw}/{f}").convert("RGB") for f, *_ in SCENES]


def ease(x):
    return 0.5 - 0.5 * math.cos(math.pi * min(1, max(0, x)))


def view(i, lt):
    """Frame of scene i at local time lt (0..SCENE_LEN)."""
    img = imgs[i]
    _, (fx, fy), z0, z1, pan = SCENES[i]
    x = min(1.0, lt / SCENE_LEN)
    p = 0.8 * x + 0.2 * ease(x)
    cover = max(W / img.width, H / img.height)
    s = cover * (z0 + (z1 - z0) * p)
    cx = img.width * (fx + pan * (p - 0.5))
    cy = img.height * fy
    hw, hh = W / (2 * s), H / (2 * s)
    cx = min(max(cx, hw), img.width - hw)
    cy = min(max(cy, hh), img.height - hh)
    return img.transform((W, H), Image.AFFINE, (1 / s, 0, cx - hw, 0, 1 / s, cy - hh), Image.BICUBIC)


rng = np.random.default_rng(42)
P = 70 if mode == "desktop" else 55
px = rng.uniform(0, W, P)
py = rng.uniform(0, H + 60, P)
pr = rng.uniform(1.2, 4.2, P) * (W / 1280 if mode == "desktop" else 1.0)
laps = rng.integers(1, 3, P)                  # whole laps per loop -> seamless
sway = rng.uniform(6, 26, P)
swf = rng.integers(1, 4, P)
ph = rng.uniform(0, 2 * math.pi, P)
tw = rng.integers(2, 6, P)

yy, xx = np.mgrid[0:H, 0:W]
vig = 1 - 0.38 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.4
vig = np.clip(vig, 0.55, 1)[..., None]
tint = np.array([0.985, 0.955, 1.03])          # lavender grade

enc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
     "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
     "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out],
    stdin=subprocess.PIPE)


def local(j, tt):
    """Scene j's own clock: starts when it begins fading in (scene 0 has no fade-in)."""
    return tt - j * STEP + (XF if j > 0 else 0)


for f in range(N):
    t = f / FPS
    k = int(t // STEP)
    lt = t - k * STEP
    frame = view(k, local(k, t))
    if lt > STEP - XF:  # crossfade into the next scene; the last one lands on scene 0 at t=0
        a = ease((lt - (STEP - XF)) / XF)
        nxt = k + 1
        nf = view(0, 0.0) if nxt == len(SCENES) else view(nxt, local(nxt, t))
        frame = Image.blend(frame, nf, a)
    base = np.asarray(frame, dtype=np.float32) / 255
    bloom = np.asarray(frame.filter(ImageFilter.GaussianBlur(14)), dtype=np.float32) / 255
    img = 1 - (1 - base) * (1 - bloom * 0.33)      # screen blend glow
    img = img * tint * vig + 0.035                  # lift blacks a touch
    # fireflies
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    ph_t = 2 * math.pi * t / T
    ys = (py - laps * (H + 60) * t / T) % (H + 60) - 30
    xs = px + sway * np.sin(swf * ph_t + ph)
    al = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(tw * ph_t + ph))
    for x, y, r, a_ in zip(xs, ys, pr, al):
        d.ellipse([x - r, y - r, x + r, y + r], fill=int(255 * a_))
    glow = np.asarray(layer.filter(ImageFilter.GaussianBlur(2.2)), dtype=np.float32)[..., None] / 255
    core = np.asarray(layer, dtype=np.float32)[..., None] / 255
    img = img + glow * np.array([1.0, 0.88, 0.62]) * 0.9 + core * 0.35
    enc.stdin.write((np.clip(img, 0, 1) * 255).astype(np.uint8).tobytes())

enc.stdin.close()
enc.wait()
print(out, f"{N} frames, {T:.1f}s")
