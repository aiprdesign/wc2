/* THE INHERITANCE — shared drawings: the book, its pages, hands, figures. */
'use strict';

const PW = 600, PH = 800; // page size in book units
const INK = PAL.sepia;

function keyframes(keys, t, ease = E.io) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const k = ease((t - a[0]) / (b[0] - a[0]));
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
    }
  }
  return keys[keys.length - 1].slice(1);
}
function bookCam(ctx, fx, fy, z, rot = 0) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  if (rot) ctx.rotate(rot);
  ctx.translate(-fx, -fy);
}

// ---------- the table and the book ----------
function drawTable(ctx, ambient = 1) {
  ctx.save();
  ctx.fillStyle = '#0c0907';
  ctx.fillRect(-4000, -3000, 8000, 6000);
  ctx.strokeStyle = `rgba(90,60,35,${0.1 * ambient})`;
  ctx.lineWidth = 2;
  const r = rng(12);
  for (let i = 0; i < 70; i++) {
    const y = -1600 + i * 46 + r() * 20;
    ctx.beginPath();
    ctx.moveTo(-3000, y);
    for (let x = -3000; x <= 3000; x += 200) ctx.lineTo(x, y + Math.sin(x * 0.002 + i) * 12 + r() * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBookBase(ctx) {
  // cover board and page block edges
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#2b1a10';
  roundRect(ctx, -PW - 34, -PH / 2 - 30, PW * 2 + 68, PH + 60, 14);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3a2416';
  roundRect(ctx, -PW - 30, -PH / 2 - 26, PW * 2 + 60, PH + 52, 12);
  ctx.fill();
  // tooled gold border on the cover lip
  ctx.strokeStyle = 'rgba(200,150,70,0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, -PW - 22, -PH / 2 - 18, PW * 2 + 44, PH + 36, 8);
  ctx.stroke();
  // page block edges
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = `rgba(200,180,140,${0.35 - i * 0.04})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(-PW - 4 - i * 2, -PH / 2 + 3 + i, PW * 2 + 8 + i * 4, PH - 6 - i * 2);
  }
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function paperFill(ctx, x, y, w, h) {
  ctx.drawImage(TEX.paper, x, y, w, h);
}
// shade a page: dark near the gutter, bowing light across
function pageShade(ctx, x, y, side, dark = 0) {
  const g = ctx.createLinearGradient(side < 0 ? x + PW : x, 0, side < 0 ? x : x + PW, 0);
  g.addColorStop(0, 'rgba(40,24,10,0.55)');
  g.addColorStop(0.08, 'rgba(40,24,10,0.18)');
  g.addColorStop(0.3, 'rgba(40,24,10,0)');
  g.addColorStop(1, 'rgba(40,24,10,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, PW, PH);
  if (dark > 0) {
    ctx.fillStyle = `rgba(5,3,2,${dark})`;
    ctx.fillRect(x, y, PW, PH);
  }
}

// Draw a page's content in page-local coords (0..PW, 0..PH).
function drawPageContent(ctx, id, lt) {
  const f = PAGES[id];
  if (!f) return;
  ctx.save();
  ctx.strokeStyle = rgba(INK, 0.82);
  ctx.fillStyle = rgba(INK, 0.82);
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  f(ctx, lt || 0);
  ctx.restore();
}
function pageNumber(ctx, n, side) {
  text(ctx, n, side < 0 ? 60 : PW - 60, PH - 40, 18, { family: FONT.serif, color: rgba(INK, 0.6) });
}
function label(ctx, s, x, y, size = 20) {
  text(ctx, s, x, y, size, { family: FONT.serif, italic: true, color: rgba(INK, 0.75) });
}

// Euclid, Elements I.1 — the equilateral triangle on a given line.
function euclidShape(cx, cy, r) {
  const A = [cx - r / 2, cy], B = [cx + r / 2, cy], C = [cx, cy - (r * Math.sqrt(3)) / 2];
  return {
    A, B, C,
    strokes: [
      linePts(A[0], A[1], B[0], B[1], 12),
      circlePts(A[0], A[1], r, 90, 0, TAU),
      circlePts(B[0], B[1], r, 90, Math.PI, Math.PI + TAU),
      [A, C],
      [B, C],
    ],
  };
}

const PAGES = {
  text(ctx) {
    text(ctx, 'L', 88, 128, 86, { family: FONT.cap, color: rgba('#7a2a18', 0.8), align: 'center' });
    scriptLines(ctx, 132, 100, 400, 3, 30, 11, INK, 0.45);
    scriptLines(ctx, 70, 190, 460, 17, 30, 12, INK, 0.45);
    pageNumber(ctx, 'xii', -1);
  },
  tinyGeo(ctx) {
    scriptLines(ctx, 70, 100, 460, 8, 30, 21, INK, 0.45);
    const e = euclidShape(300, 470, 76);
    ctx.lineWidth = 1.3;
    e.strokes.forEach((s) => strokeReveal(ctx, s, 1));
    label(ctx, 'A', e.A[0] - 14, e.A[1] + 14, 15);
    label(ctx, 'B', e.B[0] + 14, e.B[1] + 14, 15);
    label(ctx, 'C', e.C[0], e.C[1] - 14, 15);
    scriptLines(ctx, 70, 600, 460, 5, 30, 22, INK, 0.45);
    pageNumber(ctx, 'xiii', 1);
  },
  geometry(ctx) {
    const e = euclidShape(300, 300, 190);
    e.strokes.forEach((s) => strokeReveal(ctx, s, 1));
    // inscribed pentagon and golden section
    const pg = [];
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 5;
      pg.push([300 + Math.cos(a) * 70, 250 + Math.sin(a) * 70]);
    }
    strokeReveal(ctx, pg);
    strokeReveal(ctx, circlePts(300, 250, 70, 60));
    // golden rectangle with spiral
    let x = 120, y = 560, w = 360, h = w / PHI;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    let sx = x, sy = y, sw = w, sh = h, dir = 0;
    for (let i = 0; i < 7; i++) {
      const s = Math.min(sw, sh);
      if (dir === 0) { ctx.moveTo(sx + s, sy); ctx.lineTo(sx + s, sy + sh); ctx.moveTo(sx + s, sy + s); ctx.arc(sx + s, sy + s, s, Math.PI, Math.PI * 1.5); sx += s; sw -= s; }
      else if (dir === 1) { ctx.moveTo(sx, sy + s); ctx.lineTo(sx + sw, sy + s); ctx.moveTo(sx + sw - s, sy + s); ctx.arc(sx + sw - s, sy + s, s, -Math.PI / 2, 0); sy += s; sh -= s; }
      else if (dir === 2) { ctx.moveTo(sx + sw - s, sy); ctx.lineTo(sx + sw - s, sy + sh); ctx.moveTo(sx + sw - s, sy + sh - s); ctx.arc(sx + sw - s, sy + sh - s, s, 0, Math.PI / 2); sw -= s; }
      else { ctx.moveTo(sx, sy + sh - s); ctx.lineTo(sx + sw, sy + sh - s); ctx.moveTo(sx + s, sy + sh - s); ctx.arc(sx + s, sy + sh - s, s, Math.PI / 2, Math.PI); sh -= s; }
      dir = (dir + 1) % 4;
    }
    ctx.stroke();
    label(ctx, 'A', e.A[0] - 18, e.A[1] + 18);
    label(ctx, 'B', e.B[0] + 18, e.B[1] + 18);
    label(ctx, 'C', e.C[0], e.C[1] - 18);
    text(ctx, 'PROP. I.', 300, 60, 22, { family: FONT.cap, color: rgba(INK, 0.7) });
  },
  architecture(ctx) {
    text(ctx, 'DE ARCHITECTURA', 300, 60, 20, { family: FONT.cap, color: rgba(INK, 0.7) });
    const bx = 90, by = 520, bw = 420;
    // stylobate steps
    for (let i = 0; i < 3; i++) ctx.strokeRect(bx - 20 + i * 8, by + 30 - i * 12, bw + 40 - i * 16, 12);
    // columns
    for (let i = 0; i < 6; i++) {
      const cx = bx + 20 + i * ((bw - 40) / 5);
      ctx.strokeRect(cx - 16, by - 230, 32, 230);
      ctx.beginPath();
      for (let k = -1; k <= 1; k++) { ctx.moveTo(cx + k * 8, by - 226); ctx.lineTo(cx + k * 8, by - 4); }
      ctx.stroke();
      ctx.strokeRect(cx - 24, by - 244, 48, 14);
    }
    // entablature and pediment
    ctx.strokeRect(bx - 10, by - 290, bw + 20, 46);
    ctx.beginPath();
    ctx.moveTo(bx - 16, by - 290);
    ctx.lineTo(300, by - 380);
    ctx.lineTo(bx + bw + 16, by - 290);
    ctx.closePath();
    ctx.stroke();
    // proportion circle
    ctx.save();
    ctx.setLineDash([4, 6]);
    strokeReveal(ctx, circlePts(300, by - 150, 230, 90));
    ctx.restore();
    scriptLines(ctx, 70, 640, 460, 4, 30, 31, INK, 0.45);
  },
  astronomy(ctx) {
    text(ctx, 'SYSTEMA MUNDI', 300, 60, 20, { family: FONT.cap, color: rgba(INK, 0.7) });
    const cx = 300, cy = 330;
    for (let i = 1; i <= 6; i++) strokeReveal(ctx, circlePts(cx, cy, 30 + i * 36, 90));
    strokeReveal(ctx, ellipsePts(cx, cy, 250, 70, 90, -0.4));
    strokeReveal(ctx, ellipsePts(cx, cy, 250, 70, 90, 0.4));
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = i * 1.3 + 0.4, rr = 30 + (i + 1) * 36;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 5, 0, TAU);
      ctx.fill();
    }
    // moon phases
    for (let i = 0; i < 6; i++) {
      const x = 110 + i * 76, y = 650;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y, Math.abs(Math.cos((i / 5) * Math.PI)) * 20, 20, 0, -Math.PI / 2, Math.PI / 2, i < 3);
      ctx.arc(x, y, 20, Math.PI / 2, -Math.PI / 2, false);
      ctx.fill();
    }
  },
  anatomy(ctx) {
    text(ctx, 'DE HUMANI CORPORIS', 300, 60, 20, { family: FONT.cap, color: rgba(INK, 0.7) });
    // eye in section with light rays
    const cx = 300, cy = 270;
    strokeReveal(ctx, circlePts(cx, cy, 120, 90));
    strokeReveal(ctx, ellipsePts(cx - 92, cy, 26, 58, 40));
    strokeReveal(ctx, circlePts(cx - 60, cy, 150, 40, -0.55, 0.55));
    ctx.beginPath();
    ctx.moveTo(cx + 118, cy - 20);
    ctx.bezierCurveTo(cx + 170, cy - 30, cx + 200, cy, cx + 250, cy - 6);
    ctx.moveTo(cx + 118, cy + 20);
    ctx.bezierCurveTo(cx + 170, cy + 30, cx + 200, cy + 14, cx + 250, cy + 22);
    ctx.stroke();
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(40, cy - 60); ctx.lineTo(cx - 92, cy - 30); ctx.lineTo(cx + 116, cy + 30);
    ctx.moveTo(40, cy + 60); ctx.lineTo(cx - 92, cy + 30); ctx.lineTo(cx + 116, cy - 30);
    ctx.stroke();
    ctx.restore();
    // heart
    heartPath(ctx, 300, 600, 1.1);
    ctx.stroke();
    scriptLines(ctx, 70, 740, 460, 1, 30, 41, INK, 0.45);
  },
  machinery(ctx) {
    text(ctx, 'MACHINAE', 300, 60, 20, { family: FONT.cap, color: rgba(INK, 0.7) });
    strokeReveal(ctx, gearPts(220, 260, 110, 18, 0.14, 0.1));
    strokeReveal(ctx, circlePts(220, 260, 22, 30));
    strokeReveal(ctx, gearPts(390, 200, 64, 11, 0.18, 0.3));
    strokeReveal(ctx, circlePts(390, 200, 14, 24));
    // Archimedean screw
    ctx.strokeRect(100, 470, 400, 70);
    ctx.beginPath();
    for (let x = 100; x <= 500; x += 2) {
      const y = 505 + Math.sin((x - 100) * 0.06) * 35;
      if (x === 100) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // lever
    ctx.beginPath();
    ctx.moveTo(100, 660); ctx.lineTo(500, 610);
    ctx.moveTo(360, 628); ctx.lineTo(340, 680); ctx.lineTo(380, 680); ctx.closePath();
    ctx.stroke();
    ctx.strokeRect(110, 620, 40, 40);
  },
  blank() {},
};

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + 90 * s);
  ctx.bezierCurveTo(cx - 40 * s, cy + 60 * s, cx - 110 * s, cy + 10 * s, cx - 95 * s, cy - 45 * s);
  ctx.bezierCurveTo(cx - 82 * s, cy - 95 * s, cx - 25 * s, cy - 95 * s, cx - 5 * s, cy - 55 * s);
  ctx.bezierCurveTo(cx + 20 * s, cy - 100 * s, cx + 90 * s, cy - 90 * s, cx + 95 * s, cy - 35 * s);
  ctx.bezierCurveTo(cx + 100 * s, cy + 20 * s, cx + 40 * s, cy + 60 * s, cx, cy + 90 * s);
  // vessels
  ctx.moveTo(cx - 30 * s, cy - 75 * s);
  ctx.bezierCurveTo(cx - 35 * s, cy - 120 * s, cx - 10 * s, cy - 140 * s, cx + 25 * s, cy - 135 * s);
  ctx.moveTo(cx + 20 * s, cy - 80 * s);
  ctx.lineTo(cx + 26 * s, cy - 125 * s);
  ctx.moveTo(cx - 60 * s, cy - 70 * s);
  ctx.lineTo(cx - 75 * s, cy - 118 * s);
}

// A book spread with an optional page turning from right to left.
// pages: [leftId, rightId]; turn: {p: 0..1, front, back, under}
function drawSpread(ctx, left, right, lt, dark = 0, turn = null) {
  drawBookBase(ctx);
  const L = -PW, T0 = -PH / 2;
  paperFill(ctx, L, T0, PW, PH);
  ctx.save(); ctx.translate(L, T0); drawPageContent(ctx, left, lt); ctx.restore();
  pageShade(ctx, L, T0, -1, dark);
  const rid = turn ? turn.under : right;
  paperFill(ctx, 0, T0, PW, PH);
  ctx.save(); ctx.translate(0, T0); drawPageContent(ctx, rid, lt); ctx.restore();
  pageShade(ctx, 0, T0, 1, dark);
  if (turn && turn.p > 0 && turn.p < 1) {
    const th = E.io(turn.p) * Math.PI, c = Math.cos(th), s = Math.sin(th);
    const lift = s * 40;
    ctx.save();
    // shadow cast by the lifted page
    ctx.fillStyle = `rgba(0,0,0,${0.25 * s})`;
    ctx.fillRect(c > 0 ? 0 : c * PW, T0, Math.abs(c) * PW + 30 * s, PH);
    if (c >= 0) {
      ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([c, -s * 0.07, 0, 1, 0, T0 - lift * 0.2])));
      paperFill(ctx, 0, 0, PW, PH);
      drawPageContent(ctx, turn.front, lt);
      ctx.fillStyle = `rgba(20,12,6,${0.45 * s})`;
      ctx.fillRect(0, 0, PW, PH);
    } else {
      const ac = -c;
      ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([ac, s * 0.07, 0, 1, -ac * PW, T0 - lift * 0.2 - s * 0.07 * 0])));
      paperFill(ctx, 0, 0, PW, PH);
      drawPageContent(ctx, turn.back, lt);
      ctx.fillStyle = `rgba(20,12,6,${0.4 * s})`;
      ctx.fillRect(0, 0, PW, PH);
    }
    ctx.restore();
  }
  // gutter
  const g = ctx.createLinearGradient(-40, 0, 40, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, 'rgba(20,10,4,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-40, T0, 80, PH);
}

// A warm beam of light crossing the scene, in the current coordinate frame.
function beam(ctx, cx, cy, angle, width, a, t, dustA = 1) {
  if (a <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
  g.addColorStop(0, rgba('#ffb35a', 0));
  g.addColorStop(0.35, rgba('#ffb35a', 0.2 * a));
  g.addColorStop(0.5, rgba('#ffd08a', 0.28 * a));
  g.addColorStop(0.65, rgba('#ffb35a', 0.2 * a));
  g.addColorStop(1, rgba('#ffb35a', 0));
  ctx.fillStyle = g;
  ctx.fillRect(-2600, -width / 2, 5200, width);
  dust(ctx, t, 90, [-900, -width / 2, 1800, width], 3, a * dustA);
  ctx.restore();
}

// ---------- hands ----------
// A finger seen from above. tip at (x,y) pointing along `ang`.
function finger(ctx, x, y, ang, opts = {}) {
  const len = opts.len || 520, w = opts.w || 34, age = opts.age || 0;
  const tone = opts.tone || '#6a4531';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // finger points along +x; base at -len
  const path = new Path2D();
  const tipR = w * 0.5;
  path.moveTo(-len, -w * 1.8);
  path.bezierCurveTo(-len * 0.55, -w * 0.9, -len * 0.3, -w * 0.52, -tipR, -w * 0.47);
  path.arc(0 - tipR * 0.9, 0, tipR * 1.02, -Math.PI / 2 - 0.12, Math.PI / 2 + 0.12);
  path.bezierCurveTo(-len * 0.3, w * 0.55, -len * 0.55, w * 0.95, -len, w * 2.1);
  path.closePath();
  // cast shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetX = 18;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = tone;
  ctx.fill(path);
  ctx.restore();
  // form shading across the width
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, 'rgba(10,5,2,0.75)');
  g.addColorStop(0.3, 'rgba(10,5,2,0.1)');
  g.addColorStop(0.55, 'rgba(255,220,180,0.08)');
  g.addColorStop(1, 'rgba(10,5,2,0.7)');
  ctx.fillStyle = g;
  ctx.fill(path);
  // falloff toward the hand (out of the light)
  const g2 = ctx.createLinearGradient(-len, 0, 0, 0);
  g2.addColorStop(0, 'rgba(8,5,3,0.9)');
  g2.addColorStop(0.6, 'rgba(8,5,3,0.25)');
  g2.addColorStop(1, 'rgba(8,5,3,0)');
  ctx.fillStyle = g2;
  ctx.fill(path);
  // nail
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = age > 0.5 ? 'rgba(210,180,150,0.35)' : 'rgba(235,200,180,0.35)';
  ctx.beginPath();
  ctx.ellipse(-tipR * 1.1, 0, tipR * 0.95, w * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,10,0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // knuckle creases
  ctx.strokeStyle = `rgba(30,15,8,${0.25 + age * 0.35})`;
  const creases = age > 0.5 ? 7 : 3;
  for (let k = 0; k < creases; k++) {
    const cx = -w * 3.1 - k * (age > 0.5 ? 5 : 7);
    ctx.beginPath();
    ctx.moveTo(cx, -w * 0.3);
    ctx.quadraticCurveTo(cx - 6, 0, cx, w * 0.3);
    ctx.stroke();
  }
  for (let k = 0; k < creases - 1; k++) {
    const cx = -w * 6.2 - k * 5;
    ctx.beginPath();
    ctx.moveTo(cx, -w * 0.35);
    ctx.quadraticCurveTo(cx - 5, 0, cx, w * 0.35);
    ctx.stroke();
  }
  ctx.restore();
  // warm rim light on the upper edge
  if (opts.rim) {
    ctx.save();
    ctx.clip(path);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(PAL.gold, 0.5 * opts.rim);
    ctx.lineWidth = 3;
    ctx.stroke(path);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- figures ----------
// Standing person in silhouette, feet at (x,y), height h. phase animates walking.
function person(ctx, x, y, h, phase = 0, walking = 0, color = '#0b0a0c', dir = 1) {
  const s = h / 170;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.fillStyle = color;
  const sw = Math.sin(phase) * 18 * walking;
  // legs
  ctx.beginPath();
  ctx.moveTo(-6, -80); ctx.lineTo(-10 + sw, 0); ctx.lineTo(-2 + sw, 0); ctx.lineTo(2, -78);
  ctx.moveTo(6, -80); ctx.lineTo(10 - sw, 0); ctx.lineTo(2 - sw, 0); ctx.lineTo(-2, -78);
  ctx.fill();
  // body (a mantle / coat)
  ctx.beginPath();
  ctx.moveTo(-16, -138);
  ctx.quadraticCurveTo(-22, -110, -18, -70);
  ctx.lineTo(18, -70);
  ctx.quadraticCurveTo(22, -110, 16, -138);
  ctx.quadraticCurveTo(0, -146, -16, -138);
  ctx.fill();
  // arms
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-15, -132); ctx.lineTo(-19 - sw * 0.6, -86);
  ctx.moveTo(15, -132); ctx.lineTo(19 + sw * 0.6, -86);
  ctx.stroke();
  // head
  ctx.beginPath();
  ctx.arc(0, -156, 12, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Head-and-shoulders profile facing right. Returns eye position.
function profileHead(ctx, x, y, s, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const p = new Path2D();
  // from back of neck, over the crown, down the face
  p.moveTo(-120, 260);
  p.bezierCurveTo(-110, 200, -60, 170, -70, 110);
  p.bezierCurveTo(-110, 90, -120, 20, -105, -40);
  p.bezierCurveTo(-90, -120, -10, -150, 45, -120);
  p.bezierCurveTo(80, -100, 92, -60, 92, -30);
  p.bezierCurveTo(93, -10, 98, 0, 108, 18); // brow to nose
  p.bezierCurveTo(118, 34, 122, 44, 112, 50);
  p.bezierCurveTo(106, 54, 100, 54, 98, 58);
  p.bezierCurveTo(104, 66, 100, 72, 97, 76); // lips
  p.bezierCurveTo(102, 82, 98, 90, 92, 94);
  p.bezierCurveTo(94, 112, 84, 124, 60, 126); // chin
  p.bezierCurveTo(40, 128, 30, 140, 28, 170);
  p.bezierCurveTo(60, 200, 140, 220, 190, 262);
  p.closePath();
  if (opts.fill !== false) {
    ctx.fillStyle = opts.color || '#07070a';
    ctx.fill(p);
  }
  if (opts.rim) {
    ctx.save();
    ctx.clip(p);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(opts.rimColor || PAL.gold, opts.rim);
    ctx.lineWidth = 5 / s;
    ctx.translate(-3, 0);
    ctx.stroke(p);
    ctx.restore();
  }
  if (opts.stroke) {
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = (opts.lw || 2) / s;
    ctx.stroke(p);
  }
  ctx.restore();
  return [x + 62 * s, y - 18 * s];
}
// The same profile as a point list for morphing and reveals.
function profileShape(x, y, s) {
  const pts = [];
  const segs = [
    [[-120, 260], [-110, 200], [-60, 170], [-70, 110]],
    [[-70, 110], [-110, 90], [-120, 20], [-105, -40]],
    [[-105, -40], [-90, -120], [-10, -150], [45, -120]],
    [[45, -120], [80, -100], [92, -60], [92, -30]],
    [[92, -30], [93, -10], [98, 0], [108, 18]],
    [[108, 18], [118, 34], [122, 44], [112, 50]],
    [[112, 50], [106, 54], [100, 54], [98, 58]],
    [[98, 58], [104, 66], [100, 72], [97, 76]],
    [[97, 76], [102, 82], [98, 90], [92, 94]],
    [[92, 94], [94, 112], [84, 124], [60, 126]],
    [[60, 126], [40, 128], [30, 140], [28, 170]],
    [[28, 170], [60, 200], [140, 220], [190, 262]],
  ];
  for (const [a, b, c, d] of segs)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t;
      pts.push([
        x + s * (u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0]),
        y + s * (u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]),
      ]);
    }
  return pts;
}
