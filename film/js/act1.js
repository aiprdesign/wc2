/* THE INHERITANCE — Act I: the book, reason, the civic idea. */
'use strict';

// ---------------------------------------------------------------- OPENING
// Vignette pages: the book's drawings come alive.
const VIG = { strike: 6.95, scopeA: 7.75, scopeB: 8.5, gearGo: 8.95, gearJam: 9.3, gearRetry: 10.25 };

function gearAngle(lt) {
  if (lt < VIG.gearGo) return 0;
  if (lt < VIG.gearJam) return 0.28 * E.in(seg(lt, VIG.gearGo, VIG.gearJam));
  if (lt < VIG.gearRetry) {
    const k = lt - VIG.gearJam;
    return 0.28 + Math.sin(k * 70) * 0.025 * Math.exp(-k * 9);
  }
  const k = lt - VIG.gearRetry;
  return 0.28 + (k < 0.5 ? 0.9 * k * k : 0.225 + (k - 0.5) * 0.9 + (k - 0.5) * (k - 0.5) * 1.2);
}
const GEARS = [
  { x: 220, y: 430, r: 125, n: 24 },
  { x: 382, y: 337, r: 72, n: 14 },
  { x: 438, y: 452, r: 48, n: 9 },
];

PAGES.vigL = function (ctx, lt) {
  ctx.lineWidth = 1.2;
  ctx.strokeRect(60, 90, 480, 300);
  ctx.strokeRect(60, 420, 480, 280);
  text(ctx, 'LAPIS', 110, 116, 16, { family: FONT.cap, color: rgba(INK, 0.6) });
  text(ctx, 'CAELUM', 118, 446, 16, { family: FONT.cap, color: rgba(INK, 0.6) });
  ctx.lineWidth = 1.7;
  // --- stone block
  const bx = 250, by = 250, bw = 190, bh = 110, dx = 46, dy = -34;
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.moveTo(bx, by); ctx.lineTo(bx + dx, by + dy); ctx.lineTo(bx + bw + dx, by + dy); ctx.lineTo(bx + bw, by);
  ctx.moveTo(bx + bw + dx, by + dy); ctx.lineTo(bx + bw + dx, by + bh + dy); ctx.lineTo(bx + bw, by + bh);
  ctx.stroke();
  ctx.save();
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + bw + (dx * i) / 9, by + (dy * i) / 9 + 4);
    ctx.lineTo(bx + bw + (dx * i) / 9, by + bh + (dy * i) / 9 - 4);
    ctx.stroke();
  }
  ctx.restore();
  const k = lt - VIG.strike;
  if (k > 0) {
    // crack spreading from the chisel point
    ctx.save();
    ctx.lineWidth = 1.4;
    strokeReveal(ctx, [[262, 262], [280, 284], [276, 300], [298, 322], [292, 346]], E.out(clamp(k * 4)));
    ctx.restore();
  }
  // chisel
  const chisel = [[262, 258], [212, 196]];
  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = rgba(INK, 0.85);
  strokeReveal(ctx, chisel);
  ctx.restore();
  // hammer
  let ang;
  if (lt < VIG.strike - 0.35) ang = -1.25 + Math.sin(lt * 2) * 0.03;
  else if (lt < VIG.strike) ang = lerp(-1.25, -0.2, E.in(seg(lt, VIG.strike - 0.35, VIG.strike)));
  else ang = lerp(-0.2, -0.55, E.out(clamp(k * 3))) ;
  ctx.save();
  ctx.translate(112, 232);
  ctx.rotate(ang);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(96, 0);
  ctx.stroke();
  ctx.fillStyle = rgba(INK, 0.9);
  ctx.fillRect(88, -24, 28, 48);
  ctx.restore();
  if (k > 0 && k < 1.2) {
    spark(ctx, 212, 196, 10 * (1 - k), E.out(1 - clamp(k * 1.6)), PAL.gold);
    const r = rng(5);
    ctx.fillStyle = rgba(INK, 0.9 * (1 - clamp(k)));
    for (let i = 0; i < 14; i++) {
      const vx = (r() - 0.3) * 260, vy = -80 - r() * 200;
      const x = 240 + vx * k, y = 250 + vy * k + 420 * k * k;
      ctx.fillRect(x, y, 3 + r() * 5, 3 + r() * 4);
    }
  }
  // --- telescope
  const sa = lerp(-0.08, -0.72, E.io(seg(lt, VIG.scopeA, VIG.scopeB)));
  const px = 280, py = 610;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(px, py); ctx.lineTo(px - 70, 690);
  ctx.moveTo(px, py); ctx.lineTo(px + 6, 694);
  ctx.moveTo(px, py); ctx.lineTo(px + 72, 688);
  ctx.stroke();
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(sa);
  ctx.beginPath();
  ctx.moveTo(-80, -9); ctx.lineTo(150, -13); ctx.lineTo(150, 13); ctx.lineTo(-80, 9); ctx.closePath();
  ctx.stroke();
  ctx.strokeRect(150, -16, 18, 32);
  ctx.strokeRect(-96, -6, 16, 12);
  ctx.restore();
  const sk = E.out(seg(lt, VIG.scopeB - 0.25, VIG.scopeB + 0.4));
  if (sk > 0) {
    const r = rng(8);
    for (let i = 0; i < 16; i++) {
      const x = 330 + r() * 190, y = 450 + r() * 130, s = 3 + r() * 5;
      ctx.save();
      ctx.globalAlpha = sk * clamp((sk - i / 30) * 3);
      ctx.beginPath();
      ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = sk;
    ctx.beginPath();
    ctx.arc(480, 480, 22, 0.6, TAU - 0.6);
    ctx.arc(468, 480, 18, TAU - 0.9, 0.9, true);
    ctx.fill();
    ctx.restore();
  }
};

PAGES.vigR = function (ctx, lt) {
  ctx.lineWidth = 1.2;
  ctx.strokeRect(60, 90, 480, 610);
  text(ctx, 'MACHINA', 124, 116, 16, { family: FONT.cap, color: rgba(INK, 0.6) });
  const a = gearAngle(lt);
  const run = seg(lt, VIG.gearRetry + 0.1, VIG.gearRetry + 0.7);
  const rot = [a, (-a * GEARS[0].n) / GEARS[1].n + 0.12, (a * GEARS[0].n) / GEARS[2].n + 0.3];
  // frame and crank
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 640); ctx.lineTo(500, 640);
  ctx.moveTo(220, 430); ctx.lineTo(220, 640);
  ctx.moveTo(382, 337); ctx.lineTo(430, 640);
  ctx.stroke();
  GEARS.forEach((g, i) => {
    const pts = gearPts(g.x, g.y, g.r, g.n, 0.16, rot[i]);
    ctx.lineWidth = 1.8;
    strokeReveal(ctx, pts);
    strokeReveal(ctx, circlePts(g.x, g.y, g.r * 0.18, 24));
    ctx.beginPath();
    for (let s = 0; s < 4; s++) {
      const q = rot[i] + (s * TAU) / 4;
      ctx.moveTo(g.x + Math.cos(q) * g.r * 0.18, g.y + Math.sin(q) * g.r * 0.18);
      ctx.lineTo(g.x + Math.cos(q) * g.r * 0.7, g.y + Math.sin(q) * g.r * 0.7);
    }
    ctx.stroke();
    if (run > 0) {
      glowStroke(ctx, () => strokeReveal(ctx, pts), PAL.gold, 2, run);
    }
  });
  // crank handle on the big gear
  const hx = 220 + Math.cos(a + 0.8) * 90, hy = 430 + Math.sin(a + 0.8) * 90;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(220, 430);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, 9, 0, TAU);
  ctx.fill();
  if (lt > VIG.gearJam && lt < VIG.gearRetry) {
    // a jammed tooth, marked in the margin
    const j = seg(lt, VIG.gearJam, VIG.gearJam + 0.3);
    ctx.save();
    ctx.globalAlpha = j * (1 - seg(lt, VIG.gearRetry - 0.2, VIG.gearRetry));
    ctx.strokeStyle = rgba('#8a2a18', 0.9);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(342, 392, 26, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
};
PAGES.text2 = function (ctx) {
  scriptLines(ctx, 70, 100, 460, 21, 30, 51, INK, 0.45);
};

const OPEN_CAM = [
  [0, 318, 60, 2.8],
  [3.6, 300, 64, 2.15],
  [4.25, 0, 0, 1.06],
  [5.85, 0, 10, 1.1],
  [6.3, -200, 250, 1.55],
  [6.7, -300, -150, 2.25],
  [7.62, -290, -150, 2.3],
  [7.9, -300, 160, 2.3],
  [8.75, -300, 160, 2.25],
  [9.05, 300, 20, 1.9],
  [10.5, 300, 20, 1.72],
  [11.25, 0, 180, 1.0],
  [12.4, 0, 335, 1.0],
];
const FLIPS = [
  { s: 3.95, front: 'tinyGeo', back: 'geometry', under: 'architecture' },
  { s: 4.45, front: 'architecture', back: 'astronomy', under: 'anatomy' },
  { s: 4.95, front: 'anatomy', back: 'machinery', under: 'text2' },
  { s: 5.45, front: 'text2', back: 'vigL', under: 'vigR' },
];
const FLIP_D = 0.46;

function openingSpread(lt) {
  let left = 'text', right = 'tinyGeo', turn = null;
  for (const f of FLIPS) {
    if (lt >= f.s + FLIP_D) { left = f.back; right = f.under; }
    else if (lt >= f.s) { turn = { p: (lt - f.s) / FLIP_D, front: f.front, back: f.back, under: f.under }; break; }
  }
  return { left, right, turn };
}

Film.add('open', function (ctx, lt) {
  let [fx, fy, z] = keyframes(OPEN_CAM, lt);
  fx += noise1(lt * 0.4, 1) * 6;
  fy += noise1(lt * 0.4, 2) * 6;
  if (lt > VIG.strike && lt < VIG.strike + 0.3) fy += Math.sin((lt - VIG.strike) * 90) * 4 * (1 - (lt - VIG.strike) / 0.3);
  ctx.save();
  bookCam(ctx, fx, fy, z);
  drawTable(ctx);
  const dark = lerp(0.6, 0.28, E.sine(seg(lt, 3.6, 4.6)));
  const sp = openingSpread(lt);
  drawSpread(ctx, sp.left, sp.right, lt, dark, sp.turn);

  // the drawn line
  const lineP = E.io(seg(lt, 5.95, 6.6));
  const base = [[-560, 335], [560, 335]];
  const gold = seg(lt, 10.7, 11.3);
  if (lineP > 0) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(INK, 0.9 * (1 - gold));
    ctx.lineWidth = 2.2;
    strokeReveal(ctx, base, lineP);
    ctx.restore();
    if (lineP < 1) {
      // the pen
      const [px, py] = pointAt(base, lineP);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.9);
      ctx.fillStyle = '#16100b';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 14;
      ctx.shadowOffsetY = 16;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(10, -30); ctx.lineTo(14, -420); ctx.lineTo(-14, -420); ctx.lineTo(-10, -30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      spark(ctx, px, py, 3, 0.5);
    }
  }

  // light
  const beamA = E.sine(seg(lt, 0.7, 3.2)) * (1 - 0.5 * seg(lt, 10.8, 11.6));
  beam(ctx, 260, 40, 0.62, 300, beamA, lt);

  // hands
  const eIn = E.out(seg(lt, 1.15, 2.8)) * (1 - E.in(seg(lt, 3.55, 4.15)));
  if (eIn > 0) {
    const d = (1 - eIn) * 620;
    finger(ctx, 334 + d * 0.707, 4 - d * 0.707, 2.36, { w: 31, len: 560, age: 1, tone: '#5f4434', rim: 0.8 });
  }
  const cIn = E.out(seg(lt, 2.15, 3.35)) * (1 - E.in(seg(lt, 3.5, 4.05)));
  if (cIn > 0) {
    const d = (1 - cIn) * 560;
    const press = Math.sin(seg(lt, 3.0, 3.35) * Math.PI) * 3;
    finger(ctx, 268 - d * 0.707 - press, 124 + d * 0.707 + press, -0.785, { w: 23, len: 460, age: 0, tone: '#83573f', rim: 0.9 });
  }
  ctx.restore();

  // fade the book to darkness, leaving the line
  const fade = E.sine(seg(lt, 11.0, 12.1));
  if (fade > 0) wash(ctx, '#050608', fade * 0.97);
  if (gold > 0) {
    const ext = E.io(seg(lt, 11.2, 12.2));
    const half = lerp(560, 2600, ext);
    ctx.save();
    bookCam(ctx, fx, fy, z);
    glowStroke(ctx, () => strokeReveal(ctx, [[-half, 335], [half, 335]]), PAL.gold, 2.4 / z, gold);
    ctx.restore();
  }
  // opening darkness
  wash(ctx, '#000000', 1 - E.sine(seg(lt, 0.5, 2.4)));
  vignette(ctx, 0.7);
});

// ---------------------------------------------------------------- REASON
const REASON = (function () {
  const a = 136;
  const eu = euclidShape(0, 0, a * 2);
  const flower = [];
  for (let i = 0; i < 6; i++) {
    const q = (i * TAU) / 6;
    flower.push(circlePts(Math.cos(q) * a * 2, Math.sin(q) * a * 2, a * 2, 72));
  }
  const solids = [
    { s: SOLIDS.icosa(), p: [-560, 160, 1500], k: 70, sp: 0.5 },
    { s: SOLIDS.dodeca(), p: [600, 240, 1900], k: 90, sp: -0.4 },
    { s: SOLIDS.cube(), p: [-320, 420, 2600], k: 70, sp: 0.6 },
    { s: SOLIDS.octa(), p: [60, 520, 3300], k: 150, sp: 0.3 },
    { s: SOLIDS.icosa(), p: [780, 60, 2500], k: 60, sp: -0.7 },
    { s: SOLIDS.dodeca(), p: [-820, 40, 2300], k: 80, sp: 0.45 },
  ];
  const cols = [];
  for (let i = 0; i < 8; i++) for (const x of [-360, 360]) cols.push({ x, z: 1500 + i * 420, i });
  const walkers = [];
  const r = rng(33);
  for (let i = 0; i < 9; i++) walkers.push({ x: -260 + r() * 520, z: 1700 + r() * 2400, v: (r() < 0.5 ? -1 : 1) * (30 + r() * 40), ph: r() * 6, h: 150 + r() * 30 });
  return { a, eu, flower, solids, cols, walkers };
})();
const REASON_CAM = [
  [0, 0, 0, 0, 0],
  [2.2, 0, 0, 0, 0],
  [4.3, 0, -40, 380, -0.2],
  [7.7, 0, -20, 2100, 0.12],
];
const FLOOR = -260, COL_H = 560, COL_R = 36;

Film.add('reason', function (ctx, lt) {
  ctx.fillStyle = '#040507';
  ctx.fillRect(0, 0, W, H);
  const [cx, cy, cz, pitch] = keyframes(REASON_CAM, lt);
  const c = cam3(cx + noise1(lt * 0.3, 7) * 8, cy, cz, noise1(lt * 0.2, 9) * 0.01, pitch, 1100);
  const R = REASON;
  const tilt = E.io(seg(lt, 2.1, 4.1)) * (Math.PI / 2);
  const yc = lerp(0, FLOOR, E.io(seg(lt, 2.1, 4.1)));
  const P = (x, y) => proj(c, x, yc + y * Math.cos(tilt), 1000 + y * Math.sin(tilt));
  const fog = (z) => clamp(1 - (z - 900) / 4200);

  // ground glow & far doorway of light
  const door = E.sine(seg(lt, 4.4, 6.4));
  if (door > 0) {
    const d0 = proj(c, -150, FLOOR, 5100), d1 = proj(c, 150, FLOOR + 520, 5100);
    if (d0 && d1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const mx = (d0[0] + d1[0]) / 2, my = (d0[1] + d1[1]) / 2;
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 900 * d0[3] + 300);
      g.addColorStop(0, rgba('#ffcf8a', 0.5 * door));
      g.addColorStop(0.3, rgba('#ff9d4d', 0.12 * door));
      g.addColorStop(1, rgba('#ff9d4d', 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = rgba('#fff1d0', 0.9 * door);
      ctx.fillRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]);
      ctx.restore();
    }
  }

  // floor grid
  const grid = E.sine(seg(lt, 3.0, 4.6));
  if (grid > 0) {
    ctx.save();
    ctx.lineWidth = 1;
    for (let x = -1080; x <= 1080; x += 120) {
      const pts = [];
      for (let z = 500; z <= 5200; z += 150) {
        const p = proj(c, x, FLOOR, z);
        if (p) pts.push([p[0], p[1]]);
      }
      ctx.strokeStyle = rgba(PAL.gold, 0.12 * grid * (1 - Math.abs(x) / 1300));
      strokeReveal(ctx, pts, grid);
    }
    for (let z = 600; z <= 5200; z += 200) {
      const a0 = proj(c, -1080, FLOOR, z), a1 = proj(c, 1080, FLOOR, z);
      if (!a0 || !a1) continue;
      ctx.strokeStyle = rgba(PAL.gold, 0.1 * grid * fog(z));
      strokeReveal(ctx, [[a0[0], a0[1]], [a1[0], a1[1]]], grid);
    }
    ctx.restore();
  }

  // the construction (lines from the book, now monumental)
  const line0 = seg(lt, 0, 0.75);
  const figA = 1 - 0.55 * seg(lt, 4.5, 6.0);
  ctx.save();
  if (line0 < 1) {
    const half = lerp(1300, R.a * 1.1, E.io(line0));
    glowStroke(ctx, () => strokeReveal(ctx, [[W / 2 - half, H / 2], [W / 2 + half, H / 2]]), PAL.gold, 2.4, 1);
  } else {
    const strokes = R.eu.strokes;
    const reveal = [1, E.io(seg(lt, 0.5, 1.8)), E.io(seg(lt, 0.7, 2.0)), E.io(seg(lt, 1.5, 2.1)), E.io(seg(lt, 1.6, 2.2))];
    strokes.forEach((s, i) => {
      const pts = s.map(([x, y]) => P(x, -y)).filter(Boolean).map((p) => [p[0], p[1]]);
      glowStroke(ctx, () => strokeReveal(ctx, pts, reveal[i]), PAL.gold, i === 0 ? 2.4 : 1.6, figA);
    });
    // compass points
    for (const pt of [R.eu.A, R.eu.B]) {
      const p = P(pt[0], -pt[1]);
      if (p) spark(ctx, p[0], p[1], 5, figA * (1 - seg(lt, 3, 4)));
    }
    const lab = env(lt, 1.8, 2.3, 2.9, 3.4);
    if (lab > 0) {
      const la = P(R.eu.A[0] - 20, 20), lb = P(R.eu.B[0] + 20, 20), lc = P(0, -R.eu.C[1] + 26);
      [[la, 'A'], [lb, 'B'], [lc, 'C']].forEach(([p, s]) => p && text(ctx, s, p[0], p[1], 26, { family: FONT.cap, color: PAL.gold, alpha: lab }));
    }
    // the pattern spreads across the floor
    const fl = seg(lt, 2.9, 4.6);
    if (fl > 0) {
      R.flower.forEach((s, i) => {
        const pts = s.map(([x, y]) => P(x, -y)).filter(Boolean).map((p) => [p[0], p[1]]);
        ctx.strokeStyle = rgba(PAL.gold, 0.5 * figA);
        ctx.lineWidth = 1.2;
        strokeReveal(ctx, pts, E.io(clamp(fl * 1.6 - i * 0.1)));
      });
    }
  }
  ctx.restore();

  // floating solids
  const sol = E.sine(seg(lt, 1.9, 3.2)) * (1 - 0.7 * seg(lt, 5.2, 6.6));
  if (sol > 0) {
    ctx.save();
    ctx.lineWidth = 1.4;
    for (const S of R.solids) {
      const vs = S.s.v.map((v) => {
        let q = rotY(v, lt * S.sp);
        q = rotX(q, lt * S.sp * 0.6 + 0.4);
        return proj(c, S.p[0] + q[0] * S.k, S.p[1] + q[1] * S.k, S.p[2] + q[2] * S.k);
      });
      const fz = vs[0] ? fog(vs[0][2]) : 0;
      ctx.strokeStyle = rgba(PAL.line, 0.55 * sol * fz);
      ctx.beginPath();
      for (const [i, j] of S.s.e) {
        if (!vs[i] || !vs[j]) continue;
        ctx.moveTo(vs[i][0], vs[i][1]);
        ctx.lineTo(vs[j][0], vs[j][1]);
      }
      ctx.stroke();
      for (const v of vs) if (v) spark(ctx, v[0], v[1], 1.6, 0.35 * sol * fz);
    }
    ctx.restore();
  }

  // columns, ribs and people, far to near
  for (let i = 7; i >= 0; i--) {
    const z = 1500 + i * 420;
    const f = fog(z - c.z + 900);
    // rib
    const rib = E.io(seg(lt, 5.0 + i * 0.1, 5.7 + i * 0.1));
    if (rib > 0) {
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const q = (k / 40) * Math.PI;
        const p = proj(c, Math.cos(q) * 360, FLOOR + COL_H + 40 + Math.sin(q) * 330, z);
        if (p) pts.push([p[0], p[1], p[3]]);
      }
      if (pts.length > 2) {
        const half = Math.floor(pts.length / 2);
        const L = pts.slice(0, half + 1).reverse(), Rr = pts.slice(half);
        const k0 = pts[0][2];
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = mixHex('#050608', '#a8977b', f * 0.9);
        ctx.lineWidth = 34 * k0;
        strokeReveal(ctx, L.slice().reverse(), rib);
        strokeReveal(ctx, Rr.slice().reverse(), rib);
        ctx.strokeStyle = rgba(PAL.gold, 0.5 * f);
        ctx.lineWidth = 1.5;
        strokeReveal(ctx, L.slice().reverse(), rib);
        strokeReveal(ctx, Rr.slice().reverse(), rib);
        ctx.restore();
      }
    }
    // entablature segment
    const ent = E.io(seg(lt, 5.1 + i * 0.08, 5.5 + i * 0.08));
    if (ent > 0 && i < 7) {
      for (const x of [-360, 360]) {
        const a0 = proj(c, x, FLOOR + COL_H, z), a1 = proj(c, x, FLOOR + COL_H + 44, z + 420 * ent);
        const b0 = proj(c, x, FLOOR + COL_H, z + 420 * ent);
        if (!a0 || !a1 || !b0) continue;
        ctx.fillStyle = mixHex('#050608', '#8e7f66', f);
        ctx.beginPath();
        ctx.moveTo(a0[0], a0[1]);
        ctx.lineTo(b0[0], b0[1]);
        ctx.lineTo(a1[0], a1[1]);
        ctx.lineTo(a0[0], a0[1] - (a0[3] * 44));
        ctx.closePath();
        ctx.fill();
      }
    }
    // people in this depth band
    const pa = E.sine(seg(lt, 5.4, 6.4));
    if (pa > 0) {
      for (const wk of R.walkers) {
        if (wk.z < z || wk.z >= z + 420) continue;
        const wx = wk.x + wk.v * (lt - 5.4);
        const p = proj(c, wx, FLOOR, wk.z);
        if (!p || p[2] < 700) continue;
        ctx.save();
        ctx.globalAlpha = pa;
        person(ctx, p[0], p[1], wk.h * p[3], lt * 5 + wk.ph, 1, '#07070a', wk.v > 0 ? 1 : -1);
        ctx.restore();
      }
    }
    for (const x of [-360, 360]) drawColumn(ctx, c, x, z, lt, i, f);
  }
  vignette(ctx, 0.75);
});

function drawColumn(ctx, c, x, z, lt, i, f) {
  const guide = seg(lt, 3.5 + i * 0.12, 3.8 + i * 0.12);
  if (guide <= 0) return;
  const b = proj(c, x, FLOOR, z), tp = proj(c, x, FLOOR + COL_H, z);
  if (!b || !tp) return;
  const k = b[3];
  // construction line first
  const gAlpha = 1 - seg(lt, 4.6 + i * 0.12, 5.4 + i * 0.12);
  if (gAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = gAlpha * f;
    glowStroke(ctx, () => strokeReveal(ctx, [[b[0], b[1]], [tp[0], tp[1]]], E.out(guide)), PAL.gold, 1.4, 0.8);
    ctx.restore();
  }
  const drums = 5;
  const w = COL_R * k;
  const light = x < 0 ? 0.75 : 0.25; // lit from the doorway side
  for (let j = 0; j < drums; j++) {
    const tj = 3.85 + i * 0.12 + j * 0.13;
    const d = E.out(seg(lt, tj, tj + 0.3));
    if (d <= 0) continue;
    const y0 = FLOOR + (COL_H * j) / drums, y1 = FLOOR + (COL_H * (j + 1)) / drums;
    const drop = (1 - d) * 90;
    const p0 = proj(c, x, y0 + drop, z), p1 = proj(c, x, y1 + drop, z);
    if (!p0 || !p1) continue;
    const g = ctx.createLinearGradient(p0[0] - w, 0, p0[0] + w, 0);
    const base = '#b3a184';
    g.addColorStop(0, mixHex('#050608', base, f * (0.25 + light * 0.3)));
    g.addColorStop(light, mixHex('#050608', '#e6d7b8', f));
    g.addColorStop(1, mixHex('#050608', base, f * 0.3));
    ctx.save();
    ctx.globalAlpha = d;
    ctx.fillStyle = g;
    ctx.fillRect(p0[0] - w, p1[1], w * 2, p0[1] - p1[1] + 0.5);
    // fluting and seam
    ctx.strokeStyle = `rgba(20,14,8,${0.35 * f})`;
    ctx.lineWidth = Math.max(0.6, k * 1.5);
    ctx.beginPath();
    for (let q = -2; q <= 2; q++) {
      ctx.moveTo(p0[0] + q * w * 0.36, p1[1]);
      ctx.lineTo(p0[0] + q * w * 0.36, p0[1]);
    }
    ctx.moveTo(p0[0] - w, p1[1]);
    ctx.lineTo(p0[0] + w, p1[1]);
    ctx.stroke();
    ctx.restore();
  }
  // capital and base
  const cap = E.out(seg(lt, 3.85 + i * 0.12 + 0.65, 3.85 + i * 0.12 + 0.95));
  if (cap > 0) {
    ctx.save();
    ctx.globalAlpha = cap;
    ctx.fillStyle = mixHex('#050608', '#cdbd9e', f);
    ctx.fillRect(tp[0] - w * 1.45, tp[1] - k * 22, w * 2.9, k * 22);
    ctx.fillRect(b[0] - w * 1.35, b[1] - k * 16, w * 2.7, k * 16);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- CIVIC
const WORDS = [
  ['LAW', 0.85], ['CITIZEN', 1.35], ['LIBERTY', 1.85], ['REPRESENTATION', 2.35], ['RIGHTS', 2.85],
];
const CIVIC = (function () {
  const r = rng(71);
  const seats = [];
  for (let tier = 0; tier < 7; tier++) {
    const rx = 330 + tier * 95, n = 16 + tier * 7;
    for (let i = 0; i < n; i++) {
      const q = Math.PI + (i + 0.5) / n * Math.PI;
      seats.push({ x: W / 2 + Math.cos(q) * rx, y: 830 + Math.sin(q) * rx * 0.34, tier, d: r(), q });
    }
  }
  // ruler silhouette, sampled for dissolving
  const ruler = new Path2D();
  const cx = W / 2, by = 760;
  ruler.moveTo(cx - 110, by);
  ruler.lineTo(cx - 110, by - 330);
  ruler.quadraticCurveTo(cx, by - 420, cx + 110, by - 330);
  ruler.lineTo(cx + 110, by);
  ruler.closePath();
  const fig = new Path2D();
  fig.moveTo(cx - 70, by - 20);
  fig.lineTo(cx - 62, by - 150);
  fig.quadraticCurveTo(cx - 60, by - 230, cx - 32, by - 240);
  fig.lineTo(cx + 32, by - 240);
  fig.quadraticCurveTo(cx + 60, by - 230, cx + 62, by - 150);
  fig.lineTo(cx + 70, by - 20);
  fig.closePath();
  fig.arc(cx, by - 268, 26, 0, TAU);
  // crown
  fig.moveTo(cx - 28, by - 290);
  fig.lineTo(cx - 30, by - 322); fig.lineTo(cx - 16, by - 304); fig.lineTo(cx, by - 330);
  fig.lineTo(cx + 16, by - 304); fig.lineTo(cx + 30, by - 322); fig.lineTo(cx + 28, by - 290);
  fig.closePath();
  const pts = [];
  const oc = makeCanvas(8, 8).getContext('2d');
  for (let i = 0; i < 1400; i++) {
    const x = cx - 120 + r() * 240, y = by - 430 + r() * 430;
    if (oc.isPointInPath(ruler, x, y) || oc.isPointInPath(fig, x, y)) pts.push([x, y, r(), r()]);
  }
  const pages = [];
  for (let i = 0; i < 420; i++) {
    const a = r() * TAU, rad = Math.sqrt(r());
    pages.push({ a, rad, z: 400 + r() * 3400, rot: (r() - 0.5) * 0.8, sp: r(), y: (r() - 0.5) });
  }
  return { seats, ruler, fig, pts, pages };
})();

let MONO = null;
function monumental(dst, word, x, y, size, a, sweep) {
  if (a <= 0) return;
  if (!MONO) MONO = makeCanvas(W, H);
  const ctx = MONO.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.font = `600 ${size}px ${FONT.cap}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = size * 0.08 + 'px';
  const depth = Math.round(size * 0.1);
  for (let i = depth; i > 0; i--) {
    ctx.fillStyle = mixHex('#15110c', '#3d3326', i / depth);
    ctx.fillText(word, x + i * 0.35, y + i * 0.9);
  }
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#efe3c6');
  g.addColorStop(1, '#8c7a5c');
  ctx.fillStyle = g;
  ctx.fillText(word, x, y);
  // light raking across the stone
  ctx.globalCompositeOperation = 'source-atop';
  const sx = lerp(-W * 0.3, W * 1.3, sweep);
  const lg = ctx.createLinearGradient(sx - 260, 0, sx + 260, 0);
  lg.addColorStop(0, 'rgba(255,210,140,0)');
  lg.addColorStop(0.5, 'rgba(255,220,160,0.55)');
  lg.addColorStop(1, 'rgba(255,210,140,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, y - size, W, size * 2);
  ctx.restore();
  dst.save();
  dst.globalAlpha = a;
  dst.drawImage(MONO, 0, 0);
  dst.restore();
}

function chamber(ctx, lt, fill, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  for (let tier = 0; tier < 7; tier++) {
    const rx = 330 + tier * 95;
    ctx.strokeStyle = rgba(PAL.line, 0.13 + tier * 0.012);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W / 2, 848, rx + 40, (rx + 40) * 0.34, 0, Math.PI, TAU);
    ctx.stroke();
  }
  for (const s of CIVIC.seats) {
    const lit = E.out(clamp((fill - Math.abs(s.q - 1.5 * Math.PI) / Math.PI * 0.8 - s.d * 0.3) * 2.2));
    if (lit > 0) {
      spark(ctx, s.x, s.y - 12, 2.2, 0.8 * lit);
      ctx.fillStyle = rgba('#0a0908', lit);
      ctx.beginPath();
      ctx.arc(s.x, s.y - 16, 5.5, 0, TAU);
      ctx.fill();
      ctx.fillRect(s.x - 7, s.y - 10, 14, 12);
    } else {
      ctx.fillStyle = rgba(PAL.line, 0.1);
      ctx.fillRect(s.x - 5, s.y - 4, 10, 3);
    }
  }
  ctx.restore();
}

function scaleOfJustice(ctx, x, y, s, ang, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  const draw = () => {
    ctx.beginPath();
    ctx.moveTo(0, -150); ctx.lineTo(0, 170);
    ctx.moveTo(-70, 170); ctx.lineTo(70, 170);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -130);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-190, 0); ctx.lineTo(190, 0);
    ctx.stroke();
    for (const sx of [-190, 190]) {
      ctx.save();
      ctx.translate(sx, 0);
      ctx.rotate(-ang);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-55, 150); ctx.moveTo(0, 0); ctx.lineTo(55, 150);
      ctx.moveTo(-70, 150); ctx.quadraticCurveTo(0, 195, 70, 150);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };
  glowStroke(ctx, draw, PAL.gold, 2.2, 0.9);
  spark(ctx, 0, -130, 5, a);
  ctx.restore();
}

Film.add('civic', function (ctx, lt, t, frame) {
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, W, H);

  // A — the hand writes; words become monuments
  const parch = 1 - E.sine(seg(lt, 0.75, 1.1));
  if (parch > 0) {
    ctx.save();
    ctx.globalAlpha = parch;
    const s = 1.1 + lt * 0.08;
    ctx.translate(W / 2, H / 2);
    ctx.scale(s, s);
    ctx.drawImage(TEX.paper, -900, -560, 1800, 1120);
    ctx.fillStyle = 'rgba(10,6,3,0.35)';
    ctx.fillRect(-900, -560, 1800, 1120);
    scriptLines(ctx, -620, -300, 1200, 4, 60, 88, INK, 0.5);
    // handwritten word, revealed by the quill
    const rev = E.io(seg(lt, 0.05, 0.7));
    ctx.save();
    ctx.beginPath();
    ctx.rect(-400, -120, 800 * rev, 300);
    ctx.clip();
    text(ctx, 'Law', -20, 40, 200, { italic: true, weight: 500, color: rgba('#2a1a0c', 0.92) });
    ctx.restore();
    const qx = -400 + 800 * rev * 0.62, qy = 70 + Math.sin(rev * 20) * 18;
    ctx.fillStyle = '#120c08';
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(qx + 30, qy - 40);
    ctx.quadraticCurveTo(qx + 260, qy - 420, qx + 420, qy - 560);
    ctx.quadraticCurveTo(qx + 180, qy - 280, qx + 12, qy - 34);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const lb = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1100);
    lb.addColorStop(0, 'rgba(0,0,0,0)');
    lb.addColorStop(1, `rgba(0,0,0,${0.8 * parch})`);
    ctx.fillStyle = lb;
    ctx.fillRect(0, 0, W, H);
  }
  // chamber waits in the dark behind the words
  const chamA = E.sine(seg(lt, 0.9, 2.6));
  const fill = seg(lt, 4.1, 5.4);
  WORDS.forEach(([w, s], i) => {
    const a = E.out(seg(lt, s, s + 0.14)) * (1 - E.in(seg(lt, s + 0.4, s + 0.5)));
    if (a <= 0) return;
    const size = w.length > 8 ? 190 : 260;
    const k = seg(lt, s, s + 0.62);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(lerp(1.12, 1.0, E.out(k)), lerp(1.12, 1.0, E.out(k)));
    ctx.translate(-W / 2, -H / 2);
    monumental(ctx, w, W / 2, H / 2 + 10, size, a, k);
    ctx.restore();
  });

  // B — the lone ruler, then the chamber of citizens
  if (lt > 2.9) {
    chamber(ctx, lt, fill, chamA);
    const ra = E.sine(seg(lt, 2.95, 3.4));
    const dissolve = seg(lt, 4.05, 5.0);
    if (ra > 0 && dissolve < 1) {
      ctx.save();
      // hard cold light behind the throne
      const g = ctx.createRadialGradient(W / 2, 430, 0, W / 2, 430, 520);
      g.addColorStop(0, rgba('#b8c9e0', 0.28 * ra * (1 - dissolve)));
      g.addColorStop(1, rgba('#b8c9e0', 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = ra * (1 - E.in(dissolve));
      ctx.fillStyle = '#101218';
      ctx.fill(CIVIC.ruler);
      ctx.strokeStyle = rgba('#b8c9e0', 0.35);
      ctx.lineWidth = 2;
      ctx.stroke(CIVIC.ruler);
      ctx.fillStyle = '#010101';
      ctx.fill(CIVIC.fig);
      ctx.strokeStyle = rgba('#dfe8f4', 0.55);
      ctx.stroke(CIVIC.fig);
      ctx.fillRect(W / 2 - 180, 760, 360, 26);
      ctx.fillRect(W / 2 - 240, 786, 480, 26);
      ctx.restore();
      // threads of law bind the throne
      const bind = E.io(seg(lt, 3.35, 4.1));
      if (bind > 0) {
        ctx.save();
        ctx.strokeStyle = rgba(PAL.gold, 0.35 * (1 - dissolve));
        ctx.lineWidth = 1.1;
        const r = rng(4);
        for (let i = 0; i < 46; i++) {
          const s = CIVIC.seats[Math.floor(r() * CIVIC.seats.length)];
          const tx = W / 2 + (r() - 0.5) * 200, ty = 420 + r() * 330;
          strokeReveal(ctx, [[s.x, s.y - 14], [tx, ty]], clamp(bind * 1.4 - r() * 0.4));
        }
        ctx.restore();
      }
    }
    if (dissolve > 0 && dissolve < 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, a, b] of CIVIC.pts) {
        const k = E.out(clamp((dissolve - a * 0.4) * 1.6));
        if (k <= 0 || k >= 1) continue;
        const px = x + (b - 0.5) * 240 * k, py = y - 380 * k * (0.5 + a);
        ctx.fillStyle = rgba(PAL.gold, 0.7 * (1 - k));
        ctx.fillRect(px, py, 2.2, 2.2);
      }
      ctx.restore();
    }
  }

  // C — the scale settles: law above the ruler
  const sa = env(lt, 4.9, 5.3, 6.8, 7.2);
  if (sa > 0) {
    const k = Math.max(0, lt - 5.0);
    const ang = 0.34 * Math.exp(-k * 2.6) * Math.cos(k * 7.5);
    scaleOfJustice(ctx, W / 2, 420, 1.05, ang, sa);
    // the crown, set down beneath it
    ctx.save();
    ctx.globalAlpha = sa * 0.55;
    ctx.fillStyle = '#0a0908';
    ctx.strokeStyle = rgba(PAL.line, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const cx = W / 2, cy = 700;
    ctx.moveTo(cx - 34, cy); ctx.lineTo(cx - 38, cy - 34); ctx.lineTo(cx - 18, cy - 14); ctx.lineTo(cx, cy - 42);
    ctx.lineTo(cx + 18, cy - 14); ctx.lineTo(cx + 38, cy - 34); ctx.lineTo(cx + 34, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // D — written becomes printed
  const pa = env(lt, 6.9, 7.2, 8.9, 9.3);
  if (pa > 0 && lt < 8.6) {
    const pw = 480, ph = 640, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    const zoomOut = E.io(seg(lt, 8.1, 8.6));
    ctx.save();
    ctx.globalAlpha = pa;
    ctx.translate(W / 2, H / 2);
    ctx.scale(1 - zoomOut * 0.9, 1 - zoomOut * 0.9);
    ctx.translate(-W / 2, -H / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 40;
    ctx.drawImage(TEX.paper, px, py, pw, ph);
    ctx.shadowBlur = 0;
    const printed = lt > 7.62;
    if (!printed) {
      scriptLines(ctx, px + 50, py + 80, pw - 100, 16, 30, 17, INK, 0.55);
    } else {
      text(ctx, 'ARTICLE I', W / 2, py + 70, 22, { family: FONT.cap, color: rgba(INK, 0.9), spacing: 4 });
      text(ctx, 'W', px + 76, py + 142, 64, { family: FONT.cap, color: rgba('#7a2a18', 0.9) });
      const r = rng(9);
      ctx.fillStyle = rgba(INK, 0.7);
      for (let i = 0; i < 15; i++) {
        let x = px + (i < 2 ? 116 : 50);
        const y = py + 116 + i * 30;
        const end = px + pw - 50 - (i === 14 ? 180 : 0);
        while (x < end - 10) {
          const w = Math.min(end - x, 18 + r() * 54);
          ctx.fillRect(x, y, w, 5);
          x += w + 8;
        }
      }
    }
    // the platen
    const down = E.in(seg(lt, 7.35, 7.6)) * (1 - E.out(seg(lt, 7.68, 7.95)));
    if (down > 0) {
      ctx.fillStyle = '#16120d';
      ctx.fillRect(px - 40, py - 700 + down * 700, pw + 80, ph + 20);
      ctx.strokeStyle = rgba(PAL.line, 0.2);
      ctx.strokeRect(px - 40, py - 700 + down * 700, pw + 80, ph + 20);
    }
    ctx.restore();
  }

  // E/F — pages multiply, spread, and take flight
  if (lt > 8.1) {
    const spread = E.io(seg(lt, 8.1, 9.6));
    const fly = seg(lt, 9.2, 11.5);
    const c = cam3(0, 0, -600 * spread, 0, 0, 1100);
    const items = [];
    CIVIC.pages.forEach((p, i) => {
      const rad = p.rad * 2200 * spread;
      let x = Math.cos(p.a) * rad, y = Math.sin(p.a) * rad * 0.62, z = lerp(1400, p.z, spread);
      const fk = E.in(clamp(fly * 1.4 - p.sp * 0.4));
      if (fk > 0) {
        x += fk * (1800 + p.sp * 1500) + Math.sin(lt * 1.3 + i) * 60 * fk;
        y += fk * (500 + p.y * 900);
        z -= fk * 300;
      }
      const pr = proj(c, x, y, z);
      if (pr) items.push([pr, p, fk, i]);
    });
    items.sort((a, b) => b[0][2] - a[0][2]);
    const aAll = seg(lt, 8.1, 8.4);
    for (const [pr, p, fk, i] of items) {
      const s = 44 * pr[3];
      const fog = clamp(1 - (pr[2] - 600) / 3800);
      ctx.save();
      ctx.translate(pr[0], pr[1]);
      ctx.rotate(p.rot * (1 - fk) - 0.35 * fk);
      ctx.globalAlpha = aAll * fog;
      const flap = Math.sin(lt * 16 + i) * fk;
      const bw = lerp(1, 1.5, fk), bh = lerp(1.3, 0.35, fk);
      ctx.fillStyle = mixHex('#1a140c', '#e8d8b6', 0.35 + 0.65 * fog);
      ctx.beginPath();
      ctx.moveTo(-s * bw, -s * bh * (1 - fk) - s * 0.4 * flap * fk);
      ctx.lineTo(s * lerp(0, 0.2, fk) - s * (1 - fk) * 0, -s * lerp(1.3, 0.1, fk));
      ctx.lineTo(s * bw, -s * bh * (1 - fk) - s * 0.4 * flap * fk);
      ctx.lineTo(s * lerp(1, 0, fk), s * lerp(1.3, 0.5, fk));
      ctx.lineTo(-s * lerp(1, 0, fk), s * lerp(1.3, 0.5, fk));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // one bird turns toward us
    const lead = seg(lt, 10.0, 11.5);
    if (lead > 0) {
      const k = E.io(lead);
      const x = lerp(W * 0.85, W / 2, k), y = lerp(H * 0.2, H * 0.5, k), s = lerp(20, 180, E.in(lead));
      const flap = Math.sin(lt * 9);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#efe2c4';
      ctx.shadowColor = 'rgba(255,200,120,0.4)';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.5);
      ctx.lineTo(s * 1.5, -s * 0.45 * flap);
      ctx.lineTo(s * 0.15, s * 0.1);
      ctx.lineTo(0, s * 0.6);
      ctx.lineTo(-s * 0.15, s * 0.1);
      ctx.lineTo(-s * 1.5, -s * 0.45 * flap);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  vignette(ctx, 0.7);
}, { fadeIn: 0.45 });
