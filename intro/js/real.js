/* One look for every model in the intro: a museum collection in marble and
   gilt. Masses are white marble; fine structure (lattice, struts, rigging,
   orbits, strings) is gilded bronze tube; a faint gold line traces the feature
   edges. Every model prints in from the floor behind the same glowing seam.
   Two kinds of source share this treatment:
     - real assets: NASA and Khronos glTF models, marble scans (loadReal/realModel)
     - the procedural MB models (sculpt)
   Both return the MB interface: setOpacity, setPrint, setGlitch, setColor,
   width/height/depth, baseOps. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lineMat } from '../../film3d/js/holo.js';

// file, an orientation fix, and whether to trace feature edges
export const REAL = {
  saturnV: { file: 'saturnv.glb', edges: 40 },
  hubble: { file: 'hubbleA.glb', edges: 40 },
  camera: { file: 'camera.glb', edges: 50 },
  igea: { file: 'igea.glb' },
  planck: { file: 'planck.glb', rot: [0, Math.PI, 0] },
};
export const isReal = (name) => name in REAL;

// the collection's two materials and its edge line
const MARBLE = { color: '#a39b8d', roughness: 0.45, metalness: 0 };
const GILT = { color: '#d1a04a', roughness: 0.3, metalness: 1 };
const EDGE = '#ffcf85';

// procedural models whose explicit lines are structure, drawn as gilt tube (radius as a fraction of height)
const TUBES = { eiffel: 0.0022, wrightFlyer: 0.0035, caravel: 0.0016, orreryFull: 0.009, dna: 0.006, violin: 0.0025, vitruvian: 0.006, galileoScope: 0.004, wattAssembly: 0.005, press: 0.004 };

// the reveal: discard above the print line, a hot seam just below it
function withReveal(mat, reveal) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uReveal = reveal.y;
    sh.uniforms.uSeam = reveal.seam;
    sh.vertexShader = 'varying float vRY;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  #ifdef USE_INSTANCING
    vRY = (instanceMatrix * vec4(transformed, 1.0)).y;
  #else
    vRY = position.y;
  #endif`);
    sh.fragmentShader = 'uniform float uReveal; uniform float uSeam; varying float vRY;\n' + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (vRY > uReveal) discard;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * smoothstep(uSeam, 0.0, uReveal - vRY) * 4.0;');
  };
  mat.customProgramCacheKey = () => 'reveal';
  return mat;
}
function surface(P, reveal) {
  return withReveal(new THREE.MeshStandardMaterial({ ...P, color: new THREE.Color(P.color), transparent: true, side: THREE.DoubleSide }), reveal);
}

// Shared finishing for both kinds of model: solids, optional tubes, the edge line, and the MB interface.
function finish(g, inner, bb, o) {
  const H = bb.max.y - bb.min.y;
  const reveal = { y: { value: 1e6 }, seam: { value: H * 0.035 } };
  const solids = [];
  (o.meshes || []).forEach((geo) => { const m = surface(MARBLE, reveal); inner.add(new THREE.Mesh(geo, m)); solids.push(m); });
  if (o.tubes) {
    const m = surface(GILT, reveal);
    const im = new THREE.InstancedMesh(TUBE_GEO, m, o.tubes.count);
    im.instanceMatrix = o.tubes;
    im.frustumCulled = false;
    inner.add(im);
    solids.push(m);
  }
  const lm = lineMat({ color: EDGE, intensity: 1 });
  if (o.lineG && o.lineG.drawRange.count !== 0) inner.add(new THREE.LineSegments(o.lineG, lm));
  const segsN = o.lineG ? Math.min(o.lineG.drawRange.count, o.lineG.attributes.position.count) / 2 : 0;
  g.mats = [lm];
  g.baseOps = [clamp(0.5 * Math.sqrt(3000 / Math.max(1, segsN)), 0.06, 0.3)];
  g.bb = bb;
  g.inner = inner;
  g.setOpacity = (a) => {
    g.mats.forEach((m, i) => (m.uniforms.uOpacity.value = g.baseOps[i] * a));
    solids.forEach((m) => { m.opacity = a; m.depthWrite = a > 0.6; });
    g.visible = a > 0.002;
    return g;
  };
  // print: 0..1 bottom to top; the gold line leads the stone by a little
  g.setPrint = (f) => {
    const y = lerp(bb.min.y - 0.02 * H, bb.max.y + 0.06 * H, f);
    reveal.y.value = y - 0.05 * H;
    g.mats.forEach((m) => { m.uniforms.uReveal.value = y; m.uniforms.uEdge.value = H * 0.03; });
    return g;
  };
  g.setGlitch = (v) => { g.mats.forEach((m) => (m.uniforms.uGlitch.value = v)); return g; };
  g.setColor = () => g; // the collection has one palette
  return g;
}

// ---------- gilt tube: explicit line segments as instanced cylinders ----------
const TUBE_GEO = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
const TUBE_CACHE = new Map();
function tubesFor(key, pos, from, radius) {
  if (TUBE_CACHE.has(key)) return TUBE_CACHE.get(key);
  const n = (pos.length / 3 - from) / 2;
  const attr = new THREE.InstancedBufferAttribute(new Float32Array(n * 16), 16);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), M = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
  let k = 0;
  for (let i = 0; i < n; i++) {
    const j = (from + i * 2) * 3;
    a.fromArray(pos, j); b.fromArray(pos, j + 3);
    d.subVectors(b, a);
    const len = d.length();
    if (len < 1e-6) continue;
    q.setFromUnitVectors(Y, d.divideScalar(len));
    M.compose(a.add(b).multiplyScalar(0.5), q, s.set(radius, len, radius));
    M.toArray(attr.array, k++ * 16);
  }
  const out = k < n ? new THREE.InstancedBufferAttribute(attr.array.slice(0, k * 16), 16) : attr;
  TUBE_CACHE.set(key, out);
  return out;
}

// ---------- procedural models ----------
export function sculpt(m, name) {
  const H = m.bb.max.y - m.bb.min.y;
  if (m.mesh) m.mesh.visible = false;
  m.inner.children.forEach((c) => { if (c.isLineSegments) c.visible = false; });
  const pos = m.lineG.attributes.position.array;
  const tubes = TUBES[name] && pos.length / 3 > m.edgeVerts ? tubesFor(name, pos, m.edgeVerts, H * TUBES[name]) : null;
  // edges only when tubes carry the structure; otherwise edges and engraved detail lines
  const lineG = new THREE.BufferGeometry();
  lineG.setAttribute('position', m.lineG.attributes.position);
  lineG.setAttribute('lineDistance', m.lineG.attributes.lineDistance);
  lineG.setDrawRange(0, tubes ? m.edgeVerts : pos.length / 3);
  const w = m.width, h = m.height, dp = m.depth;
  finish(m, m.inner, m.bb, { meshes: m.fillG ? [m.fillG] : [], tubes, lineG });
  m.width = w; m.height = h; m.depth = dp;
  return m;
}

// ---------- real assets ----------
const LIB = new Map();
export async function loadReal(base = 'models/') {
  const loader = new GLTFLoader();
  for (const [name, s] of Object.entries(REAL)) {
    const root = (await loader.loadAsync(base + s.file)).scene;
    if (s.rot) root.rotation.set(...s.rot);
    root.updateMatrixWorld(true);
    const geos = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      const g = new THREE.BufferGeometry();
      const src = o.geometry.clone().applyMatrix4(o.matrixWorld);
      g.setAttribute('position', src.attributes.position);
      if (src.attributes.normal) g.setAttribute('normal', src.attributes.normal);
      if (src.index) g.setIndex(src.index);
      if (!g.attributes.normal) g.computeVertexNormals();
      geos.push(g);
    });
    const geo = mergeGeometries(geos, false);
    geo.computeBoundingBox();
    const bb = geo.boundingBox.clone();
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    geo.computeBoundingBox();
    let lineG = null;
    if (s.edges) {
      const e = new THREE.EdgesGeometry(geo, s.edges);
      lineG = new THREE.BufferGeometry();
      lineG.setAttribute('position', e.attributes.position);
      lineG.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array(e.attributes.position.count), 1));
    }
    LIB.set(name, { geo, bb: geo.boundingBox.clone(), lineG });
  }
}
export function realModel(name, o = {}) {
  const L = LIB.get(name);
  const size = L.bb.getSize(new THREE.Vector3());
  const scale = o.height ? o.height / size.y : 1;
  const inner = new THREE.Group();
  inner.scale.setScalar(scale);
  const g = new THREE.Group();
  g.add(inner);
  finish(g, inner, L.bb, { meshes: [L.geo], lineG: L.lineG });
  g.height = size.y * scale; g.width = size.x * scale; g.depth = size.z * scale;
  return g;
}
