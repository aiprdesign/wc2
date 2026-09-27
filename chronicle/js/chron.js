/* THREE THOUSAND YEARS — a flight along the timeline of Western achievement. */
import * as THREE from 'three';
import { scene3 } from '../../film3d/js/engine3d.js';
import { C, polyline, glow, spark, grid, pointCloud, stars, label, dust } from '../../film3d/js/holo.js';
import { model } from '../../film3d/js/models.js';

const SP = 44; // world units between milestones
const N = STATIONS.length;
const zOf = (i) => -i * SP;
const xOf = (i) => (i % 2 ? 7.5 : -7.5);
const T_END = stationTime(N - 1) + STEP;

function euclid3D(r, color) {
  const g = new THREE.Group();
  euclidShape(0, 0, r).strokes.forEach((st) => g.add(polyline(st.map(([x, y]) => [x, -y, 0]), { color, intensity: 2.6 })));
  g.setProgress = (p) => { g.children.forEach((l, i) => l.setProgress(clamp(p * 1.6 - i * 0.15))); return g; };
  g.setOpacity = (a) => { g.children.forEach((l) => l.setOpacity(a)); g.visible = a > 0.002; return g; };
  return g;
}

function sheetMesh() {
  const c = makeCanvas(600, 800), g = c.getContext('2d');
  g.drawImage(TEX.paper, 0, 0, 600, 800);
  text(g, 'MAGNA CARTA', 300, 80, 40, { family: FONT.cap, color: rgba(INK, 0.9), spacing: 6 });
  text(g, 'LIBERTATUM', 300, 130, 28, { family: FONT.cap, color: rgba(INK, 0.75), spacing: 8 });
  scriptLines(g, 60, 190, 480, 18, 30, 1215, INK, 0.55);
  g.strokeStyle = rgba('#7a2a18', 0.8); g.lineWidth = 3;
  g.beginPath(); g.arc(470, 730, 36, 0, TAU); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 6), new THREE.MeshBasicMaterial({ map: t, color: 0x8a7c66, transparent: true, side: THREE.DoubleSide }));
  m.position.y = 3.4;
  const grp = new THREE.Group();
  grp.add(m);
  grp.setOpacity = (a) => { m.material.opacity = a; grp.visible = a > 0.002; return grp; };
  grp.setPrint = () => grp;
  return grp;
}

scene3('chronicle', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.012);
  const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 3000);
  const sky = stars(6000, 900, 3000);
  scene.add(sky);
  const floor = grid(3000, 2, C.cyan, 0.22);
  floor.position.set(0, 0, -N * SP / 2);
  floor.material.uniforms.uFade.value = 90;
  scene.add(floor);
  // the timeline itself: a golden road with year ticks
  const L = zOf(N - 1) - 60;
  scene.add(polyline([[0, 0.02, 60], [0, 0.02, L]], { color: C.gold, intensity: 3 }));
  scene.add(polyline([[-0.6, 0.02, 60], [-0.6, 0.02, L]], { color: C.gold, intensity: 1.2, opacity: 0.5 }));
  scene.add(polyline([[0.6, 0.02, 60], [0.6, 0.02, L]], { color: C.gold, intensity: 1.2, opacity: 0.5 }));
  const motes = dust(1500, [60, 20, 200], 12, C.goldHot);
  scene.add(motes);

  const items = STATIONS.map(([, lab, title, , name], i) => {
    let m;
    if (name === 'euclid') { const e = euclid3D(3.2, C.gold); e.position.y = 3.5; const g = new THREE.Group(); g.add(e); g.setOpacity = (a) => { e.setOpacity(a); g.visible = a > 0.002; return g; }; g.setPrint = (f) => { e.setProgress(f); return g; }; m = g; }
    else if (name === 'sheet') m = sheetMesh();
    else {
      const warm = i % 3 !== 1;
      m = model(name, { height: 7, color: warm ? C.gold : C.cyan, wireColor: warm ? C.goldHot : C.ice, wireIntensity: 0.9, fillIntensity: 0.05 });
      const s = Math.min(1, 11 / Math.max(m.width, m.depth));
      m.scale.setScalar(s);
      m.baseOps = m.baseOps.map((x) => x * 0.55);
    }
    const g = new THREE.Group();
    g.add(m);
    g.position.set(xOf(i), 0, zOf(i));
    // plinth ring, pillar of light and a year marker on the road
    const ring = polyline(circlePts(0, 0, 5.5, 64).map(([x, z]) => [x, 0.03, z]), { color: C.gold, intensity: 2 });
    const ring2 = polyline(circlePts(0, 0, 6.2, 64).map(([x, z]) => [x, 0.03, z]), { color: C.gold, intensity: 1, opacity: 0.4 });
    const pillar = glow(C.gold, 18);
    pillar.position.y = 3;
    g.add(ring, ring2, pillar);
    const tick = polyline([[-2.2, 0.03, zOf(i)], [2.2, 0.03, zOf(i)]], { color: C.goldHot, intensity: 3 });
    const yl = label(lab.toUpperCase(), '', { align: 'center', scale: 0.9, spacing: 20, color: '#ffe6b0' });
    yl.position.set(0, 0.8, zOf(i) + 2.5);
    scene.add(g, tick, yl);
    return { g, m, ring, ring2, pillar, tick, yl, i };
  });
  const star = spark(C.goldHot, 0.6);
  scene.add(star);

  const cur = (t) => (t < INTRO ? -1 : Math.min(N - 1, Math.floor((t - INTRO) / STEP)));

  function update(lt, t) {
    const outro = seg(t, T_END, T_END + 4.5);
    const i = cur(t);
    if (t < INTRO) {
      // opening: a slow crane down the golden road
      camera.clearViewOffset();
      const k = E.io(seg(t, 0, INTRO));
      camera.position.set(lerp(0, 2, k), lerp(26, 9, k), lerp(90, 36, k));
      camera.lookAt(0, 2, lerp(-40, 0, k));
    } else if (outro > 0) {
      camera.clearViewOffset();
      const k = E.io(outro), zl = zOf(N - 1);
      camera.position.set(lerp(xOf(N - 1) + 8, 30, k), lerp(6, 70, k), lerp(zl + 14, zl - 70, k));
      camera.lookAt(lerp(xOf(N - 1), 0, k), lerp(3, 0, k), lerp(zOf(N - 1), zl * 0.45, k));
    } else {
      // each milestone is a turntable hero shot, framed on the right of the layout
      const st = stationTime(i);
      const ang = (i % 2 ? -0.6 : 0.6) + (t - st) * 0.32;
      const r = 20 - (t - st) * 0.7;
      camera.position.set(xOf(i) + Math.sin(ang) * r, 5.2 + Math.sin(t * 0.7) * 0.4, zOf(i) + Math.cos(ang) * r);
      camera.lookAt(xOf(i), 3.3, zOf(i));
      camera.setViewOffset(W, H, -W * 0.19, 0, W, H);
    }
    motes.position.set(camera.position.x, 0, camera.position.z - 40);
    motes.drift(t);
    items.forEach((it) => {
      const st = stationTime(it.i);
      let a;
      if (outro > 0) a = 0.18 * E.sine(outro);
      else a = it.i === i ? 1 : 0;
      it.g.visible = a > 0.002;
      it.yl.setOpacity(0);
      it.tick.setOpacity(t < INTRO ? 0.6 : outro > 0 ? 0.6 : 0.25);
      if (!it.g.visible) return;
      it.m.setOpacity(a);
      it.m.setPrint(outro > 0 ? 1 : E.out(seg(t, st + 0.1, st + 1.2)));
      it.m.rotation.y = (t - st) * 0.15;
      it.ring.setOpacity(a).setProgress(outro > 0 ? 1 : E.out(seg(t, st, st + 0.8)));
      it.ring2.setOpacity(a * 0.6);
      it.pillar.setOpacity(a * 0.05);
    });
    star.position.set(0, 0.4, camera.position.z - 16);
    star.setOpacity(t < INTRO ? 1 : 0);
    sky.setOpacity(0.5 + outro * 0.5);
  }

  // ---------------------------------------------------------------- motion graphics layer
  const fmt = (y) => (y < 0 ? `${Math.round(-y)} BC` : y < 1000 ? `AD ${Math.round(y)}` : `${Math.round(y)}`);
  const LOC = [
    ['IONIA', 38.4, 27.1], ['ATHENS', 37.97, 23.73], ['ALEXANDRIA', 31.2, 29.9], ['ANTIKYTHERA', 35.9, 23.3],
    ['ROME', 41.89, 12.49], ['ROME', 41.9, 12.48], ['CONSTANTINOPLE', 41.0, 28.98], ['PARIS', 48.85, 2.35],
    ['RUNNYMEDE', 51.44, -0.56], ['FLORENCE', 43.77, 11.26], ['MAINZ', 50.0, 8.27], ['MILAN', 45.46, 9.19],
    ['PALOS → THE BAHAMAS', 37.2, -6.9], ['FROMBORK', 54.36, 19.68], ['PADUA', 45.4, 11.88], ['LONDON', 51.5, -0.12],
    ['CAMBRIDGE', 52.2, 0.12], ['CREMONA', 45.13, 10.02], ['BIRMINGHAM', 52.48, -1.9], ['PHILADELPHIA', 39.95, -75.16],
    ['RAINHILL', 53.41, -2.76], ['NEW YORK', 40.7, -74.0], ['PARIS', 48.86, 2.29], ['KITTY HAWK', 36.06, -75.7],
    ['BERN', 46.95, 7.45], ['CAMBRIDGE', 52.2, 0.12], ['CAPE CANAVERAL', 28.57, -80.65], ['GENEVA · CERN', 46.23, 6.05],
  ];
  const MAP = { x: 96, y: 700, w: 470, h: 210, lon0: -92, lon1: 42, lat0: 22, lat1: 62 };
  const mx = (lon) => MAP.x + ((lon - MAP.lon0) / (MAP.lon1 - MAP.lon0)) * MAP.w;
  const my = (lat) => MAP.y + ((MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0)) * MAP.h;
  const mapCanvas = (() => {
    const c = makeCanvas(W, H), g = c.getContext('2d'), D = EARTH.dots;
    g.fillStyle = 'rgba(143,210,255,0.35)';
    for (let k = 0; k < D.length; k += 2) {
      const lat = D[k] / 10, lon = D[k + 1] / 10;
      if (lon < MAP.lon0 || lon > MAP.lon1 || lat < MAP.lat0 || lat > MAP.lat1) continue;
      g.fillRect(mx(lon) - 1, my(lat) - 1, 2, 2);
    }
    return c;
  })();
  Film.caption = () => {}; // the line is set into the layout instead

  // transitions: a different graphic wipe at every cut
  function wipe(ctx, k, style, col) {
    // k: 0..1 over the transition; the cut happens at k = 0.5
    const c = Math.sin(k * Math.PI);
    ctx.save();
    ctx.fillStyle = col;
    if (style === 0) { // diagonal band
      const x = lerp(-W * 0.6, W * 1.6, E.io(k));
      ctx.beginPath(); ctx.moveTo(x - 500, 0); ctx.lineTo(x + 300, 0); ctx.lineTo(x - 100, H); ctx.lineTo(x - 900, H); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(x - 420, 0); ctx.lineTo(x + 220, 0); ctx.lineTo(x - 180, H); ctx.lineTo(x - 820, H); ctx.fill();
    } else if (style === 1) { // shutters
      for (let s = 0; s < 8; s++) { const w = (W / 8) * E.io(clamp(c * 1.3 - s * 0.03)); ctx.fillStyle = col; ctx.fillRect(s * (W / 8) + (W / 8 - w) / 2, 0, w, H); ctx.fillStyle = '#ffc36a'; ctx.fillRect(s * (W / 8) + (W / 8 - w) / 2, 0, 2, H * c); }
    } else if (style === 2) { // iris
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, Math.max(0, (1 - c) * 1200), 0, TAU, true); ctx.fill('evenodd');
      ctx.strokeStyle = '#ffc36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.max(1, (1 - c) * 1200), 0, TAU); ctx.stroke();
    } else { // split panels
      const h = (H / 2) * E.io(c);
      ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
      ctx.fillStyle = '#ffc36a'; ctx.fillRect(0, h - 3, W, 3); ctx.fillRect(0, H - h, W, 3);
    }
    ctx.restore();
  }
  function brackets(ctx, x, y, w, h, k, col) {
    const L = 46 * k;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L); ctx.stroke();
    }
    ctx.restore();
  }
  // big year, each character rising out of a mask
  function kineticYear(ctx, str, x, y, size, k, col) {
    ctx.save();
    ctx.font = `600 ${size}px ${FONT.cap}`;
    ctx.textBaseline = 'alphabetic';
    let cx = x;
    for (let j = 0; j < str.length; j++) {
      const ch = str[j], w = ctx.measureText(ch).width;
      const kk = E.expoOut(clamp(k * 1.8 - j * 0.09));
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - 4, y - size * 0.9, w + 8, size * 1.02); ctx.clip();
      // outlined echo behind
      ctx.strokeStyle = 'rgba(255,195,106,0.35)'; ctx.lineWidth = 1.5;
      ctx.strokeText(ch, cx + 10, y + (1 - kk) * size - 10);
      ctx.fillStyle = col;
      ctx.fillText(ch, cx, y + (1 - kk) * size);
      ctx.restore();
      cx += w + size * 0.02;
    }
    ctx.restore();
    return cx;
  }

  function hud(ctx, lt, t) {
    const i = cur(t);
    const outroT = t - T_END;
    // ---- opening titles
    if (t < INTRO + 0.3) {
      const n = Math.round(3000 * E.expoOut(seg(t, 0.4, 2.6)));
      const a = env(t, 0.3, 0.7, INTRO - 0.5, INTRO);
      text(ctx, String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','), W / 2, H / 2 - 40, 230, { family: FONT.cap, weight: 600, color: '#ffe0a8', alpha: a, spacing: 10, glow: 0.35, glowBlur: 50 });
      const r = E.io(seg(t, 1.6, 2.4));
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffc36a'; ctx.fillRect(W / 2 - 420 * r, H / 2 + 70, 840 * r, 3); ctx.restore();
      text(ctx, 'YEARS', W / 2, H / 2 + 140, 64, { family: FONT.cap, color: '#fff3dc', alpha: a * seg(t, 1.9, 2.5), spacing: lerp(80, 40, E.out(seg(t, 1.9, 3.5))) });
      text(ctx, 'OF WESTERN ACHIEVEMENT · 750 BC — TODAY', W / 2, H / 2 + 210, 24, { family: FONT.cap, color: '#8fdcff', alpha: a * seg(t, 2.4, 3.0), spacing: 12 });
    }
    // ---- milestones
    if (i >= 0 && outroT < 0) {
      const st = stationTime(i), lk = t - st;
      const S = STATIONS[i], [place, lat, lon] = LOC[i];
      const out = 1 - E.in(seg(lk, STEP - 0.35, STEP - 0.05));
      const eraNew = i === 0 || STATIONS[i - 1][5] !== S[5];
      // era tag
      const ek = E.out(seg(lk, 0.15, 0.6)) * out;
      ctx.save(); ctx.globalAlpha = ek;
      ctx.font = `600 22px ${FONT.cap}`; ctx.letterSpacing = '8px';
      const ew = ctx.measureText(S[5]).width + 36;
      ctx.strokeStyle = '#8fdcff'; ctx.lineWidth = 1.5; ctx.strokeRect(96, 120, ew * ek, 44);
      if (eraNew) { ctx.fillStyle = 'rgba(143,220,255,0.15)'; ctx.fillRect(96, 120, ew * ek, 44); }
      ctx.restore();
      text(ctx, S[5], 114, 143, 22, { family: FONT.cap, weight: 600, align: 'left', color: '#bfeaff', alpha: ek, spacing: 8 });
      text(ctx, `${String(i + 1).padStart(2, '0')}`, 96 + ew + 26, 143, 22, { family: FONT.cap, align: 'left', color: '#ffc36a', alpha: ek, spacing: 4 });
      // the year
      const yk = seg(lk, 0.1, 0.9);
      ctx.save(); ctx.globalAlpha = out;
      const yEnd = kineticYear(ctx, S[1].replace('c. ', ''), 92, 400, 190, yk, '#ffe0a8');
      ctx.restore();
      if (S[1].startsWith('c.')) text(ctx, 'CIRCA', 98, 196, 18, { family: FONT.cap, align: 'left', color: '#ffc36a', alpha: out * seg(lk, 0.5, 0.8), spacing: 10 });
      // rule that draws itself
      const rk = E.expoOut(seg(lk, 0.35, 1.0));
      ctx.save(); ctx.globalAlpha = out; ctx.fillStyle = '#ffc36a'; ctx.fillRect(96, 432, Math.max(560, yEnd - 96) * rk, 3); ctx.fillRect(96, 438, 120 * rk, 3); ctx.restore();
      // title, wiped in
      const tk = E.expoOut(seg(lk, 0.45, 1.1));
      ctx.save(); ctx.beginPath(); ctx.rect(90, 450, 1000 * tk, 90); ctx.clip();
      text(ctx, S[2], 96, 494, 58, { family: FONT.cap, weight: 600, align: 'left', color: '#fff3dc', alpha: out, spacing: lerp(18, 5, tk) });
      ctx.restore();
      // the line, typed
      const chars = Math.floor(S[3].length * clamp((lk - 0.8) / 1.0));
      text(ctx, S[3].slice(0, chars), 98, 560, 34, { italic: true, weight: 500, align: 'left', color: '#efe4cc', alpha: out * 0.95 });
      // place with a pin
      const pk = seg(lk, 0.9, 1.3) * out;
      text(ctx, '◉  ' + place, 98, 626, 20, { family: FONT.cap, align: 'left', color: '#8fdcff', alpha: pk, spacing: 8 });
      // the map: every place so far, joined in order
      const ma = E.out(seg(lk, 0.2, 0.7)) * out;
      ctx.save(); ctx.globalAlpha = ma * 0.9; ctx.drawImage(mapCanvas, 0, 0); ctx.restore();
      ctx.save(); ctx.globalAlpha = ma;
      ctx.strokeStyle = 'rgba(143,220,255,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(MAP.x - 8, MAP.y - 8, MAP.w + 16, MAP.h + 16);
      ctx.strokeStyle = 'rgba(255,195,106,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 0; k <= i; k++) { const X = mx(LOC[k][2]), Y = my(LOC[k][1]); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      for (let k = 0; k < i; k++) { ctx.fillStyle = 'rgba(255,195,106,0.7)'; ctx.fillRect(mx(LOC[k][2]) - 2, my(LOC[k][1]) - 2, 4, 4); }
      const X = mx(lon), Y = my(lat), pr = (lk * 1.2) % 1;
      ctx.strokeStyle = `rgba(255,230,180,${1 - pr})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 4 + pr * 26, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#fff1d0'; ctx.shadowColor = '#ffc36a'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(X, Y, 5, 0, TAU); ctx.fill();
      if (i === 12) { ctx.shadowBlur = 0; ctx.setLineDash([6, 6]); ctx.strokeStyle = '#ffc36a'; ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(mx(-40), my(40), mx(-75), my(24)); ctx.stroke(); }
      ctx.restore();
      text(ctx, `${lat.toFixed(2)}° N  ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'}`, MAP.x + MAP.w, MAP.y + MAP.h + 30, 16, { family: FONT.cap, align: 'right', color: '#8fdcff', alpha: ma * 0.8, spacing: 4 });
      // the hero frame around the model
      const bk = E.expoOut(seg(lk, 0.2, 0.8)) * out;
      brackets(ctx, 1030, 150, 790, 720, bk, 'rgba(255,195,106,0.8)');
      const spin = lk * 0.6;
      ctx.save(); ctx.globalAlpha = 0.35 * bk; ctx.strokeStyle = '#ffc36a'; ctx.setLineDash([2, 10]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(1425, 520, 360, spin, spin + TAU * E.out(seg(lk, 0.3, 1.2))); ctx.stroke(); ctx.restore();
      text(ctx, `FIG. ${String(i + 1).padStart(2, '0')}`, 1810, 890, 16, { family: FONT.cap, align: 'right', color: '#ffc36a', alpha: bk * 0.8, spacing: 6 });
      // progress: 28 segments across the top
      ctx.save();
      for (let k = 0; k < N; k++) {
        const x = 96 + k * ((W - 192) / N);
        ctx.fillStyle = k < i ? 'rgba(255,195,106,0.9)' : k === i ? `rgba(255,230,180,${0.5 + 0.5 * seg(lk, 0, 0.5)})` : 'rgba(255,195,106,0.18)';
        ctx.fillRect(x, 64, (W - 192) / N - 6, 4);
      }
      ctx.restore();
      text(ctx, S[1].toUpperCase(), W - 96, 143, 22, { family: FONT.cap, align: 'right', color: '#ffc36a', alpha: ek, spacing: 6 });
    }
    // ---- a graphic wipe across every cut
    for (let k = 0; k <= N; k++) {
      const tc = k < N ? stationTime(k) : T_END;
      const w = seg(t, tc - 0.28, tc + 0.28);
      if (w > 0 && w < 1) wipe(ctx, w, k % 4, k % 4 === 0 ? '#ffc36a' : '#07080b');
    }
    // ---- finale: every year in a flash, then the charge
    if (outroT > 0) {
      const flash = seg(outroT, 0.2, 2.2);
      if (flash > 0 && flash < 1) {
        const j = Math.min(N - 1, Math.floor(flash * N));
        text(ctx, STATIONS[j][1].replace('c. ', ''), W / 2, H / 2, 200, { family: FONT.cap, weight: 600, color: '#ffe0a8', alpha: 0.9, spacing: 8 });
        text(ctx, STATIONS[j][2], W / 2, H / 2 + 110, 34, { family: FONT.cap, color: '#fff3dc', alpha: 0.8, spacing: 12 });
      }
    }
    const o1 = env(t, T_END + 2.4, T_END + 3.0, DURATION - 4.4, DURATION - 3.6);
    if (o1 > 0) {
      text(ctx, '28 ACHIEVEMENTS · 3,000 YEARS', W / 2, H / 2 - 150, 24, { family: FONT.cap, color: '#8fdcff', alpha: o1, spacing: 12 });
      ['INHERITED FROM THE PAST', 'ENTRUSTED TO THE PRESENT', 'BUILT FOR THE FUTURE'].forEach((l, k) => {
        const kk = E.expoOut(seg(t, T_END + 2.6 + k * 0.5, T_END + 3.4 + k * 0.5));
        ctx.save(); ctx.beginPath(); ctx.rect(0, H / 2 - 90 + k * 75, W, 70); ctx.clip();
        text(ctx, l, W / 2, H / 2 - 50 + k * 75 + (1 - kk) * 70, 52, { family: FONT.cap, weight: 600, color: k === 2 ? '#ffd88a' : '#fff0d0', alpha: o1, spacing: 12 });
        ctx.restore();
      });
    }
    const o2 = env(t, DURATION - 3.4, DURATION - 2.6, DURATION - 0.6, DURATION);
    if (o2 > 0) {
      text(ctx, 'WHAT WILL WE ADD?', W / 2, H / 2, 86, { family: FONT.cap, weight: 600, color: '#fff3dc', alpha: o2, spacing: lerp(40, 18, E.out(seg(t, DURATION - 3.4, DURATION - 1))), glow: 0.4, glowBlur: 40 });
      ctx.save(); ctx.globalAlpha = o2; ctx.fillStyle = '#ffc36a'; const r = E.expoOut(seg(t, DURATION - 3.0, DURATION - 1.8)); ctx.fillRect(W / 2 - 360 * r, H / 2 + 70, 720 * r, 3); ctx.restore();
    }
  }
  return { scene, camera, update, hud, bloom: 0.95 };
});
