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
      const s = Math.min(1, 13 / Math.max(m.width, m.depth));
      m.scale.setScalar(s);
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

  function camAt(t) {
    // position along the track, dwelling at each station then gliding on
    if (t < INTRO) {
      const k = E.io(seg(t, 0, INTRO));
      return { z: lerp(80, zOf(0) + 16, k), f: 0, i: 0, x: lerp(0, -2.5, k), y: lerp(22, 4.5, k) };
    }
    const u = (t - INTRO) / STEP;
    const i = Math.min(N - 1, Math.floor(u)), frac = u - i;
    const mv = i < N - 1 ? E.io(clamp((frac - 0.6) / 0.4)) : 0;
    const z = lerp(zOf(i), zOf(Math.min(N - 1, i + 1)), mv) + 16;
    const side = lerp(-xOf(i) * 0.35, -xOf(Math.min(N - 1, i + 1)) * 0.35, mv);
    return { z, f: frac, i, mv, x: side + Math.sin(t * 0.4) * 0.8, y: 4.5 + Math.sin(t * 0.3) * 0.5 };
  }

  function update(lt, t) {
    const c = camAt(t);
    const outro = seg(t, T_END, T_END + 4.5);
    if (outro > 0) {
      const k = E.io(outro);
      const zl = zOf(N - 1);
      camera.position.set(lerp(c.x, 30, k), lerp(c.y, 70, k), lerp(c.z, zl - 70, k));
      camera.lookAt(lerp(xOf(N - 1), 0, k), lerp(3, 0, k), lerp(zOf(N - 1), zl * 0.45, k));
    } else {
      camera.position.set(c.x, c.y, c.z);
      const ti = c.i, tj = Math.min(N - 1, c.i + 1), mv = c.mv || 0;
      camera.lookAt(lerp(xOf(ti), xOf(tj), mv) * 0.8, 3.2, lerp(zOf(ti), zOf(tj), mv));
    }
    motes.position.z = camera.position.z - 60;
    motes.drift(t);
    const cur = t < INTRO ? -1 : (t - INTRO) / STEP;
    items.forEach((it) => {
      const st = stationTime(it.i);
      const near = Math.abs(cur - it.i) < 2.2 || outro > 0;
      const a = outro > 0 ? lerp(env(t, st - 1.2, st - 0.4, st + STEP + 0.6, st + STEP + 1.6), 0.35, E.sine(outro)) : env(t, st - 1.4, st - 0.5, st + STEP + 0.6, st + STEP + 1.6);
      it.g.visible = near && a > 0.002;
      if (!it.g.visible) { it.yl.setOpacity(outro > 0 ? 0 : 0); it.tick.setOpacity(0.5); return; }
      it.m.setOpacity(a);
      it.m.setPrint(E.out(seg(t, st - 1.3, st + 0.4)));
      it.m.rotation.y = (t - st) * 0.22 + (it.i % 2 ? -0.5 : 0.5);
      it.ring.setOpacity(a).setProgress(E.out(seg(t, st - 1.3, st - 0.3)));
      it.ring2.setOpacity(a * 0.6);
      it.pillar.setOpacity(a * 0.05);
      it.tick.setOpacity(0.5 + a * 0.5);
      it.yl.setOpacity(a * (1 - outro));
      it.yl.lookAt(camera.position);
    });
    star.position.set(0, 0.4, camera.position.z - 16);
    star.setOpacity(1 - outro);
    sky.setOpacity(0.5 + outro * 0.5);
  }

  const fmt = (y) => (y < 0 ? `${Math.round(-y)} BC` : y < 1000 ? `AD ${Math.round(y)}` : `${Math.round(y)}`);
  function hud(ctx, lt, t) {
    const lb = letterbox(t);
    const fadeHud = 1 - seg(t, T_END, T_END + 1.2);
    const cur = clamp((t - INTRO) / STEP, 0, N - 1);
    const i = Math.floor(cur), frac = cur - i;
    const mv = i < N - 1 ? E.io(clamp((frac - 0.6) / 0.4)) : 0;
    const year = lerp(STATIONS[i][0], STATIONS[Math.min(N - 1, i + 1)][0], mv);
    const on = seg(t, INTRO - 0.8, INTRO) * fadeHud;
    if (on > 0) {
      // year counter
      text(ctx, t < INTRO ? '' : fmt(year), 90, lb + 88, 76, { family: FONT.cap, align: 'left', color: '#ffe0a8', alpha: on, spacing: 6, glow: 0.4, glowBlur: 30 });
      // era
      const era = STATIONS[mv > 0.5 ? Math.min(N - 1, i + 1) : i][5];
      text(ctx, era, W - 90, lb + 76, 26, { family: FONT.cap, align: 'right', color: '#8fdcff', alpha: on * 0.9, spacing: 10 });
      text(ctx, `${String(i + 1).padStart(2, '0')} / ${N}`, W - 90, lb + 112, 20, { family: FONT.cap, align: 'right', color: '#cfefff', alpha: on * 0.6, spacing: 6 });
      // milestone title, pushed in as each station arrives
      const tA = env(frac, 0.02, 0.14, 0.6, 0.72) * on;
      const st = STATIONS[i];
      if (tA > 0) {
        ctx.save();
        ctx.globalAlpha = tA;
        ctx.fillStyle = 'rgba(255,190,90,0.9)';
        ctx.fillRect(90, H - lb - 176, 6, 70);
        ctx.restore();
        text(ctx, st[2], 116, H - lb - 150, 50, { family: FONT.cap, align: 'left', color: '#fff3dc', alpha: tA, spacing: 5 + (1 - E.out(seg(frac, 0.02, 0.2))) * 20 });
        text(ctx, st[1], 118, H - lb - 110, 24, { family: FONT.cap, align: 'left', color: '#ffc36a', alpha: tA, spacing: 8 });
      }
      // progress rail across the frame
      const y0 = H - lb - 40, x0 = 90, x1 = W - 90;
      ctx.save();
      ctx.globalAlpha = on;
      ctx.strokeStyle = 'rgba(255,200,120,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      const yx = (y) => x0 + ((y + 800) / 2800) * (x1 - x0);
      STATIONS.forEach(([y], k) => { ctx.fillStyle = k <= i ? 'rgba(255,210,140,0.95)' : 'rgba(255,210,140,0.3)'; ctx.fillRect(yx(y) - 1, y0 - 7, 2, 14); });
      for (const [y, s] of [[-500, '500 BC'], [0, '0'], [500, '500'], [1000, '1000'], [1500, '1500'], [2000, '2000']]) text(ctx, s, yx(y), y0 + 22, 14, { family: FONT.cap, color: '#ffd9a0', alpha: 0.55, spacing: 3 });
      ctx.fillStyle = '#fff1d0';
      ctx.shadowColor = 'rgba(255,190,90,0.9)';
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(yx(year), y0, 6, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // opening title
    const it = env(t, 0.6, 1.6, 3.6, 4.6);
    if (it > 0) {
      text(ctx, 'THREE THOUSAND YEARS', W / 2, H / 2 - 30, 84, { family: FONT.cap, color: '#fff0d0', alpha: it, spacing: lerp(30, 16, E.out(seg(t, 0.6, 4))), glow: 0.35, glowBlur: 40 });
      text(ctx, 'ACHIEVEMENTS OF WESTERN CIVILIZATION', W / 2, H / 2 + 50, 26, { family: FONT.cap, color: '#ffc36a', alpha: it, spacing: 12 });
    }
    // closing
    const o1 = env(t, T_END + 1.5, T_END + 2.6, DURATION - 4.4, DURATION - 3.6);
    if (o1 > 0) {
      text(ctx, '750 BC — TODAY', W / 2, H / 2 - 120, 28, { family: FONT.cap, color: '#ffc36a', alpha: o1, spacing: 14 });
      text(ctx, 'INHERITED FROM THE PAST', W / 2, H / 2 - 40, 44, { family: FONT.cap, color: '#fff0d0', alpha: o1, spacing: 12 });
      text(ctx, 'ENTRUSTED TO THE PRESENT', W / 2, H / 2 + 20, 44, { family: FONT.cap, color: '#fff0d0', alpha: o1 * seg(t, T_END + 2.2, T_END + 3.0), spacing: 12 });
      text(ctx, 'BUILT FOR THE FUTURE', W / 2, H / 2 + 80, 44, { family: FONT.cap, color: '#ffd88a', alpha: o1 * seg(t, T_END + 2.8, T_END + 3.6), spacing: 12 });
    }
    const o2 = env(t, DURATION - 3.4, DURATION - 2.4, DURATION - 0.6, DURATION);
    if (o2 > 0) text(ctx, 'WHAT WILL WE ADD?', W / 2, H / 2, 70, { family: FONT.cap, color: '#fff3dc', alpha: o2, spacing: 18, glow: 0.4, glowBlur: 40 });
  }
  return { scene, camera, update, hud, bloom: 0.95 };
});
