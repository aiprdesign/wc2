/* THE INHERITANCE 3D — holographic toolkit.
   Every object is a combination of layers: a fresnel-lit translucent fill,
   a wireframe, and a point cloud, each able to "print" in along an axis. */
import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export const C = {
  cyan: '#56d8ff',
  ice: '#cdefff',
  gold: '#ffb84d',
  goldHot: '#ffe6b0',
  ember: '#ff5a2a',
  white: '#ffffff',
  violet: '#8a7dff',
  steel: '#8fb3dc',
};
export const U = { time: { value: 0 } };

const NOISE = /* glsl */ `
  float h1(float n){ return fract(sin(n) * 43758.5453); }
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

function common(opts) {
  return {
    uTime: U.time,
    uColor: { value: new THREE.Color(opts.color || C.cyan) },
    uOpacity: { value: opts.opacity == null ? 1 : opts.opacity },
    uIntensity: { value: opts.intensity == null ? 1.6 : opts.intensity },
    uReveal: { value: opts.reveal == null ? 1e6 : opts.reveal },
    uAxis: { value: opts.axis == null ? 1 : opts.axis },
    uEdge: { value: opts.edge == null ? 0.04 : opts.edge },
    uGlitch: { value: 0 },
  };
}
const REVEAL = /* glsl */ `
  uniform float uReveal; uniform int uAxis; uniform float uEdge; uniform float uGlitch;
  float axisOf(vec3 p){ return uAxis == 0 ? p.x : (uAxis == 1 ? p.y : p.z); }
`;

// Translucent fresnel fill with moving scanlines.
export function fillMat(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...common(opts), uFres: { value: opts.fresnel == null ? 1 : opts.fresnel }, uBase: { value: opts.base == null ? 0.06 : opts.base } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
      uniform float uTime; uniform float uGlitch;
      ${NOISE}
      void main(){
        vec3 p = position;
        float g = uGlitch * step(0.82, h1(floor(uTime * 24.0) + floor(p.y * 3.0))) * (h1(floor(uTime*31.0)) - 0.5);
        p.x += g * 0.4;
        vL = position;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vV = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform float uIntensity; uniform float uTime; uniform float uFres; uniform float uBase;
      ${REVEAL}
      varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
      ${NOISE}
      void main(){
        float a = axisOf(vL);
        if (a > uReveal) discard;
        float f = 1.0 - abs(dot(normalize(vN + 1e-6), normalize(vV + 1e-6)));
        f = pow(f, 2.2) * uFres;
        float scan = 0.72 + 0.28 * sin(vW.y * 60.0 - uTime * 6.0);
        float band = smoothstep(0.0, 0.08, fract(vW.y * 0.25 - uTime * 0.35)) * 0.25;
        float flick = 0.94 + 0.06 * h1(floor(uTime * 30.0));
        float edge = smoothstep(uEdge, 0.0, uReveal - a) * 2.5;
        float alpha = (uBase + f * 0.9 + band * 0.2) * scan * flick + edge;
        gl_FragColor = vec4(uColor * uIntensity, alpha * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function lineMat(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...common(opts), uDash: { value: opts.dash || 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vL; varying vec3 vW; varying float vD;
      attribute float lineDistance;
      void main(){
        vL = position;
        vD = lineDistance;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform float uIntensity; uniform float uTime; uniform float uDash;
      ${REVEAL}
      varying vec3 vL; varying vec3 vW; varying float vD;
      ${NOISE}
      void main(){
        float a = axisOf(vL);
        if (a > uReveal) discard;
        float edge = smoothstep(uEdge, 0.0, uReveal - a) * 3.0;
        float d = uDash > 0.0 ? step(0.5, fract(vD * uDash - uTime * 2.0)) * 0.8 + 0.2 : 1.0;
        float flick = 0.9 + 0.1 * h1(floor(uTime * 30.0) + vW.x);
        gl_FragColor = vec4(uColor * uIntensity * (1.0 + edge), uOpacity * d * flick);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function pointsMat(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...common(opts), uSize: { value: opts.size || 3 }, uScale: { value: 540 }, uMax: { value: opts.max || 7 } },
    vertexShader: /* glsl */ `
      uniform float uSize; uniform float uScale; uniform float uTime; uniform float uMax;
      attribute float aSeed;
      varying vec3 vL; varying float vTw;
      void main(){
        vL = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTw = 0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 40.0);
        gl_PointSize = min(uMax, uSize * (uScale / max(1.0, -mv.z)) * (0.6 + aSeed * 0.8));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform float uIntensity;
      ${REVEAL}
      varying vec3 vL; varying float vTw;
      void main(){
        float a = axisOf(vL);
        if (a > uReveal) discard;
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float k = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor * uIntensity, k * k * uOpacity * vTw);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function seeds(n, seed = 1) {
  const r = rng(seed), a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = r();
  return a;
}

// A holographic object: fill + wire + points, sharing opacity and reveal.
export function holo(geom, o = {}) {
  const g = new THREE.Group();
  g.mats = [];
  const color = o.color || C.cyan;
  if (o.fill !== false) {
    const m = fillMat({ color, intensity: o.fillIntensity || 0.75, base: o.base == null ? 0.05 : o.base, fresnel: o.fresnel, axis: o.axis });
    g.add(new THREE.Mesh(geom, m));
    g.mats.push(m);
  }
  if (o.wire !== false) {
    const eg = o.wireframe ? new THREE.WireframeGeometry(geom) : new THREE.EdgesGeometry(geom, o.threshold || 20);
    const m = lineMat({ color: o.wireColor || color, intensity: o.wireIntensity || 2.2, axis: o.axis });
    m.uniforms.uOpacity.value = o.wireOpacity == null ? 0.8 : o.wireOpacity;
    const ls = new THREE.LineSegments(eg, m);
    ls.baseOpacity = m.uniforms.uOpacity.value;
    g.add(ls);
    g.mats.push(m);
  }
  if (o.points) {
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', geom.getAttribute('position'));
    pg.setAttribute('aSeed', new THREE.BufferAttribute(seeds(geom.getAttribute('position').count, 7), 1));
    const m = pointsMat({ color: o.pointColor || color, size: o.pointSize || 2.5, intensity: 2.4, axis: o.axis });
    g.add(new THREE.Points(pg, m));
    g.mats.push(m);
  }
  g.baseOps = g.mats.map((m) => m.uniforms.uOpacity.value);
  g.setOpacity = (a) => { g.mats.forEach((m, i) => (m.uniforms.uOpacity.value = g.baseOps[i] * a)); g.visible = a > 0.002; return g; };
  g.setReveal = (v) => { g.mats.forEach((m) => (m.uniforms.uReveal.value = v)); return g; };
  g.setGlitch = (v) => { g.mats.forEach((m) => (m.uniforms.uGlitch.value = v)); return g; };
  g.setColor = (c) => { g.mats.forEach((m) => m.uniforms.uColor.value.set(c)); return g; };
  return g;
}

// Polyline(s) as a single line object whose drawing can be progressed.
export function polyline(pts, o = {}) {
  const pos = [];
  const dist = [];
  let d = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i) d += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], (p[2] || 0) - (pts[i - 1][2] || 0));
    pos.push(p[0], p[1], p[2] || 0);
    dist.push(d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('lineDistance', new THREE.Float32BufferAttribute(dist, 1));
  const m = lineMat({ color: o.color || C.cyan, intensity: o.intensity || 2.4, dash: o.dash, axis: o.axis });
  m.uniforms.uOpacity.value = o.opacity == null ? 1 : o.opacity;
  const line = new THREE.Line(g, m);
  line.base = m.uniforms.uOpacity.value;
  line.n = pts.length;
  line.setProgress = (p) => { g.setDrawRange(0, Math.max(0, Math.ceil(clamp(p) * line.n))); line.visible = p > 0; return line; };
  line.setOpacity = (a) => { m.uniforms.uOpacity.value = line.base * a; line.visible = a > 0.002; return line; };
  line.setColor = (c) => { m.uniforms.uColor.value.set(c); return line; };
  return line;
}
// Many 2D strokes (from the v1 shape library) as a group of 3D lines.
export function strokes(shape, o = {}) {
  const g = new THREE.Group();
  const s = o.scale || 1, z = o.z || 0;
  shape.forEach((st) => g.add(polyline(st.map(([x, y]) => [x * s, -y * s, z]), o)));
  g.setProgress = (p, overlap = 0.5) => {
    const n = g.children.length, span = 1 / (n - (n - 1) * overlap);
    g.children.forEach((l, i) => l.setProgress(clamp((p - i * span * (1 - overlap)) / span)));
    return g;
  };
  g.setOpacity = (a) => { g.children.forEach((l) => l.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setColor = (c) => { g.children.forEach((l) => l.setColor(c)); return g; };
  return g;
}
// A morphable stroke set: N strokes of P points, positions updated in place.
export function morphLines(S = 18, P = 40, o = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < S; i++) g.add(polyline(Array.from({ length: P }, () => [0, 0, 0]), o));
  g.setShape = (shape, scale = 1, depthZ = 0) => {
    g.children.forEach((l, i) => {
      const a = l.geometry.getAttribute('position');
      const st = shape[i];
      for (let j = 0; j < P; j++) a.setXYZ(j, st[j][0] * scale, -st[j][1] * scale, depthZ);
      a.needsUpdate = true;
      l.geometry.computeBoundingSphere();
    });
  };
  g.setOpacity = (a) => { g.children.forEach((l) => l.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setColor = (c) => { g.children.forEach((l) => l.setColor(c)); return g; };
  return g;
}

export function pointCloud(positions, o = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds(positions.length / 3, o.seed || 3), 1));
  const m = pointsMat({ color: o.color || C.cyan, size: o.size || 3, intensity: o.intensity || 2.2, axis: o.axis, max: o.max });
  m.uniforms.uOpacity.value = o.opacity == null ? 1 : o.opacity;
  const p = new THREE.Points(g, m);
  p.base = m.uniforms.uOpacity.value;
  p.setOpacity = (a) => { m.uniforms.uOpacity.value = p.base * a; p.visible = a > 0.002; return p; };
  p.setReveal = (v) => { m.uniforms.uReveal.value = v; return p; };
  return p;
}

// ---------- light ----------
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = makeCanvas(128, 128), g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.15, 'rgba(255,255,255,0.6)');
  rg.addColorStop(0.4, 'rgba(255,255,255,0.12)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}
export function glow(color = C.gold, size = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color(color).multiplyScalar(2), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.base = size;
  s.setOpacity = (a) => { m.opacity = a; s.visible = a > 0.002; return s; };
  return s;
}
// The golden spark: glow plus an anamorphic streak.
export function spark(color = C.gold, size = 1) {
  const g = new THREE.Group();
  const core = glow(color, size);
  const streak = glow(color, size);
  streak.scale.set(size * 9, size * 0.12, 1);
  g.add(core, streak);
  g.setOpacity = (a) => { core.setOpacity(a); streak.setOpacity(a * 0.6); g.visible = a > 0.002; return g; };
  g.setSize = (s) => { core.scale.setScalar(s); streak.scale.set(s * 9, s * 0.12, 1); return g; };
  return g;
}

// Volumetric beam: an open cone lit along its length, faded at the rims.
export function beam(radiusTop, radiusBottom, height, color = C.gold, opacity = 0.35) {
  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 48, 1, true);
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uTime: U.time },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float a = pow(f, 3.0) * smoothstep(0.0, 0.4, vY) * (0.85 + 0.15*sin(vY*40.0 - uTime*2.0));
        gl_FragColor = vec4(uColor * 1.6, a * uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, m);
  mesh.setOpacity = (a) => { m.uniforms.uOpacity.value = opacity * a; mesh.visible = a > 0.002; return mesh; };
  return mesh;
}

// Holographic floor grid that fades into the distance.
export function grid(size = 200, step = 2, color = C.cyan, opacity = 0.35, plane = 'xz') {
  const geom = new THREE.PlaneGeometry(size, size, 1, 1);
  if (plane === 'xz') geom.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uStep: { value: step }, uTime: U.time, uCenter: { value: new THREE.Vector3() }, uFade: { value: size * 0.35 }, uPlane: { value: plane === 'xy' ? 1 : 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uStep; uniform vec3 uCenter; uniform float uFade; uniform float uPlane; varying vec3 vW;
      void main(){ vec2 P = uPlane > 0.5 ? vW.xy : vW.xz; vec2 c = P / uStep; vec2 g = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), vec2(1e-4)); float l = 1.0 - min(min(g.x, g.y), 1.0);
        vec2 c2 = P / (uStep*5.0); vec2 g2 = abs(fract(c2 - 0.5) - 0.5) / max(fwidth(c2), vec2(1e-4)); float l2 = 1.0 - min(min(g2.x, g2.y), 1.0);
        float fade = 1.0 - smoothstep(0.0, uFade, length(P - (uPlane > 0.5 ? uCenter.xy : uCenter.xz)));
        gl_FragColor = vec4(uColor * 1.4, (l * 0.45 + l2 * 0.8) * fade * uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geom, m);
  mesh.setOpacity = (a) => { m.uniforms.uOpacity.value = opacity * a; mesh.visible = a > 0.002; return mesh; };
  return mesh;
}

export function stars(n = 4000, r = 600, seed = 11, color = C.ice) {
  const R = rng(seed), p = [];
  for (let i = 0; i < n; i++) {
    const u = R() * 2 - 1, q = R() * TAU, s = Math.sqrt(1 - u * u);
    const rr = r * (0.7 + R() * 0.3);
    p.push(Math.cos(q) * s * rr, u * rr, Math.sin(q) * s * rr);
  }
  return pointCloud(p, { color, size: 1.6, intensity: 1.4, seed });
}
export function dust(n, box, seed = 5, color = C.goldHot) {
  const R = rng(seed), p = [];
  for (let i = 0; i < n; i++) p.push((R() - 0.5) * box[0], (R() - 0.5) * box[1], (R() - 0.5) * box[2]);
  const pc = pointCloud(p, { color, size: 0.25, intensity: 1.4, seed, max: 3.5, opacity: 0.7 });
  pc.box = box;
  pc.drift = (t) => { pc.rotation.y = t * 0.03; pc.position.y = Math.sin(t * 0.3) * box[1] * 0.02; };
  return pc;
}

// ---------- type ----------
const FONTS = {};
export async function loadFonts(base) {
  for (const w of ['400', '600']) {
    const res = await fetch(`${base}fonts/cinzel-${w}.typeface.json`);
    FONTS[w] = new Font(await res.json());
  }
}
export function textGeom(str, o = {}) {
  const g = new TextGeometry(str, {
    font: FONTS[o.weight || '600'],
    size: o.size || 1,
    depth: o.depth == null ? (o.size || 1) * 0.2 : o.depth,
    curveSegments: o.curve || 4,
    bevelEnabled: o.bevel !== false,
    bevelThickness: (o.size || 1) * 0.03,
    bevelSize: (o.size || 1) * 0.02,
    bevelSegments: 1,
  });
  g.computeBoundingBox();
  const b = g.boundingBox;
  const dx = -(b.max.x + b.min.x) / 2, dy = o.baseline ? 0 : -(b.max.y + b.min.y) / 2;
  g.translate(dx, dy, -(b.max.z + b.min.z) / 2);
  if (o.tracking) {
    // letter-spacing: re-lay glyphs with extra advance (applied by caller via word())
  }
  return g;
}
// 3D holographic word
export function word(str, o = {}) {
  const geom = textGeom(str, o);
  const h = holo(geom, { color: o.color || C.cyan, threshold: 30, fillIntensity: o.fillIntensity || 1.4, base: o.base == null ? 0.25 : o.base, points: o.points, pointSize: 1.5, axis: o.axis == null ? 0 : o.axis, wireIntensity: o.wireIntensity });
  geom.computeBoundingBox();
  h.width = geom.boundingBox.max.x - geom.boundingBox.min.x;
  h.minX = geom.boundingBox.min.x;
  return h;
}

// HUD label as a camera-facing sprite (crisp canvas text).
export function label(title, sub = '', o = {}) {
  const w = 2048, hgt = 192;
  const c = makeCanvas(w, hgt), g = c.getContext('2d');
  g.font = `600 ${o.px || 64}px ${FONT.cap}`;
  g.letterSpacing = (o.spacing || 14) + 'px';
  g.fillStyle = o.color || '#dff6ff';
  g.textAlign = o.align || 'left';
  g.textBaseline = 'middle';
  const x = o.align === 'center' ? w / 2 : 24;
  g.fillText(title, x, sub ? 64 : hgt / 2);
  if (sub) {
    g.font = `italic 500 ${o.subPx || 52}px ${FONT.serif}`;
    g.letterSpacing = '2px';
    g.fillStyle = o.subColor || C.goldHot;
    g.fillText(sub, x, 142);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m);
  const sc = o.scale || 1;
  s.scale.set(sc * (w / hgt), sc, 1);
  s.center.set(o.align === 'center' ? 0.5 : 24 / w, 0.5);
  s.setOpacity = (a) => { m.opacity = a; s.visible = a > 0.002; return s; };
  return s;
}
// A callout: label plus leader line from a point
export function callout(title, sub, o = {}) {
  const g = new THREE.Group();
  const l = label(title, sub, { scale: o.scale || 1 });
  const off = o.offset || [3, 2, 0];
  l.position.set(off[0] + 0.3, off[1], off[2]);
  const line = polyline([[0, 0, 0], [off[0] * 0.6, off[1], off[2]], [off[0], off[1], off[2]]], { color: o.color || C.cyan, intensity: 2 });
  const dot = glow(o.color || C.cyan, 0.5);
  g.add(l, line, dot);
  g.setOpacity = (a, p = 1) => { l.setOpacity(a * clamp(p * 2 - 1)); line.setOpacity(a).setProgress(clamp(p * 2)); dot.setOpacity(a); g.visible = a > 0.002; return g; };
  return g;
}

// ---------- figures ----------
function cap(r, len, seg = 6) { return new THREE.CapsuleGeometry(r, len, 3, seg); }
// Human figure hologram built from capsules; pose via .pose({walk, arms})
export function figure(o = {}) {
  const color = o.color || C.cyan;
  const g = new THREE.Group();
  const part = (geom) => { const h = holo(geom, { color, threshold: 30, base: 0.1, wireOpacity: 0.5, points: o.points }); return h; };
  const head = part(new THREE.SphereGeometry(0.12, 12, 10)); head.position.y = 1.62;
  const torso = part(cap(0.17, 0.42)); torso.position.y = 1.2;
  const hips = part(cap(0.15, 0.1)); hips.position.y = 0.92;
  const limb = (x, y, len, r) => { const p = new THREE.Group(); const m = part(cap(r, len)); m.position.y = -len / 2 - r; p.add(m); p.position.set(x, y, 0); return p; };
  const lArm = limb(-0.24, 1.45, 0.5, 0.05), rArm = limb(0.24, 1.45, 0.5, 0.05);
  const lLeg = limb(-0.1, 0.9, 0.72, 0.07), rLeg = limb(0.1, 0.9, 0.72, 0.07);
  g.add(head, torso, hips, lArm, rArm, lLeg, rLeg);
  g.parts = { head, torso, lArm, rArm, lLeg, rLeg };
  const all = [head, torso, hips, lArm.children[0], rArm.children[0], lLeg.children[0], rLeg.children[0]];
  g.pose = (p = {}) => {
    const w = p.walk || 0, ph = p.phase || 0;
    lLeg.rotation.x = Math.sin(ph) * 0.5 * w;
    rLeg.rotation.x = -Math.sin(ph) * 0.5 * w;
    lArm.rotation.x = -Math.sin(ph) * 0.4 * w + (p.lArm || 0);
    rArm.rotation.x = Math.sin(ph) * 0.4 * w + (p.rArm || 0);
    lArm.rotation.z = p.lArmZ || 0;
    rArm.rotation.z = p.rArmZ || 0;
    head.rotation.x = p.head || 0;
    return g;
  };
  g.setOpacity = (a) => { all.forEach((h) => h.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setColor = (c) => { all.forEach((h) => h.setColor(c)); return g; };
  g.setGlitch = (v) => { all.forEach((h) => h.setGlitch(v)); return g; };
  return g;
}

// A hand hologram pointing along -z (index extended, others curled).
export function hand(o = {}) {
  const color = o.color || C.cyan;
  const g = new THREE.Group();
  const s = o.scale || 1;
  const parts = [];
  const part = (geom) => { const h = holo(geom, { color, threshold: 25, base: 0.12, wireOpacity: 0.55, points: true, pointSize: 1.2 }); parts.push(h); return h; };
  const palm = part(new THREE.BoxGeometry(0.8, 0.22, 0.9, 3, 1, 3));
  palm.position.set(0, 0, 0.45);
  g.add(palm);
  const fingers = [];
  const fx = [-0.3, -0.1, 0.1, 0.3];
  const lens = [0.5, 0.55, 0.5, 0.4];
  fx.forEach((x, i) => {
    const root = new THREE.Group();
    root.position.set(x, 0, 0);
    let parent = root;
    const segs = [];
    for (let k = 0; k < 3; k++) {
      const j = new THREE.Group();
      const L = lens[i] * [0.45, 0.32, 0.25][k];
      const m = part(cap(0.075 - k * 0.008, L));
      m.rotation.x = Math.PI / 2;
      m.position.z = -L / 2 - 0.04;
      j.add(m);
      j.position.z = k === 0 ? 0 : -(lens[i] * [0.45, 0.32, 0.25][k - 1]) - 0.06;
      parent.add(j);
      parent = j;
      segs.push(j);
    }
    g.add(root);
    fingers.push(segs);
  });
  const thumb = new THREE.Group();
  const tm = part(cap(0.085, 0.35));
  tm.rotation.x = Math.PI / 2;
  tm.position.z = -0.2;
  thumb.add(tm);
  thumb.position.set(o.left ? 0.42 : -0.42, -0.02, 0.45);
  thumb.rotation.y = o.left ? -0.6 : 0.6;
  g.add(thumb);
  g.scale.setScalar(s);
  g.curl = (idx, others) => {
    fingers.forEach((segs, i) => {
      const c = i === (o.left ? 2 : 1) ? idx : others;
      segs.forEach((j) => (j.rotation.x = -c * 1.2));
    });
    return g;
  };
  g.curl(0, 0.9);
  g.setOpacity = (a) => { parts.forEach((h) => h.setOpacity(a)); g.visible = a > 0.002; return g; };
  g.setColor = (c) => { parts.forEach((h) => h.setColor(c)); return g; };
  return g;
}

// Extruded profile head (the v1 silhouette given depth) — a holographic bust.
export function bust(o = {}) {
  const pts = profileShape(0, 0, 1);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x / 100, -y / 100)));
  const geom = new THREE.ExtrudeGeometry(shape, { depth: o.depth || 1.2, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.12, bevelSegments: 4, curveSegments: 8 });
  geom.center();
  return holo(geom, { color: o.color || C.cyan, threshold: 18, base: o.base || 0.02, points: o.points !== false, pointSize: 1.0, axis: 1, fillIntensity: 0.5 });
}

// Earth as a point cloud of land
export function earthPoints(R = 1, color = C.cyan, size = 2.2) {
  const D = EARTH.dots, p = [];
  for (let i = 0; i < D.length; i += 2) {
    const la = (D[i] / 10) * Math.PI / 180, lo = (D[i + 1] / 10) * Math.PI / 180;
    p.push(R * Math.cos(la) * Math.sin(lo), R * Math.sin(la), R * Math.cos(la) * Math.cos(lo));
  }
  return pointCloud(p, { color, size, intensity: 1.4, max: 2.6 });
}
export function latLon(lat, lon, R = 1) {
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
  return new THREE.Vector3(R * Math.cos(la) * Math.sin(lo), R * Math.sin(la), R * Math.cos(la) * Math.cos(lo));
}

// Place an object on a keyframed camera path: keys [[t, x,y,z, tx,ty,tz, fov?]]
export function camKeys(camera, keys, t, ease = E.io) {
  const v = keyframes(keys, t, ease);
  camera.position.set(v[0], v[1], v[2]);
  camera.lookAt(v[3], v[4], v[5]);
  if (v[6]) { camera.fov = v[6]; camera.updateProjectionMatrix(); }
  return v;
}
export function shake(camera, amt, t, seed = 1) {
  camera.position.x += noise1(t * 25, seed) * amt;
  camera.position.y += noise1(t * 25, seed + 3) * amt;
}
