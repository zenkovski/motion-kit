# MOTION.md — how to make motion design with this kit (craft manual)

You make **motion-design films written as code**: a web page draws every frame as a pure function of time `t`,
headless Chrome captures the frames, a Python script composes music + sound effects on the same timing, ffmpeg joins them.
No video generation, no stock footage, no downloaded templates. Every pixel on screen comes from your code
(plus real images you were asked to use, e.g. token icons).

This file is the craft. The job (e.g. `PROMO-TASK.md`) comes separately. Read both fully before writing code.

---

## 1. Hard rules (break one = rejected)

### 1.1 Honesty (trading / betting / memecoins)
- **No promises:** never "guaranteed", "risk-free", "easy money", "sure bet", "get rich", "passive income", "to the moon", "jistý zisk" — in any language.
- **No invented numbers.** Every number on screen comes from raw data you measured yourself, with a known `n` and period. Write the method next to it in the brief. Never copy a number from an earlier bot report or chat summary without recomputing it from raw data.
- **Past ≠ future.** Any result on screen carries a small line like `Historická data · ne záruka`. Betting content carries `18+ · Hraj zodpovědně`. The end card carries `Není investiční poradenství`.
- **Charts without data are decoration:** no price axis, no BUY/SELL arrows, no entry/target labels on made-up lines.
- **Logos:** no exchange, bookmaker, team or Discord logos (use a drawn `#` glyph for channels). Token icons are allowed only where PROMO-TASK asks for them.

### 1.2 Anti-slop (craft)
- **One idea per beat, one hero motion at a time.** Everything else holds or breathes (micro-motion).
- **Never linear easing** for organic moves. Use `E.outBack`, `E.outExpo`, `E.ioQuint`, `spring()`, `squash()`.
- **Stagger** entrances by 2–4 frames (0.066–0.13 s). Never "everything fades in together".
- **No crossfades** as transitions. Cut on the beat, wipe with a shape, mask-reveal, or let an element carry the cut.
- **Type:** only kit fonts (section 6). At 1080 px width: headlines ≥ 96 px, body ≥ 34 px. ≤ 7 words per line, ≤ 3 lines per beat. Check every string's glyphs (`tools/check_fonts.py`).
- **Colour:** controlled palette per style (section 8). No rainbow gradients, no default purple-cyan "AI" glow, no glow on everything.
- **No emoji as graphics, no clichés** (rockets, lambos, moons, money rain, flaming dice) unless redesigned as proper drawn elements that fit the style.
- **Fill the frame.** Content lives between y = 140 and y = 1540 (the bottom 380 px of 9:16 is covered by TikTok/IG UI). A frame with an empty half is a bug.
- **No dead air:** nothing > 0.6 s where nothing moves (a breathing hold is fine).
- **Sound:** every visual hit has a sound. No identical SFX more than 3× per film unless it is rhythmic. Each film has its own SFX palette (never the same "coin" in every film). Music runs to the last frame.

---

## 2. Setup (once per machine)
```bash
git clone https://github.com/zenkovski/motion-kit.git && cd motion-kit
bash setup.sh     # apt deps, node deps, headless Chrome, mgaudio + 15 reference films (mg-styles-15, MIT), python venv, smoke test
. tools/env.sh    # in every new shell (MG_CHROME, PYTHONIOENCODING)
```
No GPU on the VPS → Chrome runs SwiftShader (CPU). Canvas 2D is fast enough. Avoid WebGL shaders and full-frame `ctx.filter = "blur()"` (blur a small canvas and scale it up).

## 3. What is where
```
harness/render.mjs   renderer: frames → ffmpeg; --stills prints QA lines for text out of frame / outside the safe area
lib/mg.js            core helpers (section 5)
lib/audio/           mgaudio sound toolkit — manual: lib/audio/README.md (sections 1–3 are mandatory reading)
fonts/               fonts with full Czech coverage (section 6)
tools/               env.sh · new_film.sh · render_all.sh · discord_encode.sh · sheet.py · check_fonts.py
.mgsrc/demos/        15 reference films by mg-styles-15 — READ their code for technique (they will not render: their fonts are not shipped)
.mgsrc/prompts/      the 15 style specs; each "Signature features" section is a checklist of what makes that style recognisable
films/<slug>/        your films
```

## 4. Pipeline (every film, in this order)
1. `bash tools/new_film.sh <slug>` → write `BRIEF.md` (PROMO-TASK tells you what goes in it). Get approval.
2. **Cue sheet first:** every text and every time goes into `films/<slug>/cues.json`. Picture and sound both read it. Never hard-code a time twice.
3. **Look first:** draw the key frames, then `node harness/render.mjs films/<slug> --stills 1,3,6,10,15,20,25,29 --scale 0.5` and `.venv/bin/python tools/sheet.py films/<slug> 8`. Every still must be poster-worthy. Fix every `QA` line.
   If you can view images, open `out/sheet.jpg` and judge composition and empty space. If you cannot, post the sheet to Discord and wait for feedback.
4. **Motion:** dense stills (every 0.1 s) around each fast move. Check overshoot, overlap, nothing popping in or vanishing in one frame.
5. **Sound:** `.venv/bin/python films/<slug>/audio.py` → `warnings: []`, check `out/audio_spec.png` (green lines = your hits).
6. **Render:** `bash tools/render_all.sh films/<slug>` (soundtrack → QA stills → full render → `video-discord.mp4` ≤ 10 MB + poster). It stops if any text is out of frame.
7. **Self-review** (section 9), then post.

## 5. The film contract and `lib/mg.js`
```js
// films/<slug>/index.html  (inside <script type="module">)
import { E, seg, spring, squash, clamp, lerp, rng, fonts, stage, text, rrect, grain, qaText } from "/lib/mg.js";
const Q = await (await fetch("cues.json")).json();
const ctx = stage((ctx, t) => {            // draw the frame for time t (seconds) — pure function of t
  ctx.fillStyle = "#07080A"; ctx.fillRect(0, 0, 1080, 1920);
  const k = spring(t, Q.t.title, 2.2, 7);   // 0 → 1 with overshoot, starts at Q.t.title
  ctx.save(); ctx.translate(540, 900); ctx.scale(k, k);
  text(ctx, "Titulek", 0, 0, { size: 140, weight: 800, family: "Inter", color: "#fff", base: "middle" });
  ctx.restore();
}, { duration: 30, mb: 2 });                // 1080x1920 @30 fps by default; mb = motion-blur samples
await fonts([["Inter", "Inter.ttf", { weight: "100 900" }]]);
window.__go();
```
- Deterministic only: no `Math.random()` (use `rng(seed)`), no `Date`, no CSS transitions, no state kept between frames. Particles and physics are closed-form functions of `t`.
- Images: `const im = new Image(); im.src = "assets/x.png"; await im.decode();` before `__go()`.
- Text: use `text()`; if you call `fillText` yourself, call `qaText(ctx, s, x, y, width, size, align, baseline)` so QA sees it.
- Preview one frame in a browser with `?t=12.5`, real time with `?play`.

| helper | what it does |
|---|---|
| `E.outBack(x, s)` | overshoot then settle (s ≈ 1.7–2.6) — pops, slaps |
| `E.outExpo` | fast start, soft landing — premium reveals |
| `E.ioQuint` | slow-fast-slow — camera moves, morphs |
| `E.inBack` | anticipation exit |
| `seg(t, a, b, ease)` | progress 0..1 of t through [a, b] |
| `spring(t, t0, freq, damp)` | organic settle with wobble |
| `squash(t, t0, amt)` | decaying ± pulse for impacts (scaleX = 1+s, scaleY = 1−s) |
| `rng(seed)` | deterministic random |
| `rrect`, `grain(ctx, t, amt)` | rounded rect, film grain |

Renderer flags: `--stills 1,2.5` · `--scale 0.5` · `--workers N` · `--from/--to` · `--out f.mp4` · `--noaudio`. It muxes `out/audio.wav` automatically.

**Sound** (`lib/audio/README.md`):
```python
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', '..', 'lib', 'audio'))
from mgaudio import recipes, sfx
Q = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8')); T = Q['t']
m = recipes.darksynth(duration=30, key='D', drop=T['hero'], build=T['hook'], outro=27.0)
m.sfx(sfx.impact('cinematic'), at=T['hero'], gain=-3)        # `at` = the visual event time
res = m.export(os.path.join(HERE, 'out', 'audio.wav'), spectrogram=os.path.join(HERE, 'out', 'audio_spec.png'))
print('warnings:', res['warnings'])
```
Recipes: `pop`, `explainer`, `future_bass`, `synthwave`, `darksynth`, `techno`, `chiptune`, `lofi`, `ambient`, `variety`, `trap`, `glitch_hop`, `acid` — all take `duration=30`. `drop` = strongest visual moment; `outro` 2–5 s before the end so the music lands its final hit **at** 30 s.

## 6. Fonts (all with full Czech)
| font | use |
|---|---|
| Inter (100–900) | premium headlines and UI text |
| Archivo (100–900, width 62–125) | bold display; condensed via `ctx.fontStretch = "condensed"` (not in `ctx.font`) |
| JetBrains Mono | labels, numbers, data, terminal/HUD |
| Space Grotesk | techy display alternative |
| Roboto / Roboto Mono | neutral body |
| Nunito (to 1000) | rounded, friendly |
| Press Start 2P | pixel only, 8/16/24 px on the low-res canvas. Capital **Á has no accent** in this font → draw it by hand |
| Bungee, Bungee Shade, Monoton | loud display accents, sparingly |
| Caveat, Caveat Brush, Patrick Hand | hand-written notes |

## 7. Structure of a 30 s promo
| time | beat | rule |
|---|---|---|
| 0–3 s | hook | motion in frame 1, 2–4 words, the strongest real fact or image first |
| 3–6 s | what | server name + one honest line |
| 6–22 s | content | one block per channel/topic, 2–3.5 s each, each with its own visual motif; the hero moment lives around 15–22 s |
| 22–25 s | why | one value line (community, data, research — no money claims) |
| 25–30 s | CTA | join + invite link + disclaimers ≥ 2 s; end frame held ~1.5 s with micro-motion; music button on the last beat |

## 8. The three styles

### A — Flat Vector
- **Look:** strictly flat shapes, no gradients; either no outlines or one consistent ink outline; 5–6 colour palette with one dominant field colour; generous negative space; geometric icons built from circles/rects/arcs.
- **Motion:** anticipation → stretch → squash → overshoot → settle (~10 % squash). Element-driven transitions: a circle of the next background colour grows out of an element (shape wipe), or an element flies out and carries the cut.
- **Technique:**
  ```js
  // drop + squash on impact at t0
  const s = squash(t, t0, 0.3, 3, 9); ctx.translate(x, groundY); ctx.scale(1 + s, 1 - s);   // pivot at the contact point!
  // shape wipe to the next colour, growing from an element
  ctx.fillStyle = next; ctx.beginPath(); ctx.arc(ex, ey, E.ioC(seg(t, a, a + 0.45)) * 2300, 0, 7); ctx.fill();
  // words popping in, 2–3 frames apart, measured so they never overlap at overshoot
  ```
- **Sound:** `pop` or `explainer`; SFX `pop('bubble'|'mouth'|'soft')`, `blip`, `swish`, `whoosh('soft')`, `click`, `transition('swish_pop')`, `chime` on the hero.
- **Reference code:** `.mgsrc/demos/01-flat-vector/index.html`, spec `.mgsrc/prompts/01-flat-vector.md`.

### B — Pixel Art
- **Look:** draw on a small canvas (180×320) and upscale ×6 with `imageSmoothingEnabled = false`; integer positions only; ≤ 24-colour palette (PICO-8 family); dithered sky (Bayer 4×4); 3 parallax layers moving by whole pixels; sprites from string grids with an automatic 1-px dark outline; CRT pass (scanlines every 6 px, soft glow, vignette) on the big canvas.
- **Motion:** stepped — sprites animate at 10–12 drawings/s (`Math.floor(t * 12) / 12`), jumps are integer parabolas, transitions are pixel dissolves in Bayer order. No smooth easing on sprites.
- **Technique:**
  ```js
  const pc = Object.assign(document.createElement("canvas"), { width: 180, height: 320 }), p = pc.getContext("2d");
  // ... draw everything on p with integer coords, then:
  ctx.imageSmoothingEnabled = false; ctx.drawImage(pc, 0, 0, 1080, 1920);
  // crisp pixel text: draw text on a tiny canvas, then threshold alpha (a > 110 ? 255 : 0) before drawImage
  // sprite from strings: rows like "..gg.gg.." + palette map; outline = dark pixel where a neighbour is solid
  ```
- **Sound:** `chiptune`; SFX `jump`, `powerup`, `oneup`, `explosion_8bit`, `coin` (allowed here, ≤ 4×), square `blip` per typed character.
- **Reference code:** `.mgsrc/demos/20-pixel/` (film.js), spec `.mgsrc/prompts/20-pixel.md`.

### C — Premium Dark Kinetic
- **Look:** background `#07080A` with a faint 72-px grid and one slow light sweep; **one** accent colour (the server's brand colour, else a single green like `#00E08A`); white type `#F2F4F7` + one muted grey; thin glowing data lines; glass cards (4 % white fill, 1.5 px border at 12 % white, radius ≥ 30); grain 4–6 %.
- **Type:** Inter 700–800, tracking −2 %, everything on one left grid (x = 90) or perfectly centred — never mixed in a beat. JetBrains Mono for small labels (`01 — MEME HUNTER`).
- **Motion:** mask reveals (each line slides up out of an invisible clip, `E.outExpo`, 0.6–0.8 s, 0.08–0.3 s stagger), lines that draw on, slow camera eases (`E.ioQuint`, 1–1.5 s) that reveal new content, hard cuts on the beat. Nothing bouncy.
- **Technique:**
  ```js
  // mask reveal of one line
  ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - size * 0.95, w + 40, size * 1.22); ctx.clip();
  ctx.fillText(s, x, y + (1 - E.outExpo(seg(t, t0, t0 + 0.7))) * size * 1.1); ctx.restore();
  // line that draws on: stroke the first floor(n*u) points; glow = shadowBlur pass + sharp pass; pulsing dot at the head
  // glass card: rrect fill rgba(255,255,255,.04), top 35 % white gradient .07→0, stroke rgba(255,255,255,.12)
  // camera: ctx.translate(540,960); ctx.scale(z,z); ctx.translate(-camX,-camY) with keys eased by E.ioQuint
  ```
- **Sound:** `darksynth` or `techno` (calmer: `ambient(flavor='product')`); SFX `typing('soft')` on labels, `text_hit('slam'|'glitch')` + `impact('punch')` (different each time) on hook words, rising tonal `blip` per item in key, `whoosh('air')` on camera moves, `data_chirp` on charts, `impact('cinematic'|'trailer')` on the hero and CTA, `shimmer_hit` on the invite.
- **Reference code:** `.mgsrc/demos/22-hud/`, `.mgsrc/demos/12-aurora-glass/` (glass), `.mgsrc/demos/19-paperclip/` (camera over a big canvas, charts).

## 9. QA before posting
Automatic — all must pass:
- `out/qa.log` has no `OUT OF FRAME`; every `outside safe area` is deliberate.
- `audio.py` → `warnings: []`, 30.000 s, −14 ± 0.5 LUFS.
- `ffprobe out/video.mp4` → 1080×1920, 30 fps, 30.0 s, video + audio; `video-discord.mp4` ≤ 10 MB.

By eye (sheet + dense stills):
- [ ] frame 1 already moves · [ ] one focal point per beat, readable in 1 s on a phone · [ ] no empty half-frame
- [ ] no text touching another element or the edge; diacritics intact (ě š č ř ž ý á í é ů)
- [ ] every hit has a sound; no identical SFX > 3×; music reaches the end
- [ ] every number traced to raw data (PROMO-TASK); disclaimers readable ≥ 2 s
- [ ] poster = a finished frame, not mid-animation

Score yourself 1–10 on style fidelity, motion craft, typography, sound & sync, honesty. Post scores + top-3 weaknesses. Anything < 7 → fix first.

## 10. Pitfalls (learned the hard way)
- Thick text strokes: draw **all** strokes first, then all fills, or each letter's stroke covers its neighbour.
- Scale an element around **its own centre/contact point** (translate there first) or it jumps sideways.
- Words overlapping during overshoot → too tight; add ~0.3 em between popped words.
- Morph "knots": resample both shapes to the same N points, same start (top) and direction (clockwise); go A → circle/capsule → B.
- Blurry pixel text → no alpha threshold or a size that is not a multiple of 8.
- JSON with Czech text: open with `encoding='utf-8'`.
- `silence gap` warning → the music ended early; move `outro` later.
- mgaudio's sample index lists files the repo does not ship → `patches/samples.py` (setup copies it; copy again if you re-clone).
- SwiftShader is slow: preview at `--scale 0.5`; full render only after stills are approved. 900 frames × `mb` samples takes minutes — normal.

## 11. Licences
Renderer and mgaudio: mg-styles-15 (MIT, `LICENSE-mg-styles-15`). Samples CC0. Fonts OFL/Apache. Music and SFX are generated by code — no music licensing needed.
