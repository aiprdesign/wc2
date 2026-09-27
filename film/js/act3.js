/* THE INHERITANCE — Act III: connection, medicine, exploration. */
'use strict';

// ---------------------------------------------------------------- the globe
const DEG = Math.PI / 180;
function globePoint(lat, lon, lon0, lat0) {
  const la = lat * DEG, lo = (lon - lon0) * DEG;
  const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
  const t = lat0 * DEG;
  return [x, y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)];
}
// Orthographic Earth drawn as a stipple of land dots, lit from the left.
function drawGlobe(ctx, cx, cy, R, lon0, lat0 = 20, opts = {}) {
  const L = [-0.72, 0.35, 0.6];
  const a = opts.alpha == null ? 1 : opts.alpha;
  ctx.save();
  ctx.globalAlpha = a;
  // ocean body
  const g = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.3, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#1d3f6e');
  g.addColorStop(0.55, '#0c1d38');
  g.addColorStop(1, '#03060c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();
  // land
  const D = EARTH.dots;
  const ds = Math.max(1.1, R / 140);
  const lights = opts.lights == null ? 1 : opts.lights;
  for (let i = 0; i < D.length; i += 2) {
    const [x, y, z] = globePoint(D[i] / 10, D[i + 1] / 10, lon0, lat0);
    if (z <= 0.02) continue;
    const sx = cx + x * R, sy = cy - y * R;
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
    const lit = x * L[0] + y * L[1] + z * L[2];
    const day = clamp(lit * 2.2 + 0.25);
    const edge = Math.pow(z, 0.4);
    if (day > 0.04) {
      ctx.fillStyle = `rgba(${Math.round(lerp(50, 226, day))},${Math.round(lerp(70, 232, day))},${Math.round(lerp(80, 196, day))},${edge})`;
      ctx.fillRect(sx - ds / 2, sy - ds / 2, ds, ds);
    }
    if (day < 0.5 && lights > 0 && hash(i) < 0.16) {
      ctx.fillStyle = rgba(PAL.gold, (0.9 - day * 1.6) * edge * lights);
      ctx.fillRect(sx - ds * 0.4, sy - ds * 0.4, ds * 0.8, ds * 0.8);
    }
  }
  // atmosphere
  ctx.globalCompositeOperation = 'lighter';
  const at = ctx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * 1.12);
  at.addColorStop(0, 'rgba(90,160,255,0)');
  at.addColorStop(0.35, 'rgba(110,170,255,0.35)');
  at.addColorStop(1, 'rgba(90,160,255,0)');
  ctx.fillStyle = at;
  ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
  ctx.globalCompositeOperation = 'source-over';
  // terminator shadow
  const sh = ctx.createLinearGradient(cx - R * 0.2, cy - R * 0.1, cx + R, cy + R * 0.3);
  sh.addColorStop(0, 'rgba(0,0,0,0)');
  sh.addColorStop(0.6, 'rgba(0,0,0,0.3)');
  sh.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- CONNECTION
const CITIES = {
  london: [51.5, -0.1], newyork: [40.7, -74], paris: [48.9, 2.3], cairo: [30, 31.2], mumbai: [19, 72.8],
  tokyo: [35.7, 139.7], sydney: [-33.9, 151.2], saopaulo: [-23.5, -46.6], lagos: [6.5, 3.4], moscow: [55.8, 37.6],
  sanfrancisco: [37.8, -122.4], buenosaires: [-34.6, -58.4], beijing: [39.9, 116.4], capetown: [-33.9, 18.4],
};
const LINKS = [
  ['london', 'newyork'], ['paris', 'cairo'], ['london', 'mumbai'], ['newyork', 'sanfrancisco'], ['moscow', 'beijing'],
  ['beijing', 'tokyo'], ['mumbai', 'sydney'], ['lagos', 'saopaulo'], ['saopaulo', 'buenosaires'], ['cairo', 'capetown'],
  ['sanfrancisco', 'tokyo'], ['paris', 'moscow'], ['london', 'lagos'],
];

function flatMap(ctx, cx, cy, w, squeeze, a) {
  const D = EARTH.dots;
  const px = (lon) => cx + (lon / 180) * (w / 2) * squeeze;
  const py = (lat) => cy - (lat / 90) * (w / 4);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba('#8fb3dc', 0.45);
  for (let i = 0; i < D.length; i += 2) ctx.fillRect(px(D[i + 1] / 10) - 1.2, py(D[i] / 10) - 1.2, 2.4, 2.4);
  ctx.restore();
  return [px, py];
}

function telephone(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#020204';
  ctx.fillRect(-6, -10, 12, 150);
  ctx.beginPath();
  ctx.ellipse(0, 140, 50, 12, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-26, -40); ctx.lineTo(26, -40); ctx.lineTo(10, -8); ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

Film.add('connect', function (ctx, lt, t, frame) {
  ctx.fillStyle = '#04050a';
  ctx.fillRect(0, 0, W, H);
  // A/B — a pulse runs down the wire; a voice crosses the distance
  const AB = 1 - E.sine(seg(lt, 2.7, 3.0));
  if (AB > 0) {
    ctx.save();
    ctx.globalAlpha = AB;
    // distant landscape and town lights between them
    ctx.fillStyle = '#07080f';
    ctx.fillRect(0, 700, W, H - 700);
    const r = rng(21);
    for (let i = 0; i < 60; i++) spark(ctx, 600 + r() * 720, 705 + r() * 30, 1.2, 0.4);
    const wire = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      wire.push([lerp(250, W - 250, u), 470 + Math.sin(u * Math.PI) * 90]);
    }
    ctx.strokeStyle = rgba(PAL.line, 0.35);
    ctx.lineWidth = 1.5;
    strokeReveal(ctx, wire, E.out(seg(lt, 0, 0.5)));
    // the telegraph's pulse, dots and dashes
    const pulse = seg(lt, 0.1, 0.8);
    if (pulse > 0 && pulse < 1) {
      const [x, y] = pointAt(wire, pulse);
      spark(ctx, x, y, 7, 1, '#cfe6ff');
    }
    const code = '• — • •   — • —';
    text(ctx, code, W / 2, 420, 34, { color: rgba('#cfe6ff', env(lt, 0.3, 0.5, 0.9, 1.2)) });
    // speaker and listener
    const who = E.sine(seg(lt, 0.6, 1.0));
    ctx.globalAlpha = AB * who;
    ctx.fillStyle = '#020204';
    ctx.beginPath();
    ctx.arc(225, 480, 58, 0, TAU); // her hair, gathered
    ctx.fill();
    profileHead(ctx, 250, 560, 1.15, { color: '#020204', rim: 0.35, rimColor: '#9fb7d8' });
    telephone(ctx, 400, 520, 1.1);
    const heard = E.sine(seg(lt, 2.0, 2.5));
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    profileHead(ctx, 250, 560, 1.2, { color: '#020204', rim: 0.35 + heard * 0.8, rimColor: heard > 0 ? PAL.gold : '#9fb7d8' });
    ctx.fillStyle = '#020204';
    ctx.fillRect(250 + 10, 520, 26, 60); // the earpiece
    ctx.restore();
    // the voice as a travelling wave
    const vw = seg(lt, 0.9, 2.1);
    if (vw > 0 && vw < 1) {
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const u = clamp(vw - 0.14 + (k / 60) * 0.14);
        const [x, y] = pointAt(wire, u);
        const env1 = Math.sin((k / 60) * Math.PI);
        pts.push([x, y + Math.sin(k * 1.3 + lt * 30) * 26 * env1]);
      }
      glowStroke(ctx, () => strokeReveal(ctx, pts), PAL.gold, 2, 1);
    }
    if (heard > 0) {
      const g = ctx.createRadialGradient(W - 300, 520, 0, W - 300, 520, 400);
      g.addColorStop(0, rgba(PAL.gold, 0.14 * heard));
      g.addColorStop(1, rgba(PAL.gold, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
  // C — the world's distances collapse
  const C = env(lt, 2.7, 3.0, 4.5, 4.9);
  if (C > 0) {
    const sq = lerp(1, 0.38, E.io(seg(lt, 3.5, 4.6)));
    const [px, py] = flatMap(ctx, W / 2, H / 2 + 20, 1760, sq, C);
    ctx.save();
    ctx.globalAlpha = C;
    LINKS.forEach(([a, b], i) => {
      const A = CITIES[a], B2 = CITIES[b];
      const x1 = px(A[1]), y1 = py(A[0]), x2 = px(B2[1]), y2 = py(B2[0]);
      const d = Math.hypot(x2 - x1, y2 - y1);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - d * 0.3;
      const pts = [];
      for (let k = 0; k <= 30; k++) {
        const u = k / 30, v = 1 - u;
        pts.push([v * v * x1 + 2 * v * u * mx + u * u * x2, v * v * y1 + 2 * v * u * my + u * u * y2]);
      }
      const rv = E.out(seg(lt, 2.8 + i * 0.07, 3.3 + i * 0.07));
      glowStroke(ctx, () => strokeReveal(ctx, pts, rv), PAL.gold, 1.4, 0.8);
      const q = ((lt * 0.9 + i * 0.37) % 1);
      if (rv >= 1) { const [x, y] = pointAt(pts, q); spark(ctx, x, y, 2.5, 0.9); }
      spark(ctx, x1, y1, 2.5, rv);
      spark(ctx, x2, y2, 2.5, rv);
    });
    ctx.restore();
  }
  // D — broadcast rings, slowing into a pulse
  const D = seg(lt, 4.3, 5.2);
  if (D > 0) {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const k = ((lt - 4.3) * 0.9 + i / 6) % 1;
      const r = k * 900;
      ctx.strokeStyle = rgba(PAL.gold, (1 - k) * 0.6 * Math.min(1, D * 3));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, TAU);
      ctx.stroke();
    }
    spark(ctx, W / 2, H / 2, 8, D);
    ctx.restore();
  }
  vignette(ctx, 0.7);
}, { fadeIn: 0.3 });

// ---------------------------------------------------------------- MEDICINE
function ecg(ctx, lt, strength, y0, a) {
  const amp = lerp(26, 120, strength), period = lerp(1.5, 0.82, strength);
  const pts = [];
  const span = 3.2; // seconds of trace across the frame
  for (let x = 0; x <= W; x += 4) {
    const ts = lt - span + (x / W) * span;
    const ph = ((ts % period) + period) % period / period;
    let y = 0;
    if (ph > 0.3 && ph < 0.34) y = -0.18 * Math.sin(((ph - 0.3) / 0.04) * Math.PI);
    else if (ph > 0.38 && ph < 0.4) y = 0.25 * ((ph - 0.38) / 0.02);
    else if (ph > 0.4 && ph < 0.43) y = lerp(0.25, -1, (ph - 0.4) / 0.03);
    else if (ph > 0.43 && ph < 0.47) y = lerp(-1, 0.35, (ph - 0.43) / 0.04);
    else if (ph > 0.47 && ph < 0.5) y = lerp(0.35, 0, (ph - 0.47) / 0.03);
    else if (ph > 0.6 && ph < 0.72) y = -0.22 * Math.sin(((ph - 0.6) / 0.12) * Math.PI);
    pts.push([x, y0 + y * amp]);
  }
  const col = mixHex('#7fa7c9', PAL.gold, strength);
  ctx.save();
  ctx.globalAlpha = a;
  glowStroke(ctx, () => strokeReveal(ctx, pts), col, 2, 0.6 + strength * 0.6);
  const last = pts[pts.length - 1];
  spark(ctx, last[0] - 2, last[1], 4, a, col);
  ctx.restore();
}

function bedside(ctx, lt, dawn, glint) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mixHex('#060a14', '#1a1210', dawn));
  g.addColorStop(1, '#030305');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // window and its light
  const wc = mixHex('#8fb0d8', '#ffc98a', dawn);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(wc, 0.22 + dawn * 0.2);
  ctx.fillRect(1320, 140, 300, 380);
  ctx.fillStyle = rgba(wc, 0.05 + dawn * 0.05);
  ctx.beginPath();
  ctx.moveTo(1320, 140); ctx.lineTo(1620, 140); ctx.lineTo(1300, 900); ctx.lineTo(760, 900);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#05060a';
  ctx.fillRect(1462, 140, 16, 380);
  ctx.fillRect(1320, 322, 300, 16);
  // pillow and the child, lying with face upward
  ctx.fillStyle = '#10121a';
  ctx.beginPath();
  ctx.ellipse(1440, 690, 150, 40, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.rect(1394, 0, W, 700);
  ctx.clip();
  ctx.translate(1480, 662);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(1, -1);
  const eye = profileHead(ctx, 0, 0, 0.5, { color: '#030305', rim: 0.35 + dawn * 0.3, rimColor: wc });
  if (glint > 0) spark(ctx, eye[0] + 4, eye[1] - 2, 3.2, glint);
  ctx.restore();
  // bed and blanket
  ctx.fillStyle = '#0b0c12';
  ctx.beginPath();
  ctx.moveTo(760, 900);
  ctx.lineTo(760, 690);
  ctx.bezierCurveTo(980, 640, 1240, 640, 1392, 660);
  ctx.lineTo(1400, 900);
  ctx.fill();
  ctx.fillRect(1390, 700, 210, 200);
  ctx.strokeStyle = rgba(wc, 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(760, 690);
  ctx.bezierCurveTo(980, 640, 1240, 640, 1392, 660);
  ctx.stroke();
  // the parent, leaning close
  ctx.save();
  ctx.translate(560, 560);
  ctx.rotate(0.28 - glint * 0.06);
  profileHead(ctx, 0, 0, 0.95, { color: '#030305', rim: 0.3 + dawn * 0.4, rimColor: wc });
  ctx.restore();
  // hands held on the blanket
  ctx.fillStyle = '#030305';
  ctx.beginPath();
  ctx.moveTo(650, 820);
  ctx.quadraticCurveTo(820, 760, 1000, 700);
  ctx.lineTo(1010, 730);
  ctx.quadraticCurveTo(820, 800, 690, 880);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1010, 706, 44, 24, -0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(wc, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

Film.add('medicine', function (ctx, lt) {
  const bedA = 1 - env(lt, 1.8, 2.1, 4.1, 4.5);
  const strong = E.io(seg(lt, 4.4, 5.4));
  if (bedA > 0) {
    const dawn = E.sine(seg(lt, 4.6, 7.3)) * 0.8;
    bedside(ctx, lt, dawn, E.out(seg(lt, 5.0, 5.6)));
    ecg(ctx, lt, strong, 930, 0.9);
    if (bedA < 1) wash(ctx, '#000000', 1 - bedA);
  }
  const M = env(lt, 1.8, 2.1, 4.1, 4.5);
  if (M > 0) {
    ctx.save();
    ctx.globalAlpha = M;
    ctx.fillStyle = '#030406';
    ctx.fillRect(0, 0, W, H);
    // the researcher at the microscope
    const res = 1 - seg(lt, 2.3, 2.6);
    if (res > 0) {
      ctx.globalAlpha = M * res;
      ctx.save();
      ctx.translate(700, 620);
      ctx.rotate(0.45);
      profileHead(ctx, 0, 0, 1.1, { color: '#020203', rim: 0.6, rimColor: '#bcd8ff' });
      ctx.restore();
      ctx.fillStyle = '#020203';
      ctx.strokeStyle = rgba('#bcd8ff', 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(860, 470); ctx.lineTo(900, 450); ctx.lineTo(1010, 700); ctx.lineTo(970, 720);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillRect(900, 820, 260, 30);
      ctx.fillRect(1080, 560, 30, 270);
      ctx.fillRect(940, 740, 160, 16);
      spark(ctx, 1000, 760, 8, 0.8, '#dff0ff');
    }
    // into the microscopic world
    const micro = seg(lt, 2.3, 2.6);
    if (micro > 0) {
      ctx.globalAlpha = M * micro;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, lerp(40, 470, E.out(micro)), 0, TAU);
      ctx.clip();
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 470);
      g.addColorStop(0, '#1a2a2a');
      g.addColorStop(1, '#050909');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const cellsA = 1 - seg(lt, 3.1, 3.4);
      const r = rng(55);
      for (let i = 0; i < 26; i++) {
        const x = W / 2 - 450 + r() * 900 + Math.sin(lt + i) * 20, y = H / 2 - 450 + r() * 900 + Math.cos(lt * 0.8 + i) * 20;
        const s = 30 + r() * 50;
        ctx.globalAlpha = M * micro * cellsA;
        ctx.strokeStyle = 'rgba(170,230,210,0.55)';
        ctx.fillStyle = 'rgba(120,200,180,0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, s, s * (0.75 + r() * 0.25), r() * 3, 0, TAU);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(220,160,190,0.5)';
        ctx.beginPath();
        ctx.arc(x + s * 0.15, y - s * 0.1, s * 0.25, 0, TAU);
        ctx.fill();
        if (i % 3 === 0) {
          ctx.strokeStyle = 'rgba(240,210,150,0.6)';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          const a = r() * 3;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(a) * 20 + 70, y - Math.sin(a) * 20);
          ctx.lineTo(x + Math.cos(a) * 20 + 70, y + Math.sin(a) * 20);
          ctx.stroke();
        }
      }
      // the anatomical drawing gains a third dimension
      const hA = seg(lt, 3.1, 3.4);
      if (hA > 0) {
        ctx.globalAlpha = M * hA;
        const beat = 1 + Math.pow(Math.max(0, Math.sin(lt * 7)), 8) * 0.06;
        ctx.save();
        ctx.translate(W / 2, H / 2 + 20);
        ctx.scale(beat * 2.2, beat * 2.2);
        const dim = E.io(seg(lt, 3.5, 4.0));
        if (dim > 0) {
          const hg = ctx.createRadialGradient(-30, -40, 5, 0, 0, 120);
          hg.addColorStop(0, rgba('#e0736a', dim));
          hg.addColorStop(0.6, rgba('#8e2a2a', dim));
          hg.addColorStop(1, rgba('#2a0808', dim));
          ctx.fillStyle = hg;
          heartPath(ctx, 0, 0, 1);
          ctx.fill();
        }
        ctx.lineWidth = 1;
        const rv = E.io(seg(lt, 3.1, 3.6));
        ctx.save();
        ctx.setLineDash([600 * rv, 600]);
        glowStroke(ctx, () => { heartPath(ctx, 0, 0, 1); ctx.stroke(); }, PAL.gold, 0.9, 1);
        ctx.restore();
        ctx.restore();
      }
      ctx.restore();
      ctx.globalAlpha = M * micro;
      ctx.strokeStyle = rgba(PAL.line, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, lerp(40, 470, E.out(micro)), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
  vignette(ctx, 0.72);
}, { fadeIn: 0.4 });

// ---------------------------------------------------------------- EXPLORATION
const CRAFT = (function () {
  const biplane = [
    [[-200, 0], [180, 0]], [[-230, -80], [210, -80]], [[-230, -80], [-230, -70], [210, -70], [210, -80]],
    [[-60, 0], [-60, -80]], [[60, 0], [60, -80]], [[-160, 0], [-160, -80]], [[150, 0], [150, -80]],
    [[180, -10], [260, -30], [260, 10], [180, 0]], [[-200, -10], [-330, -40], [-330, 0], [-200, 0]],
    [[270, -60], [270, 40]], [[-20, 0], [-40, 60]], [[20, 0], [40, 60]], circlePts(-40, 70, 12, 16), circlePts(40, 70, 12, 16),
  ];
  const prop = [
    [[-260, -10], [-200, -30], [200, -30], [260, -10], [240, 20], [-240, 20], [-260, -10]],
    [[-80, 0], [60, 140], [100, 140], [60, 0]], [[-80, -10], [60, -150], [100, -150], [60, -20]],
    [[-260, -10], [-320, -70], [-290, -70], [-230, -25]], [[260, -80], [260, 60]],
    [[180, -30], [140, -55], [60, -55], [30, -30]],
  ];
  const jet = [
    [[-280, -8], [-150, -26], [220, -26], [300, 0], [220, 20], [-280, 16], [-280, -8]],
    [[-60, 0], [80, 180], [120, 180], [60, 0]], [[-60, -12], [80, -190], [120, -190], [60, -22]],
    [[-280, -8], [-340, -110], [-300, -110], [-220, -20]], [[240, -18], [210, -34], [160, -34]],
  ];
  const rocket = [
    [[-30, 260], [-30, -120], [0, -240], [30, -120], [30, 260], [-30, 260]],
    [[-30, 120], [-80, 260], [-30, 230]], [[30, 120], [80, 260], [30, 230]],
    [[-30, -60], [30, -60]], [[-30, 60], [30, 60]], [[0, 260], [0, 300]],
  ];
  const rot = (s) => s.map((st) => st.map(([x, y]) => [y, -x]));
  return {
    biplane: normShape(biplane, 16, 40),
    prop: normShape(prop, 16, 40),
    jet: normShape(jet, 16, 40),
    rocket: normShape(rot(rot(rot(rocket))), 16, 40),
    rawBiplane: biplane,
  };
})();

Film.add('explore', function (ctx, lt, t, frame) {
  // A — the blueprint
  const A = 1 - E.sine(seg(lt, 2.0, 2.6));
  if (A > 0 && lt < 3.6) {
    const sky = seg(lt, 1.3, 2.4);
    ctx.fillStyle = mixHex(PAL.blueprint, '#2a1c2c', sky);
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = A * (1 - sky);
    ctx.strokeStyle = 'rgba(150,190,240,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    text(ctx, 'FLYING MACHINE — GENERAL ARRANGEMENT', 180, 200, 24, { family: FONT.cap, align: 'left', color: 'rgba(220,235,255,0.8)', spacing: 3 });
    text(ctx, 'SPAN 12.3 m', W / 2, 740, 26, { family: FONT.cap, color: 'rgba(220,235,255,0.7)', spacing: 3, alpha: seg(lt, 0.6, 0.9) });
    ctx.strokeStyle = 'rgba(220,235,255,0.6)';
    strokeReveal(ctx, [[W / 2 - 440, 700], [W / 2 + 420, 700]], seg(lt, 0.5, 0.9));
    ctx.restore();
  }
  // B — flight: the drawing becomes a machine, and the machine evolves
  if (lt < 3.7) {
    const m = [CRAFT.biplane, CRAFT.prop, CRAFT.jet, CRAFT.rocket];
    const ks = [1.8, 2.35, 2.9];
    let shape = m[0];
    for (let i = 0; i < 3; i++) {
      const k = E.io(seg(lt, ks[i], ks[i] + 0.45));
      if (k > 0) shape = morphShape(i === 0 ? m[0] : shape, m[i + 1], k);
    }
    const rise = E.io(seg(lt, 1.3, 3.6));
    const x = lerp(W / 2, W / 2 + 200, rise), y = lerp(H / 2 + 20, H / 2 - 520, E.in(seg(lt, 2.8, 3.7))) - rise * 80;
    const sc = lerp(1.6, 1.1, rise);
    const tilt = lerp(0, -0.15, rise);
    const S2 = xform(shape, x, y, sc, tilt);
    ctx.save();
    const draw = E.io(seg(lt, 0, 1.0));
    const col = lt < 1.2 ? 'rgba(225,238,255,0.9)' : PAL.gold;
    if (lt < 1.2) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      shapeReveal(ctx, S2, draw, 0.7);
    } else {
      const fill = seg(lt, 1.0, 1.4);
      glowStroke(ctx, () => drawShape(ctx, S2), PAL.gold, 2, fill);
    }
    if (lt > 3.0) {
      const [ex, ey] = [x, y + 330 * sc];
      spark(ctx, ex, ey, 14, seg(lt, 3.0, 3.2), '#ff9d4d');
    }
    ctx.restore();
  }
  // C — a young watcher; ignition
  const C = env(lt, 3.3, 3.6, 5.95, 6.0);
  if (C > 0) {
    ctx.save();
    ctx.globalAlpha = C;
    const ign = seg(lt, 4.0, 4.3);
    const shake = lt > 4.0 && lt < 5.9 ? (1 - seg(lt, 4.0, 5.9)) * 10 : 0;
    ctx.translate(noise1(lt * 30, 3) * shake, noise1(lt * 30, 4) * shake);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0d1e');
    g.addColorStop(0.7, mixHex('#3a2436', '#ff9d4d', ign * 0.6));
    g.addColorStop(1, '#0a0506');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.drawImage(TEX.stars, 0, -300);
    // pad and tower on the horizon
    const pad = 1340, hz = 800;
    ctx.fillStyle = '#050305';
    ctx.fillRect(-20, hz, W + 40, H);
    ctx.fillRect(pad + 40, hz - 240, 22, 240);
    const climb = E.in(seg(lt, 4.3, 6.0));
    const ry = hz - 30 - climb * 1400;
    ctx.fillRect(pad - 8, ry - 140, 16, 140);
    ctx.beginPath();
    ctx.moveTo(pad - 8, ry - 140); ctx.lineTo(pad, ry - 175); ctx.lineTo(pad + 8, ry - 140);
    ctx.fill();
    if (ign > 0) {
      // exhaust trail
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const tg = ctx.createLinearGradient(0, ry, 0, hz);
      tg.addColorStop(0, rgba('#fff0c8', 0.9));
      tg.addColorStop(0.2, rgba('#ff9d4d', 0.5));
      tg.addColorStop(1, rgba('#ff9d4d', 0.05));
      ctx.fillStyle = tg;
      ctx.fillRect(pad - 6, ry, 12, hz - ry);
      spark(ctx, pad, ry + 6, 22 * ign, 1, '#ffd08a');
      ctx.restore();
      // smoke rolling out across the ground
      const r = rng(9);
      for (let i = 0; i < 40; i++) {
        const age = lt - 4.0 - r() * 0.8;
        if (age < 0) continue;
        const side = r() < 0.5 ? -1 : 1;
        const x = pad + side * age * (150 + r() * 300), y = hz - 20 - age * (20 + r() * 80);
        const s = 30 + age * 110;
        ctx.fillStyle = `rgba(${150 + r() * 60},${110 + r() * 40},${100},${0.35 * Math.max(0, 1 - age / 2.2)})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, TAU);
        ctx.fill();
      }
    }
    // the watcher, close, lit by the launch
    const eye = profileHead(ctx, 360, 690, 1.8, { color: '#030205', rim: 0.25 + ign * 0.9, rimColor: ign > 0 ? '#ffb870' : '#8fa6c8' });
    spark(ctx, eye[0] + 6, eye[1] - 2, 3 + ign * 3, 0.6 + ign * 0.4);
    if (ign > 0) wash(ctx, '#ffb870', 0.12 * ign * (1 - seg(lt, 4.5, 6)));
    ctx.restore();
  }
  // D — space, and silence
  if (lt >= 6.0) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const s = E.sine(seg(lt, 6.2, 8.0));
    ctx.globalAlpha = s;
    ctx.drawImage(TEX.stars, -(lt - 6) * 3, 0);
    ctx.drawImage(TEX.stars, W - (lt - 6) * 3, 0);
    ctx.globalAlpha = 1;
    const rise = E.io(seg(lt, 10.4, 13.6));
    const R = lerp(300, 250, rise);
    drawGlobe(ctx, W / 2 + 60, lerp(H / 2, H / 2 - 110, rise), R, -20 + (lt - 6) * 3, 22, { alpha: s });
    // the lunar horizon, and Earth rising above it
    if (rise > 0) {
      const my = lerp(H + 400, H + 1850, 1) - rise * 520 + 400;
      const mg = ctx.createRadialGradient(W / 2 - 400, my - 2200, 200, W / 2, my, 2400);
      mg.addColorStop(0, '#8d8a86');
      mg.addColorStop(0.9, '#2b2a29');
      mg.addColorStop(1, '#141414');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(W / 2, my, 2400, 0, TAU);
      ctx.fill();
      const r = rng(77);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 40; i++) {
        const q = -Math.PI / 2 + (r() - 0.5) * 0.9, d = 2400 - 10 - r() * 160;
        ctx.beginPath();
        ctx.ellipse(W / 2 + Math.cos(q) * d, my + Math.sin(q) * d, 8 + r() * 30, 2 + r() * 6, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
  vignette(ctx, lt > 6 ? 0.5 : 0.7);
}, { fadeIn: 0.35 });
