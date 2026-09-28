/* WESTERN CIVILIZATION — launch-film intro, v2.
   Eleven sections cut on a 128 BPM grid (see timeline.js). Every section is a
   3D set far from the others; only the live one is shown. The beat map drives
   the camera shake, bloom pump, flashes, zoom-blur whips and every slam. */
import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { scene3 } from '../../film3d/js/engine3d.js';
import { C, U, polyline, glow, grid, pointCloud, stars, lineMat, fillMat, beam, earthPoints, latLon } from '../../film3d/js/holo.js';
import { model } from '../../film3d/js/models.js';

const SANS = '"Manrope", "Helvetica Neue", Arial, sans-serif';
const GOLD = '#ffc36a', VIOLET = '#7b6cff', BLUE = '#4aa8ff';
const TINT = { gold: [0.95, 0.66, 0.32], silver: [0.6, 0.66, 0.8], violet: [0.55, 0.48, 0.95] };
const uPulse = { value: 0 };

// ---------- chrome: a studio environment faked from the reflection vector ----------
function chromeMat(tint = TINT.gold, dim = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uSweep: { value: -9 }, uOpacity: { value: 1 }, uPulse, uTint: { value: new THREE.Vector3(...tint) }, uDim: { value: dim } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vV = cameraPosition - w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uSweep; uniform float uOpacity; uniform float uPulse; uniform vec3 uTint; uniform float uDim;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vec3 n = normalize(vN), v = normalize(vV), r = reflect(-v, n);
        float e = smoothstep(-0.06, 0.0, r.y) * (1.0 - smoothstep(0.0, 0.18, r.y)) * 1.5
                + smoothstep(0.25, 1.0, r.y) * 0.75 + pow(max(0.0, r.x), 10.0) * 0.9 + pow(max(0.0, -r.x), 14.0) * 0.4;
        vec3 c = mix(uTint * 0.06, uTint, clamp(e, 0.0, 1.6));
        float f = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        c += vec3(1.0, 0.92, 0.8) * f * 0.3;
        c += vec3(1.0, 0.97, 0.9) * exp(-pow((vP.x * 0.14 + vP.y * 0.05 - uSweep) * 2.6, 2.0)) * 0.85;
        c *= (1.0 + uPulse * 0.35) * uDim;
        gl_FragColor = vec4(c, uOpacity);
      }`,
    transparent: true,
  });
}

// ---------- 3D type, one mesh per letter so every letter can move ----------
let SANS3 = null;
const GLYPHS = new Map();
function glyph(ch, size, depth) {
  const key = ch + size + ':' + depth;
  if (GLYPHS.has(key)) return GLYPHS.get(key);
  const g = new TextGeometry(ch, { font: SANS3, size, depth: size * depth, curveSegments: 5, bevelEnabled: true, bevelThickness: size * 0.035, bevelSize: size * 0.022, bevelSegments: 2 });
  g.computeBoundingBox();
  const b = g.boundingBox, cx = (b.max.x + b.min.x) / 2, cy = (b.max.y + b.min.y) / 2, cz = (b.max.z + b.min.z) / 2;
  g.translate(-cx, -cy, -cz);
  g.computeVertexNormals();
  const out = { geo: g, edges: new THREE.EdgesGeometry(g, 35), cx, cy };
  GLYPHS.set(key, out);
  return out;
}
function word3(str, size, o = {}) {
  const mat = chromeMat(o.tint || TINT.gold, o.dim == null ? 0.78 : o.dim);
  const edgeBase = o.edge == null ? 0.28 : o.edge;
  const em = lineMat({ color: o.edgeColor || '#ffe0a0', intensity: 1.2 });
  em.uniforms.uOpacity.value = edgeBase;
  const grp = new THREE.Group();
  grp.letters = [];
  const sc = size / SANS3.data.resolution, sp = (o.spacing || 0) * size;
  let x = 0;
  for (const ch of str) {
    const gd = SANS3.data.glyphs[ch] || SANS3.data.glyphs['?'];
    if (ch !== ' ') {
      const { geo, edges, cx, cy } = glyph(ch, size, o.depth == null ? 0.3 : o.depth);
      const L = new THREE.Group();
      L.add(new THREE.Mesh(geo, mat), new THREE.LineSegments(edges, em));
      L.home = new THREE.Vector3(x + cx, cy, 0);
      grp.add(L);
      grp.letters.push(L);
    }
    x += gd.ha * sc + sp;
  }
  const w = x - sp;
  grp.letters.forEach((L, i) => { L.home.x -= w / 2; L.home.y -= size * 0.36; L.position.copy(L.home); L.seed = i; });
  grp.width = w;
  grp.size = size;
  grp.mat = mat;
  grp.setOpacity = (a) => { mat.uniforms.uOpacity.value = a; em.uniforms.uOpacity.value = edgeBase * a; grp.visible = a > 0.002; return grp; };
  grp.sweep = (s) => { mat.uniforms.uSweep.value = s; return grp; };
  grp.home = () => { grp.letters.forEach((L) => { L.position.copy(L.home); L.rotation.set(0, 0, 0); L.scale.setScalar(1); }); return grp; };
  return grp;
}

// merged line segments with the holographic line shader
function segs(arr, o = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  g.setAttribute('lineDistance', new THREE.Float32BufferAttribute(new Float32Array(arr.length / 3), 1));
  const m = lineMat({ color: o.color || C.cyan, intensity: o.intensity || 1.8 });
  const base = o.opacity == null ? 0.8 : o.opacity;
  m.uniforms.uOpacity.value = base;
  const ls = new THREE.LineSegments(g, m);
  ls.setOpacity = (a) => { m.uniforms.uOpacity.value = base * a; ls.visible = a > 0.002; return ls; };
  return ls;
}
function ringPts(r, n = 96, y = 0) { return circlePts(0, 0, r, n).map(([x, z]) => [x, y, z]); }

// a spherical burst of sparks: positions recomputed from a seeded direction set
function burst(n, seed, color = C.goldHot, size = 3) {
  const R = rng(seed), dir = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const u = R() * 2 - 1, q = R() * TAU, s = Math.sqrt(1 - u * u); dir.set([Math.cos(q) * s, u, Math.sin(q) * s, 0.4 + R() * 0.6], i * 4); }
  const p = pointCloud(new Array(n * 3).fill(0), { color, size, intensity: 2.6, max: 5, seed });
  p.fire = (k, r) => {
    const a = p.geometry.attributes.position;
    const e = E.expoOut(clamp(k));
    for (let i = 0; i < n; i++) { const d = r * e * dir[i * 4 + 3]; a.setXYZ(i, dir[i * 4] * d, dir[i * 4 + 1] * d, dir[i * 4 + 2] * d); }
    a.needsUpdate = true;
    p.setOpacity(k > 0 && k < 1 ? Math.pow(1 - k, 1.5) : 0);
  };
  return p;
}

// frosted glass card
function glassCard(labelTxt, idx, w = 4.4, h = 5.6) {
  const c = makeCanvas(440, 560), g = c.getContext('2d');
  const r = 30;
  const path = () => { g.beginPath(); g.roundRect(2, 2, 436, 556, r); };
  const gr = g.createLinearGradient(0, 0, 440, 560);
  gr.addColorStop(0, 'rgba(130,140,255,0.26)'); gr.addColorStop(0.5, 'rgba(30,36,80,0.22)'); gr.addColorStop(1, 'rgba(255,180,100,0.24)');
  path(); g.fillStyle = gr; g.fill();
  g.save(); path(); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
  for (let x = 20; x < 440; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 560); g.stroke(); }
  for (let y = 20; y < 560; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(440, y); g.stroke(); }
  const hl = g.createLinearGradient(0, 0, 0, 180); hl.addColorStop(0, 'rgba(255,255,255,0.16)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.fillRect(0, 0, 440, 180);
  g.restore();
  path(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.stroke();
  g.font = `800 36px ${SANS}`; g.fillStyle = '#ffffff'; g.letterSpacing = '4px'; g.fillText(labelTxt, 32, 505);
  g.font = `700 20px ${SANS}`; g.fillStyle = GOLD; g.letterSpacing = '3px'; g.fillText(String(idx + 1).padStart(2, '0'), 32, 58);
  g.font = `700 26px ${SANS}`; g.fillStyle = 'rgba(255,255,255,0.7)'; g.letterSpacing = '0px'; g.fillText('↗', 392, 60);
  g.fillStyle = GOLD; g.fillRect(32, 524, 64, 4);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.setOpacity = (a) => { mat.opacity = a; mesh.visible = a > 0.002; return mesh; };
  return mesh;
}

function fitModel(name, size, o = {}) {
  const m = model(name, { height: size, color: o.color || C.gold, wireColor: o.wire || C.goldHot });
  const s = Math.min(1, (o.maxW || size * 1.8) / Math.max(m.width, m.depth));
  m.scale.setScalar(s);
  if (o.dim) m.baseOps = m.baseOps.map((v) => v * o.dim);
  return m;
}
const heroColor = (i) => (i % 3 === 1 ? [C.cyan, C.ice] : [C.gold, C.goldHot]);

scene3('intro', async () => {
  SANS3 = new Font(await (await fetch('fonts/manrope-800.typeface.json')).json());
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 6000);
  const V = new THREE.Vector3();
  const toScreen = (p) => { V.copy(p).project(camera); return [(V.x * 0.5 + 0.5) * W, (-V.y * 0.5 + 0.5) * H, V.z]; };
  function look(px, py, pz, tx, ty, tz, fov = 40, roll = 0) {
    camera.position.set(px, py, pz);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(tx, ty, tz);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }

  // sky and stars ride with the camera
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uWarm: { value: 0 }, uPulse },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform float uWarm; uniform float uPulse; varying vec3 vD;
      void main(){
        float y = vD.y;
        vec3 c = vec3(0.01, 0.012, 0.03);
        float a1 = exp(-pow(vD.x * 1.2 + sin(uTime * 0.25) * 0.4, 2.0) * 3.0) * smoothstep(-0.25, 0.3, y) * (1.0 - smoothstep(0.3, 0.95, y));
        float a2 = exp(-pow(vD.z * 1.1 - cos(uTime * 0.2) * 0.5, 2.0) * 3.0) * smoothstep(-0.1, 0.4, y) * (1.0 - smoothstep(0.4, 1.0, y));
        c += vec3(0.2, 0.13, 0.6) * a1 * (0.14 + uPulse * 0.05) + vec3(0.1, 0.35, 0.6) * a2 * 0.08 + vec3(0.7, 0.4, 0.12) * uWarm * a1 * 0.14;
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  const star = stars(3500, 1400, 8, C.ice);
  scene.add(sky, star);

  const S = [];
  const section = (key, t0, t1, def) => { const g = new THREE.Group(); scene.add(g); const s = { key, t0, t1, g, ...def(g) }; S.push(s); return s; };

  // ================= A · IGNITION — four slams =================
  section('ignite', 0, SEC.warp, (g) => {
    const words = IGNITE_WORDS.map((w, i) => { const o = word3(w, i === 0 ? 7 : 5.2, { tint: i === 3 ? TINT.gold : TINT.silver }); g.add(o); return o; });
    const shock = polyline(ringPts(1, 128).map(([x, , z]) => [x, z, 0]), { color: GOLD, intensity: 2.6 });
    const shock2 = polyline(ringPts(1, 128).map(([x, , z]) => [x, z, 0]), { color: VIOLET, intensity: 2 });
    const sp = glow(GOLD, 40); sp.position.z = -30;
    const bs = burst(1400, 4);
    g.add(shock, shock2, sp, bs);
    return {
      update(k) {
        const i = Math.min(3, Math.floor(k / (2 * BEAT))), u = k - i * 2 * BEAT;
        look(Math.sin(k * 0.6) * 1.5, 0.4, 24 - k * 1.2, 0, 0, 0, 40, Math.sin(k * 0.8) * 0.03);
        words.forEach((w, j) => {
          if (j !== i) return w.setOpacity(0);
          w.setOpacity(1);
          const slam = E.expoOut(seg(u, 0, 0.16));
          w.position.set(0, 0, lerp(-70, 0, slam) + u * 2.5);
          w.scale.setScalar(lerp(1.5, 1, E.backOut(seg(u, 0, 0.3))));
          w.letters.forEach((L, n) => { L.position.copy(L.home); L.position.y += Math.sin(n * 1.7 + k * 3) * 0.05; });
          w.sweep(lerp(-3, 3, seg(u, 0.1, 0.8)));
        });
        const s = seg(u, 0, 0.6);
        shock.scale.setScalar(2 + E.expoOut(s) * 26); shock.setOpacity((1 - s) * (s > 0 ? 1 : 0)).setProgress(1);
        shock2.scale.setScalar(2 + E.expoOut(seg(u, 0.05, 0.8)) * 34); shock2.setOpacity(1 - seg(u, 0.05, 0.8));
        sp.setOpacity(0.25 + 0.5 * Math.exp(-u * 5));
        bs.fire(seg(u, 0, 0.9), 26);
        bs.rotation.z = i;
      },
    };
  });

  // ================= warp tunnel =================
  section('warp', SEC.warp, SEC.title, (g) => {
    const rings = [], streak = [];
    for (let i = 0; i < 80; i++) {
      const z = -i * 17, n = 12, r = 10, a0 = i * 0.12;
      for (let j = 0; j < n; j++) { const a = a0 + (j / n) * TAU, b = a0 + ((j + 1) / n) * TAU; (i % 2 ? streak : rings).push(Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(b) * r, Math.sin(b) * r, z); }
    }
    const tA = segs(rings, { color: GOLD, intensity: 2.2, opacity: 0.8 }), tB = segs(streak, { color: VIOLET, intensity: 2.2, opacity: 0.7 });
    const R = rng(9), st = [];
    for (let i = 0; i < 700; i++) { const a = R() * TAU, r = 3 + R() * 12, z = -R() * 1400, l = 4 + R() * 10; st.push(Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a) * r, Math.sin(a) * r, z - l); }
    const streaks = segs(st, { color: C.ice, intensity: 2, opacity: 0.55 });
    const words = WARP_WORDS.map((w, i) => { const o = word3(w, 2.8, { tint: i % 2 ? TINT.gold : TINT.silver }); g.add(o); return o; });
    const core = glow(GOLD, 6);
    g.add(tA, tB, streaks, core);
    const zc = (k) => -(26 * k + 62 * k * k);
    return {
      update(k) {
        const gap = SEC.title - BEAT, kg = gap - SEC.warp;
        const cz = zc(Math.min(k, kg));
        const fov = lerp(55, 100, E.in(seg(k, 1.5, kg)));
        look(Math.sin(k * 2) * 0.8, Math.cos(k * 1.7) * 0.6, cz, 0, 0, cz - 50, fov, k * 0.25);
        tA.rotation.z = k * 0.4; tB.rotation.z = -k * 0.3;
        const lit = k < kg ? 1 : 0;
        tA.setOpacity(lit * (0.6 + 0.6 * pulse(KICKS, SEC.warp + k, 10))); tB.setOpacity(lit * 0.8); streaks.setOpacity(lit * lerp(0.4, 1, seg(k, 0, kg)));
        words.forEach((w, i) => {
          const u = (k - i * BEAT) / BEAT;
          if (u < 0 || u > 1.05 || k >= kg) return w.setOpacity(0);
          w.setOpacity(clamp(u * 6));
          const side = [-1, 1, 0, -1, 1, 0, -1, 1][i];
          w.position.set(side * 2.6 * (1 - u), (i % 2 ? 1.2 : -1.2) * (1 - u), cz - lerp(30, -3, E.in(u)));
          w.rotation.z = side * 0.15 * (1 - u);
          w.sweep(lerp(-2, 2, u));
        });
        // the gap: everything drops out but a collapsing star
        const gk = seg(k, kg, kg + BEAT);
        core.position.set(0, 0, cz - 40);
        core.scale.setScalar(k < kg ? 6 + 4 * pulse(KICKS, SEC.warp + k, 8) : lerp(30, 2, E.in(gk)));
        core.setOpacity(k < kg ? 0.5 : 1);
      },
      zoom: (k) => (k < SEC.title - BEAT - SEC.warp ? 0.25 * E.in(seg(k, 2.2, SEC.title - BEAT - SEC.warp)) : 0.35),
    };
  });

  // ================= B · TITLE DROP =================
  section('title', SEC.title, SEC.cards, (g) => {
    const w1 = word3('WESTERN', 4.4, { spacing: 0.02 }), w2 = word3('CIVILIZATION', 2.7, { spacing: 0.06, tint: TINT.silver });
    w1.position.y = 2.7; w2.position.y = -2.4;
    const R = rng(12);
    [...w1.letters, ...w2.letters].forEach((L) => { L.from = new THREE.Vector3((R() - 0.5) * 70, (R() - 0.5) * 40, -30 - R() * 60); L.spin = new THREE.Vector3((R() - 0.5) * 8, (R() - 0.5) * 8, (R() - 0.5) * 4); L.out = new THREE.Vector3((R() - 0.5) * 30, (R() - 0.5) * 20, 20 + R() * 30); });
    const floor = grid(600, 3, VIOLET, 0.35); floor.position.y = -6.5;
    const rings = [0, 1, 2].map((i) => polyline(ringPts(1, 160, -6.4), { color: i === 1 ? VIOLET : GOLD, intensity: 2.6 }));
    const beams = [-1, -0.35, 0.35, 1].map((a, i) => { const b = beam(0.3, 7, 90, i % 2 ? VIOLET : GOLD, 0.22); b.position.set(a * 16, 30, -30); b.rotation.z = -a * 0.35; return b; });
    const bs = burst(3000, 21, C.goldHot, 3.5);
    const back = glow(GOLD, 70); back.position.set(0, 0, -40);
    g.add(w1, w2, floor, ...rings, ...beams, bs, back);
    const all = [...w1.letters, ...w2.letters];
    return {
      update(k, t) {
        const kp = pulse(KICKS, t, 9);
        const orbit = lerp(-0.35, 0.3, E.sine(seg(k, 0, 3.4)));
        const d = lerp(15, 31, E.expoOut(seg(k, 0, 1.4))) - k * 0.8;
        look(Math.sin(orbit) * d, lerp(-1.5, 1.5, seg(k, 0, 3.7)), Math.cos(orbit) * d, 0, 0.2, 0, 40);
        const out = E.in(seg(k, 3.2, 3.75));
        all.forEach((L, i) => {
          const a = E.expoOut(seg(k, 0.02 * i, 0.02 * i + 0.55));
          L.position.lerpVectors(L.from, L.home, a).addScaledVector(L.out, out);
          L.rotation.set(L.spin.x * (1 - a) + out * L.spin.x * 0.3, L.spin.y * (1 - a), L.spin.z * (1 - a));
          L.scale.set(1, 1 + kp * 0.06, 1);
        });
        w1.sweep(lerp(-4, 4, seg(k, 0.6, 2.2))); w2.sweep(lerp(-4, 4, seg(k, 0.8, 2.4)));
        w1.setOpacity(1 - seg(k, 3.5, 3.75)); w2.setOpacity(1 - seg(k, 3.5, 3.75));
        rings.forEach((r, i) => { const s = seg(k, i * 0.12, 1.4 + i * 0.12); r.scale.setScalar(1 + E.expoOut(s) * (40 + i * 25)); r.setOpacity(s > 0 ? 1 - s : 0).setProgress(1); });
        floor.setOpacity(0.5 + 0.8 * kp);
        beams.forEach((b, i) => { b.rotation.z = (i - 1.5) * -0.25 + Math.sin(k * 1.2 + i) * 0.18; b.setOpacity(E.out(seg(k, 0, 0.4)) * (0.7 + 0.5 * kp)); });
        bs.fire(seg(k, 0, 1.6), 55);
        back.setOpacity(0.18 + 0.12 * kp);
      },
      zoom: (k) => 0.3 * E.in(seg(k, 3.3, 3.75)),
    };
  });

  // ================= C · CAROUSEL — a card snaps forward on every beat =================
  section('cards', SEC.cards, SEC.heroes, (g) => {
    const Rr = 12;
    const ring = new THREE.Group(); g.add(ring);
    const cards = FEATURES.map(([name, lab], i) => {
      const a = (i / FEATURES.length) * TAU;
      const holder = new THREE.Group();
      holder.position.set(Math.sin(a) * Rr, 0, Math.cos(a) * Rr); holder.rotation.y = a;
      const card = glassCard(lab, i);
      const [col, wc] = heroColor(i);
      const m = fitModel(name, 2.8, { color: col, wire: wc, maxW: 3.4 });
      m.position.set(0, -1.2, 0.9);
      holder.add(card, m); ring.add(holder);
      return { card, m, holder };
    });
    const floor = grid(400, 2, BLUE, 0.3); floor.position.y = -4.2;
    const halo = polyline(ringPts(Rr + 0.5, 160, -4.1), { color: GOLD, intensity: 2.2 });
    const back = glow(VIOLET, 60); back.position.set(0, 2, -20);
    g.add(floor, halo, back);
    return {
      update(k, t) {
        const kp = pulse(KICKS, t, 9);
        const b = Math.min(FEATURES.length - 1, Math.floor(k / BEAT)), u = k - b * BEAT;
        const snap = b + E.expoOut(seg(u, 0, 0.3));
        ring.rotation.y = -((snap - 1) / FEATURES.length) * TAU;
        look(lerp(-3, 3, k / 3.75), lerp(3.5, 1.5, k / 3.75), lerp(30, 24, E.out(seg(k, 0, 3.75))), 0, 0.3, Rr - 4, 40);
        cards.forEach((c, i) => {
          const front = i === b, seen = i <= b;
          const pop = front ? E.backOut(seg(u, 0, 0.35)) : 0;
          c.card.setOpacity(seen ? (front ? 1 : 0.45) : 0.12);
          c.holder.scale.setScalar(1 + (front ? 0.15 * pop : 0));
          c.m.setOpacity(seen ? (front ? 1 : 0.35) : 0);
          c.m.setPrint(front ? E.out(seg(u, 0, 0.4)) : 1);
          c.m.rotation.y = t * 0.9 + i;
        });
        floor.setOpacity(0.5 + 0.7 * kp);
        halo.setProgress(E.expoOut(seg(k, 0, 1))).setOpacity(0.7 + 0.5 * kp);
        back.setOpacity(0.12 + 0.08 * kp);
      },
    };
  });

  // ================= D · HEROES — a breakthrough every two beats =================
  const HB = 2 * BEAT;
  section('heroes', SEC.heroes, SEC.timeline, (g) => {
    const stage = new THREE.Group(); g.add(stage);
    const floor = grid(300, 2.5, VIOLET, 0.3);
    const r1 = polyline(ringPts(9, 128, 0.05), { color: GOLD, intensity: 2.4 }), r2 = polyline(ringPts(11.5, 128, 0.05), { color: VIOLET, intensity: 1.8, opacity: 0.7 });
    const back = glow(GOLD, 45); back.position.set(0, 8, -18);
    const beams = [-1, 1].map((s) => { const b = beam(0.2, 5, 70, s < 0 ? VIOLET : GOLD, 0.16); b.position.set(s * 14, 30, -16); b.rotation.z = -s * 0.3; return b; });
    const dust = pointCloud(Array.from({ length: 900 * 3 }, (_, i) => { const R = rng(i * 7 + 1)(); return i % 3 === 1 ? R * 20 : (R - 0.5) * 50; }), { color: C.goldHot, size: 0.3, intensity: 1.6, max: 3, opacity: 0.6 });
    stage.add(floor, r1, r2, back, ...beams, dust);
    const heroes = HEROES.map(([name, , , , , year], i) => {
      const [col, wc] = heroColor(i);
      const hg = new THREE.Group(); hg.position.set(i * 500, 0, 0); g.add(hg);
      const m = fitModel(name, 9.5, { color: col, wire: wc, maxW: 16, dim: 0.55 });
      const yr = word3(year, 6, { tint: i % 3 === 1 ? TINT.silver : TINT.gold, dim: 0.34, edge: 0.14 });
      hg.add(m, yr);
      return { hg, m, yr };
    });
    return {
      update(k, t) {
        const kp = pulse(KICKS, t, 9);
        const i = Math.min(HEROES.length - 1, Math.floor(k / HB)), u = k - i * HB;
        const h = heroes[i], x0 = h.hg.position.x;
        heroes.forEach((o, j) => (o.hg.visible = j === i));
        stage.position.x = x0;
        const whip = E.expoOut(seg(u, 0, 0.45));
        const mv = i % 4, dir = i % 8 < 4 ? 1 : -1;
        let px, py, pz, ty = 3.2, roll = 0, fov = 40;
        if (mv === 0) { const a = dir * lerp(1.5, 0.45, whip) + dir * u * 0.15, r = lerp(34, 22, E.out(seg(u, 0, HB))); px = Math.sin(a) * r; pz = Math.cos(a) * r; py = lerp(9, 3, whip); }
        else if (mv === 1) { const a = -dir * lerp(1.3, 0.35, whip) - dir * u * 0.15, r = lerp(30, 21, E.out(seg(u, 0, HB))); px = Math.sin(a) * r; pz = Math.cos(a) * r; py = lerp(0.5, 4, whip); }
        else if (mv === 2) { const a = 0.35 * dir + u * 0.12 * dir; px = Math.sin(a) * 22; pz = Math.cos(a) * 22; py = lerp(-3, 7, E.io(seg(u, 0, HB))); ty = lerp(6, 3, E.io(seg(u, 0, HB))); }
        else { const r = lerp(46, 20, E.expoOut(seg(u, 0, 0.6))); px = dir * 3; pz = r; py = 2.5; roll = dir * lerp(0.12, 0.04, whip); fov = lerp(55, 40, whip); }
        if (i === 14) { py = lerp(-4, 2, E.io(seg(u, 0, HB))); ty = lerp(9, 6, whip); }
        look(x0 + px, py, pz, x0, ty, 0, fov, roll);
        const hit = Math.exp(-u * 16);
        camera.position.x += noise1(t * 40, 1) * 0.5 * hit; camera.position.y += noise1(t * 40, 2) * 0.5 * hit;
        camera.setViewOffset(W, H, -W * 0.14, 0, W, H);
        h.m.setOpacity(1).setPrint(E.out(seg(u, 0, 0.4)));
        h.m.setGlitch(Math.max(0, 1 - u * 5));
        h.m.rotation.y = u * 0.4 - 0.2;
        h.yr.setOpacity(E.out(seg(u, 0.02, 0.2)));
        { const dx = camera.position.x - x0, dz = camera.position.z, l = Math.hypot(dx, dz), back = 17 + E.expoOut(seg(u, 0, 0.5)) * 3; h.yr.position.set(-dx / l * back, 8.5, -dz / l * back); h.yr.rotation.y = Math.atan2(dx, dz); }
        h.yr.letters.forEach((L, n) => { const a = E.expoOut(seg(u, 0.03 * n, 0.03 * n + 0.35)); L.position.set(L.home.x, L.home.y - (1 - a) * 6, L.home.z); L.rotation.x = (1 - a) * 1.4; });
        h.yr.sweep(lerp(-3, 3, seg(u, 0.1, HB)));
        r1.setProgress(E.expoOut(seg(u, 0, 0.5))).setOpacity(0.8 + 0.4 * kp); r2.setProgress(E.expoOut(seg(u, 0.05, 0.6)));
        r1.rotation.y = u; r2.rotation.y = -u * 0.6;
        floor.setOpacity(0.45 + 0.7 * kp);
        back.setOpacity(0.1 + 0.08 * kp);
        back.material.color.set(i % 3 === 1 ? BLUE : GOLD).multiplyScalar(2);
        beams.forEach((b, j) => { b.rotation.z = (j ? -0.3 : 0.3) + Math.sin(t * 2 + j) * 0.15; b.setOpacity(0.6 + 0.6 * kp); });
        dust.rotation.y = t * 0.1;
      },
      zoom: (k) => 0.14 * Math.exp(-(k % HB) * 14),
    };
  });

  // ================= E · TIMELINE — 3,000 years in four seconds =================
  section('timeline', SEC.timeline, SEC.globe, (g) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.9) * 13, Math.sin(i * 0.55) * 4, -i * 55));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 700, 0.34, 8), new THREE.ShaderMaterial({
      uniforms: { uHead: { value: 0 }, uPulse, uTime: U.time },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uHead; uniform float uPulse; uniform float uTime; varying vec2 vUv;
        void main(){ if (vUv.x > uHead) discard; vec3 c = mix(vec3(0.48, 0.42, 1.0), vec3(1.0, 0.75, 0.4), vUv.x);
          float d = exp(-(uHead - vUv.x) * 60.0); float flow = 0.7 + 0.3 * sin(vUv.x * 300.0 - uTime * 20.0);
          gl_FragColor = vec4(c * (0.55 + d * 2.0) * flow, 0.8); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const N = 900, fr = curve.computeFrenetFrames(N, false), hx = [[], []];
    for (let i = 0; i <= N; i++) {
      const p = curve.getPointAt(i / N);
      [0, Math.PI].forEach((ph, j) => { const a = (i / N) * 90 + ph; hx[j].push([p.x + fr.normals[i].x * Math.cos(a) * 1.3 + fr.binormals[i].x * Math.sin(a) * 1.3, p.y + fr.normals[i].y * Math.cos(a) * 1.3 + fr.binormals[i].y * Math.sin(a) * 1.3, p.z + fr.normals[i].z * Math.cos(a) * 1.3 + fr.binormals[i].z * Math.sin(a) * 1.3]); });
    }
    const h1 = polyline(hx[0], { color: GOLD, intensity: 1.8, opacity: 0.7 }), h2 = polyline(hx[1], { color: VIOLET, intensity: 1.8, opacity: 0.7 });
    const Rd = rng(71), dp = [];
    for (let i = 0; i < 3000; i++) dp.push((Rd() - 0.5) * 70, (Rd() - 0.5) * 34, -Rd() * 790);
    const dust = pointCloud(dp, { color: C.ice, size: 0.35, intensity: 1.6, max: 3, opacity: 0.8 });
    const floorT = grid(2000, 4, VIOLET, 0.25); floorT.position.set(0, -9, -400);
    g.add(tube, h1, h2, dust, floorT);
    const uOf = (y) => (y + 800) / 2830;
    // a ring around the ribbon for every century
    const cent = [];
    for (let y = -700; y <= 2000; y += 100) {
      const u = (y + 800) / 2830, i = Math.round(u * N), p = curve.getPointAt(u), rp = [];
      for (let j = 0; j <= 48; j++) { const a = (j / 48) * TAU; rp.push([p.x + (fr.normals[i].x * Math.cos(a) + fr.binormals[i].x * Math.sin(a)) * 2.2, p.y + (fr.normals[i].y * Math.cos(a) + fr.binormals[i].y * Math.sin(a)) * 2.2, p.z + (fr.normals[i].z * Math.cos(a) + fr.binormals[i].z * Math.sin(a)) * 2.2]); }
      const r = polyline(rp, { color: y % 500 === 0 ? GOLD : VIOLET, intensity: 2.2, opacity: y % 500 === 0 ? 1 : 0.6 });
      r.u = u; g.add(r); cent.push(r);
    }
    const marks = HEROES.map(([name, , , , , label, year], i) => {
      const u = uOf(year), p = curve.getPointAt(u), side = i % 2 ? 1 : -1;
      const mg = new THREE.Group(); mg.position.set(p.x + side * 4.5, p.y - 2.6, p.z);
      const [col, wc] = heroColor(i);
      const m = fitModel(name, 4.6, { color: col, wire: wc, maxW: 6, dim: 0.4 });
      const ring = polyline(ringPts(2.4, 64, 0), { color: GOLD, intensity: 2 });
      const stem = polyline([[0, 0, 0], [-side * 4.5, 2.6, 0]], { color: C.ice, intensity: 1.5, opacity: 0.5 });
      const dot = glow(GOLD, 2.2); dot.position.set(-side * 4.5, 2.6, 0);
      mg.add(m, ring, stem, dot); g.add(mg);
      return { mg, m, ring, stem, dot, u, label };
    });
    const camU = (k) => { const a = seg(k, 0, 3.75); return a < 0.3 ? lerp(0, 0.1, a / 0.3) : lerp(0.1, 0.985, E.in((a - 0.3) / 0.7)); };
    const P = new THREE.Vector3(), Q = new THREE.Vector3();
    return {
      camU,
      update(k) {
        const u = camU(k);
        curve.getPointAt(u, P); curve.getPointAt(Math.min(1, u + 0.035), Q);
        look(P.x + 1.5, P.y + 4.2, P.z + 10, Q.x, Q.y + 0.5, Q.z, lerp(45, 70, E.in(seg(k, 1.5, 3.75))), Math.sin(u * 9) * 0.1);
        const head = Math.min(1, u + 0.06);
        tube.material.uniforms.uHead.value = head;
        h1.setProgress(head); h2.setProgress(head);
        cent.forEach((r) => r.setOpacity(seg(head, r.u - 0.02, r.u)));
        marks.forEach((mk) => {
          const a = seg(head, mk.u - 0.03, mk.u);
          mk.m.setOpacity(a).setPrint(a); mk.ring.setOpacity(a).setProgress(a); mk.stem.setOpacity(a * 0.6); mk.dot.setOpacity(a * 0.6);
          mk.m.rotation.y = k * 0.8;
        });
      },
      zoom: (k) => 0.3 * E.in(seg(k, 3.1, 3.75)),
    };
  });
  const TL = S[S.length - 1];

  // ================= F · GLOBE — ideas travel =================
  const CITIES = [['NEW YORK', 40.7, -74], ['RIO', -22.9, -43.2], ['CAPE TOWN', -33.9, 18.4], ['MUMBAI', 19, 72.8], ['TOKYO', 35.7, 139.7], ['SYDNEY', -33.9, 151.2], ['LOS ANGELES', 34, -118.2], ['BEIJING', 39.9, 116.4]];
  section('globe', SEC.globe, SEC.chart, (g) => {
    const Rg = 10;
    const globe = new THREE.Group(); g.add(globe);
    const occ = new THREE.Mesh(new THREE.SphereGeometry(Rg * 0.985, 48, 32), new THREE.MeshBasicMaterial({ color: 0x020309 }));
    const land = earthPoints(Rg, C.cyan, 2.4);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(Rg * 1.06, 48, 32), fillMat({ color: C.cyan, intensity: 0.28, base: 0, fresnel: 1.2 }));
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(Rg * 1.005, 36, 18)), lineMat({ color: BLUE, intensity: 1 }));
    wire.material.uniforms.uOpacity.value = 0.08;
    globe.add(occ, land, atm, wire);
    const src = latLon(48.8, 2.3, Rg);
    const arcs = CITIES.map(([name, la, lo], i) => {
      const dst = latLon(la, lo, Rg), pts = [], a = src.clone().normalize(), b = dst.clone().normalize();
      const ang = a.angleTo(b);
      for (let j = 0; j <= 80; j++) { const s = j / 80; const v = new THREE.Vector3().copy(a).multiplyScalar(Math.sin((1 - s) * ang)).addScaledVector(b, Math.sin(s * ang)).divideScalar(Math.sin(ang)); v.multiplyScalar(Rg * (1 + Math.sin(Math.PI * s) * 0.18 * ang)); pts.push([v.x, v.y, v.z]); }
      const line = polyline(pts, { color: i % 2 ? GOLD : C.ice, intensity: 2.6 });
      const head = glow(GOLD, 1.6), land2 = glow(i % 2 ? GOLD : C.ice, 2.4);
      land2.position.copy(dst);
      globe.add(line, head, land2);
      return { name, line, head, land2, pts, dst };
    });
    const orbits = [0.4, -0.7].map((tilt, i) => { const o = new THREE.Group(); o.rotation.set(tilt, 0, i ? 0.5 : -0.3); const l = polyline(ringPts(Rg * (1.45 + i * 0.25), 160, 0), { color: i ? VIOLET : GOLD, intensity: 1.8, opacity: 0.6 }); const sat = glow(i ? VIOLET : GOLD, 1.8); o.add(l, sat); o.l = l; o.sat = sat; g.add(o); return o; });
    const back = glow(BLUE, 60); back.position.z = -25;
    g.add(back);
    return {
      arcs, globe,
      update(k, t) {
        const kp = pulse(KICKS, t, 9);
        globe.rotation.y = lerp(-0.25, 1.35, E.io(seg(k, 0, 3.75)));
        globe.rotation.x = 0.25;
        const d = lerp(48, 31, E.expoOut(seg(k, 0, 1.5)));
        look(Math.sin(k * 0.1) * 4, 3, d, 0, 0, 0, 40);
        camera.setViewOffset(W, H, -W * 0.13, 0, W, H);
        land.setOpacity(0.9 + 0.4 * kp);
        arcs.forEach((a, i) => {
          const s = seg(k, i * BEAT, i * BEAT + 0.55);
          a.line.setProgress(E.out(s)).setOpacity(s > 0 ? 1 : 0);
          const hp = a.pts[Math.min(80, Math.floor(E.out(s) * 80))];
          a.head.position.set(hp[0], hp[1], hp[2]); a.head.setOpacity(s > 0 && s < 1 ? 1 : 0);
          a.land2.setOpacity(s >= 1 ? 0.6 + 0.4 * Math.exp(-(k - i * BEAT - 0.55) * 4) : 0);
        });
        orbits.forEach((o, i) => { const a = t * (0.6 + i * 0.3); o.sat.position.set(Math.cos(a) * Rg * (1.45 + i * 0.25), 0, Math.sin(a) * Rg * (1.45 + i * 0.25)); o.l.setProgress(E.expoOut(seg(k, 0.2 * i, 1.2 + 0.2 * i))); });
        back.setOpacity(0.08 + 0.05 * kp);
      },
    };
  });
  const GL = S[S.length - 1];

  // ================= G · CHART — progress compounds =================
  const ERAS = ['ANTIQUITY', 'ROME', 'MEDIEVAL', 'RENAISSANCE', 'ENLIGHTENMENT', 'INDUSTRY', 'ELECTRIC', 'DIGITAL'];
  section('chart', SEC.chart, SEC.wall, (g) => {
    const HT = [0.9, 1.3, 1.7, 2.6, 3.9, 6, 9.5, 15];
    const box = new THREE.BoxGeometry(2.1, 1, 2.1); box.translate(0, 0.5, 0);
    const bedges = new THREE.EdgesGeometry(box);
    const bars = HT.map((h, i) => {
      const c = [lerp(0.55, 1.0, i / 7), lerp(0.5, 0.72, i / 7), lerp(1.0, 0.38, i / 7)];
      const m = new THREE.Mesh(box, chromeMat(c, 0.8));
      const e = new THREE.LineSegments(bedges, lineMat({ color: i > 4 ? GOLD : VIOLET, intensity: 1.8 }));
      e.material.uniforms.uOpacity.value = 0.7;
      const bg = new THREE.Group(); bg.add(m, e); bg.position.x = (i - 3.5) * 3.3;
      const cap = glow(i > 4 ? GOLD : VIOLET, 3.5);
      g.add(bg, cap);
      return { bg, cap, h, i };
    });
    const floor = grid(300, 1.65, VIOLET, 0.35); floor.position.y = -0.02;
    const curve = new THREE.CatmullRomCurve3(HT.map((h, i) => new THREE.Vector3((i - 3.5) * 3.3, h + 1.2, 0)));
    const cl = polyline(curve.getPoints(160).map((p) => [p.x, p.y, p.z]), { color: GOLD, intensity: 2.8 });
    const back = glow(GOLD, 50); back.position.set(6, 10, -25);
    g.add(floor, cl, back);
    return {
      bars,
      update(k, t) {
        const kp = pulse(KICKS, t, 9);
        const a = E.io(seg(k, 0, 3.75));
        look(lerp(-20, 12, a), lerp(1.5, 9, a), lerp(24, 30, a), lerp(-3, 3, a), lerp(3, 6, a), 0, 42);
        bars.forEach((b) => {
          const s = seg(k, b.i * BEAT * 0.5, b.i * BEAT * 0.5 + 0.45);
          const h = Math.max(0.001, b.h * E.backOut(s));
          b.bg.scale.set(1, h * (1 + kp * 0.03), 1);
          b.bg.visible = s > 0;
          b.cap.position.set(b.bg.position.x, h + 0.3, 0); b.cap.setOpacity(s > 0 ? 0.5 + 0.3 * kp : 0);
        });
        cl.setProgress(E.io(seg(k, 0.6, 2.6)));
        floor.setOpacity(0.5 + 0.7 * kp);
        back.setOpacity(0.1 + 0.06 * kp);
      },
    };
  });
  const CH = S[S.length - 1];

  // ================= H · THE WALL — a tile on every eighth note =================
  section('wall', SEC.wall, SEC.finale, (g) => {
    const size = 5, gap = 5.7;
    const tiles = HEROES.map(([name], i) => {
      const cx = ((i % 4) - 1.5) * gap, cy = (1.5 - Math.floor(i / 4)) * gap;
      const tg = new THREE.Group(); tg.position.set(cx, cy, 0); g.add(tg);
      const fr = polyline([[-size / 2, -size / 2, 0], [size / 2, -size / 2, 0], [size / 2, size / 2, 0], [-size / 2, size / 2, 0], [-size / 2, -size / 2, 0]], { color: i % 2 ? VIOLET : GOLD, intensity: 2.2 });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2a2570 : 0x4a3210, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
      const [col, wc] = heroColor(i);
      const m = fitModel(name, 3.3, { color: col, wire: wc, maxW: 4.2 });
      m.position.y = -1.9;
      tg.add(pane, fr, m);
      tg.home = tg.position.clone();
      tg.fly = new THREE.Vector3((cx) * 0.6, cy * 0.6, 30 + rng(i + 3)() * 30);
      return { tg, fr, pane, m, i };
    });
    const back = glow(VIOLET, 70); back.position.z = -30;
    g.add(back);
    return {
      update(k, t) {
        const n = Math.min(15, Math.floor(k / (BEAT / 2)));
        const gapT = SEC.finale - BEAT - SEC.wall;
        const cur = tiles[n].tg.home;
        const a = E.io(seg(k, 0.3, gapT));
        const tx = lerp(cur.x, 0, a * 0.8), ty = lerp(cur.y, 0, a * 0.8);
        look(tx + 2, ty - 1, lerp(11, 36, a), tx, ty, 0, 40, Math.sin(k * 2) * 0.03);
        const fl = E.in(seg(k, gapT, gapT + BEAT));
        tiles.forEach((o) => {
          const s = seg(k, o.i * BEAT / 2, o.i * BEAT / 2 + 0.2);
          o.fr.setProgress(E.out(s)).setOpacity(s > 0 ? 1 : 0.15);
          o.pane.material.opacity = s > 0 ? 0.25 + 0.5 * Math.exp(-(k - o.i * BEAT / 2) * 5) : 0.03;
          o.m.setOpacity(s > 0 ? 1 : 0).setPrint(E.out(seg(k, o.i * BEAT / 2, o.i * BEAT / 2 + 0.35)));
          o.m.rotation.y = t * 0.8 + o.i;
          o.tg.position.copy(o.tg.home).addScaledVector(o.tg.fly, fl);
          o.tg.rotation.set(fl * (o.i % 3 - 1), fl * (o.i % 2 ? 1 : -1), 0);
        });
        back.setOpacity(0.1 + 0.3 * fl);
      },
      zoom: (k) => 0.35 * E.in(seg(k, SEC.finale - BEAT - SEC.wall, SEC.finale - SEC.wall)),
    };
  });

  // ================= I · FINALE — WHAT WILL YOU ADD? =================
  section('finale', SEC.finale, SEC.end, (g) => {
    const W4 = FINALE_WORDS.map((w, i) => word3(w, i === 3 ? 4.6 : 3.4, { tint: i === 3 ? TINT.gold : TINT.silver, edge: 0.3 }));
    const qg = new THREE.Group(); g.add(qg);
    const gapX = 1.2;
    const l1 = W4[0].width + W4[1].width + gapX, l2 = W4[2].width + W4[3].width + gapX;
    W4[0].position.set(-l1 / 2 + W4[0].width / 2, 3.1, 0); W4[1].position.set(l1 / 2 - W4[1].width / 2, 3.1, 0);
    W4[2].position.set(-l2 / 2 + W4[2].width / 2, -2.4, 0); W4[3].position.set(l2 / 2 - W4[3].width / 2, -2.4, 0);
    W4.forEach((w) => { w.base = w.position.clone(); qg.add(w); });
    const ring = new THREE.Group(); g.add(ring);
    const Rr = 26;
    const models = HEROES.map(([name], i) => {
      const a = (i / HEROES.length) * TAU, [col, wc] = heroColor(i);
      const m = fitModel(name, 5.5, { color: col, wire: wc, maxW: 6.5, dim: 0.7 });
      m.position.set(Math.sin(a) * Rr, -8, Math.cos(a) * Rr);
      const b = beam(0.25, 1.8, 40, i % 2 ? VIOLET : GOLD, 0.18); b.position.set(Math.sin(a) * Rr, 12, Math.cos(a) * Rr);
      ring.add(m, b);
      return { m, b, i };
    });
    const halo = polyline(ringPts(Rr, 200, -7.9), { color: GOLD, intensity: 2.6 }), halo2 = polyline(ringPts(Rr + 4, 200, -7.9), { color: VIOLET, intensity: 2, opacity: 0.6 });
    const floor = grid(600, 3, VIOLET, 0.3); floor.position.y = -8;
    const R = rng(33), vp = [];
    for (let i = 0; i < 2600; i++) { const a = R() * TAU, r = 8 + R() * 34; vp.push(Math.cos(a) * r, -8 + R() * 30, Math.sin(a) * r); }
    const vortex = pointCloud(vp, { color: C.goldHot, size: 0.35, intensity: 1.8, max: 3.5, opacity: 0.7 });
    const shock = polyline(ringPts(1, 160, -7.8), { color: C.ice, intensity: 3 });
    const bs = burst(2500, 41, C.goldHot, 3.5);
    const back = glow(GOLD, 80); back.position.set(0, 4, -40);
    g.add(halo, halo2, floor, vortex, shock, bs, back);
    return {
      update(k, t) {
        const kp = pulse(KICKS, t, 9);
        const orbit = E.io(seg(k, BAR, 7.5)) * 1.1 + k * 0.03;
        const d = lerp(21, 58, E.io(seg(k, BAR * 0.9, 7.5)));
        look(Math.sin(orbit) * d, lerp(0.5, 17, E.io(seg(k, BAR, 7.5))), Math.cos(orbit) * d, 0, lerp(0.4, -1.5, seg(k, BAR, 7.5)), 0, 40);
        const hit = pulse(HITS, t, 10);
        camera.position.x += noise1(t * 40, 5) * 0.7 * hit; camera.position.y += noise1(t * 40, 6) * 0.7 * hit;
        qg.rotation.y = Math.atan2(camera.position.x, camera.position.z);
        W4.forEach((w, i) => {
          const u = k - i * BEAT;
          if (u < 0) return w.setOpacity(0);
          w.setOpacity(1);
          const s = E.expoOut(seg(u, 0, 0.15));
          w.position.copy(w.base); w.position.z = lerp(18, 0, s);
          w.scale.setScalar(lerp(1.7, 1, E.backOut(seg(u, 0, 0.3))) * (1 + kp * 0.03));
          w.sweep(lerp(-4, 4, seg(u, 0.1, 1.2)) + (u > 2 ? ((u - 2) % 2.5) * 3.2 - 4 : 0));
        });
        ring.rotation.y = -k * 0.12;
        models.forEach((o) => { const s = seg(k, 0.3 + o.i * 0.06, 0.9 + o.i * 0.06); o.m.setOpacity(s > 0 ? 1 : 0).setPrint(E.out(s)); o.m.rotation.y = k * 0.5; o.b.setOpacity(s * (0.5 + 0.7 * kp)); });
        halo.setProgress(E.expoOut(seg(k, 0, 1.5))).setOpacity(0.8 + 0.5 * kp); halo2.setProgress(E.expoOut(seg(k, 0.2, 1.8)));
        vortex.rotation.y = k * 0.25;
        floor.setOpacity(0.45 + 0.7 * kp);
        const s = seg(k, 0, 1.4); shock.scale.setScalar(1 + E.expoOut(s) * 60); shock.setOpacity(s > 0 ? 1 - s : 0).setProgress(1);
        bs.fire(seg(k, 0, 1.8), 60);
        back.setOpacity(0.14 + 0.1 * kp);
        sky.material.uniforms.uWarm.value = 1;
      },
      zoom: (k) => 0.18 * Math.exp(-k * 8),
    };
  });

  // ================= J · END CARD =================
  section('end', SEC.end, DURATION + 1, (g) => {
    const tor = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.26, 24, 180), chromeMat(TINT.gold, 1));
    const tor2 = polyline(ringPts(5.4, 160, 0).map(([x, , z]) => [x, z, 0]), { color: VIOLET, intensity: 2, dash: 3 });
    const col = fitModel('column', 5.6, { maxW: 3 });
    col.position.y = -2.8;
    const emb = new THREE.Group(); emb.add(tor, tor2, col); emb.position.y = 2.2;
    const wm = word3('WESTERN CIVILIZATION', 1.35, { spacing: 0.12, edge: 0.25 });
    wm.position.y = -5.4;
    const R = rng(51);
    wm.letters.forEach((L) => { L.from = new THREE.Vector3(L.home.x * 3 + (R() - 0.5) * 10, L.home.y + (R() - 0.5) * 12, -20 - R() * 20); });
    const back = glow(GOLD, 60); back.position.set(0, 1, -30);
    const bs = burst(1500, 61, C.goldHot, 3);
    g.add(emb, wm, back, bs);
    return {
      update(k, t) {
        look(Math.sin(k * 0.12) * 3, 0.2, lerp(32, 25, E.out(seg(k, 0, 7.5))), 0, -2.2, 0, 40);
        tor.rotation.set(Math.sin(k * 0.6) * 0.25, k * 0.5, 0);
        tor.material.uniforms.uOpacity.value = E.out(seg(k, 0, 0.5));
        tor.material.uniforms.uSweep.value = lerp(-3, 3, seg(k, 0.3, 2)) + (k > 4 ? lerp(-3, 3, seg(k, 4, 5.5)) : 0);
        tor.scale.setScalar(lerp(0.3, 1, E.backOut(seg(k, 0, 0.6))));
        tor2.setProgress(E.expoOut(seg(k, 0.1, 1.2))); tor2.rotation.z = k * 0.2;
        col.setOpacity(1).setPrint(E.out(seg(k, 0.2, 1.2)));
        col.rotation.y = k * 0.4;
        wm.letters.forEach((L, i) => { const a = E.expoOut(seg(k, 0.5 + i * 0.03, 1.2 + i * 0.03)); L.position.lerpVectors(L.from, L.home, a); L.rotation.y = (1 - a) * 3; });
        wm.setOpacity(seg(k, 0.5, 0.8)); wm.sweep(lerp(-5, 5, seg(k, 1.5, 3.5)));
        back.setOpacity(0.2);
        bs.fire(seg(k, 0, 1.5), 30);
      },
    };
  });

  // ================= update =================
  const BOUNDS = [SEC.cards, SEC.heroes, SEC.timeline, SEC.globe, SEC.chart, SEC.wall];
  let live = S[0];
  function update(lt, t) {
    camera.clearViewOffset();
    camera.up.set(0, 1, 0);
    uPulse.value = pulse(KICKS, t, 9);
    sky.material.uniforms.uWarm.value = 0.25;
    live = S.find((s) => t >= s.t0 && t < s.t1) || S[S.length - 1];
    S.forEach((s) => (s.g.visible = s === live));
    live.update(t - live.t0, t);
    sky.position.copy(camera.position); star.position.copy(camera.position);
    star.setOpacity(live.key === 'warp' ? 0.3 : 1);
  }

  // ================= HUD =================
  const counters = (v, k) => {
    const n = v * E.expoOut(k);
    if (v >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (n / 1e6).toFixed(0) + 'M';
    return Math.round(n).toLocaleString('en-US');
  };
  function sansText(ctx, s, x, y, size, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 800} ${size}px ${SANS}`;
    ctx.letterSpacing = (o.spacing || 0) + 'px';
    if (o.maxW) { const w = ctx.measureText(s).width; if (w > o.maxW) { size *= o.maxW / w; ctx.font = `${o.weight || 800} ${size}px ${SANS}`; } }
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.grad) { const w = ctx.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; const g = ctx.createLinearGradient(x0, y - size, x0 + w, y); g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#ffe6b8'); g.addColorStop(1, GOLD); ctx.fillStyle = g; }
    else ctx.fillStyle = o.color || '#fff';
    if (o.glow) { ctx.shadowColor = o.glowColor || 'rgba(255,195,106,0.6)'; ctx.shadowBlur = o.glow; }
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function riseText(ctx, s, x, y, size, k, o = {}) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y - size * 1.1, W, size * 1.4); ctx.clip();
    sansText(ctx, s, x, y + (1 - E.expoOut(k)) * size * 1.2, size, { ...o, alpha: (o.alpha == null ? 1 : o.alpha) * clamp(k * 3) });
    ctx.restore();
  }
  function pill(ctx, s, x, y, a, col = GOLD) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `700 18px ${SANS}`; ctx.letterSpacing = '4px';
    const w = ctx.measureText(s).width + 40;
    ctx.beginPath(); ctx.roundRect(x, y - 30, w, 42, 21); ctx.fillStyle = 'rgba(255,195,106,0.12)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = col; ctx.fillText(s, x + 20, y - 2);
    ctx.restore();
    return w;
  }
  const CHAPTER = { cards: '01 · THE FIELDS', heroes: '02 · THE BREAKTHROUGHS', timeline: '03 · THE TIMELINE', globe: '04 · THE NETWORK', chart: '05 · THE CURVE', wall: '06 · THE BUILDERS', finale: '07 · THE NEXT CHAPTER' };
  const yearText = (y) => (y < 0 ? `${Math.round(-y)} BC` : `${Math.round(y)} AD`);
  const eraOf = (y) => (y < -30 ? 'ANTIQUITY' : y < 480 ? 'ROME' : y < 1400 ? 'THE MIDDLE AGES' : y < 1600 ? 'THE RENAISSANCE' : y < 1760 ? 'THE ENLIGHTENMENT' : y < 1900 ? 'THE INDUSTRIAL AGE' : y < 1970 ? 'THE MODERN AGE' : 'THE DIGITAL AGE');

  function hud(ctx, lt, t) {
    const key = live.key, k = t - live.t0;
    // brand chip and chapter label, SaaS-style
    if (CHAPTER[key]) {
      const a = key === 'finale' ? 1 - seg(k, 1.5, 2) : 1;
      ctx.save(); ctx.globalAlpha = 0.85 * a;
      ctx.fillStyle = GOLD; ctx.translate(96, 96); ctx.rotate(Math.PI / 4); ctx.fillRect(-7, -7, 14, 14); ctx.restore();
      sansText(ctx, 'WESTERN CIVILIZATION', 120, 103, 17, { weight: 800, spacing: 5, alpha: 0.85 * a });
      sansText(ctx, CHAPTER[key], W - 96, 103, 17, { align: 'right', weight: 700, spacing: 5, color: '#b9c4ff', alpha: 0.8 * a });
    }
    if (key === 'title') {
      const a = env(k, 0.9, 1.3, 3.1, 3.4);
      if (a > 0) {
        sansText(ctx, 'THREE THOUSAND YEARS OF HUMAN ACHIEVEMENT', W / 2, H - 150, 26, { align: 'center', weight: 700, spacing: lerp(26, 12, E.out(seg(k, 0.9, 3))), color: '#dfe4ff', alpha: a });
        const pw = 200; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - pw / 2 * E.expoOut(seg(k, 1, 1.8)), H - 125, pw * E.expoOut(seg(k, 1, 1.8)), 3); ctx.restore();
      }
    }
    if (key === 'cards') {
      const b = Math.min(7, Math.floor(k / BEAT));
      riseText(ctx, 'Everything we build on.', 96, 230, 76, seg(k, 0.05, 0.6), { grad: true });
      sansText(ctx, `${String(b + 1).padStart(2, '0')}`, 96, H - 110, 120, { weight: 800, color: '#ffffff', alpha: 0.9 });
      sansText(ctx, `/ 08   ${FEATURES[b][1]}`, 270, H - 118, 26, { weight: 700, spacing: 6, color: GOLD });
    }
    if (key === 'heroes') {
      const i = Math.min(HEROES.length - 1, Math.floor(k / HB)), u = k - i * HB;
      const [, head, kick, val, unit, year] = HEROES[i];
      const out = 1 - seg(u, HB - 0.08, HB);
      const pw = pill(ctx, year, 96, 360, seg(u, 0.02, 0.12) * out);
      sansText(ctx, kick, 96 + pw + 20, 358, 19, { weight: 700, spacing: 6, color: '#b9c4ff', alpha: seg(u, 0.05, 0.15) * out });
      riseText(ctx, head, 90, 500, 104, seg(u, 0.03, 0.4), { grad: true, alpha: out, spacing: -3, maxW: 880 });
      sansText(ctx, counters(val, seg(u, 0.12, 0.8)), 96, 650, 88, { weight: 800, alpha: seg(u, 0.1, 0.2) * out });
      sansText(ctx, unit.toUpperCase(), 100, 694, 19, { weight: 700, spacing: 6, color: GOLD, alpha: seg(u, 0.15, 0.3) * out });
      ctx.save(); ctx.globalAlpha = out; ctx.fillStyle = GOLD; ctx.fillRect(96, 575, 260 * E.expoOut(seg(u, 0.06, 0.4)), 3); ctx.restore();
      // progress ticks
      ctx.save(); for (let j = 0; j < HEROES.length; j++) { ctx.globalAlpha = j === i ? 1 : 0.5; ctx.fillStyle = j <= i ? GOLD : 'rgba(255,255,255,0.25)'; ctx.fillRect(96 + j * 30, H - 100, 22, j === i ? 5 : 3); } ctx.restore();
      sansText(ctx, `${String(i + 1).padStart(2, '0')} / ${HEROES.length}`, 96 + HEROES.length * 30 + 20, H - 94, 17, { weight: 700, spacing: 4, color: 'rgba(255,255,255,0.7)' });
    }
    if (key === 'timeline') {
      const y = -800 + TL.camU(k) * 2830;
      const a = seg(k, 0.1, 0.4) * (1 - seg(k, 3.55, 3.75));
      sansText(ctx, yearText(Math.max(-750, Math.min(2025, y))), 96, H - 150, 190, { weight: 800, grad: true, alpha: a, spacing: -6 });
      sansText(ctx, eraOf(y), 102, H - 96, 24, { weight: 700, spacing: 8, color: '#dfe4ff', alpha: a });
      riseText(ctx, 'Three thousand years.', 96, 230, 70, seg(k, 0.1, 0.7), { alpha: 1 - seg(k, 3.4, 3.7) });
      sansText(ctx, 'ONE CONTINUOUS CONVERSATION', 100, 280, 19, { weight: 700, spacing: 6, color: GOLD, alpha: seg(k, 0.5, 0.9) * (1 - seg(k, 3.4, 3.7)) });
    }
    if (key === 'globe') {
      riseText(ctx, 'Ideas travel.', 96, 330, 110, seg(k, 0.05, 0.5), { grad: true, spacing: -3 });
      const n = Math.min(8, Math.floor(k / BEAT) + 1);
      sansText(ctx, counters(5500000000, seg(k, 0.2, 3.2)), 96, 500, 96, { weight: 800 });
      sansText(ctx, 'PEOPLE CONNECTED TODAY', 100, 546, 19, { weight: 700, spacing: 6, color: GOLD });
      sansText(ctx, `${n} / 8 CONTINENTAL LINKS`, 100, 600, 17, { weight: 700, spacing: 5, color: '#b9c4ff' });
      GL.arcs.forEach((a, i) => {
        const s = k - i * BEAT - 0.55;
        if (s < 0) return;
        a.land2.getWorldPosition(V); const facing = V.clone().normalize().dot(camera.position.clone().normalize());
        if (facing < 0.25) return;
        const [x, y] = toScreen(V);
        sansText(ctx, a.name, x + 14, y - 10, 15, { weight: 700, spacing: 4, color: '#ffffff', alpha: seg(s, 0, 0.2) * clamp((facing - 0.25) * 4) });
      });
    }
    if (key === 'chart') {
      riseText(ctx, 'Progress compounds.', 96, 230, 84, seg(k, 0.05, 0.5), { grad: true, spacing: -2 });
      sansText(ctx, 'EACH GENERATION BUILDS ON THE LAST', 100, 280, 19, { weight: 700, spacing: 6, color: GOLD, alpha: seg(k, 0.4, 0.8) });
      CH.bars.forEach((b) => {
        const s = seg(k, b.i * BEAT * 0.5 + 0.1, b.i * BEAT * 0.5 + 0.4);
        if (s <= 0) return;
        b.bg.getWorldPosition(V); V.y = -0.9; V.z = 1.4;
        const [x, y] = toScreen(V);
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.0);
        sansText(ctx, ERAS[b.i], 0, 0, 14, { align: 'center', weight: 700, spacing: 3, color: b.i > 4 ? GOLD : '#b9c4ff', alpha: s });
        ctx.restore();
      });
    }
    if (key === 'wall') {
      const gapT = SEC.finale - BEAT - SEC.wall;
      const a = 1 - seg(k, gapT, gapT + 0.1);
      riseText(ctx, 'Built by millions of hands.', 96, 230, 76, seg(k, 0.05, 0.5), { grad: true, alpha: a, spacing: -2 });
      const n = Math.min(16, Math.floor(k / (BEAT / 2)) + 1);
      sansText(ctx, String(n).padStart(2, '0'), 96, H - 110, 120, { weight: 800, alpha: a });
      sansText(ctx, '/ ∞', 270, H - 118, 30, { weight: 700, spacing: 4, color: GOLD, alpha: a });
    }
    if (key === 'finale') {
      ['Inherited from the past.', 'Entrusted to the present.', 'Built for the future.'].forEach((s, i) => {
        const t0 = BAR * (i + 1);
        const a = 1 - seg(k, t0 + BAR - 0.12, t0 + BAR);
        if (k < t0 || k > t0 + BAR) return;
        riseText(ctx, s, W / 2, 150, 56, seg(k, t0, t0 + 0.4), { align: 'center', grad: i === 2, alpha: a });
      });
    }
    if (key === 'end') {
      const a = seg(k, 1.4, 1.9);
      if (a > 0) sansText(ctx, 'THREE THOUSAND YEARS OF ACHIEVEMENT', W / 2, H - 196, 22, { align: 'center', weight: 700, spacing: 10, color: '#cfd6ff', alpha: a });
      const e = seg(k, 2.4, 2.9);
      if (e > 0) {
        ctx.save(); ctx.globalAlpha = e;
        const bw = 540, bx = W / 2 - bw / 2, by = H - 158 + (1 - E.expoOut(e)) * 30;
        const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ffd27f'); gr.addColorStop(1, '#ff9a48');
        ctx.beginPath(); ctx.roundRect(bx, by, bw, 66, 33); ctx.fillStyle = gr; ctx.shadowColor = 'rgba(255,170,80,0.7)'; ctx.shadowBlur = 40 + 20 * Math.sin(k * 4); ctx.fill();
        ctx.shadowBlur = 0; ctx.font = `800 22px ${SANS}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.fillStyle = '#1a1206'; ctx.fillText('YOUR CHAPTER STARTS NOW  →', W / 2, by + 42);
        ctx.restore();
      }
    }
  }

  // ================= beat-driven lens =================
  const zoomAt = (t) => {
    let z = live.zoom ? live.zoom(t - live.t0) : 0;
    for (const b of BOUNDS) z = Math.max(z, 0.22 * Math.exp(-Math.abs(t - b) * 16));
    return z;
  };
  return {
    scene, camera, update, hud,
    bloom: (t) => 0.5 + 0.25 * pulse(KICKS, t, 9) + 0.35 * pulse(HITS, t, 4),
    flash: (t) => Math.max(0.7 * pulse(HITS, t, 16), 0.1 * pulse(TICKS, t, 30)),
    aberr: (t) => 0.0015 + 0.008 * pulse(HITS, t, 5) + 0.002 * pulse(KICKS, t, 12),
    zoom: zoomAt,
  };
});
