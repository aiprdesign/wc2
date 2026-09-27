/* THE INHERITANCE — Act II: beauty, science, industry. */
'use strict';

// ---------------------------------------------------------------- BEAUTY
const BEAUTY = (function () {
  const cx = W / 2 - 40, cy = H / 2 + 10;
  const prof = profileShape(0, 0, 1);
  // dome of a cathedral, as one outline for morphing
  const dome = [];
  const push = (x, y) => dome.push([x, y]);
  push(-260, 250); push(-260, 90); push(-230, 90); push(-230, 40);
  for (let i = 0; i <= 40; i++) {
    const q = Math.PI + (i / 40) * (Math.PI / 2);
    push(Math.cos(q) * 230 * (1 - 0.1 * Math.sin(i / 40 * Math.PI)), 40 + Math.sin(q) * 260);
  }
  push(-30, -225); push(-26, -290); push(0, -318); push(26, -290); push(30, -225);
  for (let i = 0; i <= 40; i++) {
    const q = Math.PI * 1.5 + (i / 40) * (Math.PI / 2);
    push(Math.cos(q) * 230 * (1 - 0.1 * Math.sin((1 - i / 40) * Math.PI)), 40 + Math.sin(q) * 260);
  }
  push(230, 40); push(230, 90); push(260, 90); push(260, 250);
  const r = rng(515);
  const strokes = [];
  for (let i = 0; i < 520; i++) {
    const y = -300 + r() * 600, x = -390 + r() * 780;
    const top = (y + 300) / 600;
    const col = top < 0.55 ? mixHex('#f3c46e', '#c8553a', top / 0.55 * r()) : mixHex('#2c4a6e', '#16263c', r());
    strokes.push({ x, y, a: -0.2 + r() * 0.4, l: 30 + r() * 70, w: 6 + r() * 12, col, d: r() });
  }
  const notes = [];
  for (let i = 0; i < 40; i++) notes.push({ x: i * 95 + r() * 30, line: Math.floor(r() * 9) - 1, stem: r() < 0.5 });
  const smudges = [];
  for (let i = 0; i < 26; i++) {
    const side = r() < 0.5 ? -1 : 1;
    smudges.push({ x: W / 2 + side * (470 + r() * 280), y: 180 + r() * 720, s: 10 + r() * 36, col: ['#b8782a', '#9b2e1e', '#233f7a', '#3e6b52', '#d9b25c'][Math.floor(r() * 5)], d: r() });
  }
  return { cx, cy, prof: resample(prof, 220), dome: resample(dome, 220), strokes, notes, smudges };
})();

function wobble(pts, amt, seed, sx = 1, sy = 1, dx = 0, dy = 0) {
  return pts.map(([x, y], i) => [x * sx + dx + noise1(i * 0.05, seed) * amt, y * sy + dy + noise1(i * 0.05 + 30, seed) * amt]);
}

Film.add('beauty', function (ctx, lt) {
  const B = BEAUTY;
  ctx.fillStyle = '#070504';
  ctx.fillRect(0, 0, W, H);
  const deskA = 1 - E.sine(seg(lt, 2.7, 3.4));
  const S = 1.3;
  if (deskA > 0) {
    ctx.save();
    ctx.globalAlpha = deskA;
    ctx.translate(W / 2, H / 2);
    const push = 1 + lt * 0.03;
    ctx.scale(push, push);
    ctx.translate(-W / 2, -H / 2);
    drawTable(ctx, 1.2);
    // lamp pool
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 900);
    g.addColorStop(0, 'rgba(255,190,110,0.25)');
    g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // paint on the desk and fingers' marks
    for (const s of B.smudges) {
      const a = E.out(seg(lt, 0.4 + s.d * 1.6, 0.7 + s.d * 1.6));
      if (a <= 0) continue;
      ctx.fillStyle = rgba(s.col, 0.7 * a);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.s, s.s * 0.6, s.d * 3, 0, TAU);
      ctx.fill();
    }
    // the bird lands and unfolds into a sheet
    const land = E.io(seg(lt, 0, 0.75));
    const unfold = E.io(seg(lt, 0.6, 1.05));
    const sw = 420, sh = 300;
    if (unfold < 1) {
      const s = lerp(180, 70, land);
      const flap = Math.sin(lt * 9) * (1 - land);
      const bird = [[0, -s * 0.5], [s * 1.5, -s * 0.45 * flap], [s * 0.15, s * 0.1], [0, s * 0.6], [-s * 0.15, s * 0.1], [-s * 1.5, -s * 0.45 * flap]];
      const rect = [[0, -sh], [sw, -sh], [sw, sh], [0, sh], [-sw, sh], [-sw, -sh]];
      ctx.fillStyle = '#efe2c4';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      bird.forEach((p, i) => {
        const x = W / 2 + lerp(p[0], rect[i][0], unfold), y = H / 2 + lerp(p[1], rect[i][1], unfold);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 40;
      ctx.drawImage(TEX.paper, W / 2 - sw, H / 2 - sh, sw * 2, sh * 2);
      ctx.restore();
      // rejected studies in the margins
      const studies = [[W / 2 - 330, H / 2 - 200], [W / 2 + 320, H / 2 - 210], [W / 2 - 330, H / 2 + 200], [W / 2 + 330, H / 2 + 190]];
      studies.forEach(([x, y], i) => {
        const a = seg(lt, 1.1 + i * 0.3, 1.4 + i * 0.3);
        if (a <= 0) return;
        ctx.save();
        ctx.strokeStyle = rgba(INK, 0.55);
        ctx.lineWidth = 1.2;
        strokeReveal(ctx, wobble(profileShape(0, 0, 0.22), 2, 40 + i, 1, 1, x, y), a);
        if (i % 2 === 0) {
          ctx.strokeStyle = rgba('#7a2a18', 0.6);
          strokeReveal(ctx, [[x - 40, y - 50], [x + 40, y + 50]], seg(lt, 1.4 + i * 0.3, 1.55 + i * 0.3));
        }
        ctx.restore();
      });
      // attempts, erased; then the confident line
      const tries = [
        { a: 1.05, b: 1.45, e: 1.5, amt: 10, sx: 1.12, sy: 0.92, dx: 14, seed: 3 },
        { a: 1.55, b: 1.95, e: 2.0, amt: 7, sx: 0.9, sy: 1.08, dx: -10, seed: 5 },
      ];
      ctx.save();
      ctx.translate(B.cx, B.cy);
      for (const tr of tries) {
        const p = seg(lt, tr.a, tr.b);
        if (p <= 0) continue;
        const erased = seg(lt, tr.e, tr.e + 0.15);
        ctx.strokeStyle = rgba('#1c140d', lerp(0.8, 0.1, erased));
        ctx.lineWidth = lerp(2.2, 8, erased);
        strokeReveal(ctx, wobble(B.prof, tr.amt, tr.seed, S * tr.sx, S * tr.sy, tr.dx), p);
      }
      const fin = E.io(seg(lt, 2.05, 2.6));
      if (fin > 0) {
        const pts = B.prof.map(([x, y]) => [x * S, y * S]);
        ctx.strokeStyle = rgba('#1c140d', 0.9);
        ctx.lineWidth = 2.6;
        strokeReveal(ctx, pts, fin);
        const breakthrough = seg(lt, 2.55, 2.9);
        if (breakthrough > 0) glowStroke(ctx, () => strokeReveal(ctx, pts, 1), PAL.gold, 2.4, breakthrough);
        if (fin < 1) {
          const [px, py] = pointAt(pts, fin);
          ctx.fillStyle = '#0d0907';
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.7);
          ctx.fillRect(-7, -260, 14, 260);
          ctx.restore();
        }
      }
      // the active charcoal on attempts
      for (const tr of tries) {
        const p = seg(lt, tr.a, tr.b);
        if (p <= 0 || p >= 1) continue;
        const [px, py] = pointAt(wobble(B.prof, tr.amt, tr.seed, S * tr.sx, S * tr.sy, tr.dx), p);
        ctx.fillStyle = '#0d0907';
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.7);
        ctx.fillRect(-7, -260, 14, 260);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // sculpture: the drawing rises into marble
  const rise = E.io(seg(lt, 2.7, 3.5));
  const toDome = E.io(seg(lt, 4.15, 4.95));
  if (rise > 0 && lt < 5.2) {
    const phi = lerp(-0.55, 0.55, E.sine(seg(lt, 2.7, 4.3)));
    const sq = Math.cos(phi) * lerp(1, 0.9, toDome);
    const pts = B.prof.map((p, i) => {
      const x = lerp(p[0] * S, B.dome[i][0] * 1.25, toDome), y = lerp(p[1] * S - 20 * rise, B.dome[i][1] * 1.25 - 40, toDome);
      return [B.cx + (x * sq), B.cy + y];
    });
    ctx.save();
    // pedestal light
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 800);
    g.addColorStop(0, rgba('#ffe2b0', 0.16 * rise));
    g.addColorStop(1, rgba('#ffe2b0', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    const lx = B.cx + Math.sin(phi) * 300;
    const mg = ctx.createLinearGradient(lx - 400, 0, lx + 400, 0);
    mg.addColorStop(0, '#6f675c');
    mg.addColorStop(0.55, '#f1ebe0');
    mg.addColorStop(1, '#8c8478');
    ctx.globalAlpha = rise * (1 - toDome * 0.85);
    ctx.fillStyle = mg;
    ctx.fill();
    // veins in the marble
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(120,110,100,0.25)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(B.cx - 300, B.cy - 300 + i * 80);
      ctx.bezierCurveTo(B.cx - 100, B.cy - 260 + i * 90, B.cx + 50, B.cy - 340 + i * 85, B.cx + 300, B.cy - 250 + i * 80);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    glowStroke(ctx, () => strokeReveal(ctx, pts), PAL.gold, 1.6, 0.25 + 0.75 * toDome);
    // plinth
    ctx.globalAlpha = rise * (1 - toDome);
    ctx.fillStyle = '#2a2622';
    ctx.fillRect(B.cx - 220 * sq, B.cy + 345, 440 * sq, 60);
    ctx.restore();
  }

  // architecture: dome details, then painting, notation, the hall
  const domeA = env(lt, 4.7, 5.0, 5.6, 5.95);
  const paint = seg(lt, 4.95, 5.7);
  const frameA = env(lt, 4.95, 5.2, 5.75, 6.0);
  if (frameA > 0 || domeA > 0) {
    ctx.save();
    const fw = 420, fh = 330;
    // painterly strokes
    if (paint > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(W / 2 - fw, H / 2 - fh, fw * 2, fh * 2);
      ctx.clip();
      ctx.globalAlpha = frameA;
      ctx.lineCap = 'round';
      for (const s of B.strokes) {
        const k = clamp((paint - s.d * 0.7) / 0.3);
        if (k <= 0) continue;
        ctx.strokeStyle = rgba(s.col, 0.8 * k);
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(W / 2 + s.x, H / 2 + s.y);
        ctx.lineTo(W / 2 + s.x + Math.cos(s.a) * s.l * k, H / 2 + s.y + Math.sin(s.a) * s.l * k);
        ctx.stroke();
      }
      ctx.restore();
    }
    // dome drawing
    if (domeA > 0 || paint > 0) {
      const dA = Math.max(domeA, frameA);
      ctx.save();
      ctx.translate(B.cx, B.cy - 40);
      ctx.scale(1.25, 1.25);
      ctx.fillStyle = rgba('#0c0a08', 0.85 * seg(lt, 5.0, 5.5) * dA);
      ctx.beginPath();
      B.dome.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.fill();
      ctx.strokeStyle = rgba(PAL.gold, 0.8 * dA);
      ctx.lineWidth = 1.4;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 60, 40);
        ctx.quadraticCurveTo(i * 45, -150, 0, -222);
        ctx.stroke();
      }
      for (let i = -4; i <= 4; i++) ctx.strokeRect(i * 50 - 10, 50, 20, 30);
      ctx.restore();
    }
    // gilt frame
    if (frameA > 0) {
      const grow = E.out(seg(lt, 4.95, 5.3));
      ctx.globalAlpha = frameA;
      ctx.strokeStyle = '#b8903f';
      ctx.lineWidth = 30;
      ctx.strokeRect(W / 2 - fw * grow - 15, H / 2 - fh * grow - 15, fw * 2 * grow + 30, fh * 2 * grow + 30);
      ctx.strokeStyle = '#f1d38a';
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - fw * grow - 28, H / 2 - fh * grow - 28, fw * 2 * grow + 56, fh * 2 * grow + 56);
      ctx.strokeRect(W / 2 - fw * grow - 2, H / 2 - fh * grow - 2, fw * 2 * grow + 4, fh * 2 * grow + 4);
    }
    ctx.restore();
  }

  // notation, then the concert hall
  const staffA = E.sine(seg(lt, 5.65, 6.0));
  if (staffA > 0) {
    const bend = E.io(seg(lt, 6.45, 7.2));
    const hall = seg(lt, 6.5, 8);
    ctx.save();
    if (hall > 0) {
      // warm hall light
      const g = ctx.createRadialGradient(W / 2, H * 0.75, 0, W / 2, H * 0.75, 1000);
      g.addColorStop(0, rgba('#ffc47a', 0.3 * hall));
      g.addColorStop(1, rgba('#ffc47a', 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y0 = H / 2 - 120 + i * 60;
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const x = lerp(-100, W + 100, k / 60);
        const u = (x - W / 2) / (W / 2);
        // the staff bends into the tiers of a horseshoe hall
        const tierY = 150 + i * 95 + (1 - Math.sqrt(Math.max(0, 1 - u * u * 0.8))) * (300 - i * 20);
        pts.push([x, lerp(y0, tierY, bend)]);
      }
      glowStroke(ctx, () => strokeReveal(ctx, pts, E.io(seg(lt, 5.65 + i * 0.05, 6.0 + i * 0.05))), PAL.gold, 1.6, 0.6 * staffA);
      if (bend > 0.3) {
        // audience along each tier
        for (let k = 3; k < 58; k += 2) {
          const [x, y] = pts[k];
          spark(ctx, x, y - 8, 1.5, 0.5 * seg(bend, 0.3, 1));
        }
      }
    }
    // notes flowing across the staff
    const flow = 1 - bend;
    if (flow > 0) {
      for (const n of B.notes) {
        const x = ((n.x - (lt - 5.6) * 900) % 3800 + 3800) % 3800 - 100;
        const y = H / 2 - 120 + 30 * (7 - n.line);
        const a = staffA * flow * seg(lt, 5.8, 6.0);
        ctx.fillStyle = rgba(PAL.goldHot, a);
        ctx.beginPath();
        ctx.ellipse(x, y, 14, 10, -0.4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(PAL.goldHot, a);
        ctx.beginPath();
        ctx.moveTo(x + 13, y);
        ctx.lineTo(x + 13, y - 80);
        if (n.stem) ctx.quadraticCurveTo(x + 40, y - 60, x + 36, y - 30);
        ctx.stroke();
      }
    }
    if (hall > 0) {
      // proscenium, curtains, orchestra
      const pa = E.sine(seg(lt, 6.8, 7.4));
      ctx.globalAlpha = pa;
      ctx.strokeStyle = rgba(PAL.gold, 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 420, H - 110);
      ctx.lineTo(W / 2 - 420, 560);
      ctx.quadraticCurveTo(W / 2, 470, W / 2 + 420, 560);
      ctx.lineTo(W / 2 + 420, H - 110);
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#5a1712';
        ctx.beginPath();
        ctx.moveTo(W / 2 + side * 416, 560);
        ctx.quadraticCurveTo(W / 2 + side * 330, 700, W / 2 + side * 380, H - 110);
        ctx.lineTo(W / 2 + side * 416, H - 110);
        ctx.fill();
      }
      const r = rng(3);
      for (let i = 0; i < 70; i++) {
        const row = Math.floor(i / 14), col = i % 14;
        const x = W / 2 - 330 + col * 50 + (row % 2) * 25, y = 800 + row * 30;
        ctx.fillStyle = '#0a0806';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(PAL.goldHot, 0.7);
        ctx.lineWidth = 1.2;
        const bow = Math.sin(lt * 9 + r() * 6) * 10;
        ctx.beginPath();
        ctx.moveTo(x - 12 + bow, y - 6);
        ctx.lineTo(x + 12 + bow, y + 4);
        ctx.stroke();
      }
      spark(ctx, W / 2, 180, 10, pa * 0.8);
    }
    ctx.restore();
  }
  vignette(ctx, 0.72);
});

// ---------------------------------------------------------------- SCIENCE
const SKY = (function () {
  return { build() {
    const c = makeCanvas(W, H), g = c.getContext('2d');
    const r = rng(808);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4200; i++) {
      const u = r();
      const x = u * W * 1.2 - W * 0.1;
      const y = H * 0.9 - u * H * 0.8 + (r() + r() + r() - 1.5) * 110;
      g.fillStyle = `rgba(200,210,255,${r() * 0.18})`;
      g.fillRect(x, y, 1.2, 1.2);
    }
    SKY.milky = c;
  } };
})();

const GEO_EPI = (function () {
  const shape = [];
  shape.push(circlePts(0, 0, 26, 40));
  for (let i = 1; i <= 4; i++) shape.push(circlePts(0, 0, 60 + i * 55, 90));
  for (let i = 0; i < 4; i++) {
    const pts = [], R0 = 60 + (i + 1) * 55, rr = 22 + i * 4;
    for (let k = 0; k <= 400; k++) {
      const q = (k / 400) * TAU;
      pts.push([Math.cos(q) * R0 + Math.cos(q * (6 + i)) * rr, Math.sin(q) * R0 + Math.sin(q * (6 + i)) * rr]);
    }
    shape.push(pts);
  }
  return shape;
})();

const ORBITS = [110, 165, 235, 320, 455, 620];

function nightSky(ctx, lt, a = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#02030a');
  g.addColorStop(0.7, '#0a1226');
  g.addColorStop(1, '#172240');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (!SKY.milky) SKY.build();
  ctx.globalAlpha = a;
  ctx.drawImage(SKY.milky, 0, 0);
  ctx.drawImage(TEX.stars, -lt * 4, 0);
  ctx.drawImage(TEX.stars, W - lt * 4, 0);
  ctx.globalAlpha = 1;
}

function observer(ctx, x, y, s, scopeAng, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#020204';
  ctx.strokeStyle = '#020204';
  person(ctx, x, y, 170 * s, 0, 0, '#020204', 1);
  // telescope on its tripod
  const px = x + 46 * s, py = y - 118 * s;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(px, py); ctx.lineTo(px - 30 * s, y);
  ctx.moveTo(px, py); ctx.lineTo(px + 34 * s, y);
  ctx.moveTo(px, py); ctx.lineTo(px + 4 * s, y);
  ctx.stroke();
  ctx.translate(px, py);
  ctx.rotate(scopeAng);
  ctx.beginPath();
  ctx.moveTo(-40 * s, -5 * s); ctx.lineTo(140 * s, -9 * s); ctx.lineTo(140 * s, 9 * s); ctx.lineTo(-40 * s, 5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

Film.add('science', function (ctx, lt, t) {
  // A — the observer on the hill
  const A = 1 - E.sine(seg(lt, 1.9, 2.3));
  if (A > 0) {
    ctx.save();
    const push = 1 + E.sine(seg(lt, 0, 2.3)) * 0.12;
    ctx.translate(W * 0.36, H * 0.7);
    ctx.scale(push, push);
    ctx.translate(-W * 0.36, -H * 0.7);
    nightSky(ctx, lt);
    ctx.fillStyle = '#030307';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, 800);
    ctx.bezierCurveTo(400, 700, 800, 720, 1100, 820);
    ctx.bezierCurveTo(1400, 900, 1700, 860, W, 880);
    ctx.lineTo(W, H);
    ctx.fill();
    // freezes, looks again
    const look = lt > 1.2 && lt < 1.5 ? -0.02 : 0;
    observer(ctx, 620, 740, 1.6, -0.55 + look);
    // the planet they are watching
    spark(ctx, 1320, 300, 4, 0.9, '#ffe9c2');
    ctx.restore();
  }
  // B — through the eyepiece: Jupiter's moons move
  const eye = env(lt, 1.9, 2.25, 3.45, 3.8);
  if (eye > 0) {
    ctx.save();
    ctx.globalAlpha = eye;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(W / 2 - 180, H / 2, 380, 0, TAU);
    ctx.clip();
    const g = ctx.createRadialGradient(W / 2 - 180, H / 2, 0, W / 2 - 180, H / 2, 380);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(1, '#010103');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const jx = W / 2 - 180, jy = H / 2;
    ctx.fillStyle = '#e8d3ad';
    ctx.beginPath();
    ctx.arc(jx, jy, 64, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(150,100,60,0.45)' : 'rgba(255,240,210,0.3)';
      ctx.fillRect(jx - 70, jy + i * 17 - 6, 140, 10);
    }
    const sh = ctx.createLinearGradient(jx - 64, 0, jx + 64, 0);
    sh.addColorStop(0, 'rgba(0,0,0,0.5)');
    sh.addColorStop(0.5, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(jx - 64, jy - 64, 128, 128);
    ctx.restore();
    const lapse = (lt - 1.9) * 2.4;
    [[150, 1.77], [230, 3.55], [320, 7.15], [420, 16.7]].forEach(([rad, per], i) => {
      const x = jx + Math.cos((lapse * 6) / per + i * 1.7) * rad;
      spark(ctx, x, jy + (i - 1.5) * 1.5, 3.2, 1, '#fff2d8');
    });
    ctx.restore();
    // the record in the margin, in Galileo's manner
    const rows = ['Jan. 7   *  *  O    *', 'Jan. 8        O  *  *  *', 'Jan. 10   *  *  O', 'Jan. 13     *  O  *  *  *'];
    rows.forEach((s, i) => {
      const a = eye * E.out(seg(lt, 2.4 + i * 0.25, 2.7 + i * 0.25));
      text(ctx, s, 1290, 380 + i * 90, 40, { italic: true, align: 'left', color: rgba('#efe4cc', a) });
    });
  }
  // C — pages accumulate, the old model is struck through
  const P = env(lt, 3.45, 3.8, 5.6, 6.2);
  if (P > 0 && lt < 6.3) {
    ctx.fillStyle = '#060608';
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, W, H);
    const sheets = [[-360, -40, -0.12], [340, 60, 0.1], [-250, 160, 0.05], [0, -20, -0.02]];
    const eqs = [['T² ∝ a³', 'Kepler, 1619'], ['F = G m₁m₂ / r²', 'Newton, 1687'], ['v = s / t', '']];
    const shatter = seg(lt, 5.55, 6.3);
    sheets.forEach(([dx, dy, rot], i) => {
      const a = E.out(seg(lt, 3.5 + i * 0.3, 3.8 + i * 0.3));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = P * a * (i === 3 ? 1 : 1 - shatter);
      ctx.translate(W / 2 + dx, H / 2 + dy + (1 - a) * 200);
      ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 30;
      if (i < 3) {
        ctx.drawImage(TEX.paper, -260, -330, 520, 660);
        ctx.shadowBlur = 0;
        text(ctx, eqs[i][0], 0, -60, 56, { italic: true, color: rgba(INK, 0.9) });
        if (eqs[i][1]) text(ctx, eqs[i][1], 0, 20, 26, { italic: true, color: rgba(INK, 0.6) });
        scriptLines(ctx, -200, 100, 400, 6, 30, 90 + i, INK, 0.45);
      } else if (shatter <= 0) {
        drawGeoSheet(ctx, lt);
      }
      ctx.restore();
    });
    if (shatter > 0) {
      // the old model breaks apart
      const r = rng(61);
      for (let i = 0; i < 16; i++) {
        const gx = (i % 4) - 1.5, gy = Math.floor(i / 4) - 1.5;
        const vx = gx * 500 + (r() - 0.5) * 300, vy = gy * 400 + (r() - 0.5) * 300, vr = (r() - 0.5) * 2;
        const k = E.in(shatter);
        ctx.save();
        ctx.globalAlpha = P * (1 - k);
        ctx.translate(W / 2 + vx * k, H / 2 - 20 + vy * k);
        ctx.rotate(-0.02 + vr * k);
        ctx.beginPath();
        const cx = gx * 130, cy = gy * 165;
        ctx.moveTo(cx - 75 + r() * 20, cy - 90);
        ctx.lineTo(cx + 70 + r() * 20, cy - 85 + r() * 20);
        ctx.lineTo(cx + 65, cy + 90);
        ctx.lineTo(cx - 70, cy + 85 - r() * 20);
        ctx.closePath();
        ctx.clip();
        drawGeoSheet(ctx, lt);
        ctx.restore();
      }
    }
  }
  // D — the new model forms around the observer
  const N = seg(lt, 5.7, 6.4);
  if (N > 0) {
    ctx.save();
    ctx.globalAlpha = E.sine(N);
    nightSky(ctx, lt, 0.6);
    const cx = W / 2, cy = H / 2 - 30;
    const toGear = E.io(seg(lt, 8.4, 9.2));
    ORBITS.forEach((R, i) => {
      const grow = E.out(seg(lt, 5.9 + i * 0.12, 6.9 + i * 0.12)) * R;
      const other = i === 2 ? 1 : 1 - toGear;
      if (other <= 0) return;
      const ry = lerp(grow * 0.34, grow, i === 2 ? toGear : 0);
      ctx.save();
      ctx.globalAlpha = other;
      if (i === 2 && lt > 8.9) {
        const tg = seg(lt, 8.9, 9.6);
        const pts = gearPts(cx, cy, grow * lerp(1, 1.4, tg), 28, 0.1 * tg, lt * 1.2, 360);
        glowStroke(ctx, () => strokeReveal(ctx, pts), PAL.gold, 2.4, 1);
      } else {
        glowStroke(ctx, () => strokeReveal(ctx, ellipsePts(cx, cy, grow, ry, 120)), i === 2 ? PAL.gold : PAL.steel, 1.2, 0.7);
        const q = lt * (1.4 / Math.sqrt(i + 1)) + i;
        if (grow > 5) spark(ctx, cx + Math.cos(q) * grow, cy + Math.sin(q) * ry, 3 + i * 0.5, 0.9 * (1 - toGear), i === 2 ? '#9fd0ff' : PAL.goldHot);
      }
      ctx.restore();
    });
    spark(ctx, cx, cy, 16 * (1 - toGear * 0.7), 1);
    // the observer, small beneath the sky
    observer(ctx, W / 2 - 60, H - 120, 0.9, -0.9, 1 - toGear);
    ctx.restore();
  }
  vignette(ctx, 0.75);
}, { fadeIn: 0.4 });

function drawGeoSheet(ctx, lt) {
  ctx.drawImage(TEX.paper, -330, -390, 660, 780);
  ctx.save();
  ctx.strokeStyle = rgba(INK, 0.8);
  ctx.lineWidth = 1.4;
  ctx.fillStyle = rgba(INK, 0.8);
  ctx.translate(0, -10);
  GEO_EPI.forEach((s, i) => strokeReveal(ctx, s, E.io(seg(lt, 3.9 + i * 0.08, 4.5 + i * 0.08))));
  text(ctx, 'TERRA', 0, 0, 14, { family: FONT.cap, color: rgba(INK, 0.8) });
  text(ctx, 'ORBES COELESTES', 0, -340, 20, { family: FONT.cap, color: rgba(INK, 0.7) });
  // struck through
  ctx.strokeStyle = rgba('#8a2a18', 0.9);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  strokeReveal(ctx, [[-290, -300], [290, 320]], E.out(seg(lt, 4.75, 5.0)));
  strokeReveal(ctx, [[290, -300], [-290, 320]], E.out(seg(lt, 5.0, 5.25)));
  ctx.restore();
}

// ---------------------------------------------------------------- INDUSTRY
const IND = { click: 2.6, boom: 3.4 };
const WG = [
  { x: W / 2 + 40, y: H / 2, r: 300, n: 40, start: 2.6 },
  { x: W / 2 + 40 + 300 + 150 - 20, y: H / 2 - 170, r: 150, n: 20, start: 2.78 },
  { x: W / 2 + 40 + 300 + 150 - 20 + 150 + 90 - 12, y: H / 2 + 60, r: 90, n: 12, start: 2.94 },
];

function workshopAngle(lt) {
  let a = 0;
  for (const s of [0.45, 1.15]) {
    const k = lt - s;
    if (k > 0) a += 0.05 * Math.min(1, k * 12) + (k > 0.08 ? Math.sin(k * 60) * 0.008 * Math.exp(-k * 10) : 0);
  }
  if (lt > IND.click) {
    const k = lt - IND.click;
    a += k * k * 0.8 + (k > 0.8 ? (k - 0.8) * 2 : 0);
  }
  return a;
}

Film.add('industry', function (ctx, lt, t, frame) {
  ctx.fillStyle = '#050405';
  ctx.fillRect(0, 0, W, H);
  // A — the workshop
  if (lt < IND.boom + 0.05) {
    const push = 1 + E.in(seg(lt, 2.9, 3.4)) * 0.5;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(push, push);
    ctx.translate(-W / 2, -H / 2);
    const lamp = ctx.createRadialGradient(560, 120, 0, 560, 120, 1300);
    lamp.addColorStop(0, 'rgba(255,170,90,0.26)');
    lamp.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, W, H);
    // the lamp itself
    spark(ctx, 560, 120, 12, 0.8, '#ffb870');
    const a = workshopAngle(lt);
    const align = E.io(seg(lt, 2.3, 2.55));
    WG.forEach((g, i) => {
      const off = i === 2 ? (1 - align) * 26 : 0;
      const dir = i % 2 ? -1 : 1;
      const rot = (a * WG[0].r) / g.r * dir + i * 0.1;
      const run = seg(lt, g.start, g.start + 0.2);
      const pts = gearPts(g.x + off, g.y + off * 0.6, g.r, g.n, 0.12, rot, g.n * 10);
      ctx.fillStyle = '#0d0c0d';
      ctx.beginPath();
      pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.fill();
      ctx.strokeStyle = rgba('#a79f94', 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let s = 0; s < 6; s++) {
        const q = rot + (s * TAU) / 6;
        ctx.beginPath();
        ctx.moveTo(g.x + off + Math.cos(q) * g.r * 0.2, g.y + off * 0.6 + Math.sin(q) * g.r * 0.2);
        ctx.lineTo(g.x + off + Math.cos(q) * g.r * 0.75, g.y + off * 0.6 + Math.sin(q) * g.r * 0.75);
        ctx.stroke();
      }
      strokeReveal(ctx, circlePts(g.x + off, g.y + off * 0.6, g.r * 0.2, 30));
      if (run > 0) glowStroke(ctx, () => strokeReveal(ctx, pts), PAL.gold, 2.2, run);
    });
    // glint on the misaligned gear: the thing noticed
    const glint = env(lt, 1.95, 2.1, 2.4, 2.6);
    spark(ctx, WG[2].x + 26 - 60, WG[2].y - 60, 6, glint);
    // more of the machine wakes, off into the dark
    for (let i = 0; i < 6; i++) {
      const s0 = 3.0 + i * 0.06;
      const k = seg(lt, s0, s0 + 0.15);
      if (k <= 0) continue;
      const gx = 300 + i * 260, gy = i % 2 ? 180 : 960, gr = 70 + (i % 3) * 30;
      glowStroke(ctx, () => strokeReveal(ctx, gearPts(gx, gy, gr, 10 + i, 0.16, lt * (i % 2 ? -3 : 3))), PAL.gold, 1.8, k);
    }
    // the maker, in profile against the lamp
    const slump = E.io(seg(lt, 1.4, 1.9)) * (1 - E.io(seg(lt, 1.95, 2.25)));
    profileHead(ctx, 260 - slump * 30, 760 + slump * 70, 1.55, { color: '#020203', rim: 0.55 });
    ctx.restore();
  }
  // B — steam and piston
  const B = env(lt, 3.35, 3.45, 4.7, 4.9);
  if (B > 0) {
    ctx.save();
    ctx.globalAlpha = B;
    const pan = (lt - 3.4) * 200;
    ctx.translate(-pan, 0);
    const ph = lt * 22;
    const cxw = 1300, cyw = H / 2, cr = 170;
    const px = cxw + Math.cos(ph) * cr, py = cyw + Math.sin(ph) * cr;
    const rodL = 520;
    const pistonX = px - Math.sqrt(rodL * rodL - (py - cyw) * (py - cyw));
    // cylinder
    ctx.strokeStyle = rgba('#b9b1a4', 0.8);
    ctx.lineWidth = 4;
    ctx.strokeRect(200, cyw - 110, 560, 220);
    ctx.fillStyle = '#16120f';
    ctx.fillRect(pistonX - 90, cyw - 100, 60, 200);
    glowStroke(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(pistonX - 30, cyw);
      ctx.lineTo(px, py);
      ctx.stroke();
      strokeReveal(ctx, circlePts(cxw, cyw, cr + 30, 80));
      strokeReveal(ctx, circlePts(cxw, cyw, 30, 30));
      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const q = ph + (s * TAU) / 8;
        ctx.moveTo(cxw + Math.cos(q) * 30, cyw + Math.sin(q) * 30);
        ctx.lineTo(cxw + Math.cos(q) * (cr + 30), cyw + Math.sin(q) * (cr + 30));
      }
      ctx.stroke();
    }, PAL.gold, 3, 1);
    // steam
    const r = rng(13);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
      const born = 3.4 + r() * 1.4, age = lt - born;
      if (age < 0 || age > 0.9) continue;
      const x = 220 + r() * 120 - age * 400, y = cyw - 140 - age * 300 + (r() - 0.5) * 100;
      const s = 30 + age * 220;
      const g = ctx.createRadialGradient(x, y, 0, x, y, s);
      g.addColorStop(0, `rgba(230,220,205,${0.18 * (1 - age / 0.9)})`);
      g.addColorStop(1, 'rgba(230,220,205,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - s, y - s, s * 2, s * 2);
    }
    ctx.restore();
  }
  // C — the railway across the land
  const C = env(lt, 4.75, 4.9, 6.2, 6.4);
  if (C > 0) {
    ctx.save();
    ctx.globalAlpha = C;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d0f1f');
    g.addColorStop(0.62, '#8a3e22');
    g.addColorStop(0.72, '#f0a050');
    g.addColorStop(1, '#1a0d08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const k = lt - 4.8;
    const layer = (speed, base, amp, col, seed) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, base - (noise1((x + k * speed) * 0.004, seed) * 0.5 + 0.5) * amp);
      ctx.lineTo(W, H);
      ctx.fill();
    };
    layer(80, 740, 220, '#3a1e1a', 1);
    layer(400, 820, 120, '#1a0e0c', 2);
    ctx.fillStyle = '#0a0605';
    ctx.fillRect(0, 840, W, H - 840);
    // poles and wire
    ctx.strokeStyle = '#0a0605';
    ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      const x = ((i * 420 - k * 2400) % 2520 + 2520) % 2520 - 300;
      ctx.beginPath();
      ctx.moveTo(x, 840);
      ctx.lineTo(x, 520);
      ctx.moveTo(x - 30, 540);
      ctx.lineTo(x + 30, 540);
      ctx.stroke();
    }
    // locomotive
    const lx = lerp(-300, 760, E.out(seg(lt, 4.8, 5.8))), ly = 840;
    ctx.fillStyle = '#060404';
    ctx.fillRect(lx, ly - 170, 420, 130);
    ctx.fillRect(lx + 300, ly - 250, 150, 210);
    ctx.fillRect(lx + 40, ly - 240, 44, 80);
    ctx.fillRect(lx + 460, ly - 140, 380, 110);
    ctx.fillRect(lx + 880, ly - 140, 380, 110);
    ctx.beginPath();
    ctx.moveTo(lx, ly - 40); ctx.lineTo(lx - 60, ly - 10); ctx.lineTo(lx, ly - 10);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const wx = lx + 90 + i * 110;
      ctx.beginPath();
      ctx.arc(wx, ly - 30, 42, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(PAL.gold, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx, ly - 30);
      ctx.lineTo(wx + Math.cos(k * 20) * 36, ly - 30 + Math.sin(k * 20) * 36);
      ctx.stroke();
    }
    spark(ctx, lx + 380, ly - 100, 10, 0.8, '#ff8a3d');
    // smoke trail
    ctx.fillStyle = 'rgba(30,20,20,0.55)';
    for (let i = 0; i < 18; i++) {
      const s = 40 + i * 18;
      ctx.beginPath();
      ctx.arc(lx + 62 - i * 70, ly - 260 - i * 12 + Math.sin(i + k * 4) * 12, s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  // D — a bridge across the impossible distance
  const D = env(lt, 6.2, 6.35, 7.4, 7.6);
  if (D > 0) {
    ctx.save();
    ctx.globalAlpha = D;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050914');
    g.addColorStop(0.6, '#0c1830');
    g.addColorStop(1, '#03050a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const water = 760;
    const tw = E.out(seg(lt, 6.3, 6.75));
    const towers = [520, 1400];
    const top = lerp(water, 240, tw);
    const draw = () => {
      for (const x of towers) {
        ctx.beginPath();
        ctx.moveTo(x - 20, water); ctx.lineTo(x - 14, top);
        ctx.moveTo(x + 20, water); ctx.lineTo(x + 14, top);
        ctx.stroke();
      }
      const cab = E.io(seg(lt, 6.6, 7.05));
      const catenary = [];
      for (let i = 0; i <= 60; i++) {
        const u = i / 60, x = lerp(towers[0], towers[1], u);
        catenary.push([x, top + Math.sin(u * Math.PI) * 360 * tw]);
      }
      strokeReveal(ctx, catenary, cab);
      strokeReveal(ctx, [[towers[0], top], [-40, 640]], cab);
      strokeReveal(ctx, [[towers[1], top], [W + 40, 640]], cab);
      const deck = E.io(seg(lt, 6.8, 7.3));
      ctx.beginPath();
      ctx.moveTo(-40, 660); ctx.lineTo(lerp(-40, W / 2, deck), 660);
      ctx.moveTo(W + 40, 660); ctx.lineTo(lerp(W + 40, W / 2, deck), 660);
      ctx.stroke();
      const hang = seg(lt, 6.9, 7.3);
      ctx.beginPath();
      for (let i = 1; i < 30; i++) {
        const u = i / 30, x = lerp(towers[0], towers[1], u);
        if (Math.abs(x - W / 2) > (1 - deck) * W / 2 && hang > u * 0.5) {
          ctx.moveTo(x, top + Math.sin(u * Math.PI) * 360 * tw);
          ctx.lineTo(x, 660);
        }
      }
      ctx.stroke();
    };
    glowStroke(ctx, draw, PAL.gold, 2.2, 1);
    // reflection
    ctx.save();
    ctx.translate(0, water * 2);
    ctx.scale(1, -1);
    ctx.globalAlpha = D * 0.18;
    glowStroke(ctx, draw, PAL.gold, 2.2, 1);
    ctx.restore();
    ctx.restore();
  }
  // E — turbine, generator, lightning
  const Et = seg(lt, 7.45, 7.65);
  if (Et > 0) {
    ctx.save();
    ctx.globalAlpha = Et;
    ctx.fillStyle = '#040508';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const spin = (lt - 7.45) * (6 + (lt - 7.45) * 8);
    const gen = seg(lt, 8.2, 8.6);
    const R = lerp(400, 330, gen);
    glowStroke(ctx, () => {
      strokeReveal(ctx, circlePts(cx, cy, R + 20, 120));
      strokeReveal(ctx, circlePts(cx, cy, 70, 40));
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const q = spin + (i * TAU) / 28;
        ctx.moveTo(cx + Math.cos(q) * 70, cy + Math.sin(q) * 70);
        ctx.quadraticCurveTo(cx + Math.cos(q + 0.35) * R * 0.6, cy + Math.sin(q + 0.35) * R * 0.6, cx + Math.cos(q + 0.2) * R, cy + Math.sin(q + 0.2) * R);
      }
      ctx.stroke();
    }, gen > 0 ? mixHex(PAL.gold, '#bfe0ff', gen) : PAL.gold, 1.6, 1);
    if (gen > 0) {
      // coils of the generator
      ctx.strokeStyle = rgba('#c98b4a', gen);
      ctx.lineWidth = 10;
      for (let i = 0; i < 16; i++) {
        const q = (i * TAU) / 16;
        ctx.save();
        ctx.translate(cx + Math.cos(q) * (R + 70), cy + Math.sin(q) * (R + 70));
        ctx.rotate(q);
        ctx.strokeRect(-18, -34, 36, 68);
        ctx.restore();
      }
    }
    const bolt = seg(lt, 8.55, 9.1);
    if (bolt > 0) {
      const r = rng(frame);
      ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 14; b++) {
        const q = (b / 14) * TAU + r() * 0.3;
        const pts = [[cx + Math.cos(q) * 120, cy + Math.sin(q) * 120]];
        let d = 120;
        while (d < 1300 * E.out(bolt) + 120) {
          d += 60 + r() * 60;
          const qq = q + (r() - 0.5) * 0.25;
          pts.push([cx + Math.cos(qq) * d, cy + Math.sin(qq) * d]);
        }
        glowStroke(ctx, () => strokeReveal(ctx, pts), '#cfe6ff', 2.5, 1);
      }
      wash(ctx, '#dfeeff', 0.5 * Math.sin(bolt * Math.PI));
    }
    ctx.restore();
  }
  vignette(ctx, 0.7);
}, { fadeIn: 0.35 });
