import math
import os
import subprocess
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1920, 1080
FPS = 30
DURATION = 14.0
TOTAL_FRAMES = int(FPS * DURATION)

ASSETS_DIR = r"C:\Users\hp\.gemini\antigravity\scratch\amir-portfolio\public\assets"
OUT_VIDEO = os.path.join(ASSETS_DIR, "amir_showreel.mp4")
OUT_THUMB = os.path.join(ASSETS_DIR, "showreel_thumb.png")
AUDIO_WAV = os.path.join(ASSETS_DIR, "_showreel_audio.wav")

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_LIGHT = r"C:\Windows\Fonts\segoeuil.ttf"
FONT_MONO = r"C:\Windows\Fonts\consolab.ttf"
if not os.path.exists(FONT_MONO):
    FONT_MONO = FONT_BOLD

F_HUGE = ImageFont.truetype(FONT_BOLD, 168)
F_TITLE = ImageFont.truetype(FONT_BOLD, 74)
F_SUB = ImageFont.truetype(FONT_LIGHT, 34)
F_MONO = ImageFont.truetype(FONT_MONO, 24)
F_TAG = ImageFont.truetype(FONT_BOLD, 22)
F_PILL = ImageFont.truetype(FONT_BOLD, 30)


def ease_out_expo(x):
    x = max(0.0, min(1.0, x))
    return 1.0 if x >= 1.0 else 1.0 - math.pow(2.0, -10.0 * x)


def ease_in_out_cubic(x):
    x = max(0.0, min(1.0, x))
    return 4 * x * x * x if x < 0.5 else 1 - ((-2 * x + 2) ** 3) / 2


def generate_agency_audio(path, duration=14.0, sr=44100):
    """Synthesize a sleek modern agency electronic pulse + sub-bass + airy synth pad."""
    n = int(sr * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    bpm = 112.0
    beat_dur = 60.0 / bpm
    beat_phase = (t % beat_dur) / beat_dur

    # Sidechain pumping envelope
    sidechain = np.clip(beat_phase * 2.6, 0.18, 1.0)

    # Warm sub-kick on each beat (starts at t=1.8s, stops at 12.2s)
    kick_active = ((t >= 1.8) & (t <= 12.2)).astype(np.float64)
    kick_env = np.exp(-beat_phase * 14.0) * kick_active
    kick_freq = 44.0 + 95.0 * np.exp(-beat_phase * 28.0)
    kick = np.sin(2 * np.pi * kick_freq * (beat_phase * beat_dur)) * kick_env * 0.42

    # Crisp subtle off-beat hat tick
    half_phase = ((t + beat_dur * 0.5) % beat_dur) / beat_dur
    rng = np.random.default_rng(42)
    noise = rng.standard_normal(n)
    hat_env = np.exp(-half_phase * 48.0) * kick_active
    hat = noise * hat_env * 0.045

    # Atmospheric dark-luxury synth chords (Cm9 -> Abmaj7 -> Fm9 -> G7sus4)
    chords = [
        (0.0, 3.6, [65.41, 130.81, 196.00, 233.08, 293.66]),
        (3.5, 7.2, [51.91, 103.83, 155.56, 196.00, 246.94]),
        (7.1, 10.7, [43.65, 87.31, 130.81, 174.61, 207.65]),
        (10.6, 14.0, [49.00, 98.00, 146.83, 196.00, 261.63]),
    ]
    pad_l = np.zeros(n, dtype=np.float64)
    pad_r = np.zeros(n, dtype=np.float64)
    for start, end, freqs in chords:
        mask = (t >= start) & (t <= end)
        lt = t[mask] - start
        dur = end - start
        env = np.sin(np.pi * np.clip(lt / dur, 0, 1)) ** 0.8
        for i, f in enumerate(freqs):
            vol = 0.08 / (1 + 0.25 * i)
            det = 0.35 if i % 2 == 0 else -0.35
            pad_l[mask] += env * vol * (np.sin(2 * np.pi * f * lt) + 0.18 * np.sin(4 * np.pi * f * lt))
            pad_r[mask] += env * vol * (np.sin(2 * np.pi * (f + det) * lt) + 0.18 * np.sin(4 * np.pi * (f + det) * lt))

    fade_in = np.clip(t / 0.8, 0, 1)
    fade_out = np.clip((duration - t) / 1.4, 0, 1)
    master = fade_in * fade_out

    left = np.tanh((pad_l * sidechain + kick + hat) * master * 1.1) * 0.72
    right = np.tanh((pad_r * sidechain + kick - hat * 0.8) * master * 1.1) * 0.72

    pcm = (np.stack([left, right], axis=1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def make_studio_bg(accent_rgb):
    """Dark obsidian canvas with subtle grid + glowing radial studio accent."""
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    d1 = np.sqrt(((x - 0.65) * 1.1) ** 2 + ((y - 0.35) * 1.1) ** 2)
    glow = np.clip(1.0 - d1 * 1.25, 0.0, 1.0) ** 2.2

    r = np.clip(6 + glow * accent_rgb[0] * 0.22, 0, 255).astype(np.uint8)
    g = np.clip(7 + glow * accent_rgb[1] * 0.22, 0, 255).astype(np.uint8)
    b = np.clip(11 + glow * accent_rgb[2] * 0.22, 0, 255).astype(np.uint8)
    base = Image.fromarray(np.stack([r, g, b], axis=-1), "RGB").convert("RGBA")

    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(grid)
    for gx in range(0, W, 80):
        d.line([(gx, 0), (gx, H)], fill=(255, 255, 255, 7), width=1)
    for gy in range(0, H, 80):
        d.line([(0, gy), (W, gy)], fill=(255, 255, 255, 7), width=1)
    return Image.alpha_composite(base, grid)


def load_site_image(name, fallback, target_w=1220):
    p = os.path.join(ASSETS_DIR, name)
    if not os.path.exists(p):
        p = os.path.join(ASSETS_DIR, fallback)
    im = Image.open(p).convert("RGB")
    scale = target_w / im.width
    new_h = int(im.height * scale)
    return im.resize((target_w, new_h), Image.Resampling.LANCZOS)


def draw_centered(draw, text, y, font, fill):
    bb = draw.textbbox((0, 0), text, font=font)
    tw = bb[2] - bb[0]
    draw.text(((W - tw) // 2, y), text, font=font, fill=fill)


def draw_browser_showcase(bg, site_img, title, tag, subtitle, accent, lt, seg_dur):
    """Render sleek studio browser showcase smoothly gliding across full website screenshot."""
    frame = bg.copy()
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)

    enter = ease_out_expo(lt / 0.65)
    exit_p = 1.0 - ease_in_out_cubic((lt - (seg_dur - 0.45)) / 0.45) if lt > seg_dur - 0.45 else 1.0
    alpha = enter * exit_p
    a = int(255 * alpha)

    # Left editorial text column
    tx = int(86 - (1 - enter) * 55)
    d.rounded_rectangle([tx, 270, tx + 340, 310], radius=20, fill=(*accent, int(35 * alpha)), outline=(*accent, int(170 * alpha)), width=2)
    d.text((tx + 20, 277), tag, font=F_TAG, fill=(*accent, a))

    # Multi-line project title
    words = title.split(" ")
    y_cursor = 345
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if d.textbbox((0, 0), test, font=F_TITLE)[2] > 500 and line:
            d.text((tx, y_cursor), line, font=F_TITLE, fill=(248, 248, 252, a))
            y_cursor += 86
            line = w
        else:
            line = test
    if line:
        d.text((tx, y_cursor), line, font=F_TITLE, fill=(248, 248, 252, a))
        y_cursor += 96

    d.text((tx, y_cursor + 12), subtitle, font=F_SUB, fill=(170, 174, 190, a))

    # Accent progress line under text
    bar_w = int(240 * ease_in_out_cubic(lt / seg_dur))
    d.rectangle([tx, y_cursor + 78, tx + 240, y_cursor + 82], fill=(255, 255, 255, int(35 * alpha)))
    if bar_w > 2:
        d.rectangle([tx, y_cursor + 78, tx + bar_w, y_cursor + 82], fill=(*accent, a))

    # Right 3D-style Glass Browser Window with live Full-Page Scroll Pan
    win_w, win_h = 1160, 740
    bar_h = 44
    wx = int(670 + (1 - enter) * 140)
    wy = int(170 + (1 - exit_p) * -40)

    # Soft accent drop shadow
    d.rounded_rectangle([wx - 10, wy - 10, wx + win_w + 10, wy + win_h + 10], radius=26, fill=(*accent, int(24 * alpha)))
    d.rounded_rectangle([wx, wy, wx + win_w, wy + win_h], radius=22, fill=(12, 13, 19, a), outline=(*accent, int(145 * alpha)), width=2)

    # Traffic lights + chrome bar
    for idx, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        cx = wx + 24 + idx * 22
        cy = wy + 22
        d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(*col, a))
    d.text((wx + 110, wy + 10), f"AMIR STUDIO // LIVE SHOWCASE", font=F_MONO, fill=(140, 145, 165, a))

    frame = Image.alpha_composite(frame, ov)

    # Crop scrolling viewport from full-page website image
    vp_h = win_h - bar_h - 4
    vp_w = win_w - 4
    if site_img.width != vp_w:
        sc = vp_w / site_img.width
        site_resized = site_img.resize((vp_w, int(site_img.height * sc)), Image.Resampling.BILINEAR)
    else:
        site_resized = site_img

    max_scroll = max(0, site_resized.height - vp_h)
    scroll_prog = ease_in_out_cubic(max(0.0, (lt - 0.35) / (seg_dur - 0.75)))
    sy = int(max_scroll * scroll_prog)
    crop = site_resized.crop((0, sy, vp_w, min(site_resized.height, sy + vp_h)))

    # Rounded mask for viewport bottom corners
    if alpha < 0.99:
        crop_rgba = crop.convert("RGBA")
        crop_rgba.putalpha(int(255 * alpha))
        frame.alpha_composite(crop_rgba, (wx + 2, wy + bar_h))
    else:
        frame.paste(crop, (wx + 2, wy + bar_h))

    return frame


def main():
    print("Synthesizing agency showreel soundtrack...")
    generate_agency_audio(AUDIO_WAV, DURATION)

    print("Loading website full-page assets...")
    img_nocturne = load_site_image("nocturne_full.png", "nocturne_desktop.png", 1156)
    img_amirst = load_site_image("amirst_full.png", "amirst_desktop.png", 1156)
    img_english = load_site_image("english_full.png", "english_desktop.png", 1156)

    bg_lime = make_studio_bg((200, 255, 0))
    bg_gold = make_studio_bg((226, 185, 111))
    bg_emerald = make_studio_bg((52, 211, 153))

    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", AUDIO_WAV,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "160k",
        "-shortest",
        "-movflags", "+faststart",
        OUT_VIDEO,
    ]

    print("Rendering 14-second 1080p AMIR Studio Showreel...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    thumb_saved = False

    for i in range(TOTAL_FRAMES):
        t = i / FPS
        if t < 2.2:
            # Opener: AMIR DIGITAL STUDIO // 2026 SHOWREEL
            frame = bg_lime.copy()
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            p_in = ease_out_expo(t / 0.85)
            p_out = 1.0 - ease_in_out_cubic((t - 1.75) / 0.45) if t > 1.75 else 1.0
            al = p_in * p_out
            a = int(255 * al)
            slide = int((1 - p_in) * 50)

            draw_centered(d, "2026 AGENCY SHOWREEL", 315 + slide, F_MONO, (200, 255, 0, a))
            draw_centered(d, "AMIR.", 370 + slide, F_HUGE, (255, 255, 255, a))

            lw = int(340 * p_in)
            if lw > 2:
                d.rectangle([W // 2 - lw // 2, 590 + slide, W // 2 + lw // 2, 595 + slide], fill=(200, 255, 0, a))
            draw_centered(d, "3D WEBSITES   •   E-COMMERCE   •   CINEMA MOTION", 630 + slide, F_SUB, (195, 200, 215, a))
            frame = Image.alpha_composite(frame, ov)

        elif t < 5.6:
            frame = draw_browser_showcase(
                bg_gold,
                img_nocturne,
                "Nocturne Coffee Atelier",
                "01 / LUXURY HOSPITALITY",
                "Dark-luxury café & interactive menu",
                (226, 185, 111),
                t - 2.2,
                3.4,
            )
            if not thumb_saved and t >= 2.85:
                frame.convert("RGB").save(OUT_THUMB, quality=95)
                thumb_saved = True

        elif t < 9.0:
            frame = draw_browser_showcase(
                bg_lime,
                img_amirst,
                "AMIR.ST Apparel Store",
                "02 / STREETWEAR E-COMMERCE",
                "High-converting Cairo fashion storefront",
                (200, 255, 0),
                t - 5.6,
                3.4,
            )

        elif t < 11.8:
            frame = draw_browser_showcase(
                bg_emerald,
                img_english,
                "English Accelerator",
                "03 / INTERACTIVE EDTECH",
                "Full-stack Next.js & Supabase platform",
                (52, 211, 153),
                t - 9.0,
                2.8,
            )

        else:
            # Closer
            lt = t - 11.8
            frame = bg_lime.copy()
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            p_in = ease_out_expo(lt / 0.7)
            p_out = 1.0 - ease_in_out_cubic((lt - 1.6) / 0.6) if lt > 1.6 else 1.0
            al = p_in * p_out
            a = int(255 * al)

            draw_centered(d, "BUILT TO IMPRESS & CONVERT", 330, F_MONO, (200, 255, 0, a))
            draw_centered(d, "AMIR STUDIO", 388, ImageFont.truetype(FONT_BOLD, 126), (255, 255, 255, a))

            # Glowing CTA pill
            pw, ph = 420, 74
            px0, py0 = (W - pw) // 2, 580
            d.rounded_rectangle([px0, py0, px0 + pw, py0 + ph], radius=37, fill=(200, 255, 0, a))
            draw_centered(d, "LET'S BUILD YOURS  ->", py0 + 18, F_PILL, (5, 5, 7, a))
            frame = Image.alpha_composite(frame, ov)

        proc.stdin.write(frame.convert("RGB").tobytes())

    proc.stdin.close()
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"FFmpeg failed with exit code {ret}")
    if os.path.exists(AUDIO_WAV):
        os.remove(AUDIO_WAV)

    mb = os.path.getsize(OUT_VIDEO) / (1024 * 1024)
    print(f"DONE! Showreel saved: {OUT_VIDEO} ({mb:.2f} MB) + thumb {OUT_THUMB}")


if __name__ == "__main__":
    main()
