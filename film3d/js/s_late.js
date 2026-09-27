/* THE INHERITANCE 3D — Connection, Medicine, Exploration. */
import * as THREE from 'three';
import { scene3 } from './engine3d.js';
import { model } from './models.js';
import { C, holo, polyline, glow, spark, grid, figure, pointCloud, camKeys, shake, word, callout, label, stars, bust, hand, earthPoints, latLon, morphLines, fillMat } from './holo.js';

// ---------------------------------------------------------------- shared: Earth
export function earth3(R = 5, o = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 48), fillMat({ color: '#2a6fb0', base: 0.05, intensity: 0.35, fresnel: 1.0 }));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 64, 48), fillMat({ color: '#6fb8ff', base: 0.0, intensity: 0.45, fresnel: 1.6 }));
  const land = earthPoints(R, o.landColor || C.ice, o.size || 2.2);
  const D = EARTH.dots, lp = [];
  for (let i = 0; i < D.length; i += 2) if (hash(i) < 0.12) { const v = latLon(D[i] / 10, D[i + 1] / 10, R * 1.004); lp.push(v.x, v.y, v.z); }
  const lights = pointCloud(lp, { color: C.gold, size: (o.size || 2.2) * 1.2, intensity: 2.2, max: 3.2 });
  g.add(body, atmo, land, lights);
  g.land = land;
  g.lights = lights;
  g.setOpacity = (a, lightsA = 1) => {
    body.material.uniforms.uOpacity.value = a;
    atmo.material.uniforms.uOpacity.value = a;
    land.setOpacity(a);
    lights.setOpacity(a * lightsA);
    g.visible = a > 0.002;
    return g;
  };
  return g;
}

// ---------------------------------------------------------------- CONNECTION
scene3('connect', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 1000);
  const floor = grid(120, 1, C.cyan, 0.3);
  floor.position.y = -2;
  scene.add(floor);
  const wirePts = [];
  for (let i = 0; i <= 100; i++) { const u = i / 100; wirePts.push([lerp(-14, 14, u), 1.6 - Math.sin(u * Math.PI) * 0.8, -2]); }
  const wire = polyline(wirePts, { color: C.ice, opacity: 0.5, intensity: 1.6 });
  scene.add(wire);
  const pulse = spark('#cfe6ff', 0.5);
  scene.add(pulse);
  const morse = label('• — • •   — • —', '', { align: 'center', scale: 0.8, color: '#cfe6ff' });
  morse.position.set(0, 3.2, -2);
  scene.add(morse);
  const her = figure({ color: C.gold, points: true });
  her.position.set(-12, -2, -2);
  her.rotation.y = Math.PI / 2;
  her.scale.setScalar(2.2);
  her.pose({ rArm: -2.2, rArmZ: 0.3 });
  const him = figure({ color: C.cyan, points: true });
  him.position.set(12, -2, -2);
  him.rotation.y = -Math.PI / 2;
  him.scale.setScalar(2.2);
  him.pose({ lArm: -2.4, lArmZ: -0.4 });
  scene.add(her, him);
  const voice = polyline(Array.from({ length: 60 }, () => [0, 0, 0]), { color: C.gold, intensity: 3.2 });
  scene.add(voice);
  const warm = glow(C.gold, 6);
  warm.position.set(12, 1.5, -2);
  scene.add(warm);
  const cBell = callout('BELL', 'Telephone · 1876', { offset: [2, 2.5, 0], scale: 0.8, color: C.gold });
  cBell.position.set(-10, 2.4, -2);
  scene.add(cBell);

  // the map that folds into a globe
  const globe = new THREE.Group();
  globe.position.set(0, 0, -60);
  scene.add(globe);
  const D = EARTH.dots, n = D.length / 2;
  const flat = new Float32Array(n * 3), sph = new Float32Array(n * 3);
  const R = 6;
  for (let i = 0; i < n; i++) {
    const lat = D[i * 2] / 10, lon = D[i * 2 + 1] / 10;
    flat[i * 3] = (lon / 180) * 22;
    flat[i * 3 + 1] = (lat / 90) * 11;
    flat[i * 3 + 2] = 0;
    const v = latLon(lat, lon, R);
    sph[i * 3] = v.x; sph[i * 3 + 1] = v.y; sph[i * 3 + 2] = v.z;
  }
  const map = pointCloud(Array.from(flat), { color: C.ice, size: 2.2, intensity: 2 });
  globe.add(map);
  const arcs = LINKS.map(([a, b]) => {
    const A = latLon(...CITIES[a], R), B = latLon(...CITIES[b], R);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const lift = mid.clone().normalize().multiplyScalar(R + A.distanceTo(B) * 0.45);
    const curve = new THREE.QuadraticBezierCurve3(A, lift, B);
    const l = polyline(curve.getPoints(48).map((p) => [p.x, p.y, p.z]), { color: C.gold, intensity: 3 });
    l.curve = curve;
    const s = glow(C.goldHot, 0.35);
    globe.add(l, s);
    return { l, s };
  });
  const cities = [];
  Object.values(CITIES).forEach(([la, lo]) => { const v = latLon(la, lo, R * 1.01); cities.push(v.x, v.y, v.z); });
  const cityP = pointCloud(cities, { color: C.goldHot, size: 8, intensity: 3, max: 12 });
  globe.add(cityP);
  const eif = model('eiffel', { height: 16, color: C.gold, wireColor: C.goldHot });
  eif.position.set(0, -8, 12);
  globe.add(eif);
  const cEif = callout('EIFFEL TOWER', 'Paris 1889 \u00b7 wireless from its summit, 1903', { offset: [3, 2, 0], scale: 0.6, color: C.gold });
  cEif.position.set(0.5, 8.2, 12);
  globe.add(cEif);
  const rings = [];
  for (let i = 0; i < 6; i++) {
    const r = holo(new THREE.TorusGeometry(1, 0.02, 4, 90), { color: C.gold, fill: false, threshold: 1 });
    rings.push(r);
    globe.add(r);
  }

  function update(lt) {
    if (lt < 2.8) camKeys(camera, [[0, 0, 1, 16, 0, 0.5, -2, 50], [2.8, 0, 0.6, 14, 0, 0.5, -2, 50]], lt);
    else camKeys(camera, [[2.8, 0, 0, -32, 0, 0, -60, 50], [4.3, 0, 0, -40, 0, 0, -60, 46], [5.2, 4, 1, -32, 0, 1, -48, 50]], lt);
    const AB = 1 - seg(lt, 2.7, 3.0);
    floor.setOpacity(AB);
    wire.setProgress(E.out(seg(lt, 0, 0.5))).setOpacity(AB * 0.8);
    const pp = seg(lt, 0.1, 0.8);
    pulse.position.set(...pointAt(wirePts.map((p) => [p[0], p[1]]), pp), -2);
    pulse.setOpacity(pp > 0 && pp < 1 ? 1 : 0);
    morse.setOpacity(env(lt, 0.3, 0.5, 0.9, 1.2));
    const who = E.sine(seg(lt, 0.6, 1.0)) * AB;
    her.setOpacity(who); him.setOpacity(who);
    const vw = seg(lt, 0.9, 2.1);
    const va = voice.geometry.attributes.position;
    for (let k = 0; k < 60; k++) {
      const u = clamp(vw - 0.14 + (k / 60) * 0.14);
      const [x, y] = pointAt(wirePts.map((p) => [p[0], p[1]]), u);
      va.setXYZ(k, x, y + Math.sin(k * 1.3 + lt * 30) * 0.5 * Math.sin((k / 60) * Math.PI), -2);
    }
    va.needsUpdate = true;
    voice.geometry.computeBoundingSphere();
    voice.setOpacity(vw > 0 && vw < 1 ? AB : 0);
    const heard = E.sine(seg(lt, 2.0, 2.5));
    him.setColor(heard > 0.5 ? C.gold : C.cyan);
    him.parts.head.rotation.z = heard * 0.2;
    warm.setOpacity(heard * 0.5 * AB);
    cBell.setOpacity(env(lt, 0.9, 1.2, 2.5, 2.8), seg(lt, 0.9, 1.6));

    const G = env(lt, 2.7, 3.0, 5.0, 5.2);
    const fold = E.io(seg(lt, 3.0, 4.2));
    const mp = map.geometry.attributes.position;
    for (let i = 0; i < n; i++) mp.setXYZ(i, lerp(flat[i * 3], sph[i * 3], fold), lerp(flat[i * 3 + 1], sph[i * 3 + 1], fold), lerp(flat[i * 3 + 2], sph[i * 3 + 2], fold));
    mp.needsUpdate = true;
    map.geometry.computeBoundingSphere();
    map.setOpacity(G);
    globe.rotation.y = -0.4 + fold * (lt - 3) * 0.5;
    arcs.forEach(({ l, s }, i) => {
      const rv = E.out(seg(lt, 3.9 + i * 0.05, 4.4 + i * 0.05));
      l.setProgress(rv).setOpacity(G);
      const q = (lt * 0.9 + i * 0.37) % 1;
      s.position.copy(l.curve.getPoint(q));
      s.setOpacity(rv >= 1 ? G : 0);
    });
    cityP.setOpacity(G * seg(lt, 3.9, 4.2));
    const D2 = seg(lt, 4.4, 5.2);
    const eA = seg(lt, 4.25, 4.5);
    eif.setOpacity(eA);
    eif.setPrint(E.io(seg(lt, 4.25, 4.75)));
    eif.rotation.y = lt * 0.3;
    cEif.setOpacity(eA, seg(lt, 4.5, 4.9));
    rings.forEach((r, i) => {
      const k = ((lt - 4.4) * 0.9 + i / 6) % 1;
      r.scale.setScalar(0.5 + k * 16);
      r.setOpacity(D2 > 0 ? (1 - k) * Math.min(1, D2 * 3) : 0);
      r.rotation.set(Math.PI / 2, 0, 0);
      r.position.set(0, 8.2, 12);
    });
  }
  return { scene, camera, update, bloom: 1.0 };
});

// ---------------------------------------------------------------- MEDICINE
function heartCloud(n = 5000, s = 0.18) {
  const p = [], R = rng(21);
  for (let i = 0; i < n; i++) {
    const t = R() * TAU, u = R() * Math.PI;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const k = Math.sin(u), rr = 0.7 + R() * 0.3;
    p.push(x * s * rr * (0.4 + 0.6 * k), y * s * rr * (0.4 + 0.6 * k), Math.cos(u) * 5 * s * rr);
  }
  return pointCloud(p, { color: C.ember, size: 2.4, intensity: 2.6 });
}
function ecgLine(n = 240) {
  return polyline(Array.from({ length: n }, () => [0, 0, 0]), { color: C.cyan, intensity: 3 });
}
function ecgUpdate(l, lt, strength, width = 24, y0 = -3.2, z = 2) {
  const amp = lerp(0.35, 1.6, strength), period = lerp(1.5, 0.82, strength), span = 3.2;
  const a = l.geometry.attributes.position, n = a.count;
  for (let i = 0; i < n; i++) {
    const ts = lt - span + (i / (n - 1)) * span;
    const ph = ((ts % period) + period) % period / period;
    let y = 0;
    if (ph > 0.3 && ph < 0.34) y = -0.18 * Math.sin(((ph - 0.3) / 0.04) * Math.PI);
    else if (ph > 0.38 && ph < 0.4) y = 0.25 * ((ph - 0.38) / 0.02);
    else if (ph > 0.4 && ph < 0.43) y = lerp(0.25, -1, (ph - 0.4) / 0.03);
    else if (ph > 0.43 && ph < 0.47) y = lerp(-1, 0.35, (ph - 0.43) / 0.04);
    else if (ph > 0.47 && ph < 0.5) y = lerp(0.35, 0, (ph - 0.47) / 0.03);
    else if (ph > 0.6 && ph < 0.72) y = -0.22 * Math.sin(((ph - 0.6) / 0.12) * Math.PI);
    a.setXYZ(i, lerp(-width / 2, width / 2, i / (n - 1)), y0 - y * amp, z);
  }
  a.needsUpdate = true;
  l.geometry.computeBoundingSphere();
  l.setColor(strength > 0.5 ? C.gold : C.cyan);
}

scene3('medicine', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.03);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 1000);
  // the bedside: a parent's hand holding a child's
  const parent = bust({ color: C.gold, depth: 1.2, points: false });
  parent.scale.setScalar(0.85);
  parent.position.set(-2.4, 0.6, -1.4);
  parent.rotation.set(0, 0.25, -0.35);
  const face = figure({ color: C.cyan });
  face.scale.setScalar(2.2);
  face.position.set(5.6, -1.2, -1.6);
  face.rotation.set(0, 0, Math.PI / 2);
  const bed = holo(new THREE.BoxGeometry(9, 0.4, 3, 12, 1, 4), { color: C.cyan, base: 0.01, fillIntensity: 0.3, wireOpacity: 0.25 });
  bed.position.set(3.5, -1.9, -1.4);
  const eyeGlint = spark(C.goldHot, 0.3);
  eyeGlint.position.set(2.15, -0.95, -1.4);
  const ecg = ecgLine();
  const parent2 = parent, kid = { setOpacity() {}, curl() {} };
  scene.add(parent, face, bed, eyeGlint, ecg);
  const dawn = glow(C.gold, 18);
  dawn.position.set(8, 6, -12);
  scene.add(dawn);
  // microscopic world
  const micro = new THREE.Group();
  micro.position.set(0, 0, -80);
  scene.add(micro);
  const cells = [];
  const R = rng(55);
  for (let i = 0; i < 26; i++) {
    const c = holo(new THREE.SphereGeometry(0.9 + R() * 0.8, 20, 14), { color: C.cyan, base: 0.04, wireOpacity: 0.15, threshold: 30, fillIntensity: 0.6 });
    c.position.set((R() - 0.5) * 22, (R() - 0.5) * 12, -R() * 14);
    c.scale.set(1, 0.8 + R() * 0.3, 1);
    const nuc = glow('#ff9fd0', 1.1);
    c.add(nuc);
    c.userData = { ph: R() * 6 };
    micro.add(c);
    cells.push(c);
  }
  const helixM = model('dna', { height: 14, color: C.cyan, wireColor: C.ice });
  helixM.position.set(-7, -7, -8);
  helixM.rotation.z = 0.35;
  micro.add(helixM);
  const cDNA = callout('THE DOUBLE HELIX', 'Watson, Crick, Franklin, Wilkins \u00b7 1953', { offset: [-6, 3, 0], scale: 0.7, color: C.cyan });
  cDNA.position.set(-8, 4, -8);
  micro.add(cDNA);
  const scopeM = model('microscope', { height: 7, color: C.gold });
  scopeM.position.set(0, -3.5, 16);
  micro.add(scopeM);
  const cHooke = callout('HOOKE', 'Micrographia \u00b7 1665', { offset: [2.5, 1.8, 0], scale: 0.5, color: C.gold });
  cHooke.position.set(1.8, 2.2, 16);
  micro.add(cHooke);
  const heart = heartCloud();
  heart.position.set(0, 0, -6);
  micro.add(heart);
  const cHarvey = callout('HARVEY', 'The circulation of the blood · 1628', { offset: [3, 2.5, 0], scale: 0.8, color: C.gold });
  cHarvey.position.set(2.5, 1.5, -6);
  micro.add(cHarvey);
  const cCell = callout('THE CELL', 'Hooke, 1665 · Pasteur, 1861', { offset: [3, 2.5, 0], scale: 0.8, color: C.cyan });
  cCell.position.set(3, 2, -2);
  micro.add(cCell);

  function update(lt) {
    const bedA = 1 - env(lt, 1.8, 2.1, 4.1, 4.5);
    const strong = E.io(seg(lt, 4.4, 5.4));
    if (lt < 1.8 || lt > 4.2) camKeys(camera, [[0, -0.5, 1.5, 12, 0.8, -0.4, -1, 40], [2.2, -0.2, 1.3, 11, 0.8, -0.4, -1, 40], [4.2, 0.5, 1.0, 11, 1.0, -0.4, -1, 40], [7.3, 0.8, 1.1, 12.5, 1.0, -0.4, -1, 40]], lt);
    else camKeys(camera, [[1.8, 0, 1, -54, 0, 0, -64, 45], [2.5, 0, 0, -60, 0, 0, -80, 45], [3.2, 0, 0, -66, 0, 0, -86, 45], [4.2, 0, 0, -70, 0, 0, -86, 42]], lt);
    const glintA = E.out(seg(lt, 5.0, 5.6));
    parent.setOpacity(bedA); kid.setOpacity(bedA);
    kid.curl(lerp(0.2, 0.7, strong), lerp(0.3, 0.8, strong));
    face.setOpacity(bedA * 0.8);
    bed.setOpacity(bedA);
    parent.rotation.z = -0.35 + glintA * 0.12;
    eyeGlint.setOpacity(glintA * bedA);
    ecgUpdate(ecg, lt, strong);
    ecg.setOpacity(bedA);
    dawn.setOpacity(E.sine(seg(lt, 4.6, 7.3)) * 0.35 * bedA);
    const M = env(lt, 1.8, 2.2, 4.1, 4.5);
    const cellsA = M * (1 - seg(lt, 3.1, 3.4));
    cells.forEach((c) => { c.setOpacity(cellsA); c.children.forEach((k) => k.setOpacity && k.setOpacity(cellsA * 0.6)); c.position.y += Math.sin(lt + c.userData.ph) * 0.002; c.rotation.y = lt * 0.2 + c.userData.ph; });
    const hA = M * seg(lt, 3.1, 3.4);
    const dA = M * seg(lt, 2.9, 3.3);
    helixM.setOpacity(dA);
    helixM.setPrint(E.io(seg(lt, 2.9, 3.6)));
    helixM.rotation.y = lt * 0.8;
    cDNA.setOpacity(dA, seg(lt, 3.3, 3.8));
    const sA = env(lt, 1.8, 2.0, 2.4, 2.6);
    scopeM.setOpacity(sA); scopeM.setPrint(E.io(seg(lt, 1.8, 2.2))); scopeM.rotation.y = lt * 0.5;
    cHooke.setOpacity(sA, seg(lt, 1.9, 2.3));
    const beat = 1 + Math.pow(Math.max(0, Math.sin(lt * 7)), 8) * 0.08;
    heart.scale.setScalar(beat);
    heart.rotation.y = lt * 0.6;
    heart.setOpacity(hA);
    cHarvey.setOpacity(hA, seg(lt, 3.3, 3.8));
    cCell.setOpacity(cellsA, seg(lt, 2.4, 2.9));
  }
  return { scene, camera, update, bloom: 1.0 };
});

// ---------------------------------------------------------------- EXPLORATION
scene3('explore', async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 5000);
  // A — the blueprint
  const bp = grid(80, 0.5, '#6fb3ff', 0.5, 'xy');
  bp.position.z = -1;
  scene.add(bp);
  const plane = new THREE.Group();
  const pp = [];
  const addP = (geom, x, y, z, rx = 0) => { const h = holo(geom, { color: C.ice, base: 0.02, axis: 0, fillIntensity: 0.5 }); h.position.set(x, y, z); h.rotation.x = rx; plane.add(h); pp.push(h); return h; };
  addP(new THREE.BoxGeometry(12.3 * 0.5, 0.06, 1.2, 12, 1, 3), 0, 1, 0);
  addP(new THREE.BoxGeometry(12.3 * 0.5, 0.06, 1.2, 12, 1, 3), 0, -0.6, 0);
  addP(new THREE.BoxGeometry(0.4, 0.4, 4.2), 0, 0.1, -0.4, 0);
  addP(new THREE.BoxGeometry(1.4, 0.05, 0.5), 0, 0.4, 2.6);
  for (let i = -2; i <= 2; i++) addP(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), i * 1.2, 0.2, 0);
  plane.rotation.set(0.25, -0.5, 0);
  scene.add(plane);
  const wf = model('wrightFlyer', { scale: 0.62, color: C.ice, wireColor: '#dff6ff' });
  wf.rotation.set(0.25, -0.5 + Math.PI / 2, 0);
  scene.add(wf);
  const cWright = callout('WRIGHT FLYER', 'Kitty Hawk · 17 December 1903 · 12 seconds', { offset: [3, 2.2, 0], scale: 0.62, color: C.cyan });
  cWright.position.set(2.5, 1.2, 0);
  scene.add(cWright);
  const evo = morphLines(16, 40, { color: C.gold, intensity: 3 });
  scene.add(evo);

  // C — the launch
  const launch = new THREE.Group();
  launch.position.set(0, 0, -200);
  scene.add(launch);
  const ground = grid(400, 2, C.cyan, 0.25);
  ground.position.y = -4;
  launch.add(ground);
  const tower = holo(new THREE.BoxGeometry(1.6, 18, 1.6, 1, 12, 1), { color: C.cyan, fill: false, wireframe: true, wireOpacity: 0.5 });
  tower.position.set(26, 5, -60);
  tower.visible = false;
  const prof = [];
  for (let i = 0; i <= 30; i++) {
    const y = (i / 30) * 16;
    const r = y < 12 ? 1.1 : 1.1 * (1 - (y - 12) / 4.2);
    prof.push(new THREE.Vector2(Math.max(0.02, r), y));
  }
  const rocket = holo(new THREE.LatheGeometry(prof, 20), { color: C.goldHot, base: 0.03, threshold: 10, points: true, pointSize: 1.2, fillIntensity: 0.6 });
  rocket.position.set(22.5, -4, -60);
  launch.add(rocket);
  rocket.visible = false;
  const sat = model('saturnV', { scale: 0.16, raw: true, color: C.goldHot, wireColor: C.goldHot });
  launch.add(sat);
  const lut = modelFromTower();
  launch.add(lut);
  const exhaust = [];
  for (let i = 0; i < 2500; i++) exhaust.push(0, 0, 0);
  const exP = pointCloud(exhaust, { color: '#ffb070', size: 10, intensity: 2.2, max: 14, opacity: 0.55 });
  launch.add(exP);
  const flame = glow('#ffd08a', 10);
  launch.add(flame);
  const watcher = bust({ color: C.cyan, depth: 1.4, points: false });
  watcher.scale.setScalar(1.6);
  watcher.position.set(-7, -1.5, -14);
  launch.add(watcher);
  const eyeG = spark(C.goldHot, 0.25);
  eyeG.position.set(-6.1, -1.1, -13.2);
  launch.add(eyeG);
  const cSat = callout('SATURN V', '111 metres · 3,400 tonnes of thrust', { offset: [5, 4, 0], scale: 1.6, color: C.gold });
  cSat.position.set(24, 8, -60);
  launch.add(cSat);

  // D — space: the Earth, and the Moon's horizon
  const space = new THREE.Group();
  space.position.set(0, 0, -2000);
  scene.add(space);
  const sky = stars(6000, 600, 21);
  space.add(sky);
  const earth = earth3(6, { size: 0.9 });
  earth.position.set(2, 0, -30);
  earth.rotation.set(0.4, 0.5, 0);
  space.add(earth);
  const mg = new THREE.SphereGeometry(80, 120, 60);
  const mp = mg.attributes.position, Rm = rng(8);
  const craters = [];
  for (let i = 0; i < 60; i++) craters.push([new THREE.Vector3(Rm() - 0.5, 1, Rm() - 0.5 - 0.2).normalize(), 0.02 + Rm() * 0.06]);
  const v = new THREE.Vector3();
  for (let i = 0; i < mp.count; i++) {
    v.fromBufferAttribute(mp, i).normalize();
    let d = 0;
    for (const [c, r] of craters) { const a = v.angleTo(c); if (a < r) d -= Math.cos((a / r) * Math.PI / 2) * r * 6; else if (a < r * 1.3) d += 0.3; }
    v.multiplyScalar(80 + d);
    mp.setXYZ(i, v.x, v.y, v.z);
  }
  mg.computeVertexNormals();
  const moon = holo(mg, { color: '#b9c3d0', fill: true, base: 0.01, wireframe: true, wireOpacity: 0.05, fillIntensity: 0.3 });
  moon.position.set(0, -88, -40);
  space.add(moon);
  const cApollo = callout('APOLLO 8', 'Earthrise · 24 December 1968', { offset: [4, 3, 0], scale: 0.9, color: C.ice });
  cApollo.position.set(6, 5, -30);
  space.add(cApollo);

  function update(lt, t) {
    if (lt < 3.3) camKeys(camera, [[0, 0, 0, 16, 0, 0, 0, 40], [1.8, 0, 0.5, 15, 0, 0.5, 0, 40], [3.3, 0, 3, 16, 0, 5, 0, 44]], lt);
    else if (lt < 6.0) {
      camKeys(camera, [[3.3, -9, 0.2, -190, 20, 4, -260, 45], [4.2, -9, 0.2, -190, 20, 5, -260, 45], [6.0, -9, 0.5, -190, 18, 16, -260, 50]], lt);
      if (lt > 4.0) shake(camera, 0.3 * (1 - seg(lt, 4.0, 5.9)), lt, 7);
    } else camKeys(camera, [[6.0, 0, 0, -1975, 2, 0, -2030, 40], [10.4, 0, 0, -1978, 2, 0, -2030, 40], [13.6, 0, -3, -1976, 2, 2, -2030, 40], [14.3, 0, -3, -1977, 2, 2, -2030, 40]], lt);

    const A = 1 - E.sine(seg(lt, 2.0, 2.6));
    bp.setOpacity(A * (1 - seg(lt, 1.3, 2.4)));
    const build = E.io(seg(lt, 0, 1.1));
    pp.forEach((p) => p.setOpacity(0));
    wf.setOpacity(A * (1 - seg(lt, 1.7, 2.0)));
    wf.setPrint(build);
    wf.position.y = -1 + E.io(seg(lt, 1.2, 2.0)) * 2;
    cWright.setOpacity(env(lt, 0.6, 0.9, 1.7, 2.0), seg(lt, 0.6, 1.2));
    const m = [CRAFT.biplane, CRAFT.prop, CRAFT.jet, CRAFT.rocket];
    let shape = m[0];
    [1.8, 2.35, 2.9].forEach((s, i) => { const k = E.io(seg(lt, s, s + 0.45)); if (k > 0) shape = morphShape(i === 0 ? m[0] : shape, m[i + 1], k); });
    evo.setShape(shape, 0.018);
    evo.position.set(lerp(0, 3, seg(lt, 1.6, 3.3)), lerp(2, 8, E.in(seg(lt, 2.6, 3.3))), 0);
    evo.rotation.z = -0.15 * seg(lt, 1.6, 3.3);
    evo.setOpacity(env(lt, 1.6, 1.9, 3.0, 3.3));

    launch.visible = lt > 3.25 && lt < 6.05;
    const ign = seg(lt, 4.0, 4.3);
    const climb = E.in(seg(lt, 4.3, 6.0));
    rocket.position.y = -4 + climb * 90;
    sat.position.set(22.5, -4 + climb * 90, -60);
    sat.setOpacity(1);
    sat.setPrint(E.io(seg(lt, 3.3, 3.9)));
    lut.setOpacity(1 - seg(lt, 5.5, 6));
    lut.setPrint(E.io(seg(lt, 3.3, 3.9)));
    flame.position.set(22.5, rocket.position.y - 0.5, -60);
    flame.setOpacity(ign * 0.5);
    const ex = exP.geometry.attributes.position;
    for (let i = 0; i < ex.count; i++) {
      const born = 4.0 + hash(i) * 2.0, age = lt - born;
      if (age < 0 || ign <= 0) { ex.setXYZ(i, 22.5, -100, -60); continue; }
      const onPad = hash(i + 7) < 0.6;
      const side = hash(i + 3) < 0.5 ? -1 : 1;
      if (onPad) ex.setXYZ(i, 22.5 + side * age * (6 + hash(i + 1) * 10), -3.6 + age * (0.5 + hash(i + 2) * 2), -60 + (hash(i + 4) - 0.5) * age * 8);
      else { const y0 = -4 + E.in(seg(born, 4.3, 6.0)) * 90; ex.setXYZ(i, 22.5 + (hash(i + 5) - 0.5) * age * 3, y0 - age * 6, -60 + (hash(i + 6) - 0.5) * age * 3); }
    }
    ex.needsUpdate = true;
    exP.setOpacity(ign * 0.25);
    watcher.setOpacity(1);
    watcher.setColor(ign > 0 ? '#ffb070' : C.cyan);
    eyeG.setOpacity(0.6 + ign * 0.4);
    cSat.setOpacity(env(lt, 3.5, 3.8, 4.6, 4.9), seg(lt, 3.5, 4.1));

    space.visible = lt >= 6.0;
    const s = E.sine(seg(lt, 6.2, 8.0));
    sky.setOpacity(s);
    earth.setOpacity(s, 0.6);
    earth.rotation.y = 0.5 + (lt - 6) * 0.05;
    const rise = E.io(seg(lt, 10.4, 13.6));
    moon.setOpacity(seg(lt, 10.2, 11.2) * 0.9);
    moon.position.y = lerp(-110, -88, rise);
    earth.position.y = lerp(0, 1.5, rise);
    cApollo.setOpacity(env(lt, 11.4, 11.8, 13.8, 14.3), seg(lt, 11.4, 12.2));
  }
  return { scene, camera, update, bloom: (lt) => (lt > 6 ? 0.8 : 1.0), flash: (lt) => 0.1 * env(lt, 4.0, 4.1, 4.15, 4.5) };
});

function modelFromTower() {
  // the launch umbilical tower alone, from the Saturn V model with its tower
  const m = model('saturnVTower', { scale: 0.16, raw: true, color: C.cyan });
  m.position.set(22.5, -4, -60);
  return m;
}
