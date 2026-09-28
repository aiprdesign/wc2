/* Real 3D models — photogrammetry scans and production glTF assets — rendered
   as solid, lit objects that "print" in from the floor behind a glowing seam,
   dressed with a holographic edge/contour layer and a sampled point cloud.
   Instances expose the same interface as the procedural MB models. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { C, lineMat, pointsMat } from '../../film3d/js/holo.js';

// file, an orientation fix, and how to draw the holographic layer
export const REAL = {
  saturnV: { file: 'saturnv.glb', lines: 'edges', angle: 40, exposure: 0.62 },
  hubble: { file: 'hubbleA.glb', lines: 'edges', angle: 40, exposure: 0.85 },
  camera: { file: 'camera.glb', lines: 'edges', angle: 45 },
  igea: { file: 'igea.glb', lines: 'contours', marble: true, rot: [0, 0, 0] },
  planck: { file: 'planck.glb', lines: 'contours', marble: true, rot: [0, Math.PI, 0] },
};
const LIB = new Map();

// horizontal contour lines through a mesh: the look of a topographic scan
function contours(geo, count) {
  const p = geo.attributes.position.array, idx = geo.index ? geo.index.array : null;
  const n = idx ? idx.length : p.length / 3;
  let lo = Infinity, hi = -Infinity;
  for (let i = 1; i < p.length; i += 3) { lo = Math.min(lo, p[i]); hi = Math.max(hi, p[i]); }
  const step = (hi - lo) / count, out = [];
  const v = (k) => { const j = (idx ? idx[k] : k) * 3; return [p[j], p[j + 1], p[j + 2]]; };
  for (let t = 0; t < n; t += 3) {
    const a = v(t), b = v(t + 1), c = v(t + 2);
    const y0 = Math.min(a[1], b[1], c[1]), y1 = Math.max(a[1], b[1], c[1]);
    for (let k = Math.ceil((y0 - lo) / step); lo + k * step <= y1; k++) {
      const y = lo + k * step, hit = [];
      for (const [u, w] of [[a, b], [b, c], [c, a]]) {
        if ((u[1] - y) * (w[1] - y) < 0) { const s = (y - u[1]) / (w[1] - u[1]); hit.push(u[0] + (w[0] - u[0]) * s, y, u[2] + (w[2] - u[2]) * s); }
      }
      if (hit.length === 6) out.push(...hit);
    }
  }
  return new Float32Array(out);
}

// Loads every model once: geometry is baked into model space, based at y=0.
export async function loadReal(base = 'models/') {
  const loader = new GLTFLoader();
  for (const [name, s] of Object.entries(REAL)) {
    const gltf = await loader.loadAsync(base + s.file);
    const root = gltf.scene;
    if (s.rot) root.rotation.set(...s.rot);
    root.updateMatrixWorld(true);
    const parts = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      if (!g.attributes.normal) g.computeVertexNormals();
      parts.push({ geo: g, mat: o.material });
    });
    const bb = new THREE.Box3();
    parts.forEach((q) => { q.geo.computeBoundingBox(); bb.union(q.geo.boundingBox); });
    const off = new THREE.Vector3(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    parts.forEach((q) => q.geo.translate(off.x, off.y, off.z));
    bb.translate(off);
    const size = bb.getSize(new THREE.Vector3());
    // position-only merged copy for sampling and line extraction
    const bare = mergeGeometries(parts.map((q) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', q.geo.attributes.position); if (q.geo.index) g.setIndex(q.geo.index); return g; }), false);
    let lines;
    if (s.lines === 'contours') lines = contours(bare, 70);
    else {
      const eg = mergeGeometries(parts.map((q) => { const e = new THREE.EdgesGeometry(q.geo, s.angle || 35); const g = new THREE.BufferGeometry(); g.setAttribute('position', e.attributes.position); return g; }), false);
      lines = eg.attributes.position.array;
    }
    const lineG = new THREE.BufferGeometry();
    lineG.setAttribute('position', new THREE.BufferAttribute(lines, 3));
    lineG.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array(lines.length / 3), 1));
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(bare)).setRandomGenerator(rng(7)).build();
    const N = 14000, sp = new Float32Array(N * 3), sd = new Float32Array(N), tv = new THREE.Vector3(), R = rng(3);
    for (let i = 0; i < N; i++) { sampler.sample(tv); sp.set([tv.x, tv.y, tv.z], i * 3); sd[i] = R(); }
    const ptG = new THREE.BufferGeometry();
    ptG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    ptG.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
    LIB.set(name, { parts, bb, size, lineG, ptG, s });
  }
}
export const isReal = (name) => name in REAL;

const MARBLE = { color: new THREE.Color('#b3aa9b'), roughness: 0.46, metalness: 0.0 };

// the reveal: discard above the print line, a hot seam just below it
function withReveal(mat, reveal) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uReveal = reveal.y;
    sh.uniforms.uSeam = reveal.seam;
    sh.vertexShader = 'varying float vRY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRY = position.y;');
    sh.fragmentShader = 'uniform float uReveal; uniform float uSeam; varying float vRY;\n' + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (vRY > uReveal) discard;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * smoothstep(uSeam, 0.0, uReveal - vRY) * 4.0;');
  };
  mat.customProgramCacheKey = () => 'reveal';
  return mat;
}

export function realModel(name, o = {}) {
  const L = LIB.get(name);
  const scale = o.height ? o.height / L.size.y : 1;
  const inner = new THREE.Group();
  inner.scale.setScalar(scale);
  const g = new THREE.Group();
  g.add(inner);
  const reveal = { y: { value: 1e6 }, seam: { value: L.size.y * 0.04 } };
  // solid pass
  const solids = L.parts.map((q) => {
    let m;
    if (L.s.marble) m = new THREE.MeshStandardMaterial({ ...MARBLE });
    else { m = (Array.isArray(q.mat) ? q.mat[0] : q.mat).clone(); if (m.color) m.color.multiplyScalar(L.s.exposure || 1); }
    m.envMapIntensity = o.env == null ? 1 : o.env;
    m.transparent = true;
    m.side = THREE.DoubleSide;
    withReveal(m, reveal);
    const mesh = new THREE.Mesh(q.geo, m);
    inner.add(mesh);
    return m;
  });
  // holographic dress
  const color = o.color || C.gold;
  const lm = lineMat({ color: o.wireColor || color, intensity: 1.6 });
  const pm = pointsMat({ color: o.wireColor || color, size: 0.9, intensity: 1.8, max: 2.5 });
  inner.add(new THREE.LineSegments(L.lineG, lm), new THREE.Points(L.ptG, pm));
  g.mats = [lm, pm];
  const lineBase = L.s.lines === 'contours' ? 0.18 : clamp(0.9 * Math.sqrt(4000 / Math.max(1, L.lineG.attributes.position.count / 2)), 0.1, 0.6);
  g.baseOps = [lineBase * (o.holo == null ? 1 : o.holo), 0.22 * (o.holo == null ? 1 : o.holo)];
  g.solidOp = o.solid == null ? 1 : o.solid;
  g.height = L.size.y * scale; g.width = L.size.x * scale; g.depth = L.size.z * scale;
  g.bb = L.bb;
  g.inner = inner;
  g.setOpacity = (a) => {
    g.mats.forEach((m, i) => (m.uniforms.uOpacity.value = g.baseOps[i] * a));
    solids.forEach((m) => { m.opacity = a * g.solidOp; m.depthWrite = a * g.solidOp > 0.6; });
    g.visible = a > 0.002;
    return g;
  };
  // print: 0..1 bottom to top; the holo layer leads the solid by a little
  g.setPrint = (f) => {
    const H = L.size.y, y = lerp(-0.02 * H, 1.06 * H, f);
    reveal.y.value = y - 0.06 * H;
    g.mats.forEach((m) => { m.uniforms.uReveal.value = y; m.uniforms.uEdge.value = H * 0.03; });
    return g;
  };
  g.setGlitch = (v) => { g.mats.forEach((m) => (m.uniforms.uGlitch.value = v)); return g; };
  g.setColor = (c) => { g.mats.forEach((m) => m.uniforms.uColor.value.set(c)); return g; };
  return g;
}

// Solid, lit materials for the procedural models: the holographic fill is
// swapped for a real surface that prints in under the same seam.
const PRESETS = {
  marble: { color: '#b8ae9f', roughness: 0.5, metalness: 0 },
  stone: { color: '#9a8a74', roughness: 0.75, metalness: 0 },
  brick: { color: '#a0583c', roughness: 0.7, metalness: 0 },
  wood: { color: '#6e4b2c', roughness: 0.62, metalness: 0 },
  brass: { color: '#c08f3e', roughness: 0.32, metalness: 1 },
  iron: { color: '#5a4a40', roughness: 0.5, metalness: 0.85 },
  steel: { color: '#8d96a3', roughness: 0.35, metalness: 0.9 },
  fabric: { color: '#cbbd9c', roughness: 0.8, metalness: 0 },
};
export function solidify(m, preset) {
  const P = PRESETS[preset];
  if (!P || !m.mesh) return m;
  const mat = new THREE.MeshStandardMaterial({ ...P, color: new THREE.Color(P.color), transparent: true, side: THREE.DoubleSide });
  const H = m.bb.max.y - m.bb.min.y;
  const reveal = { y: { value: 1e6 }, seam: { value: H * 0.04 } };
  withReveal(mat, reveal);
  const solid = new THREE.Mesh(m.mesh.geometry, mat);
  m.inner.add(solid);
  m.baseOps = m.baseOps.map((v, i) => (i === 0 ? v * 0.2 : v * 0.55));
  const so = m.setOpacity, sp = m.setPrint;
  m.setOpacity = (a) => { so(a); mat.opacity = a; mat.depthWrite = a > 0.6; return m; };
  m.setPrint = (f) => { sp(f); reveal.y.value = lerp(m.bb.min.y - 0.02 * H, m.bb.max.y + 0.02 * H, f) - 0.06 * H; return m; };
  return m;
}
