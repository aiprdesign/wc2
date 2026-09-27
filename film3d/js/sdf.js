/* THE INHERITANCE 3D — sculpting kit.
   Organic forms are written as signed distance fields (blended ellipsoids and
   tapered capsules), meshed with marching cubes, then drawn as a hologram:
   topographic contour lines over a fresnel skin, with a fine point cloud. */
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { fillMat, lineMat, pointsMat, C } from './holo.js';

// ---------- primitives ----------
export function cap(p, a, b, r0, r1 = r0) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
  const h = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  return Math.hypot(px - bx * h, py - by * h, pz - bz * h) - (r0 + (r1 - r0) * h);
}
export function ell(p, c, r) {
  const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2];
  const k0 = Math.hypot(x, y, z);
  const k1 = Math.hypot(x / r[0], y / r[1], z / r[2]);
  return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(...r);
}
export function sph(p, c, r) { return Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r; }
export function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
export function smax(a, b, k) { return -smin(-a, -b, k); }
// union of a list of distances with a blend radius
export function blend(ds, k) { let d = ds[0]; for (let i = 1; i < ds.length; i++) d = smin(d, ds[i], k); return d; }

// ---------- meshing ----------
const CACHE = new Map();
// fn(p) -> distance; box = [cx, cy, cz, half]; contours = [[axis, step], ...]
export function sculpt(key, fn, box, res = 80, contours = [[1, 0.05]]) {
  if (CACHE.has(key)) return CACHE.get(key);
  const [cx, cy, cz, S] = box;
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 400000);
  mc.isolation = 80;
  const f = mc.field, p = [0, 0, 0];
  const scale = 900 * (1 / S);
  for (let z = 0; z < res; z++) for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) {
    p[0] = cx + ((x / res) * 2 - 1) * S; p[1] = cy + ((y / res) * 2 - 1) * S; p[2] = cz + ((z / res) * 2 - 1) * S;
    f[x + y * res + z * res * res] = 80 - fn(p) * scale;
  }
  mc.update();
  const n = mc.count;
  const pos = mc.positionArray.slice(0, n * 3);
  for (let i = 0; i < n * 3; i += 3) { pos[i] = pos[i] * S + cx; pos[i + 1] = pos[i + 1] * S + cy; pos[i + 2] = pos[i + 2] * S + cz; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const lines = [];
  for (const [axis, step] of contours) {
    for (let i = 0; i < n; i += 3) {
      const v0 = i * 3, v1 = v0 + 3, v2 = v0 + 6;
      const a0 = pos[v0 + axis] / step, a1 = pos[v1 + axis] / step, a2 = pos[v2 + axis] / step;
      const lo = Math.floor(Math.min(a0, a1, a2)), hi = Math.floor(Math.max(a0, a1, a2));
      for (let L = lo + 1; L <= hi; L++) {
        const pts = [];
        const edge = (ia, ib, va, vb) => { if ((va - L) * (vb - L) < 0) { const t = (L - va) / (vb - va); pts.push(pos[ia] + (pos[ib] - pos[ia]) * t, pos[ia + 1] + (pos[ib + 1] - pos[ia + 1]) * t, pos[ia + 2] + (pos[ib + 2] - pos[ia + 2]) * t); } };
        edge(v0, v1, a0, a1); edge(v1, v2, a1, a2); edge(v2, v0, a2, a0);
        if (pts.length === 6) lines.push(...pts);
      }
    }
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  const out = { g, lg, count: n };
  CACHE.set(key, out);
  return out;
}

// A holographic object from a sculpt.
export function organic(sc, o = {}) {
  const color = o.color || C.cyan;
  const grp = new THREE.Group();
  const fm = fillMat({ color, intensity: o.fillIntensity || 0.45, base: 0.015, fresnel: 1.1, axis: 1 });
  const lm = lineMat({ color: o.lineColor || color, intensity: o.lineIntensity || 1.7, axis: 1 });
  lm.uniforms.uOpacity.value = o.lineOpacity || 0.6;
  const mats = [fm, lm];
  grp.add(new THREE.Mesh(sc.g, fm), new THREE.LineSegments(sc.lg, lm));
  if (o.points !== false) {
    const pp = sc.g.getAttribute('position').array, keep = [];
    const every = o.pointEvery || 9;
    for (let i = 0; i < pp.length; i += 3 * every) keep.push(pp[i], pp[i + 1], pp[i + 2]);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
    const sd = new Float32Array(keep.length / 3), R = rng(9);
    for (let i = 0; i < sd.length; i++) sd[i] = R();
    pg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
    const pm = pointsMat({ color, size: o.pointSize || 0.9, intensity: 1.8, max: 2.4, axis: 1 });
    pm.uniforms.uOpacity.value = 0.55;
    grp.add(new THREE.Points(pg, pm));
    mats.push(pm);
  }
  sc.g.computeBoundingBox();
  const bb = sc.g.boundingBox;
  const base = mats.map((m) => m.uniforms.uOpacity.value);
  grp.mats = mats;
  grp.setOpacity = (a) => { mats.forEach((m, i) => (m.uniforms.uOpacity.value = base[i] * a)); grp.visible = a > 0.002; return grp; };
  grp.setColor = (c) => { mats.forEach((m) => m.uniforms.uColor.value.set(c)); return grp; };
  grp.setGlitch = (v) => { mats.forEach((m) => (m.uniforms.uGlitch.value = v)); return grp; };
  grp.setReveal = (v) => { mats.forEach((m) => (m.uniforms.uReveal.value = v)); return grp; };
  grp.setPrint = (f) => { const y = lerp(bb.min.y - 0.05, bb.max.y + 0.05, f); mats.forEach((m) => { m.uniforms.uReveal.value = y; m.uniforms.uEdge.value = (bb.max.y - bb.min.y) * 0.03; }); return grp; };
  return grp;
}

// ---------- the human figure (classical proportions, 1.8 tall, feet at y=0) ----------
const POSES = {
  stand: { lArm: [0.12, 0], rArm: [0.12, 0], lFore: 0.1, rFore: 0.1, lLeg: 0, rLeg: 0, lKnee: 0, rKnee: 0, head: 0 },
  walkA: { lArm: [0.1, -0.45], rArm: [0.1, 0.45], lFore: 0.3, rFore: 0.2, lLeg: 0.4, rLeg: -0.35, lKnee: 0.05, rKnee: 0.45, head: 0 },
  walkB: { lArm: [0.1, 0.45], rArm: [0.1, -0.45], lFore: 0.2, rFore: 0.3, lLeg: -0.35, rLeg: 0.4, lKnee: 0.45, rKnee: 0.05, head: 0 },
  reach: { lArm: [0.15, 0.2], rArm: [0.2, 1.3], lFore: 0.3, rFore: 0.2, lLeg: 0.05, rLeg: -0.05, lKnee: 0, rKnee: 0, head: -0.25 },
  seated: { lArm: [0.2, 0.5], rArm: [0.2, 0.5], lFore: 0.9, rFore: 0.9, lLeg: 1.5, rLeg: 1.5, lKnee: 1.5, rKnee: 1.5, head: 0, seat: 1 },
  lift: { lArm: [0.3, 2.6], rArm: [0.15, 0.1], lFore: 0.1, rFore: 0.2, lLeg: 0, rLeg: 0, lKnee: 0, rKnee: 0, head: -0.35 },
};
// rotate a limb direction: down (0,-1,0), swung forward by fwd (about x) and out by out (about z)
function limbDir(out, fwd) { return [Math.sin(out) * Math.cos(fwd), -Math.cos(out) * Math.cos(fwd), Math.sin(fwd) * Math.cos(out)]; }
const add = (a, d, l) => [a[0] + d[0] * l, a[1] + d[1] * l, a[2] + d[2] * l];

function figureSDF(P) {
  const seat = P.seat || 0;
  const hipY = 0.95 - seat * 0.42;
  const parts = [];
  const hips = [0, hipY, 0];
  // legs
  const legs = [];
  for (const [s, a, k] of [[-1, P.lLeg, P.lKnee], [1, P.rLeg, P.rKnee]]) {
    const hip = [s * 0.1, hipY - 0.02, 0];
    const knee = add(hip, limbDir(s * 0.03, a), 0.46);
    const ank = add(knee, limbDir(s * 0.01, a - k), 0.44);
    const toe = add(ank, [0, -0.02, 1], 0.2);
    legs.push([hip, knee, ank, toe]);
  }
  const lean = P.head || 0;
  const chest = [0, hipY + 0.42, 0.02], neck = [0, hipY + 0.62, 0.0], head = [0, hipY + 0.78 + Math.sin(lean) * 0, Math.sin(-lean) * 0.03];
  const sh = [[-0.2, hipY + 0.55, 0], [0.2, hipY + 0.55, 0]];
  const arms = [];
  [[0, P.lArm, P.lFore], [1, P.rArm, P.rFore]].forEach(([i, [out, fwd], fore]) => {
    const s = i ? 1 : -1;
    const elbow = add(sh[i], limbDir(s * out, fwd), 0.3);
    const wrist = add(elbow, limbDir(s * out * 0.5, fwd + fore), 0.27);
    arms.push([sh[i], elbow, wrist]);
  });
  return (p) => {
    const ds = [
      ell(p, head, [0.095, 0.12, 0.11]),
      ell(p, [head[0], head[1] - 0.07, head[2] + 0.035], [0.07, 0.06, 0.07]),
      cap(p, neck, [head[0], head[1] - 0.05, head[2]], 0.055),
      ell(p, chest, [0.19, 0.17, 0.12]),
      ell(p, [0, hipY + 0.22, 0.01], [0.15, 0.16, 0.1]),
      ell(p, [0, hipY + 0.03, 0], [0.17, 0.11, 0.11]),
      cap(p, sh[0], sh[1], 0.075),
    ];
    for (const [a, b, c] of arms) { ds.push(cap(p, a, b, 0.06, 0.045)); ds.push(cap(p, b, c, 0.045, 0.034)); ds.push(ell(p, add(c, [0, -1, 0], 0.07), [0.035, 0.08, 0.05])); }
    for (const [a, b, c, d] of legs) { ds.push(cap(p, a, b, 0.085, 0.058)); ds.push(cap(p, b, c, 0.055, 0.037)); ds.push(cap(p, c, d, 0.04, 0.03)); }
    return blend(ds, 0.05);
  };
}
export function figureSculpt(pose = 'stand', res = 72) {
  return sculpt('fig:' + pose + ':' + res, figureSDF(POSES[pose]), [0, 0.95, 0.1, 1.05], res, [[1, 0.035], [0, 0.06]]);
}

// ---------- a classical head and shoulders, after Michelangelo's David ----------
function bustSDF() {
  const R = rng(1506);
  const curls = [];
  for (let i = 0; i < 70; i++) {
    const u = R() * 2 - 1, q = R() * TAU, s = Math.sqrt(1 - u * u);
    const dir = [Math.cos(q) * s, Math.abs(u) * 0.9 + 0.1, Math.sin(q) * s];
    if (dir[2] > 0.55 && dir[1] < 0.6) continue; // keep the face clear
    curls.push([[dir[0] * 0.93, 1.72 + dir[1] * 0.88, dir[2] * 0.95 - 0.08], 0.14 + R() * 0.06]);
  }
  return (p) => {
    let d = ell(p, [0, 1.72, -0.05], [0.8, 0.95, 0.92]); // cranium
    d = smin(d, ell(p, [0, 1.25, 0.2], [0.62, 0.62, 0.62]), 0.25); // face mass
    d = smin(d, ell(p, [0, 0.92, 0.35], [0.33, 0.25, 0.3]), 0.2); // chin
    d = smin(d, cap(p, [-0.45, 1.08, 0.1], [0, 0.82, 0.48], 0.14), 0.2); // jaw
    d = smin(d, cap(p, [0.45, 1.08, 0.1], [0, 0.82, 0.48], 0.14), 0.2);
    d = smin(d, cap(p, [-0.34, 1.62, 0.66], [0.34, 1.62, 0.66], 0.11), 0.1); // brow
    d = smin(d, cap(p, [0, 1.56, 0.78], [0, 1.2, 0.98], 0.06, 0.12), 0.08); // nose
    d = smin(d, sph(p, [0, 1.17, 0.95], 0.1), 0.06);
    for (const s of [-1, 1]) {
      d = smax(d, -sph(p, [s * 0.27, 1.47, 0.8], 0.14), 0.06); // eye sockets
      d = smin(d, ell(p, [s * 0.27, 1.46, 0.72], [0.1, 0.07, 0.08]), 0.03); // eyes
      d = smin(d, ell(p, [s * 0.44, 1.3, 0.5], [0.16, 0.14, 0.2]), 0.12); // cheekbones
      d = smin(d, ell(p, [s * 0.78, 1.42, -0.02], [0.08, 0.26, 0.17]), 0.06); // ears
    }
    d = smin(d, cap(p, [-0.17, 1.02, 0.83], [0.17, 1.02, 0.83], 0.055), 0.04); // lips
    d = smin(d, cap(p, [-0.15, 0.93, 0.8], [0.15, 0.93, 0.8], 0.05), 0.04);
    d = smax(d, -cap(p, [-0.2, 0.975, 0.9], [0.2, 0.975, 0.9], 0.018), 0.01);
    for (const [c, r] of curls) d = smin(d, sph(p, c, r), 0.05);
    d = smin(d, cap(p, [0, 0.95, -0.05], [0, 0.1, -0.02], 0.36), 0.2); // neck
    d = smin(d, cap(p, [0.2, 0.8, -0.1], [-0.25, -0.1, 0.05], 0.1), 0.15); // sternocleidomastoid
    d = smin(d, ell(p, [0, -0.35, 0], [1.35, 0.55, 0.62]), 0.35); // shoulders and chest
    d = smin(d, cap(p, [-1.2, -0.25, 0], [1.2, -0.25, 0], 0.4), 0.3);
    d = smax(d, -(p[1] + 0.85), 0.05); // cut flat as a bust
    return d;
  };
}
export function bustSculpt(res = 112) {
  return sculpt('bust:' + res, bustSDF(), [0, 1.0, 0.1, 1.85], res, [[1, 0.045]]);
}

// ---------- the heart ----------
function heartSDF() {
  return (p) => {
    let d = ell(p, [0.1, 0, 0], [0.75, 0.95, 0.65]); // left ventricle
    d = smin(d, ell(p, [-0.35, 0.1, 0.12], [0.6, 0.8, 0.55]), 0.25); // right ventricle
    d = smin(d, ell(p, [0.3, 0.75, -0.1], [0.45, 0.35, 0.4]), 0.2); // left atrium
    d = smin(d, ell(p, [-0.5, 0.7, 0], [0.4, 0.35, 0.4]), 0.2); // right atrium
    d = smin(d, cap(p, [0.05, 0.75, 0.05], [0.05, 1.5, 0.1], 0.2), 0.12); // aorta
    const arch = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; arch.push([0.05 + Math.cos(a) * -0.45 + 0.45, 1.5 + Math.sin(a) * 0.35, 0.1 - i * 0.03]); }
    for (let i = 0; i < 8; i++) d = smin(d, cap(p, arch[i], arch[i + 1], 0.18), 0.05);
    d = smin(d, cap(p, [0.85, 1.4, -0.14], [0.95, 0.3, -0.3], 0.16), 0.08); // descending aorta
    for (const x of [0.25, 0.5, 0.7]) d = smin(d, cap(p, [x, 1.65, 0], [x + 0.05, 2.1, 0.05], 0.06), 0.04); // arch branches
    d = smin(d, cap(p, [-0.3, 0.7, 0.3], [-0.45, 1.5, 0.35], 0.16), 0.1); // pulmonary trunk
    d = smin(d, cap(p, [-0.6, 0.9, 0], [-0.7, 1.7, -0.1], 0.14), 0.1); // vena cava
    // coronary vessels as surface ridges
    for (let i = 0; i < 6; i++) { const t = i / 5; d = smin(d, cap(p, [lerp(-0.2, 0.2, t), lerp(0.6, -0.8, t), 0.62 - t * 0.05], [lerp(-0.1, 0.3, t), lerp(0.4, -0.9, t), 0.6], 0.03), 0.02); }
    return d;
  };
}
export function heartSculpt(res = 90) {
  return sculpt('heart:' + res, heartSDF(), [0.1, 0.5, 0, 1.7], res, [[1, 0.06], [0, 0.09]]);
}
