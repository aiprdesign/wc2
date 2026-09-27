/* THE INHERITANCE 3D — Computation, Entrusted, the Chain, Questions, Legacy, Title. */
import * as THREE from 'three';
import { scene3 } from './engine3d.js';
import { C, holo, polyline, glow, spark, grid, figure, pointCloud, camKeys, shake, word, callout, label, stars, bust, hand, morphLines, beam, dust, lineMat } from './holo.js';
import { extrudedGear, euclid3D, temple, armillary } from './s_open.js';
import { domeGroup } from './s_mid.js';
import { earth3 } from './s_late.js';
import { book, pageTexture, PW3, PH3 } from './book3d.js';
import { model } from './models.js';

// layered wire extrusion of a morph shape, for depth
function deepMorph(color, layers = 3) {
  const g = new THREE.Group();
  const ls = [];
  for (let i = 0; i < layers; i++) {
    const m = morphLines(18, 40, { color, intensity: i ? 1.4 : 3, opacity: i ? 0.35 : 1 });
    m.position.z = -i * 0.35;
    g.add(m);
    ls.push(m);
  }
  g.setShape = (s, sc) => ls.forEach((m) => m.setShape(s, sc));
  g.setOpacity = (a) => { ls.forEach((m, i) => m.setOpacity(a * (i ? 0.4 : 1))); g.visible = a > 0.002; return g; };
  g.setColor = (c) => ls.forEach((m) => m.setColor(c));
  return g;
}

// ---------------------------------------------------------------- COMPUTATION
function waferTexture() {
  const c = makeCanvas(1024, 1024), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 1024, 1024);
  gr.addColorStop(0, '#2b2a6a'); gr.addColorStop(0.4, '#15505e'); gr.addColorStop(0.7, '#6a4a1a'); gr.addColorStop(1, '#2b2a6a');
  g.fillStyle = gr;
  g.beginPath(); g.arc(512, 512, 510, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(180,230,255,0.5)';
  g.lineWidth = 2;
  for (let x = 12; x < 1024; x += 44) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 12; y < 1024; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  g.globalCompositeOperation = 'destination-in';
  g.beginPath(); g.arc(512, 512, 510, 0, TAU); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

scene3('compute', async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 2000);
  const limb = holo(new THREE.TorusGeometry(1, 0.004, 6, 200), { color: '#7fb7ff', fill: false, threshold: 1 });
  limb.rotation.x = -Math.PI / 2;
  scene.add(limb);
  const wafer = new THREE.Mesh(new THREE.CircleGeometry(6, 96), new THREE.MeshBasicMaterial({ map: waferTexture(), transparent: true, color: 0x9a9a9a }));
  wafer.rotation.x = -Math.PI / 2;
  scene.add(wafer);
  const chain = deepMorph(C.steel);
  scene.add(chain);
  const years = DEVICES.map(([, , y]) => { const w = word(y, { size: 0.7, depth: 0.15, color: C.gold, base: 0.02, fillIntensity: 0.5 }); w.position.set(0, -3.3, 0); scene.add(w); return w; });
  const names = DEVICES.map(([, n]) => { const l = label(n, '', { align: 'center', scale: 0.42, spacing: 16 }); l.position.set(0, -4.25, 0); scene.add(l); return l; });
  // one becomes millions
  const gp = [];
  for (let x = -150; x <= 150; x++) for (let y = -85; y <= 85; y++) gp.push(x * 0.5, y * 0.5, -20);
  const grid2 = pointCloud(gp, { color: C.gold, size: 1.4, intensity: 2.2, max: 5 });
  scene.add(grid2);
  // network
  const net = new THREE.Group();
  net.position.set(0, 0, -60);
  const R = rng(12), nodes = [];
  for (let i = 0; i < 140; i++) {
    const u = R() * 2 - 1, q = R() * TAU, s = Math.sqrt(1 - u * u);
    nodes.push(new THREE.Vector3(Math.cos(q) * s * 7, u * 7, Math.sin(q) * s * 7));
  }
  const edges = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (nodes[i].distanceTo(nodes[j]) < 2.6) edges.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
  const em = lineMat({ color: C.gold, intensity: 1.6 });
  const edgeL = new THREE.LineSegments(eg, em);
  net.add(edgeL);
  const nodeP = pointCloud(nodes.flatMap((v) => [v.x, v.y, v.z]), { color: C.goldHot, size: 9, intensity: 3, max: 12 });
  net.add(nodeP);
  const bits = [];
  for (let i = 0; i < 300; i++) bits.push(0, 0, 0);
  const bitP = pointCloud(bits, { color: C.cyan, size: 5, intensity: 3 });
  net.add(bitP);
  const bookL = deepMorph(C.ice, 1);
  bookL.setShape(SH.n.book, 0.012);
  net.add(bookL);
  const cWeb = callout('WORLD WIDE WEB', 'CERN · 1991', { offset: [4, 3, 0], scale: 0.9, color: C.gold });
  cWeb.position.set(5, 4, 0);
  net.add(cWeb);
  scene.add(net);

  function update(lt) {
    if (lt < 1.3) camKeys(camera, [[0, 0, 3, 0.01, 0, 0, -8, 45], [1.3, 0, 10, 3, 0, 0, 0, 45]], lt);
    else if (lt < 4.5) camKeys(camera, [[1.3, 0, 0, 12, 0, -0.5, 0, 42], [4.5, 1.5, 0.3, 11, 0, -0.5, 0, 42]], lt);
    else camKeys(camera, [[4.5, 0, 0, -40, 0, 0, -60, 45], [5.7, 3, 1, -44, 0, 0, -60, 45]], lt);
    const k = E.io(seg(lt, 0.1, 1.1));
    const rr = lerp(60, 6, k);
    limb.scale.setScalar(rr);
    limb.position.set(0, 0, lerp(-68, 0, k));
    limb.setOpacity(1 - seg(lt, 1.2, 1.5));
    wafer.material.opacity = seg(lt, 0.6, 1.1) * (1 - seg(lt, 1.2, 1.5));
    wafer.visible = lt < 1.5;
    wafer.rotation.z = lt * 0.3;
    const cA = env(lt, 1.2, 1.4, 3.75, 4.0);
    const f = (lt - 1.2) / 0.36;
    const i = clamp(Math.floor(f), 0, DEVICES.length - 1);
    const kk = i < DEVICES.length - 1 ? E.io(clamp((f - i - 0.55) / 0.45)) : 0;
    const a = SH.n[DEVICES[i][0]], b = SH.n[DEVICES[Math.min(i + 1, DEVICES.length - 1)][0]];
    chain.setShape(morphShape(a, b, kk), 0.011);
    chain.setOpacity(cA);
    chain.rotation.y = Math.sin(lt * 1.2) * 0.5;
    chain.setColor(i >= 3 ? C.gold : C.steel);
    const idx = kk > 0.5 ? Math.min(i + 1, DEVICES.length - 1) : i;
    years.forEach((w, j) => w.setOpacity(j === idx ? cA * (1 - Math.sin(kk * Math.PI) * 0.8) : 0));
    names.forEach((l, j) => l.setOpacity(j === idx ? cA * (1 - Math.sin(kk * Math.PI) * 0.8) : 0));
    const mA = env(lt, 3.75, 3.95, 4.5, 4.8);
    grid2.setOpacity(mA);
    grid2.position.z = lerp(18, -30, E.in(seg(lt, 3.75, 4.8)));
    const nA = seg(lt, 4.5, 4.8);
    net.visible = nA > 0;
    net.rotation.y = lt * 0.25;
    em.uniforms.uOpacity.value = nA * E.out(seg(lt, 4.55, 5.5));
    nodeP.setOpacity(nA);
    const bp = bitP.geometry.attributes.position;
    for (let j = 0; j < bp.count; j++) {
      const q = ((lt - 4.5) * 0.8 + j / 300) % 1;
      const n = nodes[j % nodes.length];
      bp.setXYZ(j, n.x * q, n.y * q, n.z * q);
    }
    bp.needsUpdate = true;
    bitP.setOpacity(nA);
    bookL.setOpacity(nA * (1 - seg(lt, 5.0, 5.5)));
    cWeb.setOpacity(nA, seg(lt, 4.8, 5.4));
  }
  return { scene, camera, update, bloom: 1.0 };
});

// ---------------------------------------------------------------- ENTRUSTED
function coverTexture() {
  const c = makeCanvas(630, 852), g = c.getContext('2d');
  g.fillStyle = '#3a2416';
  g.fillRect(0, 0, 630, 852);
  g.strokeStyle = 'rgba(220,170,90,0.8)';
  g.lineWidth = 4;
  g.strokeRect(24, 24, 582, 804);
  g.lineWidth = 3;
  euclidShape(315, 440, 150).strokes.forEach((s) => strokeReveal(g, s));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

scene3('inherit', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 1000);
  // A — the book closes and is passed on
  const bookG = new THREE.Group();
  scene.add(bookG);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(PW3, PH3).rotateX(-Math.PI / 2).translate(PW3 / 2, 0, 0), new THREE.MeshBasicMaterial({ map: pageTexture('vigR', 12), color: 0x6f624e }));
  const rCover = new THREE.Mesh(new THREE.BoxGeometry(PW3 + 0.15, 0.1, PH3 + 0.3).translate(PW3 / 2 + 0.07, -0.07, 0), new THREE.MeshBasicMaterial({ color: 0x2a170c }));
  bookG.add(right, rCover);
  const leftPivot = new THREE.Group();
  bookG.add(leftPivot);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(PW3, PH3).rotateX(-Math.PI / 2).translate(-PW3 / 2, 0.005, 0), new THREE.MeshBasicMaterial({ map: pageTexture('vigL', 12), color: 0x6f624e }));
  const coverM = new THREE.MeshBasicMaterial({ map: coverTexture(), color: 0x8a7a66, side: THREE.BackSide });
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(PW3 + 0.15, PH3 + 0.3).rotateX(-Math.PI / 2).translate(-PW3 / 2 - 0.07, -0.02, 0), coverM);
  leftPivot.add(left, cover);
  const floor = grid(60, 0.5, C.cyan, 0.3);
  floor.position.y = -0.14;
  scene.add(floor);
  const light = beam(0.25, 1.9, 9, C.gold, 0.08);
  light.position.set(1.8, 4.4, -0.6);
  light.rotation.set(0.1, 0, 0.28);
  scene.add(light);
  const elder = hand({ color: C.gold, scale: 0.55 });
  const child = hand({ color: C.cyan, scale: 0.42, left: true });
  scene.add(elder, child);

  // B — the new maker's bridge
  const work = new THREE.Group();
  work.position.set(0, 0, -60);
  scene.add(work);
  const bench = grid(80, 0.5, C.steel, 0.3, 'xy');
  bench.position.z = -2;
  work.add(bench);
  const map3 = ([x, y], z) => new THREE.Vector3((x - 960) / 100, (760 - y) / 100 - 1.2, z);
  function truss(list) {
    const g = new THREE.Group();
    const ms = [];
    for (const z of [-0.6, 0.6]) list.forEach(([a, b]) => { const A = map3(a, z), B = map3(b, z); const l = polyline([[A.x, A.y, A.z], [B.x, B.y, B.z]], { color: C.ice, intensity: 2.6 }); l.a = A; l.b = B; g.add(l); ms.push(l); });
    return { g, ms };
  }
  const phases = [
    { ...truss(ARCH.A), draw: [2.6, 3.4], test: 4.0, fail: [4.15, 4.7], wipe: [4.7, 4.95] },
    { ...truss(ARCH.B), draw: [4.95, 5.55], test: 5.6, sag: [5.7, 6.1], wipe: [6.2, 6.45] },
    { ...truss(ARCH.C), draw: [6.45, 7.2], test: 7.25, holds: 7.4 },
  ];
  phases.forEach((p) => work.add(p.g));
  const load = new THREE.Group();
  const arrowL = polyline([[0, 2.2, 0], [0, 0.6, 0]], { color: C.ember, intensity: 3 });
  const arrowH = holo(new THREE.ConeGeometry(0.2, 0.45, 12), { color: C.ember, base: 0.3 });
  arrowH.rotation.x = Math.PI;
  arrowH.position.y = 0.45;
  load.add(arrowL, arrowH);
  work.add(load);
  const apex = spark(C.gold, 0.8);
  apex.position.copy(map3(ARCH.apex, 0));
  work.add(apex);
  const maker = hand({ color: C.cyan, scale: 0.4 });
  work.add(maker);
  const face = bust({ color: C.gold, depth: 1.2, points: false });
  face.scale.setScalar(1.2);
  face.position.set(-7.5, 0.5, 1);
  work.add(face);

  function update(lt) {
    if (lt < 2.2) camKeys(camera, [[0, 0.4, 5.5, 5.2, 0.8, 0, 0.6, 38], [2.2, 0.6, 5.0, 6.2, 1.0, 0, 1.6, 38]], lt);
    else camKeys(camera, [[2.2, 0, 0, -48, 0, 0, -60, 42], [7.4, 0, 0.5, -49, 0, 0.3, -60, 42], [10.1, 0.5, 0.8, -50.5, 0, 0.6, -60, 40]], lt);
    const A = 1 - E.sine(seg(lt, 2.1, 2.6));
    const close = E.io(seg(lt, 0.15, 0.95));
    leftPivot.rotation.z = -close * Math.PI * 0.995;
    const slide = E.io(seg(lt, 1.0, 1.9));
    bookG.position.set(0, 0, slide * 2.4);
    [right, rCover, left, cover].forEach((m) => { m.material.transparent = true; m.material.opacity = A; });
    bookG.visible = A > 0;
    floor.setOpacity(A);
    light.setOpacity(A);
    const eA = E.out(seg(lt, 0.7, 1.0)) * A;
    elder.setOpacity(eA);
    elder.rotation.set(-0.25, Math.PI, 0);
    elder.position.set(1.5, 0.3, -2.4 + slide * 2.4 - (1 - eA) * 1.5);
    const cA = E.out(seg(lt, 1.4, 2.0));
    const grow = seg(lt, 2.0, 2.6);
    child.setOpacity(cA * A);
    child.rotation.set(-0.3, 0, 0);
    child.position.set(1.4, 0.25, 2.3 + 2.2 + (1 - cA) * 1.5);
    child.scale.setScalar(lerp(0.42, 0.6, grow));

    bench.setOpacity(seg(lt, 2.1, 2.6));
    let tip = null;
    phases.forEach((ph) => {
      const vis = lt >= ph.draw[0] && !(ph.wipe && lt > ph.wipe[1]);
      ph.g.visible = vis;
      if (!vis) return;
      const p = seg(lt, ph.draw[0], ph.draw[1]);
      const fail = ph.fail ? E.in(seg(lt, ph.fail[0], ph.fail[1])) : 0;
      const sag = ph.sag ? E.out(seg(lt, ph.sag[0], ph.sag[1])) : 0;
      const holds = ph.holds ? seg(lt, ph.holds, ph.holds + 0.5) : 0;
      const wipe = ph.wipe ? seg(lt, ph.wipe[0], ph.wipe[1]) : 0;
      const n = ph.ms.length / 2;
      ph.ms.forEach((l, i) => {
        const k = clamp(p * n - (i % n));
        const pos = l.geometry.attributes.position;
        let A2 = l.a.clone(), B2 = l.b.clone();
        if (sag > 0) { const f = (v) => { v.y -= Math.sin(((v.x + 4) / 8) * Math.PI) * 0.7 * sag; }; f(A2); f(B2); }
        if (fail > 0) {
          const r = hash(i * 13 + 7);
          const d = new THREE.Vector3((r - 0.5) * 2 * fail, -fail * fail * (4 + r * 5), (hash(i) - 0.5) * 3 * fail);
          A2.add(d); B2.add(d.clone().multiplyScalar(0.7 + r * 0.6));
        }
        pos.setXYZ(0, A2.x, A2.y, A2.z);
        pos.setXYZ(1, lerp(A2.x, B2.x, k), lerp(A2.y, B2.y, k), lerp(A2.z, B2.z, k));
        pos.needsUpdate = true;
        l.geometry.computeBoundingSphere();
        l.setOpacity((k > 0 ? 1 : 0) * (1 - wipe));
        l.setColor(fail > 0 || sag > 0 ? C.ember : holds > 0 ? C.gold : C.ice);
        if (k > 0 && k < 1) tip = new THREE.Vector3(lerp(A2.x, B2.x, k), lerp(A2.y, B2.y, k), A2.z);
      });
    });
    const tests = [[4.0, 1.2], [5.6, 0.8], [7.25, 3]];
    let la = 0, ly = 0, holdsNow = lt > 7.4;
    for (const [s, d] of tests) if (lt > s && lt < s + d) { la = 1; ly = E.out(seg(lt, s, s + 0.25)); }
    load.position.set(0, 3.8 - ly * 1.4 + (holdsNow ? 0 : 0), 0);
    [arrowL, arrowH].forEach((o) => o.setOpacity(la));
    arrowL.setColor(holdsNow ? C.gold : C.ember);
    arrowH.setColor(holdsNow ? C.gold : C.ember);
    const sp = seg(lt, 7.5, 8.0);
    apex.setOpacity(E.out(sp));
    apex.setSize(0.8 + Math.sin(lt * 4) * 0.08);
    const mA = seg(lt, 2.4, 2.7) * (1 - seg(lt, 7.3, 7.8));
    maker.setOpacity(mA);
    maker.rotation.set(-0.5, 0, 0);
    const tp = tip || new THREE.Vector3(3, -1.5, 0.6);
    maker.position.set(tp.x + 0.1, tp.y + 0.2, tp.z + 1.2);
    face.setOpacity(E.sine(seg(lt, 8.0, 8.8)));
  }
  function hud(ctx, lt) {
    const codeA = env(lt, 3.3, 3.5, 9.2, 9.8);
    if (codeA <= 0) return;
    CODE.forEach((line, i) => {
      const chars = Math.floor(clamp((lt - 3.35 - i * 0.12) * 50, 0, line.length));
      text(ctx, line.slice(0, chars), 1480, 300 + i * 40, 24, { family: '"DejaVu Sans Mono", Menlo, monospace', align: 'left', color: rgba('#9fc3e8', 0.85 * codeA) });
    });
    const res = lt > 7.45 ? 'PASS' : lt > 5.8 ? 'FAIL — deflection' : lt > 4.2 ? 'FAIL — collapse' : '';
    if (res) text(ctx, res, 1480, 520, 24, { family: '"DejaVu Sans Mono", Menlo, monospace', align: 'left', color: rgba(res === 'PASS' ? PAL.gold : PAL.ember, codeA) });
  }
  return { scene, camera, update, hud, bloom: 1.0 };
});

// ---------------------------------------------------------------- THE CHAIN
const CHAIN_MODELS = { stone: 'stoneBlock', column: 'column', arch: 'triumphalArch', book: 'openBook', painting: 'paintingFrame', telescope: 'galileoScope', equation: 'equation', gear: 'antikythera', engine: 'wattEngine', electricity: 'teslaCoil', microscope: 'microscope', aircraft: 'wrightFlyer', rocket: 'saturnV', transistor: 'chip', network: 'networkGlobe' };
scene3('chain', async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, W / H, 0.05, 1000);
  const NP = 16000;
  const clouds = [], wires = [];
  for (const n of CHAIN) {
    const m = model(CHAIN_MODELS[n], { height: 6, color: C.gold, wireColor: C.goldHot });
    const s = 7 / Math.max(m.width, m.height, m.depth);
    m.scale.setScalar(s);
    m.position.y = -m.height * s / 2;
    const pts = m.sample(NP, 5);
    for (let i = 0; i < NP; i++) { pts[i * 3] *= s; pts[i * 3 + 1] = pts[i * 3 + 1] * s - m.height * s / 2; pts[i * 3 + 2] *= s; }
    clouds.push(pts);
    scene.add(m);
    wires.push(m);
  }
  const cloud = pointCloud(Array.from(clouds[0]), { color: C.goldHot, size: 1.2, intensity: 1.2, max: 2.5, opacity: 0.6 });
  scene.add(cloud);
  const names = CHAIN.map((n) => { const w = word(n.toUpperCase(), { size: 0.55, depth: 0.1, color: C.ice, base: 0.0, fillIntensity: 0.25, wireIntensity: 1.2 }); w.position.set(0, -4.4, 0); scene.add(w); return w; });
  const R = rng(77), st = [];
  for (let i = 0; i < 400; i++) { const q = R() * TAU, r = 5 + R() * 20, z = -R() * 120; st.push(Math.cos(q) * r, Math.sin(q) * r, z, Math.cos(q) * r, Math.sin(q) * r, z - 4 - R() * 6); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(st, 3));
  const sm = lineMat({ color: C.gold, intensity: 1.5 });
  const streaks = new THREE.LineSegments(sg, sm);
  scene.add(streaks);
  function update(lt) {
    scene.visible = lt <= 3.15;
    camera.position.set(Math.sin(lt * 0.8) * 4, 1.2, 13 - lt * 0.9);
    camera.lookAt(0, -0.5, 0);
    const f = clamp((lt - 0.1) / 0.2, 0, CHAIN.length - 1);
    const i = Math.floor(f), frac = f - i;
    const k = i < CHAIN.length - 1 ? E.io(clamp((frac - 0.45) / 0.55)) : 0;
    const a = clouds[i], b2 = clouds[Math.min(i + 1, CHAIN.length - 1)];
    const cp = cloud.geometry.attributes.position;
    for (let j = 0; j < NP; j++) {
      const sw = Math.sin(k * Math.PI) * 0.6 * (hash(j) - 0.5);
      cp.setXYZ(j, lerp(a[j * 3], b2[j * 3], k) + sw, lerp(a[j * 3 + 1], b2[j * 3 + 1], k) + sw * 0.6, lerp(a[j * 3 + 2], b2[j * 3 + 2], k) - sw);
    }
    cp.needsUpdate = true;
    cloud.setOpacity(1);
    const rot = Math.sin(lt * 1.6) * 0.5;
    cloud.rotation.y = rot;
    wires.forEach((w, j) => {
      const on = j === i ? (1 - k) * seg(frac, 0, 0.25) : j === i + 1 ? k * k : 0;
      w.setOpacity(on * 0.9);
      w.rotation.y = rot;
    });
    const idx = k > 0.5 ? Math.min(i + 1, CHAIN.length - 1) : i;
    names.forEach((w, j) => w.setOpacity(j === idx ? 1 - Math.sin(k * Math.PI) * 0.9 : 0));
    streaks.position.z = (lt * 60) % 120;
    sm.uniforms.uOpacity.value = 0.5;
  }
  return { scene, camera, update, bloom: 1.1 };
});

// ---------------------------------------------------------------- QUESTIONS
scene3('questions', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.05, 1000);
  const bk = book();
  scene.add(bk);
  const floor = grid(60, 0.5, C.cyan, 0.25);
  floor.position.y = -0.16;
  scene.add(floor);
  const light = beam(0.25, 1.9, 9, C.gold, 0.1);
  light.position.set(1.8, 4.4, -0.6);
  light.rotation.set(0.1, 0, 0.28);
  scene.add(light);
  const motes = dust(500, [4, 4, 4], 9);
  motes.position.set(1.2, 1.6, -0.2);
  scene.add(motes);
  const child = hand({ color: C.cyan, scale: 0.42, left: true });
  child.position.set(1.0, 0.2, 1.9);
  child.rotation.set(-0.3, -0.35, 0);
  scene.add(child);
  const tip = new THREE.Vector3(0.78, 0.1, 1.35);
  const ghosts = [
    [temple(C.gold), -1.4, 0.2, -0.6, 0.6, 2.4],
    [euclid3D(0.9, C.gold), 1.6, 0.9, -0.6, 0.6, 2.4],
    [armillary(C.gold), -1.5, 1.0, 0.2, 2.5, 3.8],
    [extrudedGear(0.45, 16, 0.1, C.gold), 1.5, 0.9, -0.3, 2.6, 3.8],
    [domeGroup(C.gold), 0.2, 0.1, -1.2, 2.7, 3.8],
  ].map(([o, x, y, z, a, b]) => { o.position.set(x, y, z); if (o === undefined) return null; scene.add(o); return { o, a, b }; });
  ghosts[4].o.scale.setScalar(0.25);
  const wrong = ['x = 2πr²', 'F = mv', 'T ∝ a²'].map((s, i) => {
    const l = label(s, '', { align: 'center', scale: 0.35, color: '#ffe6b0' });
    l.position.set(-1.2 + i * 1.2, 0.7 + (i % 2) * 0.4, -0.8);
    const x = polyline([[-0.8, 0, 0], [0.8, 0.05, 0]], { color: C.ember, intensity: 3.5 });
    x.position.copy(l.position);
    x.position.z += 0.05;
    scene.add(l, x);
    return { l, x, i };
  });
  const jam = extrudedGear(0.35, 12, 0.1, C.ember);
  jam.position.set(1.4, 0.8, 0);
  scene.add(jam);
  const sp = spark(C.gold, 0.25);
  scene.add(sp);
  const path = [[3.2, 0.1, -2.2], [2.2, 0.1, -1.0], [1.5, 0.1, 0.0], [1.1, 0.1, 0.8], [tip.x, tip.y, tip.z]];
  function update(lt) {
    camKeys(camera, [[0, 1.2, 4.6, 5.4, 0.8, 0.3, 0.1, 36], [7, 1.0, 4.3, 5.0, 0.8, 0.3, 0.2, 36]], lt);
    bk.show('blank', 'blank', null, 0);
    bk.setLight(E.sine(seg(lt, 0.1, 0.7)));
    motes.drift(lt);
    ghosts.forEach(({ o, a, b }) => {
      const k = env(lt, a, a + 0.4, b - 0.3, b);
      o.setOpacity(k * 0.9);
      if (o.setProgress) o.setProgress(seg(lt, a, a + 0.6));
      if (o.spin) o.spin(lt);
      o.rotation.y = lt * 0.4;
      o.position.y += 0;
    });
    const m = env(lt, 3.8, 4.1, 5.0, 5.3);
    wrong.forEach(({ l, x, i }) => { l.setOpacity(m); x.setOpacity(m).setProgress(E.out(seg(lt, 4.0 + i * 0.15, 4.2 + i * 0.15))); });
    jam.setOpacity(m);
    jam.rotation.z = lt > 4.3 ? 0.3 + Math.sin(lt * 70) * 0.03 : 0.3;
    jam.setGlitch(lt > 4.3 ? 1 : 0);
    let p = null, a = 0;
    if (lt < 1.4) { p = seg(lt, 0.1, 1.3) * 0.5; a = env(lt, 0.1, 0.4, 1.1, 1.4); }
    else if (lt > 5.0) { p = E.io(seg(lt, 5.0, 6.3)); a = E.out(seg(lt, 5.0, 5.3)); }
    if (p != null) {
      const pts = path.map((q) => [q[0], q[2]]);
      const [x, z] = pointAt(pts, p);
      sp.position.set(x, 0.12, z);
    }
    sp.setOpacity(a);
    sp.setSize(0.25 + (lt > 6.3 ? Math.sin(lt * 5) * 0.03 : 0));
    child.setOpacity(1);
  }
  return { scene, camera, update, bloom: 1.0 };
});

// ---------------------------------------------------------------- LEGACY: the pullback
scene3('pullback', async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 100);
  camera.position.set(0, 7, 0.001);
  camera.lookAt(0, 0, 0);
  const root = new THREE.Group();
  scene.add(root);
  const TIP = new THREE.Vector3(0.78, 0.1, 1.35);
  const world = new THREE.Group(); // centred on the spark
  world.position.copy(TIP).multiplyScalar(-1);
  root.add(world);
  const bk = book();
  bk.show('blank', 'blank', null, 0);
  world.add(bk);
  const child = hand({ color: C.cyan, scale: 0.42, left: true });
  child.position.set(1.0, 0.2, 1.9);
  child.rotation.set(-0.3, -0.35, 0);
  world.add(child);
  // the room
  const room = holo(new THREE.BoxGeometry(40, 16, 30, 1, 1, 1), { color: C.cyan, fill: false, wireOpacity: 0.6 });
  room.position.set(0, 7.8, 0);
  const desk = holo(new THREE.BoxGeometry(10, 0.3, 6), { color: C.gold, base: 0.02, fillIntensity: 0.4 });
  desk.position.y = -0.3;
  const floorG = grid(60, 1, C.cyan, 0.4);
  floorG.position.y = -0.2;
  world.add(room, desk, floorG);
  // the city: blocks of light
  const cityPts = [], R = rng(99);
  for (let i = 0; i < 16000; i++) {
    const rad = Math.pow(R(), 0.7) * 4e4 * (0.5 + R());
    const q = R() * TAU;
    let x = Math.cos(q) * rad, z = Math.sin(q) * rad;
    if (R() < 0.7) { if (R() < 0.5) x = Math.round(x / 180) * 180; else z = Math.round(z / 180) * 180; }
    cityPts.push(x, 0, z);
  }
  const city = pointCloud(cityPts, { color: C.gold, size: 2.2, intensity: 2.6, max: 4 });
  world.add(city);
  const blocks = new THREE.Group();
  for (let i = 0; i < 40; i++) {
    const w = 60 + R() * 80, h = 20 + R() * 120, d = 60 + R() * 80;
    const b = holo(new THREE.BoxGeometry(w, h, d), { color: C.cyan, fill: false, wireOpacity: 0.35 });
    b.position.set((R() - 0.5) * 900, h / 2, (R() - 0.5) * 900);
    if (Math.abs(b.position.x) < 80 && Math.abs(b.position.z) < 80) b.position.x += 200;
    blocks.add(b);
  }
  world.add(blocks);
  // the Earth, our spark one light among many
  const RE = 6.37e7;
  const earth = earth3(RE, { size: 2.6 });
  const up = new THREE.Vector3(0, 1, 0);
  const home = new THREE.Vector3().copy(earthDir(41.9, 12.5));
  earth.quaternion.setFromUnitVectors(home, up);
  earth.position.set(0, -RE, 0);
  world.add(earth);
  const sky = stars(5000, 50, 31);
  scene.add(sky);
  const sp = spark(C.gold, 0.22);
  scene.add(sp);

  function update(lt) {
    const Z = 10.2 * E.sine(seg(lt, 0.3, 7.9));
    const s = Math.pow(10, -Z);
    root.scale.setScalar(s);
    camera.up.set(Math.sin(lt * 0.08), 0, -Math.cos(lt * 0.08));
    camera.lookAt(0, 0, 0);
    const near = 1 - seg(Z, 2.4, 3.3);
    bk.visible = near > 0.01;
    bk.setLight(near);
    child.setOpacity(near);
    room.setOpacity(seg(Z, 0.6, 1.2) * (1 - seg(Z, 2.2, 2.8)));
    desk.setOpacity(1 - seg(Z, 2.2, 2.8));
    floorG.setOpacity(1 - seg(Z, 1.2, 2.0));
    const cityA = seg(Z, 2.2, 3.0) * (1 - seg(Z, 6.0, 6.8));
    city.setOpacity(cityA);
    blocks.children.forEach((b) => b.setOpacity(seg(Z, 2.0, 2.6) * (1 - seg(Z, 3.4, 4.0))));
    const gA = seg(Z, 5.6, 6.6);
    earth.setOpacity(gA, 1.2);
    earth.visible = gA > 0;
    sky.setOpacity(seg(Z, 7, 9));
    sp.setOpacity(1);
    sp.setSize(Z < 1 ? 0.22 : lerp(0.22, 0.12, seg(Z, 1, 9)));
  }
  return { scene, camera, update, bloom: 1.0 };
});
function earthDir(lat, lon) {
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
  return new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
}

// ---------------------------------------------------------------- TITLE
scene3('title', async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.05, 1000);
  const sky = stars(3000, 300, 41);
  scene.add(sky);
  const HALL = ['parthenon', 'pantheon', 'colosseum', 'notreDame', 'duomo', 'press', 'violin', 'orrery', 'capitol', 'wattEngine', 'brooklyn', 'eiffel', 'wrightFlyer', 'caravel', 'saturnV', 'dna', 'chip'];
  const hall = new THREE.Group();
  hall.position.set(0, -5.6, -18);
  const halls = HALL.map((n, i) => {
    const m = model(n, { height: 3.4, color: i % 3 === 1 ? C.cyan : C.gold, wireColor: i % 3 === 1 ? C.ice : C.goldHot });
    const s = Math.min(1, 5.5 / Math.max(m.width, m.depth));
    m.scale.setScalar(s);
    const a = -Math.PI * 0.46 + (i / (HALL.length - 1)) * Math.PI * 0.92;
    m.position.set(Math.sin(a) * 17, 0, -Math.cos(a) * 9 + 6);
    m.rotation.y = -a * 0.6;
    m.i = i;
    hall.add(m);
    return m;
  });
  scene.add(hall);
  const t1 = word('ACHIEVEMENTS', { size: 1.25, depth: 0.2, color: C.goldHot, base: 0.0, fillIntensity: 0.25, weight: '400', wireIntensity: 1.1 });
  t1.position.set(0, 1.55, 0);
  const t2 = word('OF WESTERN CIVILIZATION', { size: 0.52, depth: 0.08, color: C.ice, base: 0.0, fillIntensity: 0.25, weight: '400', wireIntensity: 1.0 });
  t2.position.set(0, 0.5, 0);
  scene.add(t1, t2);
  // particles that converge into the lettering
  const src = t1.children[0].geometry.attributes.position;
  const target = [], start = [];
  const R = rng(5);
  for (let i = 0; i < src.count; i += 2) {
    target.push(src.getX(i), src.getY(i) + 1.55, src.getZ(i));
    start.push((R() - 0.5) * 30, (R() - 0.5) * 16, (R() - 0.5) * 20);
  }
  const conv = pointCloud(start.slice(), { color: C.goldHot, size: 1.6, intensity: 1.8, max: 4 });
  scene.add(conv);
  const line = polyline([[-6, 0, 0], [6, 0, 0]], { color: C.gold, intensity: 3.2 });
  scene.add(line);
  const sp = spark(C.gold, 0.3);
  scene.add(sp);
  const tag = [['INHERITED FROM THE PAST.', 3.9], ['ENTRUSTED TO THE PRESENT.', 4.8], ['BUILT FOR THE FUTURE.', 5.7]].map(([s, t], i) => {
    const l = label(s, '', { align: 'center', scale: 0.5, spacing: 18, color: i === 2 ? '#ffd88a' : '#e6dcc6' });
    l.position.set(0, -0.75 - i * 0.62, 0);
    l.t = t;
    scene.add(l);
    return l;
  });
  const ask = word('WHAT WILL WE ADD?', { size: 0.95, depth: 0.15, color: C.goldHot, base: 0.0, fillIntensity: 0.25, weight: '400', wireIntensity: 1.1 });
  ask.position.set(0, 0.9, 0);
  scene.add(ask);
  function update(lt) {
    camera.position.set(0, 0.2, lerp(15, 13.2, E.sine(seg(lt, 0, 10.8))));
    camera.lookAt(0, 0.4, 0);
    sky.setOpacity(0.6 * (1 - seg(lt, 0.2, 1.5)) + 0.15);
    const hq = 1 - E.sine(seg(lt, 7.4, 8.4));
    halls.forEach((m) => {
      const t0 = 0.6 + m.i * 0.1;
      m.setOpacity(seg(lt, t0, t0 + 0.2) * 0.22 * hq + (lt > 8.4 ? 0.12 : 0));
      m.setPrint(E.io(seg(lt, t0, t0 + 1.2)));
    });
    hall.rotation.y = Math.sin(lt * 0.12) * 0.05;
    const lw = E.io(seg(lt, 0.3, 1.6));
    line.scale.x = Math.max(0.001, lw * 0.7);
    line.setOpacity(1);
    sp.setOpacity(1 - seg(lt, 1.2, 2.2) * 0.6);
    const q = seg(lt, 7.6, 8.2);
    const tA = E.sine(seg(lt, 1.2, 3.0)) * (1 - E.sine(q));
    t1.setOpacity(tA);
    t1.setReveal(lerp(-8, 8, E.io(seg(lt, 1.3, 3.0))));
    t2.setOpacity(E.sine(seg(lt, 1.8, 3.3)) * (1 - E.sine(q)));
    t2.setReveal(lerp(-7, 7, E.io(seg(lt, 1.8, 3.3))));
    const k = E.io(seg(lt, 0.8, 2.8));
    const cp = conv.geometry.attributes.position;
    for (let i = 0; i < cp.count; i++) cp.setXYZ(i, lerp(start[i * 3], target[i * 3], k), lerp(start[i * 3 + 1], target[i * 3 + 1], k), lerp(start[i * 3 + 2], target[i * 3 + 2], k));
    cp.needsUpdate = true;
    conv.setOpacity((1 - seg(lt, 2.8, 3.6)) * (lt > 0.8 ? 1 : 0));
    tag.forEach((l) => l.setOpacity(E.sine(seg(lt, l.t, l.t + 0.7)) * (1 - E.sine(q))));
    const aA = E.sine(seg(lt, 8.1, 9.0));
    ask.setOpacity(aA);
    ask.setReveal(lerp(-8, 8, E.io(seg(lt, 8.1, 9.0))));
    line.position.y = lerp(0, 0.05, aA);
  }
  return { scene, camera, update, bloom: 1.1 };
});
