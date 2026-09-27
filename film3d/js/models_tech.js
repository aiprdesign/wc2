/* THE INHERITANCE 3D — instruments, machines and vehicles, modelled procedurally. */
import * as THREE from 'three';
import { MB, flutedColumn, columnLines, pointedArch, roundArch, helix } from './mb.js';

const gearShape = (r, n, depth = 0.16) => gearPts(0, 0, r, n, depth, 0, n * 6).map(([x, y]) => [x, y]);
function gear(b, r, n, th, x, y, z, rx = 0, ry = 0, rz = 0, spokes = 4) {
  const hole = circlePts(0, 0, r * 0.12, 16).map(([a, c]) => [a, c]).reverse();
  b.extrude(gearShape(r, n), th, x, y, z, rx, ry, rz, [hole], 'edge');
  // spokes as lines in the gear plane
  const m = b.mat(x, y, z, rx, ry, rz);
  const v = new THREE.Vector3();
  for (let s = 0; s < spokes; s++) {
    const a = (s / spokes) * TAU;
    const p1 = v.set(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12, th / 2 + 0.001).applyMatrix4(m).toArray();
    const p2 = v.set(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, th / 2 + 0.001).applyMatrix4(m).toArray();
    b.seg(p1, p2);
  }
}

// ---------------------------------------------------------------- GUTENBERG'S PRESS (c. 1440)
export function press() {
  const b = new MB('Press');
  for (const x of [-0.75, 0.75]) b.box(0.22, 2.3, 0.3, x, 1.15, 0);
  b.box(1.9, 0.3, 0.4, 0, 2.25, 0);
  b.box(1.72, 0.18, 0.35, 0, 1.55, 0);
  b.box(1.72, 0.14, 0.35, 0, 0.95, 0);
  for (const x of [-0.75, 0.75]) { b.box(0.5, 0.12, 0.9, x, 0.06, 0); b.line([[x, 2.4, 0], [x * 0.6, 3.2, -0.6]]); }
  // the great screw
  b.line(helix(0.07, 0.06, 7, 140, 0, 1.12, 0));
  b.cyl(0.05, 0.05, 0.5, 12, 0, 1.35, 0, 0, 0, 0, 'wire');
  // bar, hose and platen
  b.cyl(0.02, 0.025, 0.9, 8, 0.45, 1.2, 0.2, 0, 0.4, Math.PI / 2, 'wire');
  b.box(0.18, 0.28, 0.18, 0, 1.0, 0);
  b.box(0.7, 0.06, 0.45, 0, 0.84, 0);
  // bed, rails and carriage running forward
  b.box(0.8, 0.08, 1.8, 0, 0.62, 0.5);
  for (const x of [-0.3, 0.3]) b.box(0.06, 0.06, 2.2, x, 0.55, 0.5);
  // type forme: rows of sorts
  for (let i = 0; i < 14; i++) for (let j = 0; j < 9; j++) b.box(0.03, 0.025, 0.04, -0.28 + i * 0.043, 0.68, 0.5 + j * 0.045, 0, 'edge');
  // tympan and frisket, hinged open
  b.box(0.62, 0.02, 0.5, 0, 0.95, 1.35, 0, 'edge', -1.1);
  b.box(0.62, 0.02, 0.5, 0, 1.25, 1.55, 0, 'edge', -1.6);
  return b;
}

// ---------------------------------------------------------------- STRADIVARI VIOLIN (1716)
export function violin() {
  const b = new MB('Violin');
  const half = [[0, 0], [5.2, 0.4], [8.6, 2.2], [10.3, 5.5], [10.3, 9.5], [9.1, 12.4], [6.3, 14.6], [5.3, 17.6], [6.1, 20.7], [7.6, 22.3], [8.3, 25.6], [7.9, 29.6], [6.2, 33], [3.4, 35], [0, 35.6]];
  const curve = new THREE.CatmullRomCurve3(half.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const pts = curve.getPoints(60).map((v) => [v.x, v.y]);
  const outline = [...pts, ...pts.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
  b.extrude(outline, 3.0, 0, 0, 0, 0, 0, 0, [], 'edge', 1.4);
  // purfling
  b.line(outline.map(([x, y]) => [x * 0.95, y * 0.985 + 0.25, 3.0]).concat([[outline[0][0] * 0.95, outline[0][1] * 0.985 + 0.25, 3.0]]));
  // f-holes
  for (const sx of [-1, 1]) {
    const f = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30; f.push([sx * (4.2 + Math.sin(t * Math.PI * 2) * 0.7 - t * 0.6), 11.5 + t * 8, 3.1]); }
    b.line(f);
    b.ring(sx * 4.3, 11.4, 3.1, 0.35, 12, 'z');
    b.ring(sx * 3.6, 19.6, 3.1, 0.35, 12, 'z');
  }
  // neck, fingerboard, pegbox, scroll
  b.box(2.4, 13, 2.2, 0, 42, 2.2);
  b.box(4.2, 27, 0.6, 0, 42, 3.9, 0, 'edge', 0.04);
  b.box(2.2, 7, 2.2, 0, 52, 2);
  const scroll = [];
  for (let i = 0; i <= 90; i++) { const t = i / 90, a = t * TAU * 2.5, r = 2.4 * (1 - t * 0.8); scroll.push([0, 57 + Math.sin(a) * r, 2 + Math.cos(a) * r]); }
  for (const dx of [-1.1, 1.1]) b.line(scroll.map(([x, y, z]) => [dx, y, z]));
  for (let i = 0; i < 4; i++) b.cyl(0.3, 0.25, 5.5, 8, (i % 2 ? 1 : -1) * 2.6, 49.5 + i * 1.5, 2, 0, 0, Math.PI / 2, 'wire');
  // bridge, tailpiece, strings
  b.extrude([[-2.1, 0], [2.1, 0], [1.8, 3.3], [-1.8, 3.3]], 0.35, 0, 17.8, 4.3, Math.PI / 2, 0, 0);
  b.extrude([[-2, 0], [2, 0], [1.1, 10.5], [-1.1, 10.5]], 0.5, 0, 1.2, 4.2);
  for (let i = 0; i < 4; i++) {
    const x0 = -0.8 + i * 0.53, xb = -1.5 + i * 1.0, xn = -0.6 + i * 0.4;
    b.line([[x0, 11.2, 4.6], [xb, 18.3, 7.6], [xn, 55.2, 4.6], [(i % 2 ? 1 : -1) * 0.4, 49.5 + i * 1.5, 2.8]]);
  }
  return b;
}

// ---------------------------------------------------------------- ORRERY (18th century)
export const ORRERY_PLANETS = [[1.5, 0.24, 0.12], [2.2, 0.62, 0.2], [3.0, 1.0, 0.22], [3.8, 1.88, 0.16], [5.0, 11.86, 0.45], [6.3, 29.46, 0.38]];
export function orrery() {
  const b = new MB('Orrery');
  // tripod stand and drum
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU, p = [];
    for (let k = 0; k <= 16; k++) { const t = k / 16; p.push([Math.cos(a) * (0.4 + t * 2.4), 1.6 - t * 1.6 + Math.sin(t * Math.PI) * 0.4, Math.sin(a) * (0.4 + t * 2.4)]); }
    b.line(p);
    b.line(p.map(([x, y, z]) => [x * 1.04, y + 0.08, z * 1.04]));
  }
  b.cyl(1.4, 1.5, 0.9, 48, 0, 2.0, 0, 0, 0, 0, 'edge');
  // gear train inside the drum
  [[0.9, 30], [0.6, 22], [0.75, 26], [0.45, 16]].forEach(([r, n], i) => gear(b, r, n, 0.06, 0, 1.7 + i * 0.12, 0, Math.PI / 2, 0, 0, 6));
  // ecliptic ring with zodiac graduations
  b.ring(0, 2.46, 0, 7.2, 180);
  b.ring(0, 2.46, 0, 7.5, 180);
  for (let i = 0; i < 360; i += 2) { const a = (i / 360) * TAU, r0 = i % 30 === 0 ? 6.9 : 7.2; b.seg([Math.cos(a) * r0, 2.47, Math.sin(a) * r0], [Math.cos(a) * 7.5, 2.47, Math.sin(a) * 7.5]); }
  b.cyl(0.12, 0.12, 1.2, 12, 0, 2.9, 0, 0, 0, 0, 'wire');
  return b;
}
// moving parts built separately so they can turn
export function orreryArm(i) {
  const [r, , s] = ORRERY_PLANETS[i];
  const b = new MB('arm' + i);
  const h = 2.6 + i * 0.12;
  b.cyl(0.03, 0.03, r, 6, r / 2, h, 0, 0, 0, Math.PI / 2, 'wire');
  b.cyl(0.02, 0.02, 0.6, 6, r, h + 0.3, 0, 0, 0, 0, 'wire');
  b.sphere(s, r, h + 0.6 + s, 0, 18, 12);
  if (i === 5) b.put(new THREE.TorusGeometry(s * 1.9, s * 0.25, 4, 48), b.mat(r, h + 0.6 + s, 0, 1.2, 0, 0.2), 'wire');
  if (i === 2) { b.cyl(0.01, 0.01, 0.5, 4, r + 0.25, h + 0.6 + s, 0, 0, 0, Math.PI / 2, 'wire'); b.sphere(0.07, r + 0.5, h + 0.6 + s, 0, 10, 8); }
  return b;
}

// ---------------------------------------------------------------- GALILEO'S TELESCOPE (1609)
export function galileoScope() {
  const b = new MB('Telescope');
  b.lathe([[0.19, 0], [0.2, 0.2], [0.24, 0.25], [0.24, 0.4], [0.2, 0.45], [0.22, 9.8], [0.3, 9.9], [0.3, 10.3], [0.25, 10.4], [0.01, 10.4]], 24, 0, 0, 0, 'edge', 20);
  for (let k = 1; k < 9; k++) b.ring(0, k * 1.1, 0, 0.215, 24);
  b.lathe([[0.1, -1.2], [0.12, 0], [0.19, 0.01]], 16);
  const m = new THREE.Matrix4().makeRotationZ(-1.0).setPosition(0, 4, 0);
  b.fill.forEach((g) => g.applyMatrix4(m));
  b.edges.forEach((g) => g.applyMatrix4(m));
  b.transformLines(m);
  // the stand
  b.cyl(0.08, 0.1, 4.5, 12, 0.2, 2.25, 0, 0, 0, 0, 'wire');
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; b.seg([0.2, 0.6, 0], [0.2 + Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6]); }
  b.sphere(0.25, 0.2, 4.4, 0, 12, 8);
  return b;
}

// ---------------------------------------------------------------- HOOKE'S MICROSCOPE (1665)
export function microscope() {
  const b = new MB('Microscope');
  const tube = [[0.18, 0], [0.22, 0.2], [0.34, 0.3], [0.36, 1.2], [0.42, 1.3], [0.42, 1.5], [0.36, 1.6], [0.4, 3.2], [0.48, 3.3], [0.48, 3.5], [0.3, 3.6], [0.22, 4.2], [0.26, 4.3], [0.1, 4.5]];
  b.lathe(tube, 24, 0, 0, 0, 'edge', 15);
  for (let k = 0; k < 14; k++) b.ring(0, 1.7 + k * 0.1, 0, 0.385, 24);
  const m = new THREE.Matrix4().makeRotationZ(0.35).setPosition(0.4, 1.4, 0);
  b.fill.forEach((g) => g.applyMatrix4(m));
  b.edges.forEach((g) => g.applyMatrix4(m));
  b.transformLines(m);
  b.box(0.18, 3.8, 0.18, 1.3, 1.9, 0);
  b.sphere(0.2, 1.3, 3.1, 0, 10, 8);
  b.seg([1.3, 3.1, 0], [0.7, 3.4, 0]);
  b.cyl(0.9, 1.0, 0.25, 32, 0.8, 0.12, 0);
  b.cyl(0.3, 0.3, 0.12, 24, 0.15, 1.2, 0);
  // the lamp and water-flask condenser
  b.sphere(0.45, -1.4, 1.6, 0, 18, 12);
  b.cyl(0.06, 0.06, 1.4, 8, -1.4, 0.7, 0, 0, 0, 0, 'wire');
  b.lathe([[0.3, 0], [0.32, 0.3], [0.15, 0.5], [0.05, 0.8]], 16, -2.4, 0.25, 0);
  return b;
}

// ---------------------------------------------------------------- WATT'S ENGINE (1776–1788)
export function wattEngine() {
  const b = new MB('Watt engine');
  // engine house wall and entablature
  b.box(0.8, 9, 5, -1, 4.5, 0, 0, 'edge');
  // cylinder and valve chest
  b.cyl(0.9, 0.9, 3.4, 32, -4.5, 3.2, 0, 0, 0, 0, 'edge', false, 1);
  for (const y of [1.5, 3.2, 4.9]) b.ring(-4.5, y, 0, 0.95, 32);
  b.box(0.5, 3, 0.5, -3.3, 3.2, 0);
  b.cyl(0.5, 0.5, 1.4, 20, -4.5, 0.7, 1.6, 0, 0, 0, 'edge');
  // flywheel and governor frame
  b.box(0.4, 4.2, 0.4, 5.2, 2.1, -0.9);
  b.box(0.4, 4.2, 0.4, 5.2, 2.1, 0.9);
  b.box(1, 0.2, 2.4, 5.2, 4.2, 0);
  // governor shaft
  b.cyl(0.04, 0.04, 2.2, 8, 2.8, 5.2, 1.2, 0, 0, 0, 'wire');
  b.box(0.6, 0.1, 0.6, 2.8, 4.1, 1.2);
  return b;
}
export function wattBeam() {
  const b = new MB('beam');
  b.box(9.2, 0.55, 0.4, 0, 0, 0, 0, 'edge');
  for (let i = -8; i <= 8; i++) b.seg([i * 0.52, -0.27, 0.21], [i * 0.52 + 0.26, 0.27, 0.21]);
  b.cyl(0.25, 0.25, 0.6, 16, 0, 0, 0, Math.PI / 2, 0, 0);
  return b;
}
export function wattFlywheel() {
  const b = new MB('flywheel');
  b.put(new THREE.TorusGeometry(2.5, 0.18, 8, 64), b.mat(0, 0, 0), 'edge', 20);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; b.seg([Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0], [Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0]); b.seg([Math.cos(a + 0.05) * 0.3, Math.sin(a + 0.05) * 0.3, 0.08], [Math.cos(a + 0.02) * 2.4, Math.sin(a + 0.02) * 2.4, 0.08]); }
  b.cyl(0.35, 0.35, 0.5, 16, 0, 0, 0, Math.PI / 2, 0, 0);
  gear(b, 0.6, 20, 0.12, 0, 0, 0.4);
  return b;
}
export function governor() {
  const b = new MB('governor');
  for (const s of [-1, 1]) {
    b.seg([0, 1.0, 0], [s * 0.55, 0.35, 0]);
    b.seg([0, 0.2, 0], [s * 0.3, 0.6, 0]);
    b.sphere(0.16, s * 0.6, 0.3, 0, 12, 8);
  }
  return b;
}

// ---------------------------------------------------------------- STEPHENSON'S ROCKET (1829)
export function rocketLoco() {
  const b = new MB('Rocket');
  b.cyl(0.5, 0.5, 1.9, 32, 0, 1.25, 0.1, Math.PI / 2, 0, 0, 'edge', false);
  for (let k = 0; k < 5; k++) b.ring(0, 1.25, -0.8 + k * 0.45, 0.52, 32, 'z');
  // chimney
  b.lathe([[0.17, 0], [0.17, 2.1], [0.26, 2.25], [0.26, 2.32]], 20, 0, 1.6, 1.0, 'edge');
  // firebox at the rear
  b.box(0.95, 1.0, 0.7, 0, 1.2, -1.15);
  b.lathe([[0.001, 0], [0.45, 0], [0.48, 0.2], [0.001, 0.38]], 16, 0, 1.7, -1.15, 'wire');
  // driving wheels with spokes
  for (const x of [-0.62, 0.62]) {
    b.put(new THREE.TorusGeometry(0.71, 0.04, 6, 48), b.mat(x, 0.72, 0.55, 0, Math.PI / 2, 0), 'edge', 30);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; b.seg([x, 0.72, 0.55], [x, 0.72 + Math.sin(a) * 0.68, 0.55 + Math.cos(a) * 0.68]); }
    b.put(new THREE.TorusGeometry(0.38, 0.03, 6, 32), b.mat(x, 0.4, -1.15, 0, Math.PI / 2, 0), 'edge', 30);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; b.seg([x, 0.4, -1.15], [x, 0.4 + Math.sin(a) * 0.36, -1.15 + Math.cos(a) * 0.36]); }
    // inclined cylinder and connecting rod
    b.cyl(0.11, 0.11, 0.8, 16, x * 1.12, 1.25, -0.55, 0.62, 0, 0, 'edge');
    b.seg([x * 1.14, 1.0, -0.2], [x * 1.14, 0.95, 0.5]);
  }
  // frame and tender with its water barrel
  b.box(1.2, 0.12, 2.6, 0, 0.55, -0.2);
  b.box(1.3, 0.1, 1.7, 0, 0.55, -2.6);
  b.cyl(0.42, 0.42, 1.4, 24, 0, 1.05, -2.6, Math.PI / 2, 0, 0, 'edge');
  for (const x of [-0.6, 0.6]) for (const z of [-2.1, -3.1]) b.put(new THREE.TorusGeometry(0.33, 0.03, 6, 28), b.mat(x, 0.33, z, 0, Math.PI / 2, 0), 'edge', 30);
  return b;
}

// ---------------------------------------------------------------- BROOKLYN BRIDGE (1869–1883)
export function brooklyn() {
  const b = new MB('Brooklyn Bridge');
  const S = 486.3 / 2, side = 283, TH = 84, DY = 41;
  // two masonry towers with twin gothic arches
  for (const tx of [-S, S]) {
    const holes = [-9.5, 9.5].map((ax) => pointedArch(10.4, 13, 10).map(([u, v]) => [ax + u, v + 46]).concat([[ax + 5.2, DY + 1], [ax - 5.2, DY + 1]]));
    const outline = [[-20, 0], [20, 0], [20, TH - 6], [18, TH - 4], [18, TH], [-18, TH], [-18, TH - 4], [-20, TH - 6]];
    b.extrude(outline, 16, tx, 0, 0, 0, Math.PI / 2, 0, holes.map((h) => h.slice().reverse()), 'edge');
    for (let k = 1; k < 7; k++) b.ring(tx, k * 12, 0, 8.3, 4, 'y', Math.PI / 4, Math.PI / 4 + TAU, 20.5);
  }
  // four main cables with suspenders, and the diagonal stays
  const zc = [-10, -4, 4, 10];
  const cableY = (x) => {
    if (Math.abs(x) <= S) return DY + 6 + (TH - DY - 8) * Math.pow(x / S, 2);
    const t = (Math.abs(x) - S) / side;
    return TH - 2 - t * (TH - DY - 10);
  };
  for (const z of zc) {
    const pts = [];
    for (let i = 0; i <= 200; i++) { const x = lerp(-S - side, S + side, i / 200); pts.push([x, cableY(x), z]); }
    b.line(pts);
    for (let x = -S - side + 6; x < S + side; x += 6) if (Math.abs(Math.abs(x) - S) > 8) b.seg([x, cableY(x), z], [x, DY, z]);
    for (const tx of [-S, S]) for (let k = 1; k <= 18; k++) {
      for (const dir of [-1, 1]) b.seg([tx, TH - 4, z], [tx + dir * k * 8, DY, z * 0.95]);
    }
  }
  // deck truss
  for (const z of [-12, 0, 12]) {
    b.seg([-S - side, DY, z], [S + side, DY, z]);
    b.seg([-S - side, DY - 5, z], [S + side, DY - 5, z]);
    for (let x = -S - side; x <= S + side; x += 6) { b.seg([x, DY, z], [x, DY - 5, z]); b.seg([x, DY, z], [x + 6, DY - 5, z]); }
  }
  for (let x = -S - side; x <= S + side; x += 12) b.seg([x, DY, -12], [x, DY, 12]);
  b.box(2 * (S + side) + 10, 0.8, 26, 0, DY, 0, 0, 'none');
  // anchorages
  for (const sx of [-1, 1]) b.box(40, 28, 36, sx * (S + side + 20), 14, 0);
  return b;
}

// ---------------------------------------------------------------- EIFFEL TOWER (1889)
export function eiffel() {
  const b = new MB('Eiffel Tower');
  const leg = (y) => (y < 115 ? lerp(56, 17, Math.pow(y / 115, 0.8)) : 0);
  const shaftHalf = (y) => (y < 115 ? 0 : y < 276 ? lerp(17, 5, Math.pow((y - 115) / 161, 0.75)) : lerp(5, 2.5, (y - 276) / 24));
  const legHalf = (y) => lerp(7.5, 4.5, y / 115);
  const Y = [0, 6, 12, 18, 24, 30, 36, 42, 48, 57.6, 64, 70, 76, 82, 88, 94, 100, 106, 115.7];
  // four legs, each a square lattice column
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const corners = (y) => { const c = leg(y), h = legHalf(y); return [[sx * c - h, sz * c - h], [sx * c + h, sz * c - h], [sx * c + h, sz * c + h], [sx * c - h, sz * c + h]]; };
    for (let k = 0; k < 4; k++) b.line(Y.map((y) => { const p = corners(y)[k]; return [p[0], y, p[1]]; }));
    for (let i = 0; i < Y.length - 1; i++) {
      const a = corners(Y[i]), c = corners(Y[i + 1]);
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4;
        b.seg([a[k][0], Y[i], a[k][1]], [c[k2][0], Y[i + 1], c[k2][1]]);
        b.seg([a[k2][0], Y[i], a[k2][1]], [c[k][0], Y[i + 1], c[k][1]]);
        b.seg([a[k][0], Y[i], a[k][1]], [a[k2][0], Y[i], a[k2][1]]);
      }
    }
  }
  // the decorative arches between the legs
  for (let f = 0; f < 4; f++) {
    const rot = (f * Math.PI) / 2, p = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, x = lerp(-44, 44, t), y = 39 + Math.sin(t * Math.PI) * 14; p.push([x, y, 44]); }
    const c = Math.cos(rot), s = Math.sin(rot);
    b.line(p.map(([x, y, z]) => [x * c - z * s, y, x * s + z * c]));
    b.line(p.map(([x, y, z]) => [x * c - (z + 2) * s, y - 2.5, x * s + (z + 2) * c]));
  }
  // platforms
  b.box(70, 4, 70, 0, 59.6, 0, 0, 'edge');
  for (let i = -35; i <= 35; i += 3.5) for (const s of [-1, 1]) { b.seg([i, 61.6, s * 35], [i, 63, s * 35]); b.seg([s * 35, 61.6, i], [s * 35, 63, i]); }
  b.box(40, 3, 40, 0, 117, 0, 0, 'edge');
  // the upper shaft
  const Y2 = []; for (let y = 115.7; y <= 300; y += 7) Y2.push(y);
  const sc = (y) => { const h = shaftHalf(y); return [[-h, -h], [h, -h], [h, h], [-h, h]]; };
  for (let k = 0; k < 4; k++) b.line(Y2.map((y) => { const p = sc(y)[k]; return [p[0], y, p[1]]; }));
  for (let i = 0; i < Y2.length - 1; i++) {
    const a = sc(Y2[i]), c = sc(Y2[i + 1]);
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; b.seg([a[k][0], Y2[i], a[k][1]], [c[k2][0], Y2[i + 1], c[k2][1]]); b.seg([a[k2][0], Y2[i], a[k2][1]], [c[k][0], Y2[i + 1], c[k][1]]); b.seg([a[k][0], Y2[i], a[k][1]], [a[k2][0], Y2[i], a[k2][1]]); }
  }
  b.box(16, 5, 16, 0, 278, 0, 0, 'edge');
  b.cyl(0.6, 1.4, 24, 8, 0, 312, 0, 0, 0, 0, 'wire');
  return b;
}

// ---------------------------------------------------------------- WRIGHT FLYER (1903)
export function wrightFlyer() {
  const b = new MB('Wright Flyer');
  const span = 12.3, chord = 1.98, gap = 1.83;
  const rib = (z, y) => { const p = []; for (let i = 0; i <= 12; i++) { const t = i / 12; p.push([lerp(chord * 0.5, -chord * 0.5, t), y + Math.sin(t * Math.PI) * 0.1 * (1 - t * 0.3), z]); } return p; };
  for (const y of [0.6, 0.6 + gap]) {
    for (let i = 0; i <= 38; i++) { const z = lerp(-span / 2, span / 2, i / 38); b.line(rib(z, y)); }
    b.seg([chord * 0.5, y, -span / 2], [chord * 0.5, y, span / 2]);
    b.seg([-chord * 0.5, y, -span / 2], [-chord * 0.5, y, span / 2]);
    b.box(chord, 0.01, span, 0, y + 0.05, 0, 0, 'none');
  }
  // struts and wire bracing
  for (let i = 0; i <= 8; i++) {
    const z = lerp(-span / 2 + 0.2, span / 2 - 0.2, i / 8);
    for (const x of [chord * 0.45, -chord * 0.45]) b.seg([x, 0.6, z], [x, 0.6 + gap, z]);
    if (i < 8) {
      const z2 = lerp(-span / 2 + 0.2, span / 2 - 0.2, (i + 1) / 8);
      for (const x of [chord * 0.45, -chord * 0.45]) { b.seg([x, 0.6, z], [x, 0.6 + gap, z2]); b.seg([x, 0.6 + gap, z], [x, 0.6, z2]); }
    }
  }
  // forward elevator (canard)
  for (const y of [0.9, 1.6]) { b.box(0.8, 0.01, 4.4, 3.2, y, 0, 0, 'edge'); for (let i = 0; i <= 10; i++) b.seg([2.8, y, -2.2 + i * 0.44], [3.6, y + 0.04, -2.2 + i * 0.44]); }
  b.seg([0.99, 0.6, -0.5], [3.2, 0.9, -0.3]); b.seg([0.99, 0.6, 0.5], [3.2, 0.9, 0.3]);
  b.seg([0.99, 2.43, -0.5], [3.2, 1.6, -0.3]); b.seg([0.99, 2.43, 0.5], [3.2, 1.6, 0.3]);
  // twin rudders aft
  for (const z of [-0.3, 0.3]) b.box(0.6, 1.8, 0.01, -3.2, 1.5, z, 0, 'edge');
  for (const y of [0.6, 2.43]) { b.seg([-0.99, y, -0.4], [-3.0, y - (y > 1 ? 0.4 : -0.3), 0]); b.seg([-0.99, y, 0.4], [-3.0, y - (y > 1 ? 0.4 : -0.3), 0]); }
  // engine, chains and the two pusher propellers
  b.box(0.5, 0.4, 0.6, 0.1, 0.85, 0.7);
  for (const z of [-1.2, 1.2]) {
    b.box(0.08, 2.6, 0.22, -1.25, 1.5, z, 0, 'edge', 0, 0.2);
    b.seg([0.1, 0.85, 0.7], [-1.25, 1.5, z]);
  }
  b.box(0.6, 0.12, 0.25, 0.3, 0.72, -0.4);
  // skids
  for (const z of [-0.5, 0.5]) { const p = []; for (let i = 0; i <= 16; i++) { const t = i / 16; p.push([lerp(-1.2, 3.4, t), 0.05 + Math.pow(Math.max(0, t - 0.7) / 0.3, 2) * 0.8, z]); } b.line(p); }
  return b;
}

// ---------------------------------------------------------------- SANTA MARÍA (1492)
export function caravel() {
  const b = new MB('Santa Maria');
  const L = 19, BM = 5.6, D = 3.2;
  // lofted hull
  const NU = 40, NV = 10, pos = [], idx = [];
  const halfB = (x) => { const t = x / (L / 2); return (BM / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), t > 0 ? 2.2 : 3.2)), 0.5); };
  const sheer = (x) => 0.35 * Math.pow(x / (L / 2), 2) * (x > 0 ? 1.2 : 1.6);
  for (let i = 0; i <= NU; i++) {
    const x = lerp(-L / 2, L / 2, i / NU);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV; // 0 keel .. 1 deck, going around one side
      const y = -D + D * v + sheer(x) * v;
      const w = halfB(x) * Math.pow(Math.sin((v * Math.PI) / 2), 0.55);
      pos.push(x, y, w);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, c = a + NV + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  const side = new THREE.BufferGeometry();
  side.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  side.setIndex(idx);
  side.computeVertexNormals();
  b.put(side, null, 'wire');
  b.put(side.clone(), new THREE.Matrix4().makeScale(1, 1, -1), 'wire');
  // castles
  b.box(4.5, 2.2, 4.8, -L / 2 + 2.6, 1.5, 0);
  b.box(3, 1.4, 4.2, -L / 2 + 2.0, 3.3, 0);
  b.extrude([[0, -2], [3.2, 0], [0, 2]], 1.6, L / 2 - 3.2, 1.3, 0, Math.PI / 2, 0, 0);
  // masts, yards, sails
  const masts = [[L / 2 - 4, 13, 0], [0.5, 22, 0], [-L / 2 + 3, 12, 0]];
  masts.forEach(([x, h], k) => {
    b.cyl(0.14, 0.24, h, 10, x, h / 2 - 0.5, 0, 0, 0, 0, 'wire');
    if (k < 2) {
      const yards = k === 1 ? [[h * 0.52, 8.5], [h * 0.82, 5]] : [[h * 0.55, 6]];
      yards.forEach(([yy, w], j) => {
        b.cyl(0.08, 0.08, w, 8, x, yy, 0, Math.PI / 2, 0, 0, 'wire');
        // billowing square sail
        const sh = j === 0 ? yy * 0.55 : yy - yards[0][0] - 0.8;
        const g = new THREE.PlaneGeometry(w * 0.95, sh, 10, 8);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (w * 0.5), v = p.getY(i) / (sh * 0.5); p.setZ(i, (1 - u * u) * (1 - v * v * 0.6) * 1.1); }
        g.computeVertexNormals();
        b.put(g, b.mat(x + 0.25, yy - sh / 2, 0, 0, Math.PI / 2, 0), 'wire');
        if (k === 1 && j === 0) { b.seg([x + 1.5, yy - sh * 0.8, 0], [x + 1.5, yy - sh * 0.2, 0]); b.seg([x + 1.5, yy - sh * 0.5, -1.5], [x + 1.5, yy - sh * 0.5, 1.5]); }
      });
      b.cyl(0.5, 0.35, 0.9, 10, x, h * 0.9, 0, 0, 0, 0, 'wire');
    } else {
      b.cyl(0.07, 0.07, 9, 8, x, h * 0.6, 0, 0, 0, 0.7, 'wire');
      b.extrude([[0, 0], [5.5, 4.5], [0, 7]], 0.02, x - 0.2, h * 0.3, 0, 0, Math.PI / 2, 0.1);
    }
    // shrouds and ratlines
    for (const s of [-1, 1]) for (let r = 0; r < 5; r++) {
      const bx = x - 1.2 + r * 0.6;
      b.seg([x, h * 0.88, 0], [bx, 0.8, s * 2.7]);
    }
    for (const s of [-1, 1]) for (let q = 1; q < 10; q++) { const t = q / 10; b.seg([lerp(x - 1.2, x, t), lerp(0.8, h * 0.88, t), s * lerp(2.7, 0, t)], [lerp(x + 1.2, x, t), lerp(0.8, h * 0.88, t), s * lerp(2.7, 0, t)]); }
  });
  // bowsprit and stays
  b.cyl(0.1, 0.12, 7, 8, L / 2 + 1.5, 2.2, 0, 0, 0, -1.2, 'wire');
  b.seg([L / 2 + 4.5, 3.6, 0], [masts[0][0], masts[0][1] * 0.88, 0]);
  b.seg([masts[0][0], masts[0][1] * 0.88, 0], [masts[1][0], masts[1][1] * 0.88, 0]);
  b.seg([masts[1][0], masts[1][1] * 0.88, 0], [masts[2][0], masts[2][1] * 0.8, 0]);
  return b;
}

// ---------------------------------------------------------------- SATURN V (1967)
export function saturnV(withTower = false) {
  const b = new MB('Saturn V');
  const r1 = 5.05, r3 = 3.3;
  const stage = (r, y0, h, ribs = 36) => {
    b.cyl(r, r, h, 48, 0, y0 + h / 2, 0, 0, 0, 0, 'edge', true, 1);
    for (let i = 0; i < ribs; i++) { const a = (i / ribs) * TAU; b.seg([Math.cos(a) * r * 1.002, y0, Math.sin(a) * r * 1.002], [Math.cos(a) * r * 1.002, y0 + h, Math.sin(a) * r * 1.002]); }
    for (let k = 0; k <= 4; k++) b.ring(0, y0 + (h * k) / 4, 0, r * 1.004, 48);
  };
  // five F-1 engines
  const bell = []; for (let i = 0; i <= 12; i++) { const t = i / 12; bell.push([lerp(1.85, 0.5, Math.pow(t, 0.6)), -5.8 + t * 5.8]); }
  [[0, 0], [2.6, 2.6], [-2.6, 2.6], [2.6, -2.6], [-2.6, -2.6]].forEach(([x, z]) => b.lathe(bell, 24, x * 0.8, 5.8, z * 0.8, 'wire', 1));
  stage(r1, 5.8, 42);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    b.extrude([[0, 0], [3.8, -1.5], [3.8, 3.5], [0, 8]], 0.3, Math.cos(a) * r1, 5.8, Math.sin(a) * r1, 0, -a, 0);
    b.lathe([[1.2, 0], [1.1, 4], [0.4, 7]], 16, Math.cos(a) * (r1 + 0.6), 3.5, Math.sin(a) * (r1 + 0.6), 'wire');
  }
  b.cyl(r1, r1, 5.5, 48, 0, 47.8 + 2.75, 0, 0, 0, 0, 'edge', true);
  stage(r1, 53.3, 24.9);
  b.cyl(r3, r1, 5.5, 48, 0, 78.2 + 2.75, 0, 0, 0, 0, 'wire', true, 2);
  stage(r3, 83.7, 17.8, 24);
  b.cyl(r3, r3, 0.9, 48, 0, 101.9, 0, 0, 0, 0, 'edge', true);
  b.cyl(1.95, r3, 8.5, 32, 0, 106.6, 0, 0, 0, 0, 'wire', true, 3);
  b.cyl(1.95, 1.95, 3.8, 32, 0, 112.7, 0, 0, 0, 0, 'edge', true);
  b.lathe([[1.95, 0], [1.6, 1.2], [0.5, 3.2], [0.1, 3.5]], 32, 0, 114.6, 0, 'wire', 1);
  // launch escape tower
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + Math.PI / 4; b.seg([Math.cos(a) * 0.5, 118.1, Math.sin(a) * 0.5], [Math.cos(a) * 0.25, 121.5, Math.sin(a) * 0.25]); }
  for (let y = 118.4; y < 121.4; y += 0.6) b.ring(0, y, 0, lerp(0.5, 0.25, (y - 118.1) / 3.4), 4, 'y', Math.PI / 4, Math.PI / 4 + TAU);
  b.cyl(0.3, 0.3, 4.5, 12, 0, 123.8, 0, 0, 0, 0, 'edge');
  b.cyl(0, 0.3, 1.2, 12, 0, 126.6, 0);
  if (withTower) {
    const tx = 18;
    for (const dx of [-6, 6]) for (const dz of [-6, 6]) b.seg([tx + dx, 0, dz], [tx + dx, 120, dz]);
    for (let y = 0; y <= 120; y += 6) {
      b.ring(tx, y, 0, 6 * 1.414, 4, 'y', Math.PI / 4, Math.PI / 4 + TAU);
      for (const [a, c] of [[[-6, -6], [6, -6]], [[6, -6], [6, 6]], [[6, 6], [-6, 6]], [[-6, 6], [-6, -6]]]) b.seg([tx + a[0], y, a[1]], [tx + c[0], y + 6, c[1]]);
    }
    for (const y of [40, 62, 84, 104]) { b.seg([tx - 6, y, -2], [r1 + 0.5, y, -2]); b.seg([tx - 6, y, 2], [r1 + 0.5, y, 2]); }
  }
  return b;
}

// ---------------------------------------------------------------- DNA (1953)
export function dna(bp = 44) {
  const b = new MB('DNA');
  const r = 1, rise = 0.34, per = 10.5, n = bp;
  const A = [], B2 = [];
  for (let i = 0; i <= n * 4; i++) {
    const t = i / 4, a = (t / per) * TAU;
    A.push([Math.cos(a) * r, t * rise, Math.sin(a) * r]);
    B2.push([Math.cos(a + 2.4) * r, t * rise, Math.sin(a + 2.4) * r]);
  }
  b.line(A); b.line(B2);
  b.line(A.map(([x, y, z]) => [x * 1.08, y, z * 1.08]));
  b.line(B2.map(([x, y, z]) => [x * 1.08, y, z * 1.08]));
  for (let i = 0; i < n; i++) {
    const a = (i / per) * TAU, y = i * rise;
    const p = [Math.cos(a) * r, y, Math.sin(a) * r], q = [Math.cos(a + 2.4) * r, y, Math.sin(a + 2.4) * r];
    const m = [(p[0] + q[0]) / 2, y, (p[2] + q[2]) / 2];
    b.seg(p, m); b.seg(m, q);
    b.put(new THREE.OctahedronGeometry(0.09), b.mat(...p), 'wire');
    b.put(new THREE.OctahedronGeometry(0.09), b.mat(...q), 'wire');
  }
  return b;
}

// ---------------------------------------------------------------- MICROPROCESSOR (1971 onward)
export function chip() {
  const b = new MB('Microprocessor');
  b.box(10, 0.4, 10, 0, 0.2, 0);
  for (let i = 0; i < 40; i++) {
    const t = -4.6 + (i / 39) * 9.2;
    for (const s of [-1, 1]) { b.line([[t, 0.2, s * 5], [t, 0.2, s * 5.6], [t, -0.4, s * 5.8]]); b.line([[s * 5, 0.2, t], [s * 5.6, 0.2, t], [s * 5.8, -0.4, t]]); }
  }
  b.box(5, 0.1, 5, 0, 0.45, 0);
  // functional blocks and routed traces on the die
  const R = rng(71);
  for (let i = 0; i < 26; i++) { const w = 0.4 + R() * 1.2, d = 0.4 + R() * 1.2; b.box(w, 0.06, d, -2.1 + R() * 4.2, 0.53, -2.1 + R() * 4.2, 0, 'edge'); }
  for (let i = 0; i < 160; i++) {
    let x = -2.4 + R() * 4.8, z = -2.4 + R() * 4.8;
    const p = [[x, 0.52, z]];
    for (let k = 0; k < 4; k++) { if (k % 2) x = clamp(x + (R() - 0.5) * 2, -2.45, 2.45); else z = clamp(z + (R() - 0.5) * 2, -2.45, 2.45); p.push([x, 0.52, z]); }
    b.line(p);
  }
  // bond wires
  for (let i = 0; i < 40; i++) {
    const t = -2.2 + (i / 39) * 4.4;
    for (const s of [-1, 1]) { b.line([[t, 0.5, s * 2.5], [t, 1.0, s * 3.2], [t * 1.6, 0.4, s * 4.4]]); b.line([[s * 2.5, 0.5, t], [s * 3.2, 1.0, t], [s * 4.4, 0.4, t * 1.6]]); }
  }
  return b;
}

// ---------------------------------------------------------------- ANTIKYTHERA MECHANISM (c. 100 BC)
export function antikythera() {
  const b = new MB('Antikythera');
  b.box(3.4, 1.9, 0.9, 0, 0, 0, 0, 'edge');
  const R = rng(2);
  const gs = [[0.8, 223, 0, 0.1], [0.55, 64, 0.9, 0.35], [0.4, 38, -0.95, -0.4], [0.33, 32, 0.6, -0.6], [0.28, 24, -0.5, 0.55], [0.22, 20, 1.2, -0.2], [0.3, 27, -1.25, 0.4], [0.18, 15, 0.2, 0.7], [0.42, 50, 1.3, 0.55], [0.26, 22, -0.2, -0.65]];
  gs.forEach(([r, n, x, y], i) => gear(b, r, Math.min(n, 60), 0.05, x, y, -0.3 + (i % 3) * 0.2, 0, 0, 0, 4));
  // front dial: zodiac and Egyptian calendar rings
  for (const r of [0.85, 0.78, 0.7, 0.6]) b.ring(0, 0, 0.46, r, 96, 'z');
  for (let i = 0; i < 365; i += 5) { const a = (i / 365) * TAU; b.seg([Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.46], [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0.46]); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; b.seg([Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.46], [Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.46]); }
  // back dial: the Metonic spiral
  const sp = []; for (let i = 0; i <= 300; i++) { const t = i / 300, a = t * TAU * 5; sp.push([Math.cos(a) * (0.2 + t * 0.6), 0.3 + Math.sin(a) * (0.2 + t * 0.6) * 0.8, -0.46]); }
  b.line(sp);
  return b;
}

// ---------------------------------------------------------------- small pieces for the chain
export function stoneBlock() {
  const b = new MB('Stone');
  const g = new THREE.BoxGeometry(3, 1.6, 1.8, 6, 4, 4);
  const p = g.attributes.position, R = rng(3);
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + (R() - 0.5) * 0.08, p.getY(i) + (R() - 0.5) * 0.08, p.getZ(i) + (R() - 0.5) * 0.08);
  b.put(g, null, 'wire');
  for (let i = 0; i < 6; i++) b.seg([-1.5 + i * 0.1, 0.8, 0.9], [-1.1 + i * 0.1, -0.8, 0.9]);
  return b;
}
export function column() {
  const b = new MB('Column');
  columnLines(b, 0, 0.6, 0, 0.95, 0.74, 10.4);
  b.lathe([[0.74, 0], [0.9, 0.12], [1.05, 0.28], [1.08, 0.36]], 24, 0, 11, 0);
  b.box(2.2, 0.32, 2.2, 0, 11.5, 0);
  b.box(2.6, 0.6, 2.6, 0, 0.3, 0);
  return b;
}
export function triumphalArch() {
  const b = new MB('Arch');
  const holes = [roundArch(5.4, 16).map(([u, v]) => [u, v + 7]).concat([[2.7, 0.01], [-2.7, 0.01]]).reverse()];
  b.extrude([[-8, 0], [8, 0], [8, 15], [-8, 15]], 5, 0, 0, 0, 0, 0, 0, holes);
  for (const x of [-6.2, -3.6, 3.6, 6.2]) b.cyl(0.35, 0.4, 11, 16, x, 5.5, 2.8, 0, 0, 0, 'wire');
  b.box(17, 1.2, 6, 0, 15.6, 0);
  b.box(12, 4, 5, 0, 18.2, 0);
  return b;
}
export function openBook() {
  const b = new MB('Book');
  for (const s of [-1, 1]) {
    for (let k = 0; k < 8; k++) {
      const g = new THREE.PlaneGeometry(3, 4, 12, 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 1.5, y = p.getY(i); p.setXYZ(i, s * x, Math.sin((x / 3) * Math.PI * 0.9) * 0.35 + 0.3 - k * 0.03, y); }
      b.put(g, null, k === 0 ? 'edge' : 'lines');
    }
  }
  b.box(6.4, 0.12, 4.3, 0, 0, 0);
  return b;
}
export function paintingFrame() {
  const b = new MB('Painting');
  const o = [[-4.6, -3.6], [4.6, -3.6], [4.6, 3.6], [-4.6, 3.6]], i = [[-3.9, -2.9], [-3.9, 2.9], [3.9, 2.9], [3.9, -2.9]];
  b.extrude(o, 0.5, 0, 3.6, 0, 0, 0, 0, [i], 'edge', 0.2);
  b.put(new THREE.PlaneGeometry(7.8, 5.8, 16, 12), b.mat(0, 3.6, -0.1), 'wire');
  // a Renaissance landscape: hills, a road, a horizon
  b.line([[-3.9, 2.4, 0], [-2, 3.4, 0], [-0.6, 2.8, 0], [1.2, 4.2, 0], [3.9, 3.0, 0]]);
  b.line([[-0.2, 0.8, 0], [0.4, 2.8, 0], [0.9, 0.8, 0]]);
  b.ring(2.4, 5.2, 0, 0.6, 24, 'z');
  for (const [x, y] of [[-4.6, 0], [4.6, 0], [-4.6, 7.2], [4.6, 7.2]]) b.sphere(0.4, x, y, 0.2, 10, 8);
  return b;
}
export function teslaCoil() {
  const b = new MB('Coil');
  b.cyl(1.4, 1.6, 0.6, 32, 0, 0.3, 0);
  b.line(helix(0.7, 0.05, 80, 2400, 0, 0.8, 0));
  b.cyl(0.7, 0.7, 4.2, 24, 0, 2.9, 0, 0, 0, 0, 'edge', true);
  b.put(new THREE.TorusGeometry(1.4, 0.45, 12, 40), b.mat(0, 5.6, 0, Math.PI / 2, 0, 0), 'wire');
  b.line(helix(1.8, 0.2, 3, 60, 0, 0.6, 0));
  return b;
}
export function networkGlobe() {
  const b = new MB('Network');
  for (let k = -3; k <= 3; k++) b.ring(0, Math.sin((k / 4) * (Math.PI / 2)) * 5, 0, Math.cos((k / 4) * (Math.PI / 2)) * 5, 64);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI; const p = []; for (let j = 0; j <= 48; j++) { const q = (j / 48) * TAU; p.push([Math.cos(q) * Math.cos(a) * 5, Math.sin(q) * 5, Math.cos(q) * Math.sin(a) * 5]); } b.line(p); }
  const R = rng(4), nodes = [];
  for (let i = 0; i < 40; i++) { const u = R() * 2 - 1, q = R() * TAU, s = Math.sqrt(1 - u * u); nodes.push(new THREE.Vector3(Math.cos(q) * s * 5, u * 5, Math.sin(q) * s * 5)); }
  for (let i = 0; i < 60; i++) {
    const a = nodes[Math.floor(R() * 40)], c = nodes[Math.floor(R() * 40)];
    const mid = a.clone().add(c).multiplyScalar(0.5).normalize().multiplyScalar(5 + a.distanceTo(c) * 0.35);
    b.line(new THREE.QuadraticBezierCurve3(a, mid, c).getPoints(20).map((v) => v.toArray()));
  }
  nodes.forEach((n) => b.put(new THREE.OctahedronGeometry(0.15), b.mat(n.x, n.y, n.z), 'wire'));
  return b;
}
export function equation() {
  const b = new MB('Equation');
  // E = mc², drawn as stroked glyphs in 3D
  const E = [[0, 0], [0, 3], [2, 3]], E2 = [[0, 1.5], [1.6, 1.5]], E3 = [[0, 0], [2, 0]];
  const G = (pts, dx) => b.line(pts.map(([x, y]) => [x + dx, y, 0]));
  G(E, -6.5); G(E2, -6.5); G(E3, -6.5);
  G([[-3.8, 1.9], [-2.2, 1.9]], 0); G([[-3.8, 1.1], [-2.2, 1.1]], 0);
  G([[0, 0], [0, 2], [0.2, 2.2], [0.7, 2.2], [0.9, 2], [0.9, 0]], -1.0); G([[0.9, 2], [1.1, 2.2], [1.6, 2.2], [1.8, 2], [1.8, 0]], -1.0);
  const cc = []; for (let i = 0; i <= 20; i++) { const a = 0.6 + (i / 20) * (TAU - 1.2); cc.push([1.9 + Math.cos(a) * 1.0, 1.1 + Math.sin(a) * 1.1]); }
  G(cc, 0.6);
  G([[3.4, 2.9], [3.7, 3.3], [4.1, 3.3], [4.2, 3.0], [3.4, 2.3], [4.3, 2.3]], 0);
  for (let d = 0; d < 3; d++) { b.transformLines(new THREE.Matrix4(), 0); }
  const n = b.lines.length;
  const copy = b.lines.slice();
  for (let i = 0; i < n; i += 3) b.lines.push(copy[i], copy[i + 1], copy[i + 2] - 0.4);
  return b;
}
// Vitruvian man, after Leonardo (c. 1490)
export function vitruvian() {
  const b = new MB('Vitruvian');
  b.ring(0, 0.9, 0, 1.0, 96, 'z');
  b.line([[-0.82, -0.02, 0], [0.82, -0.02, 0], [0.82, 1.62, 0], [-0.82, 1.62, 0], [-0.82, -0.02, 0]]);
  const body = (armA, legA, z) => {
    b.cyl(0.13, 0.11, 0.55, 8, 0, 1.12, z, 0, 0, 0, 'wire');
    b.sphere(0.1, 0, 1.5, z, 10, 8);
    for (const s of [-1, 1]) {
      const ax = Math.cos(armA) * 0.75, ay = Math.sin(armA) * 0.75;
      b.cyl(0.035, 0.03, 0.75, 6, s * (0.15 + ax / 2), 1.33 + ay / 2, z, 0, 0, s * (Math.PI / 2 - armA), 'wire');
      const lx = Math.sin(legA) * 0.85, ly = Math.cos(legA) * 0.85;
      b.cyl(0.055, 0.04, 0.85, 6, s * (0.08 + lx / 2), 0.85 - ly / 2, z, 0, 0, s * legA, 'wire');
    }
  };
  body(0, 0.02, 0);
  body(0.45, 0.33, 0.02);
  return b;
}

export function saturnVTower() {
  const full = saturnV(true), rocketOnly = saturnV(false);
  // keep only the tower lines: those in the full model beyond the rocket's line count
  const b = new MB('LUT');
  b.lines = full.lines.slice(rocketOnly.lines.length);
  return b;
}
