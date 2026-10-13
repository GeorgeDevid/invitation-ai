"""Render a gentle harp / piano / violin arrangement of Pachelbel's Canon in D.

Composition: Johann Pachelbel (public domain). Arrangement rendered from samples:
  - Piano: Salamander Grand Piano (Alexander Holm, CC-BY 3.0) via Tonejs/audio
  - Harp, violin, contrabass: VSCO 2 Community Edition (CC0) via nbrosowsky/tonejs-instruments
"""
import os
import re
import subprocess
import sys

import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
# usage: python3 tools/compose_canon.py <samples_dir> <out.wav>
#   <samples_dir>/tja  = sparse clone of github.com/Tonejs/audio        (folder: salamander)
#   <samples_dir>/ti   = sparse clone of github.com/nbrosowsky/tonejs-instruments
#                        (folders: samples/harp, samples/violin, samples/contrabass)
# then: ffmpeg -i out.wav -c:a libmp3lame -b:a 128k assets/audio/canon-in-d.mp3
# Requires: python3, numpy, scipy, ffmpeg.
ROOT = sys.argv[1]
OUT = sys.argv[2]
rng = np.random.default_rng(1231)

DIRS = {
    "piano": os.path.join(ROOT, "tja", "salamander"),
    "harp": os.path.join(ROOT, "ti", "samples", "harp"),
    "violin": os.path.join(ROOT, "ti", "samples", "violin"),
    "bass": os.path.join(ROOT, "ti", "samples", "contrabass"),
}
PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def name_to_midi(n):
    m = re.fullmatch(r"([A-G])(s|#|b)?(-?\d)", n)
    if not m:
        return None
    pc = PC[m.group(1)] + {None: 0, "s": 1, "#": 1, "b": -1}[m.group(2)]
    return 12 * (int(m.group(3)) + 1) + pc


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


SAMPLES = {}
for inst, d in DIRS.items():
    table = {}
    for f in os.listdir(d):
        if not f.endswith(".mp3"):
            continue
        midi = name_to_midi(f[:-4])
        if midi is not None:
            table[midi] = os.path.join(d, f)
    SAMPLES[inst] = table

_cache = {}


def detune_cents(a, midi):
    """Measure how far a sample is from equal temperament (harmonic-sum pitch search)."""
    x = a[int(0.1 * SR): int(1.5 * SR)].mean(axis=1)
    sp = np.abs(np.fft.rfft(x * np.hanning(len(x)), 1 << 18))
    fr = np.fft.rfftfreq(1 << 18, 1 / SR)
    f0 = 440 * 2 ** ((midi - 69) / 12)
    cents = np.linspace(-60, 60, 241)
    score = [sum(np.interp(f0 * 2 ** (c / 1200) * h, fr, sp) for h in (1, 2, 3)) for c in cents]
    return cents[int(np.argmax(score))]


def sample(inst, path, midi):
    if path not in _cache:
        a = decode(path)
        a /= max(1e-9, np.sqrt(np.mean(a[: SR * 2] ** 2)))  # rough loudness match (first 2 s)
        _cache[path] = (a, detune_cents(a, midi))
    return _cache[path]


def note_audio(inst, midi, length_s):
    table = SAMPLES[inst]
    src = min(table, key=lambda m: (abs(m - midi), m > midi))
    a, cents = sample(inst, table[src], src)
    ratio = 2 ** ((midi - src) / 12 - cents / 1200)
    n_out = int(length_s * SR)
    idx = np.arange(n_out) * ratio
    idx = idx[idx < len(a) - 1]
    i0 = idx.astype(int)
    frac = (idx - i0)[:, None]
    return a[i0] * (1 - frac) + a[i0 + 1] * frac


def n(s):
    return name_to_midi(s.replace("#", "s"))


TEMPO = 56.0
Q = 60.0 / TEMPO        # quarter note seconds
H = 2 * Q               # half note (one chord)
CYCLE = 8 * H

total = int((7 * CYCLE + 9.0) * SR)
tracks = {k: np.zeros((total, 2)) for k in ("piano", "harp", "violin", "bass")}
PAN = {"piano": -0.12, "harp": -0.35, "violin": 0.32, "bass": 0.05}


def place(inst, t, midi, dur, vel=1.0, attack=0.005, release=0.4, ring=None):
    """Add one note. dur = held time, release = fade-out after dur, ring overrides tail."""
    t += rng.normal(0, 0.006) if t > 0 else 0
    vel *= rng.uniform(0.92, 1.05)
    length = dur + (ring if ring is not None else release)
    a = note_audio(inst, midi, length).copy()
    L = len(a)
    env = np.ones(L)
    na = max(1, int(attack * SR))
    env[:na] = np.linspace(0, 1, na) ** 1.5
    hold = min(L, int(dur * SR))
    tail = L - hold
    if tail > 0:
        env[hold:] = np.linspace(1, 0, tail) ** 2
    a *= env[:, None] * vel
    p = PAN[inst]
    a[:, 0] *= np.sqrt((1 - p) / 2) * 1.414
    a[:, 1] *= np.sqrt((1 + p) / 2) * 1.414
    s = int(max(0, t) * SR)
    e = min(total, s + L)
    tracks[inst][s:e] += a[: e - s]


CHORDS = [  # (bass, harp arpeggio tones)
    ("D3", ["D3", "A3", "D4", "F#4"]),
    ("A2", ["A2", "E3", "A3", "C#4"]),
    ("B2", ["B2", "F#3", "B3", "D4"]),
    ("F#2", ["F#2", "C#3", "F#3", "A3"]),
    ("G2", ["G2", "D3", "G3", "B3"]),
    ("D2", ["D3", "A3", "D4", "F#4"]),
    ("G2", ["G2", "D3", "G3", "B3"]),
    ("A2", ["A2", "E3", "A3", "C#4"]),
]
VAR1 = ["F#5", "E5", "D5", "C#5", "B4", "A4", "B4", "C#5"]                 # halves
VAR1_LOW = ["D5", "C#5", "B4", "A4", "G4", "F#4", "G4", "A4"]              # thirds below
VAR2 = ["D5", "F#5", "A5", "G5", "F#5", "D5", "F#5", "E5",
        "D5", "B4", "D5", "A5", "G5", "B5", "A5", "G5"]                     # quarters
VAR3 = ["D5", "C#5", "D5", "D4", "C#4", "A4", "E4", "F#4",
        "D4", "D5", "C#5", "B4", "C#5", "F#5", "A5", "B5",
        "G5", "F#5", "E5", "G5", "F#5", "E5", "D5", "C#5",
        "B4", "A4", "G4", "F#4", "E4", "G4", "F#4", "E4"]                   # eighths

# dynamics per cycle (0..6)
DYN = [0.55, 0.65, 0.75, 0.85, 1.0, 0.85, 0.6]


def harp_cycle(c0, dyn):
    E = Q / 2
    for i, (_, tones) in enumerate(CHORDS):
        t = c0 + i * H
        for k, tone in enumerate(tones):
            accent = 1.0 if k == 0 else 0.78
            hold = H * 1.2 - k * E  # let the chord ring just past the change, like a damped harp
            place("harp", t + k * E, n(tone), hold, 0.55 * dyn * accent, release=0.0, ring=1.1)


def bass_cycle(c0, dyn, piano_octave=True):
    for i, (b, _) in enumerate(CHORDS):
        t = c0 + i * H
        place("bass", t, n(b), H * 0.98, 0.42 * dyn, attack=0.06, release=0.35)
        if piano_octave:
            place("piano", t, n(b) - 12, H, 0.32 * dyn, release=0.0, ring=0.9)


def violin_line(c0, notes, dur, dyn, octave=0):
    for i, nm in enumerate(notes):
        t = c0 + i * dur
        place("violin", t, n(nm) + 12 * octave, dur * 1.02, 0.36 * dyn, attack=0.14, release=0.45)


def piano_line(c0, notes, dur, dyn, octave=0):
    for i, nm in enumerate(notes):
        t = c0 + i * dur
        place("piano", t, n(nm) + 12 * octave, dur, 0.5 * dyn, release=0.0, ring=1.2)


for c in range(7):
    c0 = c * CYCLE
    d = DYN[c]
    harp_cycle(c0, d)
    bass_cycle(c0, d, piano_octave=c not in (0, 6))
    if c == 1:
        violin_line(c0, VAR1, H, d)
    if c == 2:
        piano_line(c0, VAR2, Q, d)
        violin_line(c0, VAR1_LOW, H, d)
    if c == 3:
        piano_line(c0, VAR3, Q / 2, d * 0.9)
        violin_line(c0, VAR2, Q, d * 0.9)
    if c == 4:
        piano_line(c0, VAR2, Q, d)
        violin_line(c0, VAR1, H, d)
        violin_line(c0, VAR1_LOW, H, d * 0.75)
    if c == 5:
        piano_line(c0, VAR3, Q / 2, d * 0.85)
        violin_line(c0, VAR1, H, d * 0.9)
    if c == 6:
        piano_line(c0, VAR1, H, d * 0.8)

# Final cadence: rolled D major chord with a gentle ritardando feel
end = 7 * CYCLE
for k, tone in enumerate(["D2", "A2", "D3", "F#3", "A3", "D4", "F#4", "A4", "D5"]):
    place("harp", end + k * 0.11, n(tone), 6.0, 0.5, release=0.0, ring=2.5)
place("bass", end, n("D2"), 5.0, 0.4, attack=0.1, release=2.0)
place("violin", end + 0.2, n("F#5"), 5.0, 0.3, attack=0.4, release=2.2)
place("violin", end + 0.2, n("A4"), 5.0, 0.22, attack=0.4, release=2.2)
place("piano", end, n("D1"), 6.0, 0.3, release=0.0, ring=2.0)
place("piano", end + 0.35, n("D5"), 6.0, 0.35, release=0.0, ring=2.0)

GAIN = {"piano": 0.85, "harp": 0.8, "violin": 0.62, "bass": 0.55}
dry = sum(tracks[k] * GAIN[k] for k in tracks)

# Gentle high-pass on everything, slight low-pass for warmth
dry = sosfilt(butter(2, 45, "hp", fs=SR, output="sos"), dry, axis=0)
dry = sosfilt(butter(2, 11000, "lp", fs=SR, output="sos"), dry, axis=0)

# Synthetic hall reverb (stereo decorrelated noise IR, ~3 s tail)
ir_len = int(3.2 * SR)
tt = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)], axis=1)
ir *= np.exp(-6.9 * tt / 2.9)[:, None]
ir = sosfilt(butter(1, 5200, "lp", fs=SR, output="sos"), ir, axis=0)
ir[: int(0.018 * SR)] = 0  # pre-delay
ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
wet = np.stack([fftconvolve(dry[:, ch], ir[:, ch])[: len(dry)] for ch in range(2)], axis=1)

mix = dry * 0.78 + wet * 0.55
fade_in = int(0.8 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
fade_out = int(4.0 * SR)
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 2
mix *= 0.89 / np.max(np.abs(mix))

pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2",
                "-i", "-", OUT], input=pcm, check=True)
print("rendered", OUT, f"{len(mix) / SR:.1f}s")
