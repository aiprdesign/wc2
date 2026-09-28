/* THE INHERITANCE 3D — model builder.
   Models are assembled from primitives in real-world units, merged into one
   fill mesh plus one line set (feature edges, full wireframes and explicit
   lines such as cables, rigging and lattice), and can be sampled into a point
   cloud so that any model can morph into any other. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { fillMat, lineMat, pointsMat, C } from './holo.js';

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(), SV = new THREE.Vector3(), PV = new THREE.Vector3();

function clean(g) {
  let n = g.index ? g.toNonIndexed() : g;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', n.getAttribute('position').clone());
  if (n.getAttribute('normal')) out.setAttribute('normal', n.getAttribute('normal').clone());
  else { out.computeVertexNormals(); }
  return out;
}

export class MB {
  constructor(name = '') {
    this.name = name;
    this.fill = [];
    this.edges = [];
    this.lines = [];
  }
  mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    EU.set(rx, ry, rz, 'YXZ');
    Q.setFromEuler(EU);
    SV.set(sx, sy, sz);
    PV.set(x, y, z);
    return new THREE.Matrix4().compose(PV, Q, SV);
  }
  // add a geometry: mode 'edge' (feature edges), 'wire' (every edge), 'none' (fill only), 'lines' (wire only, no fill)
  put(g, m, mode = 'edge', threshold = 25) {
    const geom = clean(g);
    if (m) geom.applyMatrix4(m);
    if (mode !== 'lines') this.fill.push(geom);
    if (mode === 'edge') this.edges.push(new THREE.EdgesGeometry(geom, threshold));
    else if (mode === 'wire' || mode === 'lines') {
      const w = new THREE.WireframeGeometry(g);
      if (m) w.applyMatrix4(m);
      this.edges.push(w);
    }
    return this;
  }
  box(w, h, d, x, y, z, ry = 0, mode = 'edge', rx = 0, rz = 0) { return this.put(new THREE.BoxGeometry(w, h, d), this.mat(x, y, z, rx, ry, rz), mode); }
  cyl(rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0, mode = 'edge', open = false, hs = 1) { return this.put(new THREE.CylinderGeometry(rt, rb, h, seg, hs, open), this.mat(x, y, z, rx, ry, rz), mode); }
  sphere(r, x, y, z, ws = 16, hs = 12, mode = 'wire') { return this.put(new THREE.SphereGeometry(r, ws, hs), this.mat(x, y, z), mode); }
  lathe(prof, seg, x = 0, y = 0, z = 0, mode = 'edge', threshold = 25, rx = 0, rz = 0) {
    return this.put(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg), this.mat(x, y, z, rx, 0, rz), mode, threshold);
  }
  extrude(pts2, depth, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, holes = [], mode = 'edge', bevel = 0) {
    const sh = new THREE.Shape(pts2.map(([a, b]) => new THREE.Vector2(a, b)));
    holes.forEach((h) => sh.holes.push(new THREE.Path(h.map(([a, b]) => new THREE.Vector2(a, b)))));
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.6, bevelSegments: 2, curveSegments: 12 });
    g.translate(0, 0, -depth / 2);
    return this.put(g, this.mat(x, y, z, rx, ry, rz), mode);
  }
  // explicit lines
  line(pts) { for (let i = 1; i < pts.length; i++) this.lines.push(pts[i - 1][0], pts[i - 1][1], pts[i - 1][2], pts[i][0], pts[i][1], pts[i][2]); return this; }
  seg(a, b) { this.lines.push(a[0], a[1], a[2], b[0], b[1], b[2]); return this; }
  ring(cx, cy, cz, r, n = 48, axis = 'y', a0 = 0, a1 = TAU, rz = r) {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n, c = Math.cos(a) * r, s = Math.sin(a) * rz;
      p.push(axis === 'y' ? [cx + c, cy, cz + s] : axis === 'z' ? [cx + c, cy + s, cz] : [cx, cy + c, cz + s]);
    }
    return this.line(p);
  }
  transformLines(m, from = 0) {
    const v = new THREE.Vector3();
    for (let i = from; i < this.lines.length; i += 3) {
      v.set(this.lines[i], this.lines[i + 1], this.lines[i + 2]).applyMatrix4(m);
      this.lines[i] = v.x; this.lines[i + 1] = v.y; this.lines[i + 2] = v.z;
    }
  }
  // merge another builder in with a transform
  include(other, m) {
    other.fill.forEach((g) => this.fill.push(m ? g.clone().applyMatrix4(m) : g));
    other.edges.forEach((g) => this.edges.push(m ? g.clone().applyMatrix4(m) : g));
    const start = this.lines.length;
    for (let i = 0; i < other.lines.length; i++) this.lines.push(other.lines[i]);
    if (m) this.transformLines(m, start);
    return this;
  }

  // Build a holographic object normalised to `height` (base at y=0, centred).
  build(o = {}) {
    // geometry is merged once and shared by every instance
    if (!this._geo) {
      const fillG = this.fill.length ? mergeGeometries(this.fill, false) : null;
      const edgeG = this.edges.length ? mergeGeometries(this.edges.map((g) => { const c = new THREE.BufferGeometry(); c.setAttribute('position', g.getAttribute('position')); return c; }), false) : null;
      const ea = edgeG ? edgeG.getAttribute('position').array : new Float32Array(0);
      const pos = new Float32Array(ea.length + this.lines.length);
      pos.set(ea, 0);
      pos.set(this.lines, ea.length);
      const lineG = new THREE.BufferGeometry();
      lineG.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      lineG.setAttribute('lineDistance', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1));
      lineG.computeBoundingBox();
      this._geo = { fillG, lineG, pos, edgeVerts: ea.length / 3 };
    }
    const { fillG, lineG, pos, edgeVerts } = this._geo;
    const bb = new THREE.Box3();
    if (fillG) { fillG.computeBoundingBox(); bb.copy(fillG.boundingBox); }
    bb.union(lineG.boundingBox);
    const size = bb.getSize(new THREE.Vector3());
    const scale = o.height ? o.height / size.y : o.scale || 1;
    const inner = new THREE.Group();
    inner.scale.setScalar(scale);
    if (!o.raw) inner.position.set(-(bb.min.x + bb.max.x) / 2 * scale, -bb.min.y * scale, -(bb.min.z + bb.max.z) / 2 * scale);
    const g = new THREE.Group();
    g.add(inner);
    g.mats = [];
    const color = o.color || C.cyan;
    if (fillG && o.fill !== false) {
      const m = fillMat({ color: o.fillColor || color, intensity: o.fillIntensity || 0.1, base: o.base == null ? 0.0 : o.base, fresnel: 0.5 });
      const mesh = new THREE.Mesh(fillG, m);
      inner.add(mesh);
      g.mats.push(m);
      g.mesh = mesh;
    }
    const lm = lineMat({ color: o.wireColor || color, intensity: o.wireIntensity || 1.5 });
    const segs = pos.length / 6;
    lm.uniforms.uOpacity.value = o.wireOpacity == null ? clamp(0.9 * Math.sqrt(5000 / Math.max(1, segs)), 0.12, 0.9) : o.wireOpacity;
    g.segs = segs;
    const ls = new THREE.LineSegments(lineG, lm);
    inner.add(ls);
    g.mats.push(lm);
    g.baseOps = g.mats.map((m) => m.uniforms.uOpacity.value);
    g.bb = bb;
    g.fitScale = scale;
    g.height = size.y * scale;
    g.width = size.x * scale;
    g.depth = size.z * scale;
    g.setOpacity = (a) => { g.mats.forEach((m, i) => (m.uniforms.uOpacity.value = g.baseOps[i] * a)); g.visible = a > 0.002; return g; };
    // print: 0..1 bottom to top (model space)
    g.setPrint = (f) => { const y = lerp(bb.min.y - 0.02 * size.y, bb.max.y + 0.02 * size.y, f); g.mats.forEach((m) => { m.uniforms.uReveal.value = y; m.uniforms.uEdge.value = size.y * 0.03; }); return g; };
    g.setColor = (c) => { g.mats.forEach((m) => m.uniforms.uColor.value.set(c)); return g; };
    g.setGlitch = (v) => { g.mats.forEach((m) => (m.uniforms.uGlitch.value = v)); return g; };
    g.inner = inner;
    g.lineG = lineG;
    g.edgeVerts = edgeVerts; // lineG holds feature edges first, then explicit lines (cables, lattice, rigging)
    g.fillG = fillG;
    // sample into a point cloud in the fitted frame
    g.sample = (n, seed = 1) => sampleModel(g, n, seed);
    return g;
  }
}

function sampleModel(g, n, seed) {
  const out = new Float32Array(n * 3);
  const R = rng(seed);
  const lp = g.lineG.getAttribute('position').array;
  // segment lengths
  const segs = lp.length / 6;
  let lineTotal = 0;
  const cum = new Float32Array(segs);
  for (let i = 0; i < segs; i++) {
    const k = i * 6;
    lineTotal += Math.hypot(lp[k + 3] - lp[k], lp[k + 4] - lp[k + 1], lp[k + 5] - lp[k + 2]);
    cum[i] = lineTotal;
  }
  const nLine = g.fillG ? Math.floor(n * 0.65) : n;
  const v = new THREE.Vector3();
  const s = g.inner.scale.x, o = g.inner.position;
  for (let i = 0; i < nLine; i++) {
    const t = R() * lineTotal;
    let lo = 0, hi = segs - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < t) lo = mid + 1; else hi = mid; }
    const k = lo * 6, u = R();
    out[i * 3] = lerp(lp[k], lp[k + 3], u) * s + o.x;
    out[i * 3 + 1] = lerp(lp[k + 1], lp[k + 4], u) * s + o.y;
    out[i * 3 + 2] = lerp(lp[k + 2], lp[k + 5], u) * s + o.z;
  }
  if (g.fillG && nLine < n) {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(g.fillG)).setRandomGenerator(R).build();
    for (let i = nLine; i < n; i++) {
      sampler.sample(v);
      out[i * 3] = v.x * s + o.x; out[i * 3 + 1] = v.y * s + o.y; out[i * 3 + 2] = v.z * s + o.z;
    }
  }
  return out;
}

// ---------- shared profile helpers ----------
// Fluted, tapered column with entasis; base at y=0.
export function flutedColumn(r0, r1, h, flutes = 20, seg = 60, hs = 10) {
  const g = new THREE.CylinderGeometry(1, 1, h, seg, hs, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x), t = (y + h / 2) / h;
    const r = lerp(r0, r1, t) * (1 + 0.025 * Math.sin(Math.PI * t));
    const f = flutes ? 1 - 0.045 * Math.pow(Math.abs(Math.sin((flutes * a) / 2)), 0.6) : 1;
    p.setXYZ(i, Math.cos(a) * r * f, y + h / 2, Math.sin(a) * r * f);
  }
  g.computeVertexNormals();
  return g;
}
// Column drawn as a draughtsman would: fill plus flute lines and rings.
export function columnLines(b, x, y, z, r0, r1, h, flutes = 20) {
  b.put(flutedColumn(r0, r1, h, flutes, 40, 4), b.mat(x, y, z), 'none');
  const n = flutes || 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, p = [];
    for (let k = 0; k <= 4; k++) { const t = k / 4, r = lerp(r0, r1, t) * (1 + 0.025 * Math.sin(Math.PI * t)); p.push([x + Math.cos(a) * r, y + t * h, z + Math.sin(a) * r]); }
    b.line(p);
  }
  for (const t of [0, 1]) b.ring(x, y + t * h, z, lerp(r0, r1, t), 24);
  return b;
}
// Pointed (gothic) arch outline, springing at y=0, width w, rise h
export function pointedArch(w, h, n = 12) {
  const r = (w * w / 4 + h * h) / w; // radius so that arcs meet at apex
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const cx = -w / 2 + r, a = Math.PI - Math.asin(clamp((i / n) * h / r));
    pts.push([cx + Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let i = n; i >= 0; i--) {
    const cx = w / 2 - r, a = Math.asin(clamp((i / n) * h / r));
    pts.push([cx + Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}
export function roundArch(w, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI - (i / n) * Math.PI; pts.push([Math.cos(a) * w / 2, Math.sin(a) * w / 2]); }
  return pts;
}
// helix points
export function helix(r, pitch, turns, n, x = 0, y = 0, z = 0, phase = 0) {
  const p = [];
  for (let i = 0; i <= n; i++) { const t = (i / n) * turns * TAU + phase; p.push([x + Math.cos(t) * r, y + (i / n) * turns * pitch, z + Math.sin(t) * r]); }
  return p;
}
