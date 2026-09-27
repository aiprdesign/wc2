/* THE INHERITANCE — Act IV: computation, the inheritance, the chain, legacy. */
'use strict';

// ---------------------------------------------------------------- shape library
const SH = (function () {
  const L = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
  const R = (x, y, w, h) => rectPts(x, y, w, h);
  const C = (x, y, r, n = 36) => circlePts(x, y, r, n);
  const lib = {
    stone: [
      R(-180, -40, 300, 170), [[-180, -40], [-100, -110], [200, -110], [120, -40]], [[200, -110], [200, 60], [120, 130]],
      [[-60, 20], [-30, 60], [-40, 100]],
    ],
    column: [
      R(-50, -200, 100, 400), R(-90, -240, 180, 40), R(-80, 200, 160, 30), L(-20, -200, -20, 200), L(20, -200, 20, 200),
      [[-90, -240], [-110, -260], [-90, -280]], [[90, -240], [110, -260], [90, -280]],
    ],
    arch: [
      circlePts(0, 80, 200, 48, Math.PI, TAU), circlePts(0, 80, 140, 48, Math.PI, TAU), L(-200, 80, -200, 260), L(-140, 80, -140, 260),
      L(200, 80, 200, 260), L(140, 80, 140, 260), R(-26, -140, 52, 80),
    ],
    book: [
      [[0, -120], [-120, -150], [-260, -130], [-260, 150], [-120, 130], [0, 160]],
      [[0, -120], [120, -150], [260, -130], [260, 150], [120, 130], [0, 160]], L(0, -120, 0, 160),
      L(-220, -80, -40, -80), L(-220, -30, -40, -30), L(-220, 20, -40, 20), L(40, -80, 220, -80), L(40, -30, 220, -30),
    ],
    painting: [R(-260, -190, 520, 380), R(-230, -160, 460, 320), [[-230, 120], [-110, -40], [-20, 60], [80, -80], [230, 90]], C(120, -90, 30)],
    telescope: [
      [[-220, 60], [180, -120], [196, -86], [-204, 94], [-220, 60]], R(180, -140, 40, 70), L(-10, 20, -90, 230), L(-10, 20, 70, 230), L(-10, 20, -10, 240),
    ],
    equation: [
      [[-160, -150], [-130, -170], [-110, -130], [-150, 130], [-130, 170], [-100, 150]], L(-40, -20, 40, -20), L(-40, 30, 40, 30),
      [[90, -60], [110, 40], [140, -120], [220, -120]], C(160, 60, 30),
    ],
    gear: [gearPts(0, 0, 220, 16, 0.18, 0, 128), C(0, 0, 50), L(0, -50, 0, -170), L(0, 50, 0, 170), L(-50, 0, -170, 0), L(50, 0, 170, 0)],
    engine: [R(-260, -70, 250, 140), R(-120, -60, 40, 120), L(-80, 0, 120, -80), C(160, 0, 140), C(160, 0, 26)],
    electricity: [[[40, -260], [-80, 20], [10, 20], [-60, 260], [120, -40], [20, -40], [110, -260], [40, -260]]],
    microscope: [
      [[-40, -240], [20, -240], [60, 20], [0, 20], [-40, -240]], R(-160, 210, 320, 40), [[120, 210], [120, -40], [60, -100]],
      R(-60, 60, 180, 20), C(30, 40, 20),
    ],
    aircraft: null,
    rocket: [[[-40, 240], [-40, -100], [0, -250], [40, -100], [40, 240], [-40, 240]], [[-40, 100], [-100, 250], [-40, 220]], [[40, 100], [100, 250], [40, 220]], C(0, -40, 22)],
    transistor: [[[-90, 60], [-90, -80], [0, -150], [90, -80], [90, 60], [-90, 60]], R(-110, 60, 220, 30), L(-50, 90, -50, 260), L(0, 90, 0, 260), L(50, 90, 50, 260)],
    network: (function () {
      const r = rng(4), nodes = [], s = [];
      for (let i = 0; i < 9; i++) nodes.push([Math.cos(i * 0.7 + 0.3) * (100 + r() * 150), Math.sin(i * 0.7 + 0.3) * (100 + r() * 150)]);
      nodes.push([0, 0]);
      nodes.forEach((n) => s.push(C(n[0], n[1], 16, 16)));
      for (let i = 0; i < nodes.length; i++) s.push([nodes[i], nodes[(i + 3) % nodes.length]], [nodes[i], nodes[9]]);
      return s;
    })(),
    calculator: [R(-260, -110, 520, 220), C(-180, 20, 36), C(-90, 20, 36), C(0, 20, 36), C(90, 20, 36), C(180, 20, 36), R(-220, -90, 440, 34)],
    relay: [R(-200, -60, 140, 160), [[-200, -40], [-60, -20], [-200, 0], [-60, 20], [-200, 40], [-60, 60], [-200, 80]], L(-40, -100, 200, -140), C(-40, -100, 14), R(160, -60, 60, 40), L(-240, 120, 240, 120)],
    tube: [[[-90, 200], [-90, -60], [-80, -140], [0, -200], [80, -140], [90, -60], [90, 200], [-90, 200]], [[-40, 100], [-40, -60], [-20, -90], [0, -60], [20, -90], [40, -60], [40, 100]], R(-110, 200, 220, 50), L(-60, 250, -60, 290), L(0, 250, 0, 290), L(60, 250, 60, 290)],
    chip: (function () {
      const s = [R(-200, -120, 400, 240), circlePts(-200, 0, 26, 20, -Math.PI / 2, Math.PI / 2)];
      for (let i = 0; i < 8; i++) s.push(L(-170 + i * 48, -120, -170 + i * 48, -170), L(-170 + i * 48, 120, -170 + i * 48, 170));
      return s;
    })(),
    micro: (function () {
      const s = [R(-190, -190, 380, 380), R(-80, -80, 160, 160)];
      for (let i = 0; i < 7; i++) {
        const k = -150 + i * 50;
        s.push(L(k, -190, k, -240), L(k, 190, k, 240), L(-190, k, -240, k), L(190, k, 240, k));
      }
      return s;
    })(),
    computer: [R(-230, -200, 460, 300), R(-200, -170, 400, 240), [[-40, 100], [-60, 170], [60, 170], [40, 100]], R(-240, 200, 480, 60), L(-170, 150, -20, 150)],
  };
  lib.aircraft = CRAFT.rawBiplane.length ? [
    [[-260, -10], [-200, -30], [200, -30], [260, -10], [240, 20], [-240, 20], [-260, -10]],
    [[-80, 0], [60, 140], [100, 140], [60, 0]], [[-80, -10], [60, -150], [100, -150], [60, -20]],
    [[-260, -10], [-320, -70], [-290, -70], [-230, -25]], [[260, -80], [260, 60]],
  ] : [];
  const norm = {};
  for (const k in lib) norm[k] = normShape(lib[k], 18, 40);
  return { raw: lib, n: norm };
})();

// ---------------------------------------------------------------- COMPUTATION
const DEVICES = [
  ['calculator', 'CALCULATING MACHINE', '1642'], ['relay', 'RELAY', '1835'], ['tube', 'VACUUM TUBE', '1904'],
  ['transistor', 'TRANSISTOR', '1947'], ['chip', 'INTEGRATED CIRCUIT', '1958'], ['micro', 'MICROPROCESSOR', '1971'],
  ['computer', 'PERSONAL COMPUTER', '1977'],
];

Film.add('compute', function (ctx, lt, t, frame) {
  ctx.fillStyle = '#020306';
  ctx.fillRect(0, 0, W, H);
  // A — Earth's horizon becomes the edge of a silicon wafer
  const wA = 1 - E.sine(seg(lt, 1.2, 1.6));
  if (wA > 0) {
    const k = E.io(seg(lt, 0.1, 1.1));
    const R = lerp(2600, 440, k), cy = lerp(H / 2 + 2600 - 260, H / 2, k);
    ctx.save();
    ctx.globalAlpha = wA;
    ctx.beginPath();
    ctx.arc(W / 2, cy, R, 0, TAU);
    const g = ctx.createLinearGradient(W / 2 - R, cy - R, W / 2 + R, cy + R);
    g.addColorStop(0, mixHex('#08101e', '#2b2a4a', k));
    g.addColorStop(0.5, mixHex('#08101e', '#16303a', k));
    g.addColorStop(1, mixHex('#08101e', '#3a2e1a', k));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const die = 44;
    ctx.strokeStyle = rgba('#9fc3e8', 0.35 * k);
    ctx.lineWidth = 1;
    const s = R / 440 * die;
    for (let x = W / 2 - R; x < W / 2 + R; x += s) { ctx.beginPath(); ctx.moveTo(x, cy - R); ctx.lineTo(x, cy + R); ctx.stroke(); }
    for (let y = cy - R; y < cy + R; y += s) { ctx.beginPath(); ctx.moveTo(W / 2 - R, y); ctx.lineTo(W / 2 + R, y); ctx.stroke(); }
    const sheen = ctx.createLinearGradient(W / 2 - R, 0, W / 2 + R, 0);
    sheen.addColorStop(0, 'rgba(120,90,255,0)');
    sheen.addColorStop(0.45 + lt * 0.05, `rgba(140,230,255,${0.25 * k})`);
    sheen.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    glowStroke(ctx, () => { ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, TAU); ctx.stroke(); }, mixHex('#7fb7ff', PAL.gold, k), 2, 1);
    ctx.restore();
  }
  // B — each machine grows out of the one before
  const t0 = 1.2, step = 0.36;
  const cA = env(lt, 1.2, 1.4, 3.75, 4.0);
  if (cA > 0) {
    const f = (lt - t0) / step;
    const i = clamp(Math.floor(f), 0, DEVICES.length - 1);
    const frac = f - i;
    const k = i < DEVICES.length - 1 ? E.io(clamp((frac - 0.55) / 0.45)) : 0;
    const a = SH.n[DEVICES[i][0]], b = SH.n[DEVICES[Math.min(i + 1, DEVICES.length - 1)][0]];
    const shp = xform(morphShape(a, b, k), W / 2, H / 2 - 30, 1.1);
    ctx.save();
    ctx.globalAlpha = cA;
    glowStroke(ctx, () => drawShape(ctx, shp), i >= 3 ? PAL.gold : PAL.steel, 2, 1);
    const la = 1 - Math.abs(k - 0.5) * 2 < 1 && k > 0 ? 1 - Math.sin(k * Math.PI) : 1;
    const idx = k > 0.5 ? Math.min(i + 1, DEVICES.length - 1) : i;
    text(ctx, DEVICES[idx][2], W / 2, H / 2 + 330, 34, { family: FONT.cap, color: PAL.gold, alpha: la * cA, spacing: 8 });
    text(ctx, DEVICES[idx][1], W / 2, H / 2 + 285, 22, { family: FONT.cap, color: PAL.line, alpha: la * cA * 0.8, spacing: 6 });
    ctx.restore();
  }
  // C — one becomes millions
  const mA = env(lt, 3.75, 3.95, 4.55, 4.8);
  if (mA > 0) {
    const z = Math.pow(0.04, E.in(seg(lt, 3.75, 4.8)));
    const cell = 520 * z;
    ctx.save();
    ctx.globalAlpha = mA;
    ctx.translate(W / 2, H / 2);
    const n = Math.min(80, Math.ceil(W / cell / 2) + 1);
    const tr = SH.raw.transistor;
    for (let gx = -n; gx <= n; gx++) for (let gy = -Math.ceil(n * 0.6); gy <= Math.ceil(n * 0.6); gy++) {
      const x = gx * cell, y = gy * cell;
      if (cell > 24) {
        ctx.strokeStyle = rgba(PAL.gold, 0.8);
        ctx.lineWidth = 1.2;
        drawShape(ctx, xform(tr, x, y, z * 0.9));
      } else {
        ctx.fillStyle = rgba(hash(gx * 911 + gy * 37 + frame) < 0.15 ? PAL.goldHot : PAL.gold, 0.7);
        ctx.fillRect(x - 1, y - 1, Math.max(1.2, cell * 0.25), Math.max(1.2, cell * 0.25));
      }
    }
    ctx.restore();
  }
  // D — pages become light, light becomes a network
  const nA = seg(lt, 4.5, 4.8);
  if (nA > 0) {
    ctx.save();
    ctx.globalAlpha = nA;
    const r = rng(12);
    const nodes = [];
    for (let i = 0; i < 70; i++) nodes.push([W / 2 + (r() - 0.5) * 1700, H / 2 + (r() - 0.5) * 820, r()]);
    const grow = E.out(seg(lt, 4.55, 5.6));
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
        if (d > 260) continue;
        const k = clamp(grow * 1.4 - nodes[i][2] * 0.4);
        ctx.strokeStyle = rgba(PAL.gold, 0.35 * k);
        strokeReveal(ctx, [[nodes[i][0], nodes[i][1]], [nodes[j][0], nodes[j][1]]], k);
        if (k >= 1) {
          const q = (lt * 1.5 + i * 0.13 + j * 0.07) % 1;
          spark(ctx, lerp(nodes[i][0], nodes[j][0], q), lerp(nodes[i][1], nodes[j][1], q), 1.6, 0.8);
        }
      }
    }
    // an open book at the centre, its lines turning into light
    ctx.strokeStyle = rgba(PAL.line, 0.8 * (1 - seg(lt, 5.0, 5.5)));
    ctx.lineWidth = 2;
    drawShape(ctx, xform(SH.raw.book, W / 2, H / 2, 0.55));
    for (let i = 0; i < 40; i++) {
      const k = ((lt - 4.5) * 0.9 + i / 40) % 1;
      const n = nodes[i];
      spark(ctx, lerp(W / 2, n[0], k), lerp(H / 2, n[1], k), 1.8, 0.8 * (1 - k));
    }
    for (const n of nodes) spark(ctx, n[0], n[1], 2.5, clamp(grow * 1.4 - n[2] * 0.4));
    ctx.restore();
  }
  vignette(ctx, 0.7);
}, { fadeIn: 0.3 });

// ---------------------------------------------------------------- INHERITANCE
const ARCH = (function () {
  const n = 8, nodes = [], deck = [];
  for (let i = 0; i <= n; i++) {
    const x = 560 + i * 100;
    nodes.push([x, 760 - 250 * Math.sin((Math.PI * i) / n)]);
    deck.push([x, 760]);
  }
  const A = [], Bv = [], Cd = [];
  for (let i = 0; i < n; i++) { A.push([nodes[i], nodes[i + 1]]); A.push([deck[i], deck[i + 1]]); }
  for (let i = 1; i < n; i++) Bv.push([nodes[i], deck[i]]);
  for (let i = 0; i < n; i++) { Cd.push([nodes[i], deck[i + 1]]); Cd.push([deck[i], nodes[i + 1]]); }
  return { A, B: A.concat(Bv), C: A.concat(Bv, Cd), apex: nodes[n / 2] };
})();

function drawCover(ctx) {
  ctx.fillStyle = '#3a2416';
  roundRect(ctx, 0, -PH / 2 - 26, PW + 30, PH + 52, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(210,160,80,0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, 24, -PH / 2 - 2, PW - 18, PH + 4, 6);
  ctx.stroke();
  ctx.lineWidth = 2;
  const e = euclidShape(PW / 2 + 15, 30, 150);
  e.strokes.forEach((s) => strokeReveal(ctx, s));
}

function members(ctx, list, p, lt, fail, failT, sag) {
  // p: reveal 0..1 across members; fail: collapse progress
  const n = list.length;
  list.forEach(([a, b], i) => {
    const k = clamp(p * n - i);
    if (k <= 0) return;
    let a2 = a, b2 = b;
    if (sag > 0) {
      const f = (pt) => [pt[0], pt[1] + Math.sin(((pt[0] - 560) / 800) * Math.PI) * 70 * sag];
      a2 = f(a); b2 = f(b);
    }
    if (fail > 0) {
      const r = hash(i * 13 + failT);
      const dy = fail * fail * (400 + r * 500), dx = (r - 0.5) * 200 * fail, rot = (r - 0.5) * 2 * fail;
      const mx = (a2[0] + b2[0]) / 2, my = (a2[1] + b2[1]) / 2;
      const c = Math.cos(rot), s = Math.sin(rot);
      const tf = (pt) => [mx + dx + (pt[0] - mx) * c - (pt[1] - my) * s, my + dy + (pt[0] - mx) * s + (pt[1] - my) * c];
      a2 = tf(a2); b2 = tf(b2);
    }
    ctx.beginPath();
    ctx.moveTo(a2[0], a2[1]);
    ctx.lineTo(lerp(a2[0], b2[0], k), lerp(a2[1], b2[1], k));
    ctx.stroke();
  });
}

const CODE = ['span   = 8.0 m', 'rise   = 2.5 m', 'load   = 12 kN', 'solve(frame)', 'check(buckling)'];

Film.add('inherit', function (ctx, lt, t, frame) {
  // A — the book is closed and handed on
  const bookA = 1 - E.sine(seg(lt, 2.1, 2.7));
  if (bookA > 0) {
    ctx.save();
    ctx.globalAlpha = bookA;
    const slide = E.io(seg(lt, 1.0, 1.9));
    bookCam(ctx, lerp(80, 300, slide), lerp(0, 150, slide), 0.95);
    drawTable(ctx);
    const close = E.io(seg(lt, 0.15, 0.95));
    ctx.save();
    ctx.translate(0, slide * 260);
    if (close < 1) {
      drawSpread(ctx, 'vigL', 'vigR', 12, 0.35, null);
      const th = close * Math.PI, c = Math.cos(th);
      ctx.save();
      if (c > 0) {
        ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([c, 0, 0, 1, -PW * c, -PH / 2])));
        paperFill(ctx, 0, 0, PW, PH);
        ctx.fillStyle = `rgba(10,6,3,${0.5 * Math.sin(th)})`;
        ctx.fillRect(0, 0, PW, PH);
      } else {
        ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([-c, 0, 0, 1, 0, 0])));
        drawCover(ctx);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 20;
      drawCover(ctx);
      ctx.restore();
    }
    ctx.restore();
    beam(ctx, 260, 40, 0.62, 300, 0.8, lt + 90);
    // the elder's hand pushes the book forward
    const eA = E.out(seg(lt, 0.7, 1.0));
    if (eA > 0) finger(ctx, 330, -230 + slide * 260 - (1 - eA) * 400, 1.57, { w: 31, len: 560, age: 1, tone: '#5f4434', rim: 0.6 });
    // the child's finger reaches to take it
    const cA2 = E.out(seg(lt, 1.4, 2.0));
    if (cA2 > 0) finger(ctx, 250 - (1 - cA2) * 300, 560 + (1 - cA2) * 300, -0.9, { w: lerp(23, 31, seg(lt, 2.0, 2.6)), len: 480, age: 0, tone: '#83573f', rim: 0.8 });
    ctx.restore();
  }
  // B — years later: a new maker at a new surface
  const B = seg(lt, 2.1, 2.6);
  if (B > 0) {
    ctx.save();
    ctx.globalAlpha = E.sine(B);
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(143,179,220,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // attempts: A fails, B sags, C holds
    const phases = [
      { list: ARCH.A, draw: [2.6, 3.4], test: 4.0, fail: [4.15, 4.7], wipe: [4.7, 4.95] },
      { list: ARCH.B, draw: [4.95, 5.55], test: 5.6, sag: [5.7, 6.1], wipe: [6.2, 6.45] },
      { list: ARCH.C, draw: [6.45, 7.2], test: 7.25, holds: 7.4 },
    ];
    let tip = null;
    for (const ph of phases) {
      if (lt < ph.draw[0]) continue;
      if (ph.wipe && lt > ph.wipe[1]) continue;
      const p = seg(lt, ph.draw[0], ph.draw[1]);
      const fail = ph.fail ? E.in(seg(lt, ph.fail[0], ph.fail[1])) : 0;
      const sag = ph.sag ? E.out(seg(lt, ph.sag[0], ph.sag[1])) : 0;
      const built = seg(lt, ph.draw[1], ph.draw[1] + 0.3);
      const holds = ph.holds ? seg(lt, ph.holds, ph.holds + 0.5) : 0;
      ctx.save();
      if (ph.wipe) {
        const w = seg(lt, ph.wipe[0], ph.wipe[1]);
        if (w > 0) { ctx.beginPath(); ctx.rect(lerp(400, 1500, E.io(w)), 0, W, H); ctx.clip(); }
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = fail > 0 || sag > 0 ? mixHex('#c9d7e8', PAL.ember, Math.max(fail, sag)) : 'rgba(201,215,232,0.9)';
      ctx.lineWidth = lerp(1.6, 5, built);
      members(ctx, ph.list, p, lt, fail, 7, sag);
      if (holds > 0) glowStroke(ctx, () => members(ctx, ph.list, 1, lt, 0, 0, 0), PAL.gold, 3, holds);
      ctx.restore();
      if (p > 0 && p < 1) {
        const n = ph.list.length, i = Math.min(n - 1, Math.floor(p * n));
        const k = p * n - i;
        const [a, b] = ph.list[i];
        tip = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      }
      // the load test
      if (lt > ph.test && lt < ph.test + 1.2 && !holds) {
        const d = E.out(seg(lt, ph.test, ph.test + 0.25));
        ctx.strokeStyle = rgba(PAL.ember, 0.9);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(960, 300 + d * 120); ctx.lineTo(960, 440 + d * 120);
        ctx.moveTo(940, 420 + d * 120); ctx.lineTo(960, 445 + d * 120); ctx.lineTo(980, 420 + d * 120);
        ctx.stroke();
      }
      if (ph.holds && lt > ph.test) {
        const d = E.out(seg(lt, ph.test, ph.test + 0.25));
        ctx.strokeStyle = rgba(PAL.gold, 0.9);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(960, 300 + d * 120); ctx.lineTo(960, 440 + d * 120);
        ctx.moveTo(940, 420 + d * 120); ctx.lineTo(960, 445 + d * 120); ctx.lineTo(980, 420 + d * 120);
        ctx.stroke();
      }
    }
    // the working notes, typed
    const codeA = env(lt, 3.3, 3.5, 9.2, 9.8);
    if (codeA > 0) {
      CODE.forEach((line, i) => {
        const chars = Math.floor(clamp((lt - 3.35 - i * 0.12) * 50, 0, line.length));
        text(ctx, line.slice(0, chars), 1480, 320 + i * 40, 24, { family: '"DejaVu Sans Mono", Menlo, monospace', align: 'left', color: rgba('#9fc3e8', 0.8 * codeA) });
      });
      const res = lt > 7.45 ? 'PASS' : lt > 5.8 ? 'FAIL — deflection' : lt > 4.2 ? 'FAIL — collapse' : '';
      if (res) text(ctx, res, 1480, 540, 24, { family: '"DejaVu Sans Mono", Menlo, monospace', align: 'left', color: rgba(res === 'PASS' ? PAL.gold : PAL.ember, codeA) });
    }
    // the new adult hand, drawing
    const fx = tip ? tip[0] : 1500, fy = tip ? tip[1] : 980;
    const fingerA = 1 - seg(lt, 7.3, 7.8);
    if (fingerA > 0) {
      ctx.globalAlpha = E.sine(B) * fingerA;
      finger(ctx, lt < 2.7 ? lerp(W * 0.36, fx, seg(lt, 2.4, 2.7)) : fx, lt < 2.7 ? lerp(H * 0.62, fy, seg(lt, 2.4, 2.7)) : fy, -0.9, { w: 31, len: 560, age: 0.3, tone: '#6f4a36', rim: 0.7 });
      ctx.globalAlpha = E.sine(B);
    }
    // it works: the spark
    const sp = seg(lt, 7.5, 8.0);
    if (sp > 0) spark(ctx, ARCH.apex[0], ARCH.apex[1], 10 * E.out(sp) + Math.sin(lt * 4) * 1.5, E.out(sp));
    // and the maker looks at what they made
    const look = E.sine(seg(lt, 8.0, 8.8));
    if (look > 0) {
      ctx.globalAlpha = look;
      profileHead(ctx, 170, 700, 1.7, { color: '#020203', rim: 0.8, rimColor: PAL.gold });
    }
    ctx.restore();
  }
  vignette(ctx, 0.7);
});

// ---------------------------------------------------------------- THE CHAIN
const CHAIN = ['stone', 'column', 'arch', 'book', 'painting', 'telescope', 'equation', 'gear', 'engine', 'electricity', 'microscope', 'aircraft', 'rocket', 'transistor', 'network'];

Film.add('chain', function (ctx, lt) {
  ctx.fillStyle = '#030305';
  ctx.fillRect(0, 0, W, H);
  if (lt > 3.15) return; // everything stops
  const step = 0.2;
  const f = clamp((lt - 0.1) / step, 0, CHAIN.length - 1);
  const i = Math.floor(f), frac = f - i;
  const k = i < CHAIN.length - 1 ? E.io(clamp((frac - 0.35) / 0.65)) : 0;
  const a = SH.n[CHAIN[i]], b = SH.n[CHAIN[Math.min(i + 1, CHAIN.length - 1)]];
  const zoom = 1 + lt * 0.08;
  const shp = xform(morphShape(a, b, k), W / 2, H / 2 - 40, zoom);
  // light trails of what came before
  for (let j = Math.max(0, i - 3); j < i; j++) {
    ctx.save();
    ctx.globalAlpha = 0.12 * (1 - (i - j) / 4);
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 1;
    drawShape(ctx, xform(SH.n[CHAIN[j]], W / 2, H / 2 - 40, zoom * (1 + (i - j) * 0.25)));
    ctx.restore();
  }
  glowStroke(ctx, () => drawShape(ctx, shp), PAL.gold, 2.4, 1.2);
  const idx = k > 0.5 ? Math.min(i + 1, CHAIN.length - 1) : i;
  text(ctx, CHAIN[idx].toUpperCase(), W / 2, H / 2 + 330, 30, { family: FONT.cap, color: PAL.line, alpha: 1 - Math.sin(k * Math.PI) * 0.8, spacing: 14 });
  vignette(ctx, 0.7);
});

// ---------------------------------------------------------------- QUESTIONS
const GHOSTS = [
  { shape: 'arch', x: 150, y: -120, s: 0.5, a: 0.6, b: 2.4 },
  { shape: 'column', x: 440, y: 30, s: 0.45, a: 0.8, b: 2.4 },
  { shape: 'painting', x: 300, y: 200, s: 0.4, a: 1.0, b: 2.4 },
  { shape: 'telescope', x: 170, y: -160, s: 0.45, a: 2.5, b: 3.8 },
  { shape: 'gear', x: 430, y: 60, s: 0.4, a: 2.6, b: 3.8 },
  { shape: 'rocket', x: 280, y: 190, s: 0.4, a: 2.7, b: 3.8 },
];

function childPage(ctx, lt, fingerTip = true) {
  drawTable(ctx);
  drawSpread(ctx, 'blank', 'blank', 0, 0.3, null);
  beam(ctx, 260, 40, 0.62, 300, 0.9, lt + 200);
  if (fingerTip) finger(ctx, 140, 330, -0.9, { w: 23, len: 460, age: 0, tone: '#83573f', rim: 0.9 });
}

Film.add('questions', function (ctx, lt) {
  ctx.save();
  bookCam(ctx, 240 + noise1(lt * 0.3, 1) * 4, 60, 1.3);
  childPage(ctx, lt);
  // ghosts of those who came before
  for (const g of GHOSTS) {
    const a = env(lt, g.a, g.a + 0.4, g.b - 0.3, g.b);
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a * 0.8;
    glowStroke(ctx, () => shapeReveal(ctx, xform(SH.raw[g.shape], g.x, g.y, g.s), E.out(seg(lt, g.a, g.a + 0.6))), PAL.gold, 1.2, 0.7);
    ctx.restore();
  }
  // mistakes: crossed-out calculations, a machine that jams
  const m = env(lt, 3.8, 4.1, 5.0, 5.3);
  if (m > 0) {
    ctx.save();
    ctx.globalAlpha = m;
    const lines = ['x = 2πr²', 'F = mv', 'T ∝ a²'];
    lines.forEach((s, i) => {
      text(ctx, s, 300, -140 + i * 70, 40, { italic: true, color: rgba(PAL.gold, 0.8) });
      ctx.strokeStyle = rgba(PAL.ember, 0.8);
      ctx.lineWidth = 3;
      strokeReveal(ctx, [[200, -140 + i * 70], [400, -150 + i * 70]], E.out(seg(lt, 4.0 + i * 0.15, 4.2 + i * 0.15)));
    });
    const jam = Math.sin(lt * 70) * 0.03 * (lt > 4.3 ? 1 : 0);
    ctx.strokeStyle = rgba(PAL.gold, 0.7);
    ctx.lineWidth = 1.5;
    drawShape(ctx, [gearPts(300, 150, 70, 12, 0.18, 0.3 + jam), gearPts(400, 110, 44, 8, 0.2, -0.5 - jam)]);
    ctx.restore();
  }
  // the spark crosses the page, and settles at the child's fingertip
  const path = [[560, -300], [420, -160], [300, 0], [240, 150], [150, 318]];
  let sp = null, sa = 0;
  if (lt < 1.4) { sp = pointAt(path.slice(0, 3), E.io(seg(lt, 0.1, 1.3))); sa = env(lt, 0.1, 0.4, 1.1, 1.4); }
  else if (lt > 5.0) { sp = pointAt(path, E.io(seg(lt, 5.0, 6.3))); sa = E.out(seg(lt, 5.0, 5.3)); }
  if (sp) spark(ctx, sp[0], sp[1], 5 + (lt > 6.3 ? Math.sin(lt * 5) : 0), sa);
  ctx.restore();
  wash(ctx, '#000000', 1 - E.sine(seg(lt, 0.2, 0.7)));
  vignette(ctx, 0.7);
});

// ---------------------------------------------------------------- PULLBACK
const HOME = { lat: 41.9, lon: 12.5 };
const CITY = (function () {
  const r = rng(99), pts = [];
  for (let i = 0; i < 7000; i++) {
    const rad = Math.pow(r(), 0.7) * 1.6e7 * (0.5 + r());
    const q = r() * TAU;
    let x = Math.cos(q) * rad, y = Math.sin(q) * rad;
    if (r() < 0.7) { if (r() < 0.5) x = Math.round(x / 6e4) * 6e4; else y = Math.round(y / 6e4) * 6e4; }
    pts.push([x, y, r()]);
  }
  return pts;
})();

Film.add('pullback', function (ctx, lt) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const Z = 10 * E.sine(seg(lt, 0.3, 7.9));
  const z = 1.3 * Math.pow(10, -Z);
  const fx = 150, fy = 318; // the spark at the child's fingertip, in book units
  // stars
  const st = seg(Z, 7, 9);
  if (st > 0) { ctx.globalAlpha = st; ctx.drawImage(TEX.stars, 0, 0); ctx.globalAlpha = 1; }
  // room, desk and book
  const near = 1 - seg(Z, 2.4, 3.3);
  if (near > 0) {
    ctx.save();
    ctx.globalAlpha = near;
    bookCam(ctx, fx, fy, z);
    ctx.fillStyle = '#070605';
    ctx.fillRect(-9000, -7000, 18000, 14000);
    ctx.strokeStyle = 'rgba(90,70,50,0.25)';
    ctx.lineWidth = 60;
    ctx.strokeRect(-9000, -7000, 18000, 14000);
    ctx.fillStyle = 'rgba(80,60,40,0.08)';
    for (let i = -9; i < 9; i++) ctx.fillRect(i * 1000, -7000, 20, 14000);
    // window light on the floor
    ctx.fillStyle = 'rgba(255,200,130,0.1)';
    ctx.beginPath();
    ctx.moveTo(-9000, -3000); ctx.lineTo(-9000, 1000); ctx.lineTo(-2000, 2500); ctx.lineTo(-2000, -1500);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.rect(-1600, -1100, 3200, 2200);
    ctx.clip();
    drawTable(ctx);
    ctx.restore();
    const lamp = ctx.createRadialGradient(0, 0, 0, 0, 0, 3000);
    lamp.addColorStop(0, 'rgba(255,190,110,0.2)');
    lamp.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(-3000, -3000, 6000, 6000);
    drawSpread(ctx, 'blank', 'blank', 0, 0.3, null);
    beam(ctx, 260, 40, 0.62, 300, 0.9 * (1 - seg(Z, 0.5, 1.2)), lt + 300);
    finger(ctx, 140, 330, -0.9, { w: 23, len: 460, age: 0, tone: '#83573f', rim: 0.9 });
    ctx.restore();
  }
  // the city at night
  const cityA = seg(Z, 2.4, 3.2) * (1 - seg(Z, 6.2, 7.0));
  if (cityA > 0) {
    ctx.save();
    ctx.globalAlpha = cityA;
    const cx = W / 2, cy = H / 2;
    // our building, one lit window
    const bw = 4e4 * z;
    ctx.fillStyle = '#0c0b0a';
    ctx.fillRect(cx - bw / 2, cy - bw / 2, bw, bw);
    ctx.fillStyle = rgba(PAL.gold, 0.8);
    const rw = Math.max(2, 18000 * z);
    ctx.fillRect(cx - rw / 2, cy - rw / 2, rw, rw);
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, v] of CITY) {
      const sx = cx + x * z, sy = cy + y * z;
      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
      const s = Math.max(1.2, 3000 * z);
      ctx.fillStyle = rgba(v < 0.8 ? '#ffb45e' : '#fff0c8', 0.5 + v * 0.4);
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
    }
    ctx.restore();
  }
  // the Earth: our light is one among many
  const gA = seg(Z, 5.8, 6.8);
  if (gA > 0) {
    const R = 1.27e10 * z;
    if (R > 1.4) {
      drawGlobe(ctx, W / 2, H / 2 + (R > 3000 ? 0 : 0), R, HOME.lon, HOME.lat, { alpha: gA, lights: 1.6 });
    }
  }
  // the spark itself stays at the centre
  const sparkR = Z < 1 ? 5 : lerp(5, 3.5, seg(Z, 1, 9));
  spark(ctx, W / 2, H / 2, sparkR, 1);
  vignette(ctx, 0.6);
});

// ---------------------------------------------------------------- TITLE
Film.add('title', function (ctx, lt) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1 - seg(lt, 0, 1.5);
  ctx.drawImage(TEX.stars, 0, 0);
  ctx.globalAlpha = 1;
  const cy = H / 2 + 20;
  const lineW = E.io(seg(lt, 0.3, 1.6)) * 380;
  const ask = seg(lt, 7.6, 8.2);
  ctx.save();
  glowStroke(ctx, () => strokeReveal(ctx, [[W / 2 - lineW, cy], [W / 2 + lineW, cy]]), PAL.gold, 1.6, 1);
  ctx.restore();
  spark(ctx, W / 2, cy, lerp(4, 2, seg(lt, 0.3, 1.6)), 1 - seg(lt, 1.2, 2.2) * 0.6);
  const titleA = E.sine(seg(lt, 1.2, 3.0)) * (1 - E.sine(ask));
  if (titleA > 0) {
    const track = lerp(34, 20, E.out(seg(lt, 1.2, 4.0)));
    text(ctx, 'ACHIEVEMENTS', W / 2, cy - 130, 96, { family: FONT.cap, color: '#f2e6cc', alpha: titleA, spacing: track });
    text(ctx, 'OF WESTERN CIVILIZATION', W / 2, cy - 50, 44, { family: FONT.cap, color: '#e2d2b0', alpha: E.sine(seg(lt, 1.7, 3.3)) * (1 - E.sine(ask)), spacing: track * 0.6 });
  }
  const lines = [['INHERITED FROM THE PAST.', 3.9], ['ENTRUSTED TO THE PRESENT.', 4.8], ['BUILT FOR THE FUTURE.', 5.7]];
  lines.forEach(([s, a], i) => {
    const al = E.sine(seg(lt, a, a + 0.7)) * (1 - E.sine(ask));
    if (al > 0) text(ctx, s, W / 2, cy + 70 + i * 52, 28, { family: FONT.cap, color: i === 2 ? PAL.gold : '#d9ccb0', alpha: al, spacing: 9 });
  });
  const q = E.sine(seg(lt, 8.1, 9.0));
  if (q > 0) text(ctx, 'WHAT WILL WE ADD?', W / 2, cy - 64, 62, { family: FONT.cap, color: '#f6ead0', alpha: q, spacing: 16, glow: 0.35 * q, glowBlur: 30 });
  vignette(ctx, 0.55);
}, { fadeIn: 0.35 });
