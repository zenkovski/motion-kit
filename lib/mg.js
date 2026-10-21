// Shared helpers for the MG Lab films. Every frame is a pure function of t (seconds).
// The renderer (harness/render.mjs) calls window.renderAt(t) and screenshots the page.

export const W = 1080, H = 1920;
window.__qa = [];

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const E = {
  lin: (x) => x,
  inQ: (x) => x * x,
  outQ: (x) => 1 - (1 - x) * (1 - x),
  inC: (x) => x * x * x,
  outC: (x) => 1 - (1 - x) ** 3,
  ioC: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  outQuint: (x) => 1 - (1 - x) ** 5,
  ioQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2),
  inQuint: (x) => x ** 5,
  inExpo: (x) => (x <= 0 ? 0 : 2 ** (10 * x - 10)),
  outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  ioExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2,
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
  outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
/** 0..1 progress of t through [a, b], eased. */
export const seg = (t, a, b, e = E.lin) => e(clamp((t - a) / (b - a)));
/** Damped spring from 0 to 1 starting at t0: overshoots and settles. f = wobble Hz, d = damping. */
export const spring = (t, t0, f = 2.2, d = 6) => (t < t0 ? 0 : 1 - Math.exp(-d * (t - t0)) * Math.cos(2 * Math.PI * f * (t - t0)));
/** Squash pulse after an impact at t0: returns a signed bump (+ = squash) that dies out. */
export const squash = (t, t0, amt = 0.25, f = 3.2, d = 9) => (t < t0 ? 0 : amt * Math.exp(-d * (t - t0)) * Math.cos(2 * Math.PI * f * (t - t0)));

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function fonts(list) {
  for (const [fam, file, desc] of list) {
    const ff = new FontFace(fam, `url(/fonts/${file})`, desc || {});
    await ff.load();
    document.fonts.add(ff);
  }
}
export const ROBOTO = ["Roboto", "Roboto.ttf", { weight: "100 900", stretch: "75% 100%" }];

/** Full-frame canvas + window.DEMO / renderAt. ?t=3.2 shows one frame, ?play runs in real time (for previews). */
export function stage(draw, { w = W, h = H, fps = 30, duration = 10, mb = 0 } = {}) {
  document.body.style.cssText = "margin:0;background:#000;overflow:hidden";
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  cv.style.cssText = `display:block;width:${w}px;height:${h}px`;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  window.DEMO = { width: w, height: h, fps, duration, ...(mb ? { motionBlur: { samples: mb, shutter: 0.5 } } : {}) };
  window.renderAt = async (t) => {
    window.__qa = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.filter = "none";
    ctx.clearRect(0, 0, w, h);
    ctx.save(); draw(ctx, t); ctx.restore();
  };
  const q = new URLSearchParams(location.search);
  window.__go = () => {
    window.__ready = true;
    if (q.has("t")) window.renderAt(+q.get("t"));
    else if (q.has("play")) { const s = performance.now(); const loop = () => { window.renderAt(((performance.now() - s) / 1000) % duration); requestAnimationFrame(loop); }; loop(); }
    else window.renderAt(0);
  };
  return ctx;
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Text with optional tracking (px), stroke and per-call font. Returns the measured width. */
export function text(ctx, s, x, y, { size = 80, weight = 900, family = "Roboto", stretch = "", color = "#14161F", align = "center", base = "alphabetic", ls = 0, stroke = null, sw = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${stretch ? stretch + " " : ""}${size}px "${family}"`;
  ctx.textAlign = align; ctx.textBaseline = base;
  if (ls) ctx.letterSpacing = ls + "px";
  if (stroke && sw) { ctx.lineJoin = "round"; ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  const m = ctx.measureText(s).width;
  qaText(ctx, s, x, y, m, size, align, base, alpha);
  ctx.restore();
  return m;
}

/** QA: every text() call checks where it really lands on screen (after all transforms).
 *  Warnings go to window.__qa; `render.mjs --stills` prints them. Safe area = window.DEMO.safe or the 9:16 social default. */
export function qaText(ctx, s, x, y, w, size, align = "center", base = "alphabetic", alpha = 1) {
  if (alpha * ctx.globalAlpha < 0.5) return;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const S = (window.DEMO && window.DEMO.safe) || (H > W ? { l: 60, r: 60, t: 140, b: 380 } : { l: 80, r: 80, t: 60, b: 90 });
  const x0 = align === "center" ? x - w / 2 : align === "right" || align === "end" ? x - w : x;
  const y0 = base === "middle" ? y - size * 0.5 : base === "top" ? y : y - size * 0.78, y1 = y0 + size;
  const T = ctx.getTransform(), pts = [[x0, y0], [x0 + w, y0], [x0, y1], [x0 + w, y1]].map(([px, py]) => [T.a * px + T.c * py + T.e, T.b * px + T.d * py + T.f]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [L, R, Tp, B] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const name = JSON.stringify(s.length > 30 ? s.slice(0, 30) + "…" : s);
  if (L < 0 || R > W || Tp < 0 || B > H) window.__qa.push(`OUT OF FRAME ${name} box=[${L | 0},${Tp | 0},${R | 0},${B | 0}]`);
  else if (L < S.l || R > W - S.r || Tp < S.t || B > H - S.b) window.__qa.push(`outside safe area ${name} box=[${L | 0},${Tp | 0},${R | 0},${B | 0}]`);
}

/** Subtle film grain (seeded per frame) — draws a pre-made noise tile with an offset. */
let _grain = null;
export function grain(ctx, t, amt = 0.06, fps = 30) {
  if (!_grain) {
    _grain = document.createElement("canvas"); _grain.width = _grain.height = 256;
    const g = _grain.getContext("2d"), id = g.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }
  const f = Math.floor(t * fps), r = rng(f * 31 + 3);
  ctx.save();
  ctx.globalAlpha = amt; ctx.globalCompositeOperation = "overlay";
  const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
  ctx.translate(-ox, -oy);
  ctx.fillStyle = ctx.createPattern(_grain, "repeat");
  ctx.fillRect(0, 0, ctx.canvas.width + 256, ctx.canvas.height + 256);
  ctx.restore();
}

export async function cues(url = "cues.json") { return (await fetch(url)).json(); }
