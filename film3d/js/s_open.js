/* THE INHERITANCE 3D — Opening: the book, the hands, knowledge rising off the page. */
import * as THREE from 'three';
import { scene3 } from './engine3d.js';
import { C, holo, polyline, strokes, glow, spark, beam, grid, dust, hand, figure, pointCloud, camKeys, shake, callout } from './holo.js';
import { book, PW3, PH3 } from './book3d.js';
import { model } from './models.js';

// page-local (0..600, 0..800) → world on the right (+1) or left (-1) page
export const pageXZ = (side, px, py) => [side > 0 ? (px / 600) * PW3 : -PW3 + (px / 600) * PW3, -PH3 / 2 + (py / 800) * PH3];

export function extrudedGear(r, teeth, depth = 0.12, color = C.cyan) {
  const pts = gearPts(0, 0, r, teeth, 0.16, 0, teeth * 8);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.18, 0, TAU, true);
  shape.holes.push(hole);
  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 });
  geom.translate(0, 0, -depth / 2);
  return holo(geom, { color, threshold: 30, base: 0.14, points: false });
}

function euclid3D(r, color = C.gold) {
  const g = new THREE.Group();
  const e = euclidShape(0, 0, r);
  e.strokes.forEach((s) => g.add(polyline(s.map(([x, y]) => [x, -y, 0]), { color, intensity: 2.6 })));
  g.setProgress = (p) => { g.children.forEach((l, i) => l.setProgress(clamp(p * 1.6 - i * 0.15))); return g; };
  g.setOpacity = (a) => { g.children.forEach((l) => l.setOpacity(a)); g.visible = a > 0.002; return g; };
  return g;
}
export { euclid3D };

function temple(color = C.cyan) {
  const g = new THREE.Group();
  const parts = [];
  const add = (geom, x, y, z) => { const h = holo(geom, { color, threshold: 30, base: 0.08 }); h.position.set(x, y, z); g.add(h); parts.push(h); };
  add(new THREE.BoxGeometry(1.5, 0.08, 0.8), 0, 0.04, 0);
  for (let i = 0; i < 6; i++) for (const z of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.045, 0.05, 0.7, 10), -0.62 + i * 0.248, 0.43, z);
  add(new THREE.BoxGeometry(1.55, 0.1, 0.85), 0, 0.83, 0);
  const roof = new THREE.CylinderGeometry(0.01, 0.55, 1.6, 3, 1);
  roof.rotateZ(Math.PI / 2);
  roof.rotateX(Math.PI / 6 + Math.PI);
  roof.scale(1, 0.45, 1);
  add(roof, 0, 1.0, 0);
  g.setOpacity = (a) => { parts.forEach((p) => p.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setReveal = (v) => { parts.forEach((p) => p.setReveal(v - p.position.y)); return g; };
  return g;
}
export { temple };

function armillary(color = C.cyan) {
  const g = new THREE.Group();
  const rings = [];
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.6 - i * 0.02, 0.008, 6, 90));
    const h = holo(r.geometry, { color, fill: false, wireframe: false, threshold: 1, wireOpacity: 0.9 });
    h.rotation.set(i * 0.6, i * 0.9, i * 0.3);
    rings.push(h);
    g.add(h);
  }
  const core = glow(C.gold, 0.25);
  g.add(core);
  g.spin = (t) => rings.forEach((r, i) => { r.rotation.y = i * 0.9 + t * (0.3 + i * 0.1); r.rotation.x = i * 0.6 + t * 0.2 * (i % 2 ? 1 : -1); });
  g.setOpacity = (a) => { rings.forEach((r) => r.setOpacity(a)); core.setOpacity(a); g.visible = a > 0.002; return g; };
  return g;
}
export { armillary };

scene3('open', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 500);
  const bk = book();
  scene.add(bk);
  const floor = grid(60, 0.5, C.cyan, 0.25);
  floor.position.y = -0.16;
  scene.add(floor);
  const light = beam(0.25, 1.9, 9, C.gold, 0.1);
  light.position.set(1.8, 4.4, -0.6);
  light.rotation.set(0.1, 0, 0.28);
  scene.add(light);
  const motes = dust(600, [4, 4, 4], 5);
  motes.position.set(1.2, 1.6, -0.2);
  scene.add(motes);

  // the two generations
  const elder = hand({ color: C.gold, scale: 0.55 });
  const child = hand({ color: C.cyan, scale: 0.42, left: true });
  scene.add(elder, child);

  // knowledge rising off the pages
  const eu = euclid3D(0.9);
  const tp = temple();
  const arm = armillary();
  const vit = new THREE.Group();
  const vitFig = figure({ color: C.cyan });
  vitFig.scale.setScalar(0.45);
  vitFig.position.y = -0.38;
  const vitRing = polyline(circlePts(0, 0, 0.42, 72).map(([x, y]) => [x, y, 0]), { color: C.gold });
  const vitSq = polyline(rectPts(-0.37, -0.37, 0.74, 0.74).map(([x, y]) => [x, y, 0]), { color: C.gold, opacity: 0.7 });
  vit.add(vitFig, vitRing, vitSq);
  vit.setOpacity = (a) => { vitFig.setOpacity(a); vitRing.setOpacity(a); vitSq.setOpacity(a); vit.visible = a > 0.002; return vit; };
  const g1 = extrudedGear(0.45, 18, 0.12, C.cyan);
  scene.add(eu, tp, arm, vit, g1);
  const mParth = model('parthenon', { height: 0.9, color: C.gold });
  const mOrr = model('orrery', { height: 0.8, color: C.gold });
  const mVit = model('vitruvian', { height: 1.3, color: C.cyan });
  const mAnt = model('antikythera', { height: 0.9, color: C.gold });
  scene.add(mParth, mOrr, mVit, mAnt);
  [tp, arm, vit, g1].forEach((o) => o.setOpacity(0));
  const risers = [
    { o: eu, side: -1, s: 4.4, e: 5.0, y: 0.9 },
    { o: mParth, side: 1, s: 4.4, e: 5.0, y: 0.15, print: true },
    { o: mOrr, side: -1, s: 4.9, e: 5.5, y: 0.2, print: true },
    { o: mVit, side: 1, s: 4.9, e: 5.5, y: 0.2, print: true },
    { o: mAnt, side: -1, s: 5.4, e: 6.0, y: 0.3, print: true },
  ];

  // vignettes: stone and hammer, telescope, gears
  const [sx, sz] = pageXZ(-1, 300, 250);
  const stone = holo(new THREE.BoxGeometry(0.9, 0.5, 0.6, 4, 3, 3), { color: C.cyan, base: 0.04, points: true, pointSize: 1 });
  stone.position.set(sx + 0.15, 0.25, sz);
  const hammer = new THREE.Group();
  const handle = holo(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 8), { color: C.gold, base: 0.2 });
  handle.position.y = 0.4;
  const head = holo(new THREE.BoxGeometry(0.32, 0.14, 0.14), { color: C.gold, base: 0.25 });
  head.position.y = 0.82;
  hammer.add(handle, head);
  hammer.position.set(sx - 0.75, 0.35, sz);
  const chisel = holo(new THREE.CylinderGeometry(0.02, 0.035, 0.4, 6), { color: C.gold, base: 0.2 });
  chisel.position.set(sx - 0.22, 0.62, sz);
  chisel.rotation.z = 0.6;
  const chips = pointCloud(new Array(90).fill(0), { color: C.goldHot, size: 5, intensity: 3 });
  const crack = polyline([[0, 0.25, 0.301], [0.08, 0.12, 0.301], [0.03, 0.02, 0.301], [0.12, -0.1, 0.301], [0.07, -0.25, 0.301]].map(([x, y, z]) => [x - 0.2, y, z]), { color: C.goldHot });
  stone.add(crack);
  const strikeFlash = spark(C.gold, 0.35);
  strikeFlash.position.set(sx - 0.38, 0.72, sz);
  scene.add(stone, hammer, chisel, chips, strikeFlash);

  const [tx, tz] = pageXZ(-1, 280, 600);
  const scope = new THREE.Group();
  const tube = holo(new THREE.CylinderGeometry(0.05, 0.08, 1.1, 14, 1, true), { color: C.cyan, base: 0.12 });
  tube.rotation.z = Math.PI / 2;
  tube.position.x = 0.25;
  scope.add(tube);
  scope.position.set(tx, 0.6, tz);
  const tripod = new THREE.Group();
  [[-0.35, 0.3], [0.35, 0.3], [0, -0.4]].forEach(([dx, dz]) => tripod.add(polyline([[tx, 0.6, tz], [tx + dx, 0, tz + dz]], { color: C.cyan, opacity: 0.8 })));
  const sky = [];
  const R = rng(3);
  for (let i = 0; i < 60; i++) sky.push(tx + 0.3 + R() * 1.4, 1.2 + R() * 1.0, tz - 0.6 + R() * 1.2);
  const starsP = pointCloud(sky, { color: C.ice, size: 4, intensity: 3 });
  scene.add(scope, tripod, starsP);

  const [gx, gz] = pageXZ(1, 300, 420);
  const gears = new THREE.Group();
  const GG = [
    { r: 0.62, n: 24, x: -0.25, y: 0.75 },
    { r: 0.36, n: 14, x: 0.55, y: 1.2 },
    { r: 0.24, n: 9, x: 0.83, y: 0.62 },
  ].map((d) => {
    const m = extrudedGear(d.r, d.n, 0.14, C.cyan);
    m.position.set(d.x, d.y, 0);
    m.d = d;
    gears.add(m);
    return m;
  });
  gears.position.set(gx, 0, gz);
  scene.add(gears);

  // the drawn line
  const baseZ = pageXZ(1, 0, 735)[1];
  const line = polyline([[-2.8, 0.02, baseZ], [2.8, 0.02, baseZ]], { color: C.gold, intensity: 3 });
  const longLine = polyline([[-60, 0.02, baseZ], [60, 0.02, baseZ]], { color: C.gold, intensity: 3.2 });
  const pen = spark(C.gold, 0.18);
  scene.add(line, longLine, pen);

  const CAM = [
    [0, 2.7, 1.2, 2.2, 1.45, 0, 0.35, 34],
    [3.6, 3.0, 2.0, 3.0, 1.3, 0.2, 0.3, 36],
    [4.2, 0, 5.2, 5.6, 0, 0.4, 0.2, 42],
    [5.8, 0.4, 4.8, 5.4, 0, 0.5, 0.3, 42],
    [6.5, -0.5, 1.9, 1.9, -1.45, 0.45, -0.75, 40],
    [7.55, -0.3, 1.8, 2.0, -1.5, 0.5, -0.75, 40],
    [7.95, 0.2, 1.8, 3.4, -1.3, 0.9, 1.0, 40],
    [8.8, 0.3, 2.0, 3.5, -1.2, 1.1, 0.9, 40],
    [9.15, 3.6, 2.0, 3.6, 1.6, 0.9, 0.1, 40],
    [10.6, 3.3, 1.9, 3.3, 1.6, 0.9, 0.1, 40],
    [11.3, 0, 3.2, 8, 0, 0.6, 0, 42],
    [12.4, 0, 1.0, 10, 0, 0.4, baseZ, 42],
  ];

  function update(lt) {
    camKeys(camera, CAM, lt);
    if (lt > VIG.strike && lt < VIG.strike + 0.3) shake(camera, 0.03 * (1 - (lt - VIG.strike) / 0.3), lt, 2);
    const on = E.sine(seg(lt, 0.4, 2.2));
    const fadeOut = 1 - E.sine(seg(lt, 11.0, 12.0));
    const sp = openingSpread(lt);
    const anim = sp.left === 'vigL';
    bk.show(sp.left, sp.right, sp.turn, lt, anim, anim);
    bk.setLight(lerp(0.1, 1, on) * lerp(0.75, 1, seg(lt, 3.6, 4.4)) * lerp(1, 0.08, 1 - fadeOut));
    floor.setOpacity(on * fadeOut);
    light.setOpacity(on * (1 - 0.6 * seg(lt, 10.8, 11.8)));
    motes.drift(lt);
    motes.setOpacity(on * fadeOut);

    // hands
    const eIn = E.out(seg(lt, 1.1, 2.7)) * (1 - E.in(seg(lt, 3.5, 4.1)));
    elder.setOpacity(eIn);
    elder.rotation.set(-0.25, Math.PI + 0.35, 0);
    elder.position.set(1.62 + (1 - eIn) * 1.2, 0.28 + (1 - eIn) * 0.5, -0.42 - (1 - eIn) * 2);
    const cIn = E.out(seg(lt, 2.1, 3.3)) * (1 - E.in(seg(lt, 3.5, 4.0)));
    child.setOpacity(cIn);
    child.rotation.set(-0.3, -0.45, 0);
    const press = Math.sin(seg(lt, 3.0, 3.35) * Math.PI) * 0.03;
    child.position.set(1.18 - (1 - cIn) * 1.0, 0.2 - press + (1 - cIn) * 0.4, 1.02 + (1 - cIn) * 2);
    elder.curl(0.05, 0.95);
    child.curl(0.1 - press * 2, 0.9);

    // rising holograms
    for (const r of risers) {
      const k = seg(lt, r.s, r.e);
      const a = Math.sin(k * Math.PI);
      r.o.setOpacity(a);
      r.o.position.set(r.side * 1.5, lerp(0.1, r.y, E.out(k)), -0.1);
      r.o.rotation.y = (lt - r.s) * 0.8 * r.side + (r.print ? 0.5 : 0);
      if (r.o.setProgress) r.o.setProgress(E.out(k * 1.8));
      if (r.print) r.o.setPrint(E.out(clamp(k * 2.2)));
      if (r.o.spin) r.o.spin(lt);
    }

    // vignettes
    const vig = E.out(seg(lt, 5.9, 6.5)) * fadeOut;
    const k = lt - VIG.strike;
    stone.setOpacity(vig);
    stone.setReveal(lerp(-0.3, 0.3, E.out(seg(lt, 5.9, 6.6))));
    let ang;
    if (lt < VIG.strike - 0.35) ang = 1.1;
    else if (lt < VIG.strike) ang = lerp(1.1, -0.05, E.in(seg(lt, VIG.strike - 0.35, VIG.strike)));
    else ang = lerp(-0.05, 0.4, E.out(clamp(k * 3)));
    hammer.rotation.z = ang;
    hammer.children.forEach((c) => c.setOpacity(vig));
    chisel.setOpacity(vig);
    crack.setProgress(E.out(clamp(k * 4))).setOpacity(vig);
    strikeFlash.setOpacity(k > 0 && k < 0.6 ? 1 - k / 0.6 : 0);
    const cp = chips.geometry.attributes.position, Rr = rng(5);
    for (let i = 0; i < 30; i++) {
      const vx = (Rr() - 0.3) * 1.4, vy = 0.8 + Rr() * 1.6, vz = (Rr() - 0.5) * 1.2;
      const kk = Math.max(0, k);
      cp.setXYZ(i, sx - 0.35 + vx * kk, 0.7 + vy * kk - 4.5 * kk * kk, sz + vz * kk);
    }
    cp.needsUpdate = true;
    chips.setOpacity(k > 0 && k < 0.9 ? 1 - k / 0.9 : 0);

    scope.rotation.z = lerp(0.05, 0.75, E.io(seg(lt, VIG.scopeA, VIG.scopeB)));
    tube.setOpacity(vig);
    tripod.children.forEach((l) => l.setOpacity(vig));
    starsP.setOpacity(E.out(seg(lt, VIG.scopeB - 0.25, VIG.scopeB + 0.4)) * fadeOut);

    const a = gearAngle(lt);
    const jam = lt > VIG.gearJam && lt < VIG.gearRetry;
    const run = seg(lt, VIG.gearRetry + 0.1, VIG.gearRetry + 0.7);
    GG.forEach((m, i) => {
      const ratio = GG[0].d.n / m.d.n;
      m.rotation.z = (i % 2 ? -1 : 1) * a * (i ? ratio : 1) + i * 0.12;
      m.setOpacity(vig);
      m.setColor(jam ? C.ember : run > 0 ? C.gold : C.cyan);
      m.setGlitch(jam ? 1 - seg(lt, VIG.gearJam, VIG.gearJam + 0.6) : 0);
    });

    // the line: drawn, then set alight, then running out past the book
    const lp = E.io(seg(lt, 5.95, 6.6));
    line.setProgress(lp).setOpacity(lp > 0 ? 1 - seg(lt, 11.2, 11.6) : 0);
    pen.setOpacity(lp > 0 && lp < 1 ? 1 : 0);
    const pp = [lerp(-2.8, 2.8, lp), 0.05, baseZ];
    pen.position.set(...pp);
    const ext = E.io(seg(lt, 11.1, 12.2));
    longLine.setOpacity(seg(lt, 10.8, 11.2));
    longLine.scale.x = lerp(2.8 / 60, 1, ext);
  }
  return { scene, camera, update, bloom: (lt) => 1.0 + seg(lt, 10.6, 11.3) * 0.6 };
});
