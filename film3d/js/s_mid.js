/* THE INHERITANCE 3D — Beauty, Science, Industry. */
import * as THREE from 'three';
import { scene3 } from './engine3d.js';
import { C, holo, polyline, strokes, glow, spark, grid, figure, pointCloud, camKeys, shake, word, callout, label, stars, bust, lineMat } from './holo.js';
import { extrudedGear } from './s_open.js';

const flash3 = (o, a) => o.setOpacity(a);

// ---------------------------------------------------------------- BEAUTY
function profileLine(wob, seed, sx = 1, sy = 1, dx = 0) {
  return resample(profileShape(0, 0, 1), 200).map(([x, y], i) => [
    (x * sx + dx + noise1(i * 0.05, seed) * wob) / 100,
    -(y * sy + noise1(i * 0.05 + 30, seed) * wob) / 100,
    0,
  ]);
}
export function domeGroup(color) {
  const g = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const q = (i / 24) * (Math.PI / 2);
    prof.push(new THREE.Vector2(Math.cos(q) * 2.3 * (1 - 0.08 * Math.sin(q * 2)), Math.sin(q) * 2.6));
  }
  const dome = holo(new THREE.LatheGeometry(prof, 16), { color, base: 0.06, threshold: 5, points: true, pointSize: 1 });
  dome.position.y = 1.4;
  const drum = holo(new THREE.CylinderGeometry(2.4, 2.4, 1.4, 32, 2, true), { color, base: 0.06, threshold: 5 });
  drum.position.y = 0.7;
  const lantern = holo(new THREE.CylinderGeometry(0.25, 0.35, 0.8, 8), { color: C.gold, base: 0.2 });
  lantern.position.y = 4.4;
  g.add(dome, drum, lantern);
  const parts = [dome, drum, lantern];
  g.setOpacity = (a) => { parts.forEach((p) => p.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setReveal = (h) => { parts.forEach((p) => p.setReveal(h - p.position.y)); return g; };
  return g;
}
function paintingTexture() {
  const c = makeCanvas(840, 660), g = c.getContext('2d');
  g.fillStyle = '#0a0806';
  g.fillRect(0, 0, 840, 660);
  g.lineCap = 'round';
  for (const s of BEAUTY.strokes) {
    g.strokeStyle = rgba(s.col, 0.85);
    g.lineWidth = s.w;
    g.beginPath();
    g.moveTo(420 + s.x, 330 + s.y);
    g.lineTo(420 + s.x + Math.cos(s.a) * s.l, 330 + s.y + Math.sin(s.a) * s.l);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

scene3('beauty', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.03);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 500);
  // drafting plane
  const desk = grid(40, 0.5, C.cyan, 0.3, 'xy');
  desk.position.z = -0.05;
  scene.add(desk);
  const sheetFrame = polyline(rectPts(-4, -3, 8, 6).map(([x, y]) => [x, y, 0]), { color: C.ice, opacity: 0.8 });
  scene.add(sheetFrame);
  const bird = spark(C.ice, 0.5);
  scene.add(bird);
  const tries = [profileLine(12, 3, 1.12, 0.92, 14), profileLine(8, 5, 0.9, 1.08, -10)].map((p) => {
    const l = polyline(p, { color: C.ice, intensity: 1.8 });
    scene.add(l);
    return l;
  });
  const final = polyline(profileLine(0, 1), { color: C.gold, intensity: 3 });
  scene.add(final);
  const studies = [[-3.3, 2.2], [3.3, 2.1], [-3.3, -2.1], [3.3, -2.0]].map(([x, y], i) => {
    const l = polyline(profileLine(3, 40 + i).map(([a, b]) => [x + a * 0.22, y + b * 0.22, 0]), { color: C.cyan, opacity: 0.6 });
    scene.add(l);
    return l;
  });
  const b3 = bust({ color: C.ice, depth: 1.6 });
  b3.scale.setScalar(1.1);
  scene.add(b3);
  const dome = domeGroup(C.cyan);
  dome.position.set(0, -2.6, 0);
  scene.add(dome);
  const frame = holo(new THREE.BoxGeometry(9.4, 7.4, 0.3), { color: C.gold, fill: false, wireOpacity: 1 });
  const frameInner = holo(new THREE.BoxGeometry(8.6, 6.6, 0.3), { color: C.gold, fill: false, wireOpacity: 0.7 });
  const paint = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 6.6), new THREE.MeshBasicMaterial({ map: paintingTexture(), transparent: true, color: 0x888888 }));
  paint.position.z = -0.2;
  const painting = new THREE.Group();
  painting.add(paint, frame, frameInner);
  scene.add(painting);
  // staff → hall
  const staff = [];
  for (let i = 0; i < 5; i++) {
    const l = polyline(Array.from({ length: 80 }, (_, k) => [lerp(-30, 30, k / 79), 0, 0]), { color: C.gold, intensity: 2.6 });
    scene.add(l);
    staff.push(l);
  }
  const notes = [];
  for (let i = 0; i < 26; i++) {
    const n = holo(new THREE.SphereGeometry(0.22, 10, 8), { color: C.goldHot, base: 0.5 });
    n.scale.set(1.3, 1, 1);
    n.userData = { x: i * 2.3, line: Math.floor(hash(i + 3) * 9) };
    scene.add(n);
    notes.push(n);
  }
  const hallPts = [];
  const hall = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const r = 9 + k * 1.4;
    const t = holo(new THREE.TorusGeometry(r, 0.06, 4, 90, Math.PI * 1.3), { color: C.gold, fill: false, threshold: 1, wireOpacity: 0.8 });
    t.rotation.x = -Math.PI / 2;
    t.rotation.z = -Math.PI * 0.15 + Math.PI;
    t.position.y = k * 1.6;
    hall.add(t);
    for (let i = 0; i < 60; i++) {
      const q = Math.PI * 0.85 + (i / 59) * Math.PI * 1.3;
      hallPts.push(Math.cos(q) * r, k * 1.6 + 0.3, Math.sin(q) * r);
    }
  }
  const aud = pointCloud(hallPts, { color: C.goldHot, size: 4, intensity: 2.5 });
  hall.add(aud);
  const orch = [];
  for (let i = 0; i < 90; i++) orch.push(((i % 15) - 7) * 0.5, 0.2, -2 - Math.floor(i / 15) * 0.6);
  hall.add(pointCloud(orch, { color: C.cyan, size: 5, intensity: 2.5 }));
  const chand = glow(C.goldHot, 3);
  chand.position.set(0, 9, -4);
  hall.add(chand);
  hall.position.set(0, -6, -14);
  scene.add(hall);

  const kin = [['SCULPTURE', 2.9], ['ARCHITECTURE', 4.3], ['PAINTING', 5.0], ['LITERATURE', 5.55], ['MUSIC', 6.1], ['THEATRE', 6.9]].map(([s, t]) => {
    const l = label(s, '', { align: 'center', scale: 0.9, spacing: 30 });
    l.t = t;
    scene.add(l);
    return l;
  });

  function update(lt) {
    // camera: over the sheet, then orbiting the bust, then pulling back into the hall
    if (lt < 2.7) camKeys(camera, [[0, 0, -1.2, 9, 0, 0, 0, 40], [2.7, 0, -0.6, 8, 0, 0, 0, 40]], lt);
    else if (lt < 4.2) {
      const q = lerp(-0.7, 0.7, E.sine(seg(lt, 2.7, 4.2)));
      camera.position.set(Math.sin(q) * 8, 0.6, Math.cos(q) * 8);
      camera.lookAt(0, 0.4, 0);
    } else camKeys(camera, [[4.2, 0, 1.5, 11, 0, 1, 0, 44], [5.8, 0, 0.6, 10, 0, 0.3, 0, 44], [6.5, 0, 0.3, 9, 0, 0, 0, 44], [8, 0, 5, 12, 0, 0, -14, 55]], lt);
    const deskA = 1 - seg(lt, 2.6, 3.2);
    desk.setOpacity(deskA * 0.8);
    sheetFrame.setOpacity(E.out(seg(lt, 0.6, 1.0)) * deskA);
    const land = E.io(seg(lt, 0, 0.8));
    bird.position.set(0, lerp(4, 0, land), lerp(5, 0, land));
    bird.setOpacity(1 - seg(lt, 0.7, 0.9));
    tries.forEach((l, i) => {
      const a = [1.05, 1.55][i], b = [1.45, 1.95][i];
      l.setProgress(seg(lt, a, b)).setOpacity(lerp(1, 0.1, seg(lt, b + 0.05, b + 0.2)) * deskA);
    });
    studies.forEach((l, i) => l.setProgress(seg(lt, 1.1 + i * 0.3, 1.4 + i * 0.3)).setOpacity(0.6 * deskA));
    final.setProgress(E.io(seg(lt, 2.05, 2.6))).setOpacity(1 - seg(lt, 3.0, 3.6));
    const rise = seg(lt, 2.7, 3.6);
    b3.setOpacity(E.sine(rise) * (1 - seg(lt, 4.1, 4.5)));
    b3.setReveal(lerp(-3, 3, E.io(rise)));
    b3.position.y = lerp(-0.3, 0.3, E.io(rise));
    dome.setOpacity(env(lt, 4.1, 4.3, 5.7, 6.0));
    dome.setReveal(lerp(0, 5, E.io(seg(lt, 4.1, 4.9))));
    painting.visible = lt > 4.9 && lt < 6.1;
    const pa = env(lt, 4.95, 5.25, 5.7, 6.0);
    frame.setOpacity(pa); frameInner.setOpacity(pa);
    paint.material.opacity = pa * seg(lt, 5.0, 5.5);
    const bend = E.io(seg(lt, 6.4, 7.3));
    const sA = env(lt, 5.65, 6.0, 7.2, 7.6);
    staff.forEach((l, i) => {
      l.setOpacity(sA).setProgress(E.io(seg(lt, 5.65 + i * 0.05, 6.0 + i * 0.05)));
      const a = l.geometry.attributes.position;
      for (let k = 0; k < 80; k++) {
        const x = lerp(-30, 30, k / 79);
        a.setXYZ(k, x * lerp(1, 0.4, bend), (i - 2) * 0.6 + bend * 3, -bend * Math.abs(x) * 0.3);
      }
      a.needsUpdate = true;
    });
    notes.forEach((n) => {
      const x = ((n.userData.x - (lt - 5.6) * 12) % 60 + 60) % 60 - 30;
      n.position.set(x, (n.userData.line - 4) * 0.3, 0);
      n.setOpacity(sA * (1 - bend));
    });
    const hA = seg(lt, 6.6, 7.4);
    hall.visible = hA > 0;
    hall.children.forEach((c) => c.setOpacity && c.setOpacity(hA));
    kin.forEach((l) => {
      l.position.set(0, -1.6, 3);
      l.setOpacity(env(lt, l.t - 0.05, l.t + 0.1, l.t + 0.45, l.t + 0.6) * 0.9);
      l.scale.set(0.9 * (2048 / 192) * (1 + (lt - l.t) * 0.08), 0.9 * (1 + (lt - l.t) * 0.08), 1);
    });
  }
  return { scene, camera, update, bloom: 0.9 };
});

// ---------------------------------------------------------------- SCIENCE
function terrain(w, d, color, seed, amp = 1.5) {
  const g = new THREE.PlaneGeometry(w, d, 60, 30);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, (noise1(x * 0.15, seed) * 0.6 + noise1(z * 0.2 + 7, seed + 1) * 0.4) * amp + Math.max(0, -z) * 0.02);
  }
  g.computeVertexNormals();
  return holo(g, { color, fill: false, wireframe: true, wireOpacity: 0.28 });
}

scene3('science', async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 2000);
  const sky = stars(5000, 400, 13);
  scene.add(sky);
  const hill = terrain(80, 40, C.cyan, 3);
  hill.position.set(0, -3, -10);
  scene.add(hill);
  const obs = figure({ color: C.cyan, points: true });
  obs.position.set(-1.5, -2.6, -4);
  obs.rotation.y = 0.9;
  obs.pose({ rArm: -1.2, lArm: -1.0, head: -0.3 });
  scene.add(obs);
  const scope = holo(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 12, 1, true), { color: C.gold, base: 0.15 });
  scope.position.set(-1.0, -1.1, -4.1);
  scope.rotation.set(0, 0, -0.9);
  scene.add(scope);
  const target = spark(C.goldHot, 0.8);
  target.position.set(14, 12, -60);
  scene.add(target);

  // Jupiter and the Medicean moons
  const jup = new THREE.Group();
  jup.position.set(0, 0, -200);
  const jBody = holo(new THREE.SphereGeometry(4, 36, 24), { color: C.goldHot, base: 0.01, wireframe: true, wireOpacity: 0.08, fresnel: 0.6, fillIntensity: 0.35 });
  jup.add(jBody);
  const bands = [];
  for (let i = -3; i <= 3; i++) {
    const y = i * 0.9;
    const r = Math.sqrt(16 - y * y);
    const b = polyline(circlePts(0, 0, r * 1.01, 80).map(([x, z]) => [x, y, z]), { color: i % 2 ? C.ember : C.goldHot, opacity: 0.7 });
    jup.add(b);
    bands.push(b);
  }
  const moons = [0, 1, 2, 3].map((i) => { const m = glow(C.ice, 1.3); jup.add(m); return m; });
  const cGal = callout('GALILEO', 'The moons of Jupiter · January 1610', { offset: [6, 5, 0], scale: 1.6, color: C.gold });
  cGal.position.set(4, 3, 0);
  jup.add(cGal);
  scene.add(jup);

  // the old model: spheres within spheres, epicycles
  const geo = new THREE.Group();
  geo.position.set(0, 0, -400);
  GEO_EPI.forEach((s, i) => {
    const l = polyline(s.map(([x, y]) => [x / 40, y / 40, 0]), { color: i === 0 ? C.goldHot : C.cyan, intensity: 2.2 });
    geo.add(l);
  });
  const armRings = [0, 1, 2].map((i) => {
    const r = holo(new THREE.TorusGeometry(8.4, 0.03, 4, 120), { color: C.cyan, fill: false, threshold: 1, wireOpacity: 0.5 });
    r.rotation.set(Math.PI / 2 + i * 0.4, i * 0.7, 0);
    geo.add(r);
    return r;
  });
  const strike = [polyline([[-8, 8, 1], [8, -8, 1]], { color: C.ember, intensity: 4 }), polyline([[8, 8, 1], [-8, -8, 1]], { color: C.ember, intensity: 4 })];
  strike.forEach((l) => geo.add(l));
  const shards = [];
  const R = rng(4);
  for (let i = 0; i < 1200; i++) {
    const q = R() * TAU, r = 2 + R() * 8;
    shards.push(Math.cos(q) * r, Math.sin(q) * r, (R() - 0.5) * 2);
  }
  const shardBase = shards.slice();
  const shardP = pointCloud(shards, { color: C.cyan, size: 4, intensity: 2.5 });
  geo.add(shardP);
  scene.add(geo);

  // the new model
  const helio = new THREE.Group();
  helio.position.set(0, 0, -400);
  helio.rotation.x = 0.42;
  const sun = spark(C.goldHot, 2.4);
  helio.add(sun);
  const orbits = ORBITS.map((r, i) => {
    const o = polyline(circlePts(0, 0, r / 40, 160).map(([x, z]) => [x, 0, z]), { color: i === 2 ? C.gold : C.cyan, intensity: 2.2 });
    helio.add(o);
    const p = glow(i === 2 ? '#9fd0ff' : C.goldHot, 0.7 + i * 0.15);
    helio.add(p);
    return { o, p, r: r / 40, i };
  });
  const gear = extrudedGear(235 / 40, 36, 0.4, C.gold);
  gear.rotation.x = -Math.PI / 2;
  helio.add(gear);
  scene.add(helio);
  const authority = word('AUTHORITY', { size: 2.2, depth: 0.5, color: C.cyan, base: 0.01, fillIntensity: 0.35 });
  authority.position.set(0, 3.2, -392);
  const evidence = word('EVIDENCE', { size: 2.6, depth: 0.6, color: C.goldHot, base: 0.01, fillIntensity: 0.35 });
  evidence.position.set(0, 3.2, -392);
  scene.add(authority, evidence);
  const aShards = [];
  for (let i = 0; i < 800; i++) aShards.push((R() - 0.5) * 20, 3.2 + (R() - 0.5) * 2.4, -392 + (R() - 0.5));
  const aBase = aShards.slice();
  const aP = pointCloud(aShards, { color: C.cyan, size: 3, intensity: 2.2 });
  scene.add(aP);
  const small = figure({ color: C.cyan });
  small.position.set(0, -9, -392);
  small.pose({ head: -0.5 });
  scene.add(small);

  function update(lt) {
    if (lt < 2.1) camKeys(camera, [[0, 2, 0.5, 6, 0, -0.5, -10, 42], [2.1, 1.2, 0.2, 2.5, -0.5, 0.5, -12, 38]], lt);
    else if (lt < 3.7) camKeys(camera, [[2.1, 0, 0, -178, 0, 0, -200, 40], [3.7, 0, 0, -184, 0, 0, -200, 40]], lt);
    else camKeys(camera, [[3.7, 0, 2, -370, 0, 0, -400, 44], [5.6, 2, 1, -374, 0, 0, -400, 44], [7.0, 0, 0, -366, 0, 1, -400, 48], [9.8, 0, 12, -372, 0, 0, -400, 50]], lt);
    const A = 1 - seg(lt, 1.9, 2.2);
    hill.setOpacity(A);
    obs.setOpacity(A);
    scope.setOpacity(A);
    target.setOpacity(A);
    sky.setOpacity(1);
    const J = env(lt, 2.0, 2.3, 3.5, 3.8);
    jBody.setOpacity(J);
    bands.forEach((b) => b.setOpacity(J * 0.8));
    jBody.rotation.y = lt * 0.4;
    [[7, 1.77], [10, 3.55], [13.5, 7.15], [17, 16.7]].forEach(([r, per], i) => {
      const q = (lt - 1.9) * 6 * 2.4 / per + i * 1.7;
      moons[i].position.set(Math.cos(q) * r, 0, Math.sin(q) * r * 0.2);
      moons[i].setOpacity(J);
    });
    cGal.setOpacity(J, seg(lt, 2.3, 3.0));
    const G = env(lt, 3.6, 3.9, 5.6, 6.0);
    geo.children.forEach((c, i) => { if (c.setProgress && i <= GEO_EPI.length) c.setProgress(E.io(seg(lt, 3.7 + i * 0.08, 4.4 + i * 0.08))); });
    geo.children.slice(0, GEO_EPI.length).forEach((c) => c.setOpacity(G));
    armRings.forEach((r, i) => { r.setOpacity(G); r.rotation.z = lt * (0.3 + i * 0.1); });
    const red = seg(lt, 4.75, 5.0);
    geo.children.slice(0, GEO_EPI.length).forEach((c) => c.setColor(red > 0.5 ? C.ember : C.cyan));
    strike[0].setProgress(E.out(seg(lt, 4.75, 5.0))).setOpacity(G);
    strike[1].setProgress(E.out(seg(lt, 5.0, 5.25))).setOpacity(G);
    const sh = seg(lt, 5.5, 6.6);
    const sp = shardP.geometry.attributes.position;
    for (let i = 0; i < sp.count; i++) sp.setXYZ(i, shardBase[i * 3] * (1 + sh * 2.5), shardBase[i * 3 + 1] * (1 + sh * 2.5), shardBase[i * 3 + 2] + sh * 10 * hash(i));
    sp.needsUpdate = true;
    shardP.setOpacity(sh > 0 && sh < 1 ? 1 - sh : 0);
    shardP.material.uniforms.uColor.value.set(C.ember);
    const Hn = seg(lt, 5.7, 6.4);
    const toGear = E.io(seg(lt, 8.5, 9.3));
    sun.setOpacity(Hn);
    sun.setSize(2.4 * (1 - toGear * 0.6));
    orbits.forEach(({ o, p, r, i }) => {
      const grow = E.out(seg(lt, 5.9 + i * 0.12, 6.9 + i * 0.12));
      o.scale.setScalar(Math.max(0.001, grow));
      o.setOpacity(Hn * (i === 2 ? 1 - seg(lt, 8.9, 9.2) : 1 - toGear));
      const q = lt * (1.4 / Math.sqrt(i + 1)) + i;
      p.position.set(Math.cos(q) * r * grow, 0, Math.sin(q) * r * grow);
      p.setOpacity(Hn * (1 - toGear));
    });
    gear.setOpacity(seg(lt, 8.8, 9.2));
    gear.rotation.z = lt * 1.2;
    small.setOpacity(Hn * (1 - toGear));
    const au = env(lt, 5.7, 6.0, 7.4, 7.7);
    authority.setOpacity(au * (lt < 7.4 ? 1 : 0));
    authority.setReveal(lerp(-8, 8, E.out(seg(lt, 5.7, 6.2))));
    const crack = seg(lt, 7.35, 8.2);
    const ap = aP.geometry.attributes.position;
    for (let i = 0; i < ap.count; i++) ap.setXYZ(i, aBase[i * 3] * (1 + crack * 0.6), aBase[i * 3 + 1] - crack * crack * 8 * hash(i + 9), aBase[i * 3 + 2] + crack * 4 * hash(i));
    ap.needsUpdate = true;
    aP.setOpacity(crack > 0 && crack < 1 ? 1 - crack : 0);
    evidence.setOpacity(env(lt, 7.7, 8.0, 9.2, 9.6));
    evidence.setReveal(lerp(-9, 9, E.out(seg(lt, 7.7, 8.3))));
  }
  return { scene, camera, update, bloom: 1.0 };
});

// ---------------------------------------------------------------- INDUSTRY
scene3('industry', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 2000);

  // A — workshop gears
  const shop = new THREE.Group();
  scene.add(shop);
  const GD = [
    { r: 3, n: 40, x: 0, y: 0, s: 2.6 },
    { r: 1.5, n: 20, x: 4.3, y: 1.7, s: 2.78 },
    { r: 0.9, n: 12, x: 6.52, y: -0.6, s: 2.94 },
  ];
  const gears = GD.map((d) => { const g = extrudedGear(d.r, d.n, 0.5, C.cyan); g.position.set(d.x, d.y, 0); g.d = d; shop.add(g); return g; });
  const extra = [];
  for (let i = 0; i < 8; i++) {
    const g = extrudedGear(0.8 + (i % 3) * 0.5, 10 + i, 0.3, C.gold);
    g.position.set(-10 + i * 3.2, i % 2 ? 5 : -5, -3 - (i % 3) * 2);
    shop.add(g);
    extra.push(g);
  }
  const maker = figure({ color: C.cyan, points: true });
  maker.position.set(-6, -3, 2);
  maker.rotation.y = 1.2;
  maker.scale.setScalar(2.2);
  shop.add(maker);
  const glint = spark(C.goldHot, 0.6);
  glint.position.set(6.3, 0.2, 0.5);
  shop.add(glint);
  const lamp = glow(C.gold, 8);
  lamp.position.set(-4, 7, -2);
  shop.add(lamp);

  // B — engine
  const eng = new THREE.Group();
  eng.position.set(0, 0, -100);
  const cyl = holo(new THREE.CylinderGeometry(1.4, 1.4, 5, 24, 1, true), { color: C.cyan, base: 0.05 });
  cyl.rotation.z = Math.PI / 2;
  cyl.position.x = -4;
  const piston = holo(new THREE.CylinderGeometry(1.3, 1.3, 0.8, 24), { color: C.gold, base: 0.2 });
  piston.rotation.z = Math.PI / 2;
  const fly = holo(new THREE.TorusGeometry(3, 0.2, 8, 48), { color: C.gold, base: 0.15 });
  fly.position.x = 5;
  const spokes = new THREE.Group();
  for (let i = 0; i < 8; i++) { const s = polyline([[0, 0, 0], [3, 0, 0]], { color: C.gold }); s.rotation.z = (i * TAU) / 8; spokes.add(s); }
  spokes.position.x = 5;
  const rod = polyline([[0, 0, 0], [1, 0, 0]], { color: C.goldHot, intensity: 3 });
  eng.add(cyl, piston, fly, spokes, rod);
  const steam = [];
  const R = rng(6);
  for (let i = 0; i < 400; i++) steam.push(0, 0, 0);
  const steamP = pointCloud(steam, { color: C.ice, size: 6, intensity: 1.4, opacity: 0.6 });
  eng.add(steamP);
  const cWatt = callout('WATT', 'Separate condenser · 1769', { offset: [3, 3.5, 0], scale: 1, color: C.gold });
  cWatt.position.set(-4, 1.6, 0);
  eng.add(cWatt);
  scene.add(eng);

  // C — railway across a wireframe land
  const rail = new THREE.Group();
  rail.position.set(0, 0, -300);
  const land = terrain(200, 120, C.violet, 9, 4);
  land.position.set(0, -2, -40);
  rail.add(land);
  const sunG = glow(C.ember, 40);
  sunG.position.set(0, 6, -140);
  rail.add(sunG);
  for (const x of [-0.7, 0.7]) rail.add(polyline([[x, -1.5, 30], [x, -1.5, -150]], { color: C.gold, intensity: 2.6 }));
  const ties = [];
  for (let i = 0; i < 60; i++) ties.push(-1, -1.52, 30 - i * 3, 1, -1.52, 30 - i * 3);
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(ties, 3));
  const tieL = new THREE.LineSegments(tg, lineMat({ color: C.gold, intensity: 1.4 }));
  rail.add(tieL);
  const loco = new THREE.Group();
  const lp = [];
  const addL = (geom, x, y, z, col = C.gold) => { const h = holo(geom, { color: col, base: 0.02, points: false }); h.position.set(x, y, z); loco.add(h); lp.push(h); return h; };
  const boiler = addL(new THREE.CylinderGeometry(0.7, 0.7, 4, 16, 3, true), 0, 0, 0);
  boiler.rotation.x = Math.PI / 2;
  addL(new THREE.BoxGeometry(1.8, 2, 1.8), 0, 0.3, 2.6);
  addL(new THREE.CylinderGeometry(0.25, 0.35, 1.2, 10), 0, 1.2, -1.4);
  for (const z of [-1.2, 0, 1.2]) for (const x of [-0.8, 0.8]) { const w = addL(new THREE.TorusGeometry(0.55, 0.06, 6, 20), x, -0.6, z, C.cyan); w.rotation.y = Math.PI / 2; }
  loco.position.set(0, -0.6, 0);
  rail.add(loco);
  const smoke = [];
  for (let i = 0; i < 300; i++) smoke.push(0, 0, 0);
  const smokeP = pointCloud(smoke, { color: C.ice, size: 7, intensity: 1, opacity: 0.5 });
  rail.add(smokeP);
  const cSte = callout('STEPHENSON', '“Rocket” · 1829', { offset: [2.5, 2.5, 0], scale: 0.8, color: C.gold });
  cSte.position.set(1, 1.5, 0);
  loco.add(cSte);
  scene.add(rail);

  // D — bridge
  const br = new THREE.Group();
  br.position.set(0, 0, -600);
  const water = grid(300, 2, C.cyan, 0.35);
  water.position.y = -6;
  br.add(water);
  const towers = [-14, 14].map((x) => {
    const t = holo(new THREE.BoxGeometry(1.4, 22, 1.4, 1, 8, 1), { color: C.cyan, base: 0.06 });
    t.position.set(x, 5, 0);
    br.add(t);
    return t;
  });
  const cables = new THREE.Group();
  for (const z of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60, x = lerp(-14, 14, u); pts.push([x, 16 - Math.sin(u * Math.PI) * 13, z]); }
    cables.add(polyline(pts, { color: C.gold, intensity: 3 }));
    cables.add(polyline([[-14, 16, z], [-44, -1, z]], { color: C.gold, intensity: 3 }));
    cables.add(polyline([[14, 16, z], [44, -1, z]], { color: C.gold, intensity: 3 }));
  }
  br.add(cables);
  const hangers = [];
  for (let i = 1; i < 30; i++) {
    const u = i / 30, x = lerp(-14, 14, u);
    const h = polyline([[x, 16 - Math.sin(u * Math.PI) * 13, 0], [x, 0, 0]], { color: C.goldHot, opacity: 0.7 });
    h.x = x;
    br.add(h);
    hangers.push(h);
  }
  const deckL = polyline([[-44, 0, 0], [0, 0, 0]], { color: C.ice, intensity: 3 });
  const deckR = polyline([[44, 0, 0], [0, 0, 0]], { color: C.ice, intensity: 3 });
  br.add(deckL, deckR);
  const cBr = callout('BROOKLYN BRIDGE', '1,595 ft main span · 1883', { offset: [4, 6, 0], scale: 1.8, color: C.gold });
  cBr.position.set(14, 16, 0);
  br.add(cBr);
  scene.add(br);

  // E — turbine and lightning
  const tb = new THREE.Group();
  tb.position.set(0, 0, -900);
  const blades = new THREE.Group();
  for (let i = 0; i < 28; i++) {
    const b = holo(new THREE.BoxGeometry(0.12, 4.2, 0.9), { color: C.gold, base: 0.01, threshold: 1, fillIntensity: 0.4 });
    b.position.y = 2.6;
    const piv = new THREE.Group();
    piv.rotation.z = (i * TAU) / 28;
    b.rotation.y = 0.5;
    piv.add(b);
    blades.add(piv);
  }
  const hub = holo(new THREE.CylinderGeometry(0.8, 0.8, 1, 24), { color: C.goldHot, base: 0.3 });
  hub.rotation.x = Math.PI / 2;
  const ring = holo(new THREE.TorusGeometry(5.2, 0.15, 8, 90), { color: C.cyan, base: 0.2 });
  const coils = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const c = holo(new THREE.BoxGeometry(0.8, 1.4, 0.8), { color: C.ember, base: 0.2 });
    const q = (i * TAU) / 16;
    c.position.set(Math.cos(q) * 6.2, Math.sin(q) * 6.2, 0);
    c.rotation.z = q;
    coils.add(c);
  }
  tb.add(blades, hub, ring, coils);
  const bolts = new THREE.Group();
  for (let i = 0; i < 16; i++) bolts.add(polyline(Array.from({ length: 24 }, () => [0, 0, 0]), { color: '#cfe6ff', intensity: 5 }));
  tb.add(bolts);
  const cFar = callout('FARADAY', 'Electromagnetic induction · 1831', { offset: [3, 3, 0], scale: 1, color: C.cyan });
  cFar.position.set(5, 5, 0);
  tb.add(cFar);
  scene.add(tb);

  function update(lt, t) {
    // camera
    if (lt < 3.45) {
      const push = E.in(seg(lt, 2.9, 3.45));
      camera.position.set(1.5 - push, 0.5, 16 - push * 10);
      camera.lookAt(2, 0, 0);
    } else if (lt < 4.85) {
      const k = lt - 3.45;
      camera.position.set(-6 + k * 5, 3 - k, -88 - k * 2);
      camera.lookAt(0, 0, -100);
    } else if (lt < 6.35) {
      const k = lt - 4.85;
      camera.position.set(4.5 - k * 1.5, 1.2, -300 + 7 - k * 2);
      camera.lookAt(-2, 0, -300 - 2);
      loco.position.z = -k * 0.5;
    } else if (lt < 7.55) {
      const k = lt - 6.35;
      camera.position.set(-30 + k * 10, 8, -600 + 60 - k * 8);
      camera.lookAt(0, 6, -600);
    } else {
      const k = lt - 7.55;
      camera.position.set(0, 0, -900 + 20 - k * 6);
      camera.lookAt(0, 0, -900);
    }
    if (lt > 3.4 && lt < 4.2) shake(camera, 0.15 * (1 - seg(lt, 3.4, 4.2)), lt, 5);
    camera.updateProjectionMatrix();

    // A
    const a = workshopAngle(lt);
    const align = E.io(seg(lt, 2.3, 2.55));
    const jam = (lt > 0.45 && lt < 0.8) || (lt > 1.15 && lt < 1.5);
    gears.forEach((g, i) => {
      const dir = i % 2 ? -1 : 1;
      g.rotation.z = (a * GD[0].r) / g.d.r * dir + i * 0.1;
      const run = seg(lt, g.d.s, g.d.s + 0.2);
      g.setColor(jam ? C.ember : run > 0 ? C.gold : C.cyan);
      g.setGlitch(jam ? 1 : 0);
      g.setOpacity(1);
      if (i === 2) g.position.set(g.d.x + (1 - align) * 0.8, g.d.y + (1 - align) * 0.5, 0);
    });
    extra.forEach((g, i) => { g.setOpacity(seg(lt, 3.0 + i * 0.05, 3.15 + i * 0.05)); g.rotation.z = lt * (i % 2 ? -3 : 3); });
    const slump = E.io(seg(lt, 1.4, 1.9)) * (1 - E.io(seg(lt, 1.95, 2.25)));
    maker.pose({ head: slump * 0.6, rArm: -0.6 - (1 - slump) * 0.5, lArm: -0.3 });
    maker.position.y = -3 - slump * 0.6;
    maker.setOpacity(1 - seg(lt, 3.0, 3.4));
    glint.setOpacity(env(lt, 1.95, 2.1, 2.4, 2.6));
    lamp.setOpacity(0.3);
    shop.visible = lt < 3.45;

    // B
    eng.visible = lt > 3.35 && lt < 4.9;
    const ph = lt * 22;
    const px = 5 + Math.cos(ph) * 2.2, py = Math.sin(ph) * 2.2;
    const pistonX = px - Math.sqrt(7 * 7 - py * py);
    piston.position.x = pistonX - 0.5;
    const ra = rod.geometry.attributes.position;
    ra.setXYZ(0, pistonX, 0, 0); ra.setXYZ(1, px, py, 0); ra.needsUpdate = true;
    fly.rotation.z = ph; spokes.rotation.z = ph;
    const sp = steamP.geometry.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const age = ((lt * 1.3 + hash(i) * 3) % 1);
      sp.setXYZ(i, -6.5 - age * 5 + hash(i + 1) * 2, 1.5 + age * 6 + hash(i + 2) * 2, (hash(i + 3) - 0.5) * 4);
    }
    sp.needsUpdate = true;
    cWatt.setOpacity(seg(lt, 3.6, 3.9), seg(lt, 3.6, 4.3));

    // C
    rail.visible = lt > 4.8 && lt < 6.4;
    land.position.z = -40 + ((lt * 30) % 4);
    tieL.position.z = (lt * 30) % 3;
    loco.children.forEach((c, i) => { if (i >= 3 && i < 9) c.rotation.x = lt * 20; });
    const smk = smokeP.geometry.attributes.position;
    for (let i = 0; i < smk.count; i++) {
      const age = ((lt * 1.6 + hash(i) * 3) % 1);
      smk.setXYZ(i, (hash(i + 4) - 0.5) * age * 3, 1.9 + age * 3 + hash(i + 5), -1.4 + loco.position.z + age * 14);
    }
    smk.needsUpdate = true;
    cSte.setOpacity(seg(lt, 5.1, 5.4), seg(lt, 5.1, 5.8));

    // D
    br.visible = lt > 6.25 && lt < 7.6;
    const tw = E.out(seg(lt, 6.3, 6.75));
    towers.forEach((t) => t.setReveal(lerp(-11, 11, tw)));
    const cab = E.io(seg(lt, 6.6, 7.05));
    cables.children.forEach((c) => c.setProgress(cab));
    const deck = E.io(seg(lt, 6.8, 7.3));
    deckL.setProgress(deck); deckR.setProgress(deck);
    hangers.forEach((h) => h.setOpacity(Math.abs(h.x) > (1 - deck) * 44 - 30 ? seg(lt, 6.9, 7.2) : 0));
    cBr.setOpacity(seg(lt, 7.0, 7.3), seg(lt, 7.0, 7.5));

    // E
    tb.visible = lt > 7.5;
    blades.rotation.z = (lt - 7.5) * (6 + (lt - 7.5) * 8);
    const gen = seg(lt, 8.2, 8.6);
    coils.children.forEach((c) => c.setOpacity(gen));
    cFar.setOpacity(gen, seg(lt, 8.2, 8.6));
    const bolt = seg(lt, 8.55, 9.1);
    const fr = Math.round(t * FPS);
    bolts.children.forEach((l, b) => {
      const r = rng(fr * 31 + b);
      const q = (b / 16) * TAU + r() * 0.3;
      const pos = l.geometry.attributes.position;
      let d = 6;
      for (let k = 0; k < 24; k++) {
        d += 0.8 + r() * 0.9;
        const qq = q + (r() - 0.5) * 0.25;
        pos.setXYZ(k, Math.cos(qq) * d, Math.sin(qq) * d, (r() - 0.5) * 2);
      }
      pos.needsUpdate = true;
      l.geometry.computeBoundingSphere();
      l.setProgress(E.out(bolt)).setOpacity(bolt > 0 ? 1 : 0);
    });
  }
  return { scene, camera, update, bloom: 1.0, flash: (lt) => 0.5 * Math.sin(seg(lt, 8.55, 9.1) * Math.PI) + 0.25 * env(lt, 3.38, 3.42, 3.45, 3.7) };
});
