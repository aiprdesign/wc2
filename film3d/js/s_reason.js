/* THE INHERITANCE 3D — Reason and the civic idea. */
import * as THREE from 'three';
import { scene3 } from './engine3d.js';
import { C, holo, polyline, glow, spark, grid, figure, pointCloud, camKeys, shake, word, callout, label, lineMat, U } from './holo.js';
import { euclid3D } from './s_open.js';
import { model } from './models.js';

function column(color) {
  const g = new THREE.Group();
  const shaft = holo(new THREE.CylinderGeometry(0.34, 0.38, 5.2, 20, 6, true), { color, base: 0.05, threshold: 10, points: true, pointSize: 0.9, fillIntensity: 1 });
  shaft.position.y = 2.8;
  const cap = holo(new THREE.BoxGeometry(1.0, 0.25, 1.0), { color, base: 0.08 });
  cap.position.y = 5.52;
  const echinus = holo(new THREE.CylinderGeometry(0.5, 0.36, 0.22, 20, 1), { color, base: 0.08 });
  echinus.position.y = 5.3;
  const base = holo(new THREE.BoxGeometry(0.95, 0.2, 0.95), { color, base: 0.08 });
  base.position.y = 0.1;
  g.add(shaft, cap, echinus, base);
  const parts = [shaft, cap, echinus, base];
  g.setOpacity = (a) => { parts.forEach((p) => p.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setReveal = (h) => { parts.forEach((p) => p.setReveal(h - p.position.y)); return g; };
  return g;
}

scene3('reason', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.035);
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 500);
  const FLOOR = -2.6;

  // the construction from the book, monumental
  const con = new THREE.Group();
  const eu = euclid3D(3.2);
  con.add(eu);
  const flower = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const q = (i * TAU) / 6;
    flower.add(polyline(circlePts(Math.cos(q) * 3.2, Math.sin(q) * 3.2, 3.2, 90).map(([x, y]) => [x, y, 0]), { color: C.gold, opacity: 0.5 }));
  }
  con.add(flower);
  scene.add(con);
  const bar = polyline([[-40, 0, 0], [40, 0, 0]], { color: C.gold, intensity: 3.2 });
  scene.add(bar);
  const pts = [spark(C.gold, 0.5), spark(C.gold, 0.5)];
  pts.forEach((p) => con.add(p));
  const cEuclid = callout('EUCLID', 'Elements, Book I, Prop. 1 · c. 300 BC', { offset: [2.2, 2.4, 0], scale: 0.62, color: C.gold });
  cEuclid.position.set(1.6, 0.2, 0);
  scene.add(cEuclid);

  // platonic solids
  const solids = [
    [new THREE.IcosahedronGeometry(1, 0), [-6, 1.5, -4], C.cyan],
    [new THREE.DodecahedronGeometry(1.1, 0), [6.5, 2.2, -6], C.gold],
    [new THREE.BoxGeometry(1.3, 1.3, 1.3), [-4, 3.8, -12], C.cyan],
    [new THREE.OctahedronGeometry(1.3, 0), [3, 4.5, -16], C.cyan],
    [new THREE.TetrahedronGeometry(1.2, 0), [-7, 0.5, -18], C.gold],
  ].map(([g, p, col]) => {
    const h = holo(g, { color: col, base: 0.08, points: true, pointSize: 3, threshold: 1 });
    h.position.set(...p);
    scene.add(h);
    return h;
  });

  const floor = grid(120, 1, C.cyan, 0.4);
  floor.position.y = FLOOR;
  scene.add(floor);

  const parth = model('parthenon', { scale: 0.8, color: C.gold, wireColor: C.goldHot });
  parth.position.set(0, FLOOR, -36);
  scene.add(parth);
  const door = glow(C.goldHot, 16);
  door.position.set(0, FLOOR + 4, -18);
  scene.add(door);
  const cParth = callout('PARTHENON', 'Athens \u00b7 Ictinus & Callicrates \u00b7 447\u2013432 BC', { offset: [4, 5, 0], scale: 0.9, color: C.gold });
  cParth.position.set(11, FLOOR + 14, -8);
  scene.add(cParth);
  const walkers = [];
  const R = rng(33);
  for (let i = 0; i < 10; i++) {
    const f = figure({ color: R() < 0.4 ? C.gold : C.cyan });
    f.scale.setScalar(1.05);
    f.userData = { x: (R() < 0.5 ? -1 : 1) * (9.6 + R() * 1.2), z: -12 - R() * 36, v: (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.5), ph: R() * 6, dir: false };
    scene.add(f);
    walkers.push(f);
  }

  // the three ways of knowing, as 3D words in the nave
  const ways = [['OBSERVATION', 3.5, -1], ['REASON', 4.65, -4], ['ARGUMENT', 5.75, -7]].map(([s, t, z]) => {
    const w = word(s, { size: 0.9, depth: 0.25, color: C.goldHot, points: true, base: 0.05, fillIntensity: 0.8 });
    w.position.set(0, 0.9, z);
    w.t = t;
    scene.add(w);
    return w;
  });

  const CAM = [
    [0, 0, 0, 12, 0, 0, 0, 40],
    [2.2, 0, 0.3, 11, 0, 0, 0, 40],
    [3.6, 0, 1.8, 9, 0, -1.4, -4, 44],
    [5.4, 7, 4, 4, 0, 2, -20, 50],
    [7.7, 0, -0.6, -13, 0, 0.4, -30, 58],
  ];

  function update(lt) {
    camKeys(camera, CAM, lt);
    // line contracts into AB, the figure is drawn, then lies down as a floor
    const c0 = E.io(seg(lt, 0, 0.8));
    bar.scale.x = lerp(1, 1.6 / 40, c0);
    bar.setOpacity(1 - seg(lt, 0.7, 0.9));
    eu.setOpacity(seg(lt, 0.6, 0.8));
    eu.setProgress(seg(lt, 0.55, 2.2));
    const tilt = E.io(seg(lt, 2.2, 4.0));
    con.rotation.x = -tilt * Math.PI / 2;
    con.position.y = lerp(0, FLOOR + 0.01, tilt);
    flower.children.forEach((l, i) => l.setProgress(E.io(clamp(seg(lt, 2.8, 4.4) * 1.5 - i * 0.08))));
    pts[0].position.set(-1.6, 0, 0.01);
    pts[1].position.set(1.6, 0, 0.01);
    pts.forEach((p) => p.setOpacity(seg(lt, 0.6, 0.9) * (1 - seg(lt, 3, 4))));
    cEuclid.setOpacity(env(lt, 1.2, 1.6, 2.6, 3.0), seg(lt, 1.2, 2.0));

    solids.forEach((s, i) => {
      s.setOpacity(E.sine(seg(lt, 1.8 + i * 0.15, 2.8 + i * 0.15)) * (1 - 0.5 * seg(lt, 5, 6.5)));
      s.rotation.set(lt * (0.3 + i * 0.1), lt * (0.4 - i * 0.07), 0);
    });
    floor.setOpacity(E.sine(seg(lt, 2.6, 4.2)));
    parth.setOpacity(seg(lt, 3.3, 3.5) * lerp(1, 0.45, seg(lt, 5.4, 6.4)));
    parth.setPrint(E.io(seg(lt, 3.4, 5.6)));
    const d = E.sine(seg(lt, 5.0, 6.5));
    door.setOpacity(d * 0.35);
    cParth.setOpacity(env(lt, 5.2, 5.5, 7.2, 7.6), seg(lt, 5.2, 6.0));
    walkers.forEach((f) => {
      const u = f.userData;
      const a = E.sine(seg(lt, 5.2, 6.2));
      f.setOpacity(a);
      f.position.set(u.dir ? u.x + u.v * (lt - 5) : u.x, FLOOR, u.dir ? u.z : u.z + u.v * (lt - 5));
      f.rotation.y = u.dir ? (u.v > 0 ? Math.PI / 2 : -Math.PI / 2) : (u.v > 0 ? 0 : Math.PI);
      f.pose({ walk: 1, phase: lt * 5 + u.ph });
    });
    ways.forEach((w) => {
      const a = env(lt, w.t - 0.2, w.t + 0.15, w.t + 1.0, w.t + 1.3);
      w.setOpacity(a);
      w.setReveal(lerp(-4, 4, E.out(seg(lt, w.t - 0.2, w.t + 0.4))));
      w.rotation.y = Math.sin(lt * 0.5 + w.t) * 0.08;
    });
  }
  return { scene, camera, update, bloom: 1.0 };
});

// ---------------------------------------------------------------- CIVIC
function throne(color) {
  const g = new THREE.Group();
  const parts = [];
  const add = (geom, x, y, z) => { const h = holo(geom, { color, base: 0.1, threshold: 20, points: true, pointSize: 1.4 }); h.position.set(x, y, z); g.add(h); parts.push(h); return h; };
  add(new THREE.BoxGeometry(3, 0.3, 2.2), 0, 0.15, 0);
  add(new THREE.BoxGeometry(2.4, 0.3, 1.8), 0, 0.45, 0);
  add(new THREE.BoxGeometry(1.4, 3.4, 0.3), 0, 2.3, -0.7);
  add(new THREE.BoxGeometry(1.4, 0.2, 1.2), 0, 1.3, 0);
  const f = figure({ color, points: true });
  f.scale.setScalar(1.35);
  f.position.set(0, 0.2, 0);
  f.pose({ lArm: -0.9, rArm: -0.9 });
  g.add(f);
  const crown = holo(new THREE.CylinderGeometry(0.2, 0.17, 0.16, 8, 1, true), { color: C.gold, base: 0.3 });
  crown.position.set(0, 2.54, 0);
  g.add(crown);
  parts.push(crown);
  g.setOpacity = (a) => { parts.forEach((p) => p.setOpacity(a)); f.setOpacity(a); g.visible = a > 0.002; return g; };
  g.setGlitch = (v) => { parts.forEach((p) => p.setGlitch(v)); f.setGlitch(v); return g; };
  return g;
}

function scales(color) {
  const g = new THREE.Group();
  const parts = [];
  const add = (h) => { parts.push(h); return h; };
  const pole = add(holo(new THREE.CylinderGeometry(0.06, 0.08, 4, 10), { color, base: 0.2 }));
  pole.position.y = 2;
  const foot = add(holo(new THREE.CylinderGeometry(0.4, 0.9, 0.3, 24), { color, base: 0.2 }));
  foot.position.y = 0.15;
  const beamG = new THREE.Group();
  beamG.position.y = 3.8;
  const beamM = add(holo(new THREE.BoxGeometry(5, 0.1, 0.1), { color, base: 0.25 }));
  beamG.add(beamM);
  const pans = [];
  for (const x of [-2.4, 2.4]) {
    const hang = new THREE.Group();
    hang.position.x = x;
    const pan = add(holo(new THREE.SphereGeometry(0.8, 20, 6, 0, TAU, Math.PI * 0.62, Math.PI * 0.38), { color, base: 0.15 }));
    pan.position.y = -1.9 + 0.8 * 0.94;
    hang.add(pan);
    const chains = [];
    for (let k = 0; k < 3; k++) {
      const q = (k * TAU) / 3;
      chains.push(add(polyline([[0, 0, 0], [Math.cos(q) * 0.6, -1.4, Math.sin(q) * 0.6]], { color })));
    }
    chains.forEach((c) => hang.add(c));
    beamG.add(hang);
    pans.push(hang);
  }
  g.add(pole, foot, beamG);
  const pivot = spark(C.gold, 0.5);
  pivot.position.y = 3.8;
  g.add(pivot);
  g.set = (ang) => { beamG.rotation.z = ang; pans.forEach((p) => (p.rotation.z = -ang)); };
  g.setOpacity = (a) => { parts.forEach((p) => p.setOpacity(a)); pivot.setOpacity(a); g.visible = a > 0.002; return g; };
  return g;
}

// Pages that become birds: one instanced mesh, morphed and flapped in the shader.
function flock(n) {
  const geom = new THREE.BufferGeometry();
  // quad (page) → bird: 6 vertices, two wings sharing the body line
  const page = [-0.35, 0, -0.5, 0.35, 0, -0.5, 0, 0, 0, 0.35, 0, 0.5, -0.35, 0, 0.5, 0, 0, 0];
  const bird = [-1.2, 0, 0.1, 1.2, 0, 0.1, 0, 0, -0.5, 0, 0, 0.45, 0, 0, 0.45, 0, 0, -0.5];
  geom.setAttribute('position', new THREE.Float32BufferAttribute(page, 3));
  geom.setAttribute('bird', new THREE.Float32BufferAttribute(bird, 3));
  geom.setIndex([0, 2, 5, 1, 2, 5, 0, 5, 4, 1, 3, 2, 4, 5, 2, 3, 2, 4]);
  const phase = new Float32Array(n), R = rng(8);
  for (let i = 0; i < n; i++) phase[i] = R() * 100;
  geom.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMorph: { value: 0 }, uTime: U.time, uOpacity: { value: 1 }, uColor: { value: new THREE.Color(C.ice) } },
    vertexShader: /* glsl */ `
      attribute vec3 bird; attribute float aPhase; uniform float uMorph; uniform float uTime; varying float vF;
      void main(){
        vec3 p = mix(position, bird, uMorph);
        float flap = sin(uTime * 14.0 + aPhase) * uMorph;
        p.y += abs(p.x) * flap * 0.8;
        vF = 0.6 + 0.4 * abs(p.x);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying float vF; void main(){ gl_FragColor = vec4(uColor * 1.1 * vF, 0.22 * uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geom, mat, n);
  mesh.frustumCulled = false;
  return mesh;
}

function sheetTexture(printed) {
  const c = makeCanvas(480, 640), g = c.getContext('2d');
  g.drawImage(TEX.paper, 0, 0, 480, 640);
  if (!printed) scriptLines(g, 50, 80, 380, 17, 30, 17, INK, 0.6);
  else {
    text(g, 'ARTICLE I', 240, 70, 26, { family: FONT.cap, color: rgba(INK, 0.9), spacing: 4 });
    text(g, 'W', 76, 142, 64, { family: FONT.cap, color: rgba('#7a2a18', 0.9) });
    const r = rng(9);
    g.fillStyle = rgba(INK, 0.75);
    for (let i = 0; i < 15; i++) {
      let x = i < 2 ? 116 : 50;
      const y = 116 + i * 30, end = 430 - (i === 14 ? 180 : 0);
      while (x < end - 10) { const w = Math.min(end - x, 18 + r() * 54); g.fillRect(x, y, w, 5); x += w + 8; }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

scene3('civic', async () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.025);
  const camera = new THREE.PerspectiveCamera(44, W / H, 0.05, 800);

  // A — the words, flown through
  const WORDS3 = WORDS.map(([s], i) => {
    const w = word(s, { size: s.length > 8 ? 2.1 : 2.8, depth: 0.9, color: i % 2 ? C.cyan : C.goldHot, points: true, base: 0.02, fillIntensity: 0.5 });
    w.position.set(0, 0, -4 - i * 12);
    w.rotation.y = (i % 2 ? -1 : 1) * 0.12;
    scene.add(w);
    return w;
  });
  const streaks = [];
  const R = rng(19);
  for (let i = 0; i < 160; i++) {
    const x = (R() - 0.5) * 30, y = (R() - 0.5) * 16, z = -R() * 70;
    if (Math.abs(x) < 4 && Math.abs(y) < 2.5) continue;
    streaks.push(x, y, z, x, y, z - 1.5 - R() * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(streaks, 3));
  const streak = new THREE.LineSegments(sg, lineMat({ color: C.cyan, intensity: 1.6 }));
  scene.add(streak);

  // B — the chamber, the throne, the citizens
  const chamber = new THREE.Group();
  chamber.position.set(0, 0, -100);
  scene.add(chamber);
  const tiers = [];
  const seatPos = [];
  for (let k = 0; k < 8; k++) {
    const r = 6 + k * 1.3;
    const tor = holo(new THREE.TorusGeometry(r, 0.05, 4, 80, Math.PI), { color: C.cyan, fill: false, wireOpacity: 0.5, threshold: 1 });
    tor.rotation.x = -Math.PI / 2;
    tor.rotation.z = Math.PI;
    tor.position.y = k * 0.55;
    chamber.add(tor);
    tiers.push(tor);
    const n = 30 + k * 8;
    for (let i = 0; i < n; i++) {
      const q = Math.PI + ((i + 0.5) / n) * Math.PI;
      seatPos.push(Math.cos(q) * (r + 0.4), k * 0.55 + 0.35, Math.sin(q) * (r + 0.4));
    }
  }
  const seats = pointCloud(seatPos, { color: C.gold, size: 6, intensity: 3, max: 9 });
  chamber.add(seats);
  const seatDim = pointCloud(seatPos, { color: C.cyan, size: 3, intensity: 1, opacity: 0.4 });
  chamber.add(seatDim);
  const ruler = throne(C.ember);
  ruler.position.set(0, 0, -4);
  chamber.add(ruler);
  const threads = new THREE.Group();
  for (let i = 0; i < 70; i++) {
    const j = Math.floor(R() * (seatPos.length / 3));
    threads.add(polyline([[seatPos[j * 3], seatPos[j * 3 + 1], seatPos[j * 3 + 2]], [(R() - 0.5) * 1.6, 0.6 + R() * 3, -4]], { color: C.gold, opacity: 0.6 }));
  }
  chamber.add(threads);
  const motes = [];
  for (let i = 0; i < 500; i++) motes.push((R() - 0.5) * 2.6, R() * 3.6, -4 + (R() - 0.5) * 2);
  const ash = pointCloud(motes, { color: C.goldHot, size: 3, intensity: 3 });
  const ashBase = motes.slice();
  chamber.add(ash);

  // C — the scale settles
  const sc = scales(C.gold);
  sc.position.set(0, 3.5, -8);
  chamber.add(sc);
  const cLaw = callout('THE RULE OF LAW', 'No one above it', { offset: [2.8, 1.6, 0], scale: 0.7, color: C.gold });
  cLaw.position.set(2.5, 8, -8);
  chamber.add(cLaw);

  // D — written, then printed
  const texW = sheetTexture(false), texP = sheetTexture(true);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ map: texW, color: 0x9c8c70, transparent: true }));
  sheet.position.set(0, 6, -12);
  chamber.add(sheet);
  const platen = holo(new THREE.BoxGeometry(3.6, 0.6, 1.2), { color: C.cyan, base: 0.05, points: false });
  chamber.add(platen);
  const pressM = model('press', { height: 5.2, color: C.gold });
  pressM.position.set(5.2, 3.3, -12);
  pressM.rotation.y = -0.6;
  chamber.add(pressM);
  const cPress = callout('GUTENBERG', 'Movable type \u00b7 Mainz \u00b7 c. 1440', { offset: [2.5, 2.2, 0], scale: 0.6, color: C.gold });
  cPress.position.set(6.5, 8.2, -12);
  chamber.add(cPress);
  const capM = model('capitol', { height: 26, color: C.gold, wireColor: C.goldHot });
  capM.position.set(0, -3, -70);
  chamber.add(capM);
  const cCap = callout('REPRESENTATION', 'The Capitol \u00b7 Washington \u00b7 dome 1866', { offset: [6, 4, 0], scale: 1.4, color: C.gold });
  cCap.position.set(10, 22, -70);
  chamber.add(cCap);

  // E/F — pages multiply and take flight
  const N = 700;
  const birds = flock(N);
  chamber.add(birds);
  const seedsB = [];
  for (let i = 0; i < N; i++) seedsB.push({ a: R() * TAU, r: Math.sqrt(R()), z: R(), y: R() - 0.5, sp: R(), rot: (R() - 0.5) * 2 });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3(), Eu = new THREE.Euler();
  const lead = spark(C.ice, 0.6);
  chamber.add(lead);

  function update(lt) {
    // camera: fly through the words, then into the chamber
    if (lt < 3.4) {
      const z = 10 - Math.max(0, lt - 0.6) * 24;
      camera.position.set(Math.sin(lt * 0.7) * 0.6, Math.cos(lt * 0.5) * 0.3, z);
      camera.lookAt(0, 0, z - 20);
      camera.fov = 44 + seg(lt, 0.5, 1.2) * 12;
    } else {
      camKeys(camera, [
        [3.4, 0, 9, -76, 0, 2, -104, 50],
        [5.0, -4, 7, -82, 0, 2.2, -104, 46],
        [7.0, 3, 6.5, -88, 0, 5, -108, 42],
        [8.3, 0, 7.8, -104.5, 0, 7.8, -112, 40],
        [11.5, 0, 9, -80, 0, 8, -112, 50],
      ], lt);
    }
    camera.updateProjectionMatrix();
    WORDS3.forEach((w, i) => {
      const passAt = 1.18 + 0.5 * i;
      w.setOpacity(env(lt, passAt - 1.0, passAt - 0.7, passAt - 0.2, passAt - 0.02));
      w.setReveal(lerp(-12, 12, E.out(seg(lt, passAt - 1.0, passAt - 0.5))));
    });
    streak.material.uniforms.uOpacity.value = env(lt, 0.5, 0.9, 3.0, 3.4);

    // chamber
    const ch = seg(lt, 3.3, 3.8);
    tiers.forEach((t, k) => t.setOpacity(ch * seg(lt, 3.3 + k * 0.05, 3.6 + k * 0.05)));
    seatDim.setOpacity(ch * 0.8);
    const fill = seg(lt, 4.2, 5.4);
    seats.setOpacity(fill);
    seats.setReveal(lerp(-12, 12, fill));
    seats.material.uniforms.uAxis.value = 0;
    const dissolve = seg(lt, 4.3, 5.0);
    ruler.setOpacity(seg(lt, 3.3, 3.7) * (1 - E.in(dissolve)));
    ruler.setGlitch(dissolve > 0 ? 1 : 0.2);
    const bind = E.io(seg(lt, 3.6, 4.3));
    threads.children.forEach((l, i) => l.setProgress(clamp(bind * 1.5 - (i % 10) * 0.05)).setOpacity(1 - dissolve));
    const ap = ash.geometry.attributes.position;
    for (let i = 0; i < ap.count; i++) {
      const k = E.out(clamp((dissolve - (i % 7) * 0.05) * 1.4));
      ap.setXYZ(i, ashBase[i * 3] * (1 + k), ashBase[i * 3 + 1] + k * (4 + (i % 5)), ashBase[i * 3 + 2]);
    }
    ap.needsUpdate = true;
    ash.setOpacity(dissolve > 0 && dissolve < 1 ? 1 - dissolve * 0.6 : 0);

    const sa = env(lt, 4.9, 5.3, 7.0, 7.3);
    const k = Math.max(0, lt - 5.0);
    sc.set(0.4 * Math.exp(-k * 2.6) * Math.cos(k * 7.5));
    sc.setOpacity(sa);
    cLaw.setOpacity(env(lt, 5.6, 6.0, 7.0, 7.3), seg(lt, 5.6, 6.3));

    const pa = env(lt, 7.0, 7.3, 8.3, 8.8);
    sheet.material.opacity = pa;
    sheet.visible = pa > 0;
    sheet.material.map = lt > 7.62 ? texP : texW;
    const down = E.in(seg(lt, 7.35, 7.6)) * (1 - E.out(seg(lt, 7.68, 7.95)));
    platen.position.set(0, 6, lerp(-6, -11.6, down));
    platen.rotation.x = Math.PI / 2;
    platen.setOpacity(env(lt, 7.1, 7.3, 7.9, 8.1));
    const pr = env(lt, 6.9, 7.3, 8.3, 8.7);
    pressM.setOpacity(pr);
    pressM.setPrint(E.out(seg(lt, 6.9, 7.4)));
    cPress.setOpacity(pr, seg(lt, 7.2, 7.8));
    const cp = env(lt, 3.3, 3.8, 7.0, 7.5);
    capM.setOpacity(cp * 0.8);
    capM.setPrint(E.io(seg(lt, 3.4, 4.8)));
    cCap.setOpacity(env(lt, 4.4, 4.8, 6.6, 7.0), seg(lt, 4.4, 5.2));

    // pages → birds
    const spread = E.io(seg(lt, 8.1, 9.6));
    const fly = seg(lt, 9.2, 11.5);
    const morph = E.io(seg(lt, 9.2, 9.9));
    birds.material.uniforms.uMorph.value = morph;
    birds.material.uniforms.uOpacity.value = seg(lt, 8.1, 8.3);
    birds.visible = lt > 8.1;
    for (let i = 0; i < N; i++) {
      const s = seedsB[i];
      const rad = s.r * 18 * spread;
      let x = Math.cos(s.a) * rad, y = 7.8 + Math.sin(s.a) * rad * 0.55, z = -12 - s.z * 20 * spread;
      const fk = E.in(clamp(fly * 1.3 - s.sp * 0.3));
      x += fk * (26 + s.sp * 20) + Math.sin(lt * 1.3 + i) * fk;
      y += fk * (6 + s.y * 10);
      z += fk * 10;
      P.set(x, y, z);
      Eu.set(Math.PI / 2 * (1 - morph) + s.rot * (1 - spread) * 0.5, -Math.PI / 2 * morph + s.rot * 0.2, s.rot * 0.3 * (1 - morph));
      Q.setFromEuler(Eu);
      Sv.setScalar(lerp(1, 0.8, morph));
      M.compose(P, Q, Sv);
      birds.setMatrixAt(i, M);
    }
    birds.instanceMatrix.needsUpdate = true;
    const ld = seg(lt, 10.0, 11.5);
    lead.position.set(lerp(18, 0, E.io(ld)), lerp(14, 9, E.io(ld)), lerp(-30, -84, E.in(ld)));
    lead.setOpacity(ld > 0 ? 1 : 0);
  }
  return { scene, camera, update, bloom: 1.0 };
});
