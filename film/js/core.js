/* THE INHERITANCE — core toolkit.
   Everything here is deterministic: the same time value always renders the
   same frame, so the film can be scrubbed, played live, or exported frame by
   frame. */
'use strict';

const W = 1920, H = 1080;
const TAU = Math.PI * 2;

const PAL = {
  void: '#050608',
  ink: '#0a0b10',
  paper: '#e4d3b0',
  paperDeep: '#c9b287',
  sepia: '#4a331f',
  line: '#e9dcc0',
  gold: '#ffc36a',
  goldHot: '#fff0c8',
  ember: '#ff8a3d',
  steel: '#8fb3dc',
  blueprint: '#0d2138',
  marble: '#efe8dc',
};

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const E = {
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoIn: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  expoIo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  backOut: (t) => {
    const c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
// fade in over [a,b], out over [c,d]
const env = (t, a, b, c, d) => Math.min(seg(t, a, b), 1 - seg(t, c, d));

function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = Math.imul(n, 0x27d4eb2d);
  n ^= n >>> 15;
  return ((n >>> 0) % 100000) / 100000;
}
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash(i * 7919 + seed * 104729), b = hash((i + 1) * 7919 + seed * 104729);
  return lerp(a, b, smooth(f)) * 2 - 1;
}

// ---------- canvas helpers ----------
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ---------- polylines ----------
// A stroke is an array of [x,y] points; a Shape is an array of strokes.
function circlePts(cx, cy, r, n = 64, a0 = 0, a1 = TAU) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return p;
}
function ellipsePts(cx, cy, rx, ry, n = 64, rot = 0, a0 = 0, a1 = TAU) {
  const p = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    p.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return p;
}
function linePts(x1, y1, x2, y2, n = 8) {
  const p = [];
  for (let i = 0; i <= n; i++) p.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]);
  return p;
}
function rectPts(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
}
function polyLen(p) {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
}
function gearPts(cx, cy, r, teeth, depth = 0.12, rot = 0, n = 0) {
  const p = [], N = n || teeth * 8;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const ph = ((a * teeth) / TAU) % 1;
    // trapezoid tooth profile
    const k = ph < 0.2 ? ph / 0.2 : ph < 0.5 ? 1 : ph < 0.7 ? 1 - (ph - 0.5) / 0.2 : 0;
    const rr = r * (1 - depth + depth * k);
    p.push([cx + Math.cos(a + rot) * rr, cy + Math.sin(a + rot) * rr]);
  }
  return p;
}

// draw a stroke up to fraction f of its length
function strokeReveal(ctx, pts, f = 1) {
  if (f <= 0 || pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (f >= 1) {
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  } else {
    const L = polyLen(pts) * f;
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d >= L) {
        const k = d ? (L - acc) / d : 0;
        ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k));
        break;
      }
      acc += d;
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
  }
  ctx.stroke();
}
// point at fraction f along stroke
function pointAt(pts, f) {
  const L = polyLen(pts) * clamp(f);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + d >= L) {
      const k = d ? (L - acc) / d : 0;
      return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
    }
    acc += d;
  }
  return pts[pts.length - 1];
}
// reveal a whole shape: strokes drawn in sequence with overlap
function shapeReveal(ctx, shape, f, overlap = 0.6) {
  const n = shape.length;
  if (!n) return;
  const span = 1 / (n - (n - 1) * overlap);
  for (let i = 0; i < n; i++) {
    const s = i * span * (1 - overlap);
    strokeReveal(ctx, shape[i], clamp((f - s) / span));
  }
}
function resample(pts, n) {
  const out = [], L = polyLen(pts);
  if (L === 0) {
    for (let i = 0; i < n; i++) out.push([pts[0][0], pts[0][1]]);
    return out;
  }
  let j = 1, acc = 0;
  for (let i = 0; i < n; i++) {
    const target = (L * i) / (n - 1);
    while (j < pts.length - 1) {
      const d = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
      if (acc + d >= target) break;
      acc += d;
      j++;
    }
    const d = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
    const k = d ? clamp((target - acc) / d) : 0;
    out.push([lerp(pts[j - 1][0], pts[j][0], k), lerp(pts[j - 1][1], pts[j][1], k)]);
  }
  return out;
}
// Normalise a shape to exactly S strokes of P points so any two can morph.
function normShape(shape, S = 24, P = 48) {
  const strokes = shape.filter((s) => s.length > 1);
  const lens = strokes.map(polyLen);
  const order = strokes.map((_, i) => i).sort((a, b) => lens[b] - lens[a]);
  const out = [];
  let cx = 0, cy = 0, cnt = 0;
  for (const s of strokes) for (const p of s) { cx += p[0]; cy += p[1]; cnt++; }
  cx /= cnt || 1; cy /= cnt || 1;
  for (let i = 0; i < S; i++) {
    if (i < order.length) out.push(resample(strokes[order[i]], P));
    else {
      // spare strokes collapse onto a point of an existing stroke
      const src = out[i % Math.max(1, Math.min(out.length, order.length))];
      const p = src ? src[(i * 7) % P] : [cx, cy];
      out.push(Array.from({ length: P }, () => [p[0], p[1]]));
    }
  }
  // sort strokes by angle around centroid for more coherent morphs
  return out;
}
function morphShape(a, b, t) {
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const s = [];
    for (let j = 0; j < a[i].length; j++) s.push([lerp(a[i][j][0], b[i][j][0], t), lerp(a[i][j][1], b[i][j][1], t)]);
    out.push(s);
  }
  return out;
}
function drawShape(ctx, shape) {
  for (const s of shape) strokeReveal(ctx, s, 1);
}
function xform(shape, dx, dy, sc = 1, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return shape.map((st) => st.map(([x, y]) => [dx + (x * c - y * s) * sc, dy + (x * s + y * c) * sc]));
}

// ---------- light ----------
function glowStroke(ctx, drawFn, color, width, glow = 1) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(color, 0.08 * glow);
  ctx.lineWidth = width * 9;
  drawFn();
  ctx.strokeStyle = rgba(color, 0.18 * glow);
  ctx.lineWidth = width * 3.5;
  drawFn();
  ctx.restore();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  drawFn();
  ctx.restore();
}
function spark(ctx, x, y, r, a = 1, color = PAL.gold) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  let g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
  g.addColorStop(0, rgba(color, 0.55 * a));
  g.addColorStop(0.25, rgba(color, 0.16 * a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(PAL.goldHot, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  // anamorphic streak
  const sw = r * 14;
  g = ctx.createLinearGradient(x - sw, y, x + sw, y);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(PAL.goldHot, 0.35 * a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - sw, y - r * 0.08, sw * 2, r * 0.16);
  ctx.restore();
}
function vignette(ctx, strength = 0.75) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function wash(ctx, color, a) {
  if (a <= 0) return;
  ctx.fillStyle = rgba(color, a);
  ctx.fillRect(0, 0, W, H);
}

// ---------- 3D ----------
function cam3(x, y, z, yaw = 0, pitch = 0, f = 1100) {
  return { x, y, z, yaw, pitch, f, cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch) };
}
// world: x right, y up, z forward. returns [sx, sy, depth] or null
function proj(c, px, py, pz, cx = W / 2, cyy = H / 2) {
  let x = px - c.x, y = py - c.y, z = pz - c.z;
  let x1 = x * c.cy - z * c.sy, z1 = x * c.sy + z * c.cy;
  let y1 = y * c.cp - z1 * c.sp, z2 = y * c.sp + z1 * c.cp;
  if (z2 < 1) return null;
  const k = c.f / z2;
  return [cx + x1 * k, cyy - y1 * k, z2, k];
}
function rotY(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}
function rotX(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}
function rotZ(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
}

const PHI = (1 + Math.sqrt(5)) / 2;
const SOLIDS = {
  icosa() {
    const v = [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
    ];
    return { v, e: edgesByLength(v, 2) };
  },
  dodeca() {
    const v = [], p = PHI, ip = 1 / PHI;
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      v.push([0, a * ip, b * p]);
      v.push([a * ip, b * p, 0]);
      v.push([a * p, 0, b * ip]);
    }
    return { v, e: edgesByLength(v, 2 / PHI) };
  },
  cube() {
    const v = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
    return { v, e: edgesByLength(v, 2) };
  },
  octa() {
    const v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    return { v, e: edgesByLength(v, Math.SQRT2) };
  },
};
function edgesByLength(v, L) {
  const e = [];
  for (let i = 0; i < v.length; i++)
    for (let j = i + 1; j < v.length; j++) {
      const d = Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]);
      if (Math.abs(d - L) < 0.01) e.push([i, j]);
    }
  return e;
}

// ---------- textures (built once) ----------
const TEX = {};
function buildTextures() {
  // film grain frames
  TEX.grain = [];
  for (let k = 0; k < 6; k++) {
    const c = makeCanvas(256, 256), g = c.getContext('2d');
    const img = g.createImageData(256, 256), r = rng(900 + k);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    TEX.grain.push(c);
  }
  // aged paper
  const pw = 640, ph = 840;
  const pc = makeCanvas(pw, ph), g = pc.getContext('2d');
  g.fillStyle = PAL.paper;
  g.fillRect(0, 0, pw, ph);
  const r = rng(77);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},${30 + r() * 20},${r() * 0.05})`;
    const s = 1 + r() * 30;
    g.beginPath();
    g.ellipse(r() * pw, r() * ph, s, s * (0.3 + r()), r() * 3, 0, TAU);
    g.fill();
  }
  // fibres
  g.strokeStyle = 'rgba(120,90,50,0.07)';
  g.lineWidth = 0.7;
  for (let i = 0; i < 500; i++) {
    const x = r() * pw, y = r() * ph, a = r() * TAU, l = 4 + r() * 18;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  // foxing stains
  for (let i = 0; i < 14; i++) {
    const x = r() * pw, y = r() * ph, s = 8 + r() * 40;
    const rg = g.createRadialGradient(x, y, 0, x, y, s);
    rg.addColorStop(0, 'rgba(140,95,45,0.12)');
    rg.addColorStop(1, 'rgba(140,95,45,0)');
    g.fillStyle = rg;
    g.fillRect(x - s, y - s, s * 2, s * 2);
  }
  // edge burn
  const eg = g.createRadialGradient(pw / 2, ph / 2, ph * 0.3, pw / 2, ph / 2, ph * 0.72);
  eg.addColorStop(0, 'rgba(90,55,20,0)');
  eg.addColorStop(1, 'rgba(90,55,20,0.38)');
  g.fillStyle = eg;
  g.fillRect(0, 0, pw, ph);
  TEX.paper = pc;

  // star field
  const sc = makeCanvas(W, H), s = sc.getContext('2d'), sr = rng(4242);
  for (let i = 0; i < 1400; i++) {
    const m = Math.pow(sr(), 3);
    s.fillStyle = `rgba(${220 + sr() * 35},${220 + sr() * 35},255,${0.15 + m * 0.85})`;
    const rr = 0.4 + m * 1.6;
    s.beginPath();
    s.arc(sr() * W, sr() * H, rr, 0, TAU);
    s.fill();
  }
  TEX.stars = sc;
}
function grain(ctx, frame, a = 0.07) {
  const tile = TEX.grain[frame % TEX.grain.length];
  ctx.save();
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'overlay';
  const ox = -Math.floor(hash(frame * 3 + 1) * 256), oy = -Math.floor(hash(frame * 5 + 2) * 256);
  for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) ctx.drawImage(tile, x, y);
  ctx.restore();
}

// Floating dust in a beam of light.
function dust(ctx, t, n, box, seed = 1, a = 1, color = PAL.goldHot) {
  const r = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), sp = 0.2 + r() * 0.8, sz = 0.6 + r() * 2.2, ph = r() * 100;
    const x = box[0] + ((bx * box[2] + noise1(t * 0.3 * sp + ph, i) * 60 + t * 6 * sp) % box[2] + box[2]) % box[2];
    const y = box[1] + ((by * box[3] + noise1(t * 0.25 * sp + ph + 40, i) * 50 - t * 4 * sp) % box[3] + box[3]) % box[3];
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + sp * 2) + ph);
    ctx.fillStyle = rgba(color, 0.55 * a * tw);
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- type ----------
const FONT = {
  cap: '"Cinzel", "Trajan Pro", "Times New Roman", serif',
  serif: '"Cormorant Garamond", "Garamond", "Times New Roman", serif',
};
function text(ctx, str, x, y, size, opts = {}) {
  ctx.save();
  ctx.font = `${opts.italic ? 'italic ' : ''}${opts.weight || 400} ${size}px ${opts.family || FONT.serif}`;
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = opts.baseline || 'middle';
  if (opts.spacing) ctx.letterSpacing = opts.spacing + 'px';
  ctx.fillStyle = opts.color || PAL.line;
  ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
  if (opts.glow) {
    ctx.shadowColor = rgba(opts.glowColor || PAL.gold, opts.glow);
    ctx.shadowBlur = opts.glowBlur || 24;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Faux manuscript lines (handwriting texture).
function scriptLines(ctx, x, y, w, rows, lh, seed, color, a = 0.45, f = 1) {
  const r = rng(seed);
  ctx.save();
  ctx.strokeStyle = rgba(color, a);
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  for (let i = 0; i < rows; i++) {
    const rowF = clamp(f * rows - i);
    if (rowF <= 0) break;
    let cx = x + (i === 0 ? 30 : 0);
    const end = x + w * (i === rows - 1 ? 0.55 : 0.92 + r() * 0.08);
    const yy = y + i * lh;
    ctx.beginPath();
    while (cx < lerp(x, end, rowF)) {
      const wl = 8 + r() * 34;
      ctx.moveTo(cx, yy + (r() - 0.5) * 2);
      const steps = Math.floor(wl / 4);
      for (let k = 1; k <= steps; k++) {
        ctx.lineTo(cx + k * 4, yy + Math.sin(k * 2.1 + r() * 2) * lh * 0.16 - (r() < 0.1 ? lh * 0.25 : 0));
      }
      cx += wl + 7;
    }
    ctx.stroke();
  }
  ctx.restore();
}
