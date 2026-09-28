/* WESTERN CIVILIZATION — launch-film intro. */
import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { scene3 } from '../../film3d/js/engine3d.js';
import { C, U, polyline, glow, spark, grid, pointCloud, stars, lineMat } from '../../film3d/js/holo.js';
import { model } from '../../film3d/js/models.js';

const SANS = '"Manrope", "Helvetica Neue", Arial, sans-serif';
const GOLD = '#ffc36a', VIOLET = '#7b6cff', BLUE = '#4aa8ff';

// Brushed-gold sheen: a vertical gradient, a fresnel rim and a travelling highlight.
function sheenMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uSweep: { value: -1 }, uOpacity: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uSweep; uniform float uOpacity; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vec3 n = normalize(vN), v = normalize(vV);
        float f = pow(1.0 - abs(dot(n, v)), 2.5);
        float face = step(0.6, abs(n.z));
        vec3 lo = vec3(0.22, 0.11, 0.03), hi = vec3(0.75, 0.55, 0.28);
        vec3 c = mix(lo, hi, clamp(vP.y * 0.4 + 0.55, 0.0, 1.0));
        c = mix(c * 0.55, c, face);
        float band = exp(-pow((vP.x * 0.12 - uSweep) * 3.0, 2.0));
        c += vec3(1.0, 0.95, 0.85) * band * 0.9 * face + vec3(1.0, 0.85, 0.6) * f * 0.45;
        gl_FragColor = vec4(c, uOpacity);
      }`,
    transparent: true,
  });
}
let SANS3 = null;
function word3(str, size, depth = 0.35) {
  const g = new TextGeometry(str, { font: SANS3, size, depth: size * depth, curveSegments: 6, bevelEnabled: true, bevelThickness: size * 0.04, bevelSize: size * 0.025, bevelSegments: 3 });
  g.computeBoundingBox();
  const b = g.boundingBox;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  g.computeVertexNormals();
  const m = sheenMat();
  const mesh = new THREE.Mesh(g, m);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), lineMat({ color: '#ffe0a0', intensity: 1.2 }));
  edges.material.uniforms.uOpacity.value = 0.35;
  const grp = new THREE.Group();
  grp.add(mesh, edges);
  grp.width = b.max.x - b.min.x;
  grp.setOpacity = (a) => { m.uniforms.uOpacity.value = a; edges.material.uniforms.uOpacity.value = 0.35 * a; grp.visible = a > 0.002; return grp; };
  grp.sweep = (s) => { m.uniforms.uSweep.value = s; return grp; };
  return grp;
}

// A frosted glass feature card drawn to a canvas texture.
function glassCard(labelTxt, idx, w = 4.2, h = 5.2) {
  const c = makeCanvas(420, 520), g = c.getContext('2d');
  const r = 28;
  const path = () => { g.beginPath(); g.moveTo(r, 2); g.arcTo(418, 2, 418, 518, r); g.arcTo(418, 518, 2, 518, r); g.arcTo(2, 518, 2, 2, r); g.arcTo(2, 2, 418, 2, r); g.closePath(); };
  const gr = g.createLinearGradient(0, 0, 420, 520);
  gr.addColorStop(0, 'rgba(120,140,255,0.22)'); gr.addColorStop(0.5, 'rgba(40,50,90,0.18)'); gr.addColorStop(1, 'rgba(255,190,110,0.2)');
  path(); g.fillStyle = gr; g.fill();
  g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
  const hl = g.createLinearGradient(0, 0, 0, 160); hl.addColorStop(0, 'rgba(255,255,255,0.12)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.save(); path(); g.clip(); g.fillStyle = hl; g.fillRect(0, 0, 420, 160); g.restore();
  g.font = `800 34px ${SANS}`; g.fillStyle = '#ffffff'; g.letterSpacing = '4px'; g.fillText(labelTxt, 30, 470);
  g.font = `700 20px ${SANS}`; g.fillStyle = GOLD; g.letterSpacing = '3px'; g.fillText(String(idx + 1).padStart(2, '0'), 30, 56);
  g.fillStyle = 'rgba(255,195,106,0.9)'; g.fillRect(30, 488, 60, 3);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.setOpacity = (a) => { mat.opacity = a; mesh.visible = a > 0.002; return mesh; };
  return mesh;
}

// A live dashboard: an exponential curve of achievement, counters and bars.
function dashTexture() {
  const c = makeCanvas(1600, 900), g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (k) => {
    g.clearRect(0, 0, 1600, 900);
    const r = 40;
    g.beginPath(); g.roundRect(4, 4, 1592, 892, r);
    const bg = g.createLinearGradient(0, 0, 1600, 900); bg.addColorStop(0, 'rgba(30,34,70,0.78)'); bg.addColorStop(1, 'rgba(10,12,24,0.85)');
    g.fillStyle = bg; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.stroke();
    g.font = `700 26px ${SANS}`; g.fillStyle = 'rgba(255,255,255,0.6)'; g.letterSpacing = '4px'; g.fillText('HUMAN ACHIEVEMENT · 750 BC — TODAY', 60, 80);
    [['#ff5f57'], ['#febc2e'], ['#28c840']].forEach(([col], i) => { g.fillStyle = col; g.beginPath(); g.arc(1460 + i * 34, 70, 10, 0, TAU); g.fill(); });
    // counters
    const stats = [[3000, 'YEARS'], [28, 'BREAKTHROUGHS'], [1, 'INHERITANCE']];
    stats.forEach(([v, l], i) => {
      const x = 60 + i * 300, n = Math.round(v * E.expoOut(clamp(k * 1.6 - i * 0.12)));
      g.font = `800 72px ${SANS}`; g.fillStyle = '#ffffff'; g.letterSpacing = '0px'; g.fillText(n.toLocaleString('en-US'), x, 200);
      g.font = `700 18px ${SANS}`; g.fillStyle = GOLD; g.letterSpacing = '4px'; g.fillText(l, x, 236);
    });
    // chart
    const x0 = 60, y0 = 820, w = 1480, h = 500;
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
    for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(x0, y0 - (i * h) / 5); g.lineTo(x0 + w, y0 - (i * h) / 5); g.stroke(); }
    const yr = (y) => x0 + ((y + 800) / 2830) * w;
    [-500, 0, 500, 1000, 1500, 2000].forEach((y) => { g.font = `600 16px ${SANS}`; g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText(y < 0 ? `${-y} BC` : `${y}`, yr(y) - 20, y0 + 34); });
    const pts = [];
    for (let i = 0; i <= 200; i++) { const y = -800 + (i / 200) * 2830; const v = Math.pow((y + 800) / 2830, 6) * 0.92 + ((y + 800) / 2830) * 0.08; pts.push([yr(y), y0 - v * h]); }
    const n = Math.floor(pts.length * clamp(k * 1.25));
    if (n > 1) {
      const fill = g.createLinearGradient(0, y0 - h, 0, y0); fill.addColorStop(0, 'rgba(255,195,106,0.45)'); fill.addColorStop(1, 'rgba(123,108,255,0)');
      g.beginPath(); g.moveTo(pts[0][0], y0); for (let i = 0; i < n; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineTo(pts[n - 1][0], y0); g.closePath(); g.fillStyle = fill; g.fill();
      const line = g.createLinearGradient(x0, 0, x0 + w, 0); line.addColorStop(0, VIOLET); line.addColorStop(1, GOLD);
      g.beginPath(); for (let i = 0; i < n; i++) i ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[i][0], pts[i][1]); g.strokeStyle = line; g.lineWidth = 5; g.stroke();
      const [ex, ey] = pts[n - 1]; g.fillStyle = '#fff'; g.shadowColor = GOLD; g.shadowBlur = 30; g.beginPath(); g.arc(ex, ey, 10, 0, TAU); g.fill(); g.shadowBlur = 0;
    }
    STATIONS_Y.forEach((y, i) => { const a = clamp(k * 1.25 * 200 / 200 - (y + 800) / 2830); if (a <= 0) return; g.fillStyle = `rgba(255,255,255,${0.7 * clamp(a * 10)})`; g.fillRect(yr(y) - 1.5, y0 - 18, 3, 18); });
    tex.needsUpdate = true;
  };
  return { tex, draw };
}
const STATIONS_Y = [-750, -447, -300, -100, 80, 126, 533, 1163, 1215, 1436, 1440, 1490, 1492, 1543, 1609, 1665, 1687, 1716, 1776, 1787, 1829, 1883, 1889, 1903, 1905, 1953, 1969, 1991];

scene3('intro', async () => {
  SANS3 = new Font(await (await fetch('fonts/manrope-800.typeface.json')).json());
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03040a, 0.012);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 4000);

  // aurora backdrop
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uWarm: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform float uWarm; varying vec3 vD;
      void main(){
        float y = vD.y;
        vec3 base = vec3(0.012, 0.014, 0.035);
        float a1 = exp(-pow((vD.x * 1.2 + sin(uTime * 0.2) * 0.3) , 2.0) * 3.0) * smoothstep(-0.2, 0.3, y) * (1.0 - smoothstep(0.3, 0.9, y));
        float a2 = exp(-pow((vD.z * 1.1 - cos(uTime * 0.17) * 0.4), 2.0) * 3.0) * smoothstep(-0.1, 0.4, y) * (1.0 - smoothstep(0.4, 1.0, y));
        vec3 c = base + vec3(0.18, 0.12, 0.55) * a1 * 0.16 + vec3(0.1, 0.35, 0.6) * a2 * 0.1 + vec3(0.6, 0.35, 0.1) * uWarm * a1 * 0.12;
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  scene.add(sky);
  const star = stars(3000, 1200, 8, C.ice);
  scene.add(star);
  const floor = grid(4000, 4, VIOLET, 0.25);
  floor.position.y = -6;
  scene.add(floor);

  // B — the title
  const t1 = word3('WESTERN', 4.2), t2 = word3('CIVILIZATION', 2.6);
  t1.position.set(0, 2.6, 0); t2.position.set(0, -2.2, 0);
  const title = new THREE.Group(); title.add(t1, t2); scene.add(title);
  const burstP = []; const R = rng(3);
  for (let i = 0; i < 2500; i++) { const u = R() * 2 - 1, q = R() * TAU, s = Math.sqrt(1 - u * u); burstP.push(Math.cos(q) * s, u, Math.sin(q) * s); }
  const burst = pointCloud(new Array(7500).fill(0), { color: C.goldHot, size: 3, intensity: 2.6, max: 5 });
  scene.add(burst);

  // C — feature grid of glass cards
  const gridG = new THREE.Group(); gridG.position.set(0, 0, -300); scene.add(gridG);
  const cards = FEATURES.map(([name, lab], i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = (col - 1.5) * 5.2, y = (0.5 - row) * 6.2;
    const card = glassCard(lab, i);
    card.position.set(x, y, 0);
    const m = model(name, { height: 2.6, color: i % 2 ? C.cyan : C.gold, wireColor: i % 2 ? C.ice : C.goldHot });
    const s = Math.min(1, 3.2 / Math.max(m.width, m.depth));
    m.scale.setScalar(s);
    m.baseOps = m.baseOps.map((v) => v * 0.8);
    m.position.set(x, y - 1.3, 0.8);
    gridG.add(card, m);
    return { card, m, i };
  });

  // D — heroes, each in its own stage along the x axis
  const heroes = HEROES.map(([name], i) => {
    const m = model(name, { height: 9, color: i % 3 === 1 ? C.cyan : C.gold, wireColor: i % 3 === 1 ? C.ice : C.goldHot });
    const s = Math.min(1, 16 / Math.max(m.width, m.depth));
    m.scale.setScalar(s);
    m.baseOps = m.baseOps.map((v) => v * 0.5);
    const g = new THREE.Group(); g.add(m); g.position.set(1000 + i * 300, -6, 0);
    const ring = polyline(circlePts(0, 0, 9, 96).map(([x, z]) => [x, 0.05, z]), { color: GOLD, intensity: 2.2 });
    const ring2 = polyline(circlePts(0, 0, 11.5, 96).map(([x, z]) => [x, 0.05, z]), { color: VIOLET, intensity: 1.6, opacity: 0.6 });
    const glowB = glow(i % 3 === 1 ? BLUE : GOLD, 30); glowB.position.set(0, 6, -12);
    g.add(ring, ring2, glowB);
    scene.add(g);
    return { g, m, ring, ring2, glowB, i };
  });

  // E — dashboard panel
  const dash = dashTexture();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: dash.tex, transparent: true, depthWrite: false }));
  panel.position.set(0, 0, -800);
  scene.add(panel);
  const chips = ['parthenon', 'eiffel', 'saturnV'].map((n, i) => {
    const m = model(n, { height: 3.2, color: C.gold, wireColor: C.goldHot });
    m.scale.setScalar(Math.min(1, 4 / Math.max(m.width, m.depth)));
    m.position.set(-9.5 + i * 0.001, -3.5 + i * 3.2, -796);
    m.position.x = [-12.5, 12.5, 12.5][i]; m.position.y = [-4.5, -4.5, 0.5][i]; m.position.z = -806; m.baseOps = m.baseOps.map((v) => v * 0.4);
    scene.add(m); return m;
  });

  // F — the finale ring and the question
  const ring = new THREE.Group(); ring.position.set(0, 0, -1200); scene.add(ring);
  const ringModels = HEROES.map(([name], i) => {
    const m = model(name, { height: 4.2, color: i % 2 ? C.cyan : C.gold, wireColor: i % 2 ? C.ice : C.goldHot });
    m.scale.setScalar(Math.min(1, 6 / Math.max(m.width, m.depth)));
    m.baseOps = m.baseOps.map((v) => v * 0.3);
    const a = (i / HEROES.length) * TAU;
    m.position.set(Math.sin(a) * 22, -7, Math.cos(a) * 22);
    ring.add(m); return m;
  });
  const q1 = word3('WHAT WILL', 2.4), q2 = word3('YOU ADD?', 3.4);
  q1.position.set(0, 3.0, -1200); q2.position.set(0, -0.9, -1200);
  scene.add(q1, q2);
  const halo = polyline(circlePts(0, 0, 22, 160).map(([x, z]) => [x, -7, z]), { color: GOLD, intensity: 2.4 });
  ring.add(halo);

  const flashes = [SEC.title, ...HEROES.map((_, i) => SEC.heroes + i * BAR), SEC.dash, SEC.finale, 56];

  function update(lt, t) {
    camera.clearViewOffset();
    sky.position.copy(camera.position); star.position.copy(camera.position);
    sky.material.uniforms.uWarm.value = t > SEC.finale ? 1 : 0.3;
    // A: cold open — drifting through dark stars toward a single light
    title.visible = t > SEC.title - 0.8 && t < SEC.grid + 0.5;
    if (t < SEC.title) {
      camera.position.set(Math.sin(t * 0.2) * 3, 1 + Math.sin(t * 0.3), 60 - t * 3);
      camera.lookAt(0, 0, 0);
      title.visible = false;
    } else if (t < SEC.grid) {
      const k = t - SEC.title;
      const push = E.expoOut(seg(k, 0, 1.2));
      camera.position.set(Math.sin(k * 0.35) * 8 * (1 - push * 0.3), 1.5 - k * 0.3, lerp(80, 26, push) - k * 1.2);
      camera.lookAt(0, 0.3, 0);
      title.rotation.y = Math.sin(k * 0.5) * 0.12;
      t1.sweep(lerp(-2, 2, seg(k, 0.4, 2.2))); t2.sweep(lerp(-2.5, 2.5, seg(k, 0.6, 2.4)));
      const a = 1 - E.in(seg(k, 3.5, 4));
      t1.setOpacity(a); t2.setOpacity(a);
      title.scale.setScalar(1 + E.in(seg(k, 3.4, 4)) * 0.6);
    }
    // the burst
    const bk = seg(t, SEC.title, SEC.title + 2.5);
    const bp = burst.geometry.attributes.position;
    for (let i = 0; i < 2500; i++) { const d = 4 + E.expoOut(bk) * (20 + (i % 13) * 3); bp.setXYZ(i, burstP[i * 3] * d, burstP[i * 3 + 1] * d, burstP[i * 3 + 2] * d); }
    bp.needsUpdate = true;
    burst.setOpacity(bk > 0 && bk < 1 ? 1 - bk : 0);

    // C: the grid
    const inGrid = t >= SEC.grid && t < SEC.heroes + 0.3;
    gridG.visible = inGrid;
    if (inGrid) {
      const k = t - SEC.grid;
      camera.position.set(lerp(-16, 12, E.sine(seg(k, 0, 8))), lerp(10, -2, E.sine(seg(k, 0, 8))), -300 + lerp(26, 17, E.io(seg(k, 0, 6))) + E.in(seg(k, 7.2, 8)) * -14);
      camera.lookAt(lerp(-4, 4, seg(k, 0, 8)), 0, -300);
      cards.forEach(({ card, m, i }) => {
        const tb = 0.25 + i * BEAT;
        const pop = E.backOut(seg(k, tb, tb + 0.45));
        card.setOpacity(clamp(pop));
        card.scale.setScalar(0.6 + 0.4 * clamp(pop));
        m.setOpacity(seg(k, tb + 0.1, tb + 0.4));
        m.setPrint(E.out(seg(k, tb + 0.1, tb + 0.9)));
        m.rotation.y = k * 0.8 + i;
      });
    }

    // D: heroes
    const hi = t >= SEC.heroes && t < SEC.dash ? Math.floor((t - SEC.heroes) / BAR) : -1;
    heroes.forEach((h) => { h.g.visible = h.i === hi; });
    if (hi >= 0) {
      const h = heroes[hi], k = t - SEC.heroes - hi * BAR;
      const dir = hi % 2 ? -1 : 1;
      const whip = E.expoOut(seg(k, 0, 0.5));
      const ang = dir * (lerp(1.6, 0.5, whip) + k * 0.18);
      const r = lerp(30, 19, E.out(seg(k, 0, BAR)));
      const hy = hi === 8 ? 1 + k * 1.5 : 2;
      camera.position.set(h.g.position.x + Math.sin(ang) * r, hy + lerp(6, 1, whip), Math.cos(ang) * r);
      camera.lookAt(h.g.position.x, hi === 8 ? 2.5 + k : 1.5, 0);
      camera.setViewOffset(W, H, -W * 0.14, 0, W, H);
      h.m.setOpacity(1);
      h.m.setPrint(E.out(seg(k, 0, 0.7)));
      h.m.rotation.y = k * 0.25;
      h.ring.setOpacity(1).setProgress(E.expoOut(seg(k, 0, 0.6)));
      h.ring2.setOpacity(0.6).setProgress(E.expoOut(seg(k, 0.1, 0.8)));
      h.glowB.setOpacity(0.12);
      if (k < 0.25) { camera.position.x += noise1(t * 40, 1) * 0.6 * (1 - k / 0.25); camera.position.y += noise1(t * 40, 2) * 0.6 * (1 - k / 0.25); }
    }

    // E: dashboard
    const inDash = t >= SEC.dash - 0.2 && t < SEC.finale + 0.3;
    panel.visible = inDash;
    chips.forEach((m) => (m.visible = inDash));
    if (inDash) {
      const k = t - SEC.dash;
      dash.draw(seg(k, 0.4, 6.5));
      const tilt = lerp(0.5, 0.12, E.expoOut(seg(k, 0, 1.5)));
      camera.position.set(Math.sin(tilt + k * 0.03) * 22 - 4, lerp(-4, 1, E.out(seg(k, 0, 3))), -800 + Math.cos(tilt) * 22 - k * 0.6);
      camera.lookAt(0, 0, -800);
      chips.forEach((m, i) => { m.setOpacity(seg(k, 1 + i * 0.4, 1.4 + i * 0.4)); m.setPrint(E.out(seg(k, 1 + i * 0.4, 2 + i * 0.4))); m.rotation.y = k * 0.6; });
    }

    // F: finale
    const inFin = t >= SEC.finale;
    ring.visible = inFin; q1.visible = q2.visible = inFin;
    if (inFin) {
      const k = t - SEC.finale;
      const fly = E.expoOut(seg(k, 0, 2.5));
      const orb = k * 0.12;
      camera.position.set(Math.sin(orb) * lerp(80, 30, fly), lerp(24, 4, fly), -1200 + Math.cos(orb) * lerp(80, 30, fly));
      camera.lookAt(0, 0.8, -1200);
      ring.rotation.y = -k * 0.15;
      ringModels.forEach((m, i) => { m.setOpacity(seg(k, 0.2 + i * 0.12, 0.6 + i * 0.12)); m.setPrint(E.out(seg(k, 0.2 + i * 0.12, 1.2 + i * 0.12))); m.rotation.y = k * 0.4; });
      halo.setProgress(E.expoOut(seg(k, 0, 2))).setOpacity(1);
      const qa = seg(k, 4.2, 5.0);
      q1.setOpacity(qa); q2.setOpacity(seg(k, 4.5, 5.3));
      q1.lookAt(camera.position); q2.lookAt(camera.position);
      q1.sweep(lerp(-2, 2, seg(k, 5, 7))); q2.sweep(lerp(-2.5, 2.5, seg(k, 5.3, 7.5)));
    }
    star.setOpacity(1);
    sky.position.copy(camera.position); star.position.copy(camera.position);
  }

  const counters = (v, k) => {
    const n = v * E.expoOut(k);
    if (v >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (n / 1e6).toFixed(0) + 'M';
    return Math.round(n).toLocaleString('en-US');
  };
  function sansText(ctx, s, x, y, size, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 800} ${size}px ${SANS}`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = (o.spacing || 0) + 'px';
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.grad) { const w = ctx.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : x; const g = ctx.createLinearGradient(x0, y - size, x0 + w, y); g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#ffe6b8'); g.addColorStop(1, GOLD); ctx.fillStyle = g; }
    else ctx.fillStyle = o.color || '#fff';
    if (o.glow) { ctx.shadowColor = o.glowColor || 'rgba(255,195,106,0.6)'; ctx.shadowBlur = o.glow; }
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  // words that rise out of a mask
  function riseText(ctx, s, x, y, size, k, o = {}) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y - size * 1.05, W, size * 1.35); ctx.clip();
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

  function hud(ctx, lt, t) {
    // A: cold open words
    const words = [[0.8, '3,000 years.'], [2.8, 'Countless minds.'], [4.8, 'One inheritance.']];
    words.forEach(([s, txt], i) => {
      const a = env(t, s, s + 0.15, (words[i + 1] ? words[i + 1][0] : 7.6) - 0.3, (words[i + 1] ? words[i + 1][0] : 7.8));
      if (a <= 0) return;
      const k = seg(t, s, s + 0.6);
      riseText(ctx, txt, W / 2, H / 2 + 40, 118, k, { align: 'center', grad: i === 2, alpha: a, spacing: -2 });
    });
    // B: subtitle under the 3D title
    const bk = t - SEC.title;
    if (bk > 0.8 && t < SEC.grid) {
      const a = env(bk, 0.8, 1.2, 3.4, 3.8);
      sansText(ctx, 'THREE THOUSAND YEARS OF ACHIEVEMENT', W / 2, H - 170, 26, { align: 'center', weight: 700, spacing: lerp(22, 10, E.out(seg(bk, 0.8, 3))), color: '#cfd6ff', alpha: a });
    }
    // C: grid headline
    if (t >= SEC.grid && t < SEC.heroes) {
      const k = t - SEC.grid;
      riseText(ctx, 'Everything we build on.', 110, 170, 72, seg(k, 0.1, 0.8), { grad: true, alpha: 1 - seg(k, 7.4, 7.9) });
      sansText(ctx, 'EIGHT FIELDS · ONE CIVILIZATION', 114, 220, 20, { weight: 700, spacing: 6, color: GOLD, alpha: seg(k, 0.6, 1) * (1 - seg(k, 7.4, 7.9)) });
    }
    // D: hero typography
    if (t >= SEC.heroes && t < SEC.dash) {
      const hi = Math.floor((t - SEC.heroes) / BAR), k = t - SEC.heroes - hi * BAR;
      const [, head, kick, val, unit, year] = HEROES[hi];
      const out = 1 - seg(k, BAR - 0.15, BAR);
      const pw = pill(ctx, year, 110, 330, seg(k, 0.05, 0.25) * out);
      sansText(ctx, kick, 110 + pw + 20, 328, 20, { weight: 700, spacing: 6, color: '#b9c4ff', alpha: seg(k, 0.1, 0.3) * out });
      riseText(ctx, head, 104, 480, 112, seg(k, 0.08, 0.6), { grad: true, alpha: out, spacing: -3 });
      sansText(ctx, counters(val, seg(k, 0.3, 1.4)), 110, 640, 84, { weight: 800, color: '#ffffff', alpha: seg(k, 0.25, 0.45) * out });
      sansText(ctx, unit.toUpperCase(), 114, 684, 20, { weight: 700, spacing: 6, color: GOLD, alpha: seg(k, 0.35, 0.55) * out });
      ctx.save(); ctx.globalAlpha = out; ctx.fillStyle = GOLD; ctx.fillRect(110, 560, 240 * E.expoOut(seg(k, 0.2, 0.7)), 3); ctx.restore();
      // index
      sansText(ctx, `${String(hi + 1).padStart(2, '0')} / ${HEROES.length}`, W - 110, 110, 18, { align: 'right', weight: 700, spacing: 4, color: 'rgba(255,255,255,0.6)', alpha: out });
      ctx.save(); ctx.globalAlpha = 0.5 * out; for (let j = 0; j < HEROES.length; j++) { ctx.fillStyle = j <= hi ? GOLD : 'rgba(255,255,255,0.2)'; ctx.fillRect(W - 110 - (HEROES.length - j) * 26, 130, 20, 3); } ctx.restore();
    }
    // E: dashboard caption
    if (t >= SEC.dash && t < SEC.finale) {
      const k = t - SEC.dash;
      riseText(ctx, 'Progress compounds.', W / 2, 150, 72, seg(k, 0.2, 0.9), { align: 'center', grad: true, alpha: 1 - seg(k, 7.4, 7.9) });
    }
    // F: finale taglines and end card
    if (t >= SEC.finale) {
      const k = t - SEC.finale;
      ['Inherited from the past.', 'Entrusted to the present.', 'Built for the future.'].forEach((s, i) => {
        const a = env(k, 1.2 + i * 0.9, 1.5 + i * 0.9, 3.9, 4.2);
        if (a > 0) riseText(ctx, s, W / 2, 180 + i * 0, 60, seg(k, 1.2 + i * 0.9, 1.8 + i * 0.9), { align: 'center', grad: i === 2, alpha: a * (i === Math.min(2, Math.floor((k - 1.2) / 0.9)) ? 1 : 0) });
      });
      const e = seg(k, 8.2, 8.8);
      if (e > 0) {
        sansText(ctx, 'WESTERN CIVILIZATION', W / 2, H - 200, 22, { align: 'center', weight: 700, spacing: 12, color: '#cfd6ff', alpha: e });
        ctx.save(); ctx.globalAlpha = e;
        const bw = 360, bx = W / 2 - bw / 2, by = H - 170;
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#ffcf7a'); g.addColorStop(1, '#ff9e4a');
        ctx.beginPath(); ctx.roundRect(bx, by, bw, 64, 32); ctx.fillStyle = g; ctx.shadowColor = 'rgba(255,170,80,0.7)'; ctx.shadowBlur = 40; ctx.fill();
        ctx.shadowBlur = 0; ctx.font = `800 22px ${SANS}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.fillStyle = '#1a1206'; ctx.fillText('YOUR CHAPTER STARTS NOW  →', W / 2, by + 41);
        ctx.restore();
      }
    }
    // white flash frames on the big hits
    for (const f of flashes) { const d = t - f; if (d >= 0 && d < 0.18) { ctx.fillStyle = `rgba(255,248,235,${0.55 * (1 - d / 0.18)})`; ctx.fillRect(0, 0, W, H); } }
  }
  return { scene, camera, update, hud, bloom: 0.7 };
});
