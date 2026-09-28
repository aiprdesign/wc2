/* THE INHERITANCE 3D — architecture, modelled procedurally at real proportions (metres). */
import * as THREE from 'three';
import { MB, flutedColumn, columnLines, pointedArch, roundArch } from './mb.js';

// ---------------------------------------------------------------- PARTHENON (447–432 BC)
export function parthenon() {
  const b = new MB('Parthenon');
  const W = 30.9, L = 69.5;
  // krepidoma: three steps
  for (let i = 0; i < 3; i++) b.box(W + (3 - i) * 1.4, 0.55, L + (3 - i) * 1.4, 0, 0.275 + i * 0.55, 0);
  const base = 1.65, H = 10.43;
  const ech = [[0.74, 0], [0.9, 0.12], [1.05, 0.28], [1.08, 0.36]];
  const nx = 8, nz = 17;
  const xs = Array.from({ length: nx }, (_, i) => lerp(-W / 2 + 1.25, W / 2 - 1.25, i / (nx - 1)));
  const zs = Array.from({ length: nz }, (_, i) => lerp(-L / 2 + 1.25, L / 2 - 1.25, i / (nz - 1)));
  const place = (x, z) => {
    columnLines(b, x, base, z, 0.95, 0.74, H);
    b.lathe(ech, 24, x, base + H, z);
    b.box(2.2, 0.32, 2.2, x, base + H + 0.52, z);
  };
  xs.forEach((x) => { place(x, zs[0]); place(x, zs[nz - 1]); });
  zs.slice(1, -1).forEach((z) => { place(xs[0], z); place(xs[nx - 1], z); });
  // pronaos and opisthodomos (6 each)
  for (let i = 0; i < 6; i++) {
    const x = lerp(-W / 2 + 5.2, W / 2 - 5.2, i / 5);
    for (const z of [L / 2 - 6.2, -L / 2 + 6.2]) {
      columnLines(b, x, base + 0.6, z, 0.85, 0.66, H - 0.6);
      b.box(1.9, 0.3, 1.9, x, base + H + 0.15, z);
    }
  }
  const top = base + H + 0.68;
  // entablature: architrave, frieze with triglyphs, cornice
  b.box(W - 0.4, 1.35, L - 0.4, 0, top + 0.675, 0);
  b.box(W - 0.3, 1.35, L - 0.3, 0, top + 2.03, 0, 0, 'none');
  const fy = top + 2.03;
  const trig = (x, z, ry) => b.box(0.84, 1.3, 0.14, x, fy, z, ry);
  const spX = (W - 2.5) / 14, spZ = (L - 2.5) / 32;
  for (let i = 0; i <= 14; i++) { const x = -W / 2 + 1.25 + i * spX; trig(x, L / 2 - 0.1, 0); trig(x, -L / 2 + 0.1, 0); }
  for (let i = 0; i <= 32; i++) { const z = -L / 2 + 1.25 + i * spZ; trig(W / 2 - 0.1, z, Math.PI / 2); trig(-W / 2 + 0.1, z, Math.PI / 2); }
  // metope frames on the frieze (lines)
  for (let i = 0; i < 14; i++) {
    const x = -W / 2 + 1.25 + (i + 0.5) * spX;
    for (const z of [L / 2 - 0.12, -L / 2 + 0.12]) b.line([[x - 0.5, fy - 0.55, z], [x + 0.5, fy - 0.55, z], [x + 0.5, fy + 0.55, z], [x - 0.5, fy - 0.55, z]]);
  }
  const cy = top + 3.0;
  b.box(W + 0.8, 0.6, L + 0.8, 0, cy, 0);
  // pediments and roof
  const ph = 3.45;
  for (const z of [L / 2 + 0.3, -L / 2 - 0.3]) {
    b.extrude([[-W / 2 - 0.4, 0], [W / 2 + 0.4, 0], [0, ph]], 1.0, 0, cy + 0.3, z - Math.sign(z) * 0.5);
    // tympanum figures, as a frieze of silhouettes
    for (let i = -6; i <= 6; i++) {
      const hgt = ph * 0.8 * (1 - Math.abs(i) / 7);
      if (hgt < 0.4) continue;
      b.line([[i * 1.9, cy + 0.35, z], [i * 1.9 - 0.2, cy + 0.35 + hgt * 0.55, z], [i * 1.9, cy + 0.35 + hgt, z], [i * 1.9 + 0.25, cy + 0.35 + hgt * 0.5, z], [i * 1.9, cy + 0.35, z]]);
    }
    // acroteria
    b.box(0.6, 1.2, 0.3, 0, cy + ph + 0.8, z);
    b.box(0.5, 0.9, 0.3, W / 2, cy + 0.9, z);
    b.box(0.5, 0.9, 0.3, -W / 2, cy + 0.9, z);
  }
  const slope = Math.atan2(ph, W / 2);
  const rl = Math.hypot(W / 2 + 0.6, ph);
  for (const sx of [-1, 1]) {
    b.box(rl, 0.25, L + 0.6, sx * (W / 4 + 0.15), cy + 0.3 + ph / 2, 0, 0, 'edge', 0, -sx * slope);
    // tile ridges
    for (let i = 0; i <= 70; i++) {
      const z = -L / 2 - 0.3 + (i / 70) * (L + 0.6);
      b.seg([0, cy + 0.45 + ph, z], [sx * (W / 2 + 0.5), cy + 0.45, z]);
    }
  }
  // the cella and its door
  b.box(21.7, H + 1, 48, 0, base + (H + 1) / 2, -1, 0, 'edge');
  b.line([[-2.4, base, 23.01], [-2.4, base + 9.8, 23.01], [2.4, base + 9.8, 23.01], [2.4, base, 23.01]]);
  // Athena Parthenos, a tall figure in the naos
  b.cyl(0.9, 1.6, 9, 12, 0, base + 5.7, -4, 0, 0, 0, 'wire');
  b.sphere(0.8, 0, base + 11, -4, 10, 8);
  return b;
}

// ---------------------------------------------------------------- PANTHEON (c. AD 126)
export function pantheon() {
  const b = new MB('Pantheon');
  const R = 22.2;
  b.cyl(R, R, 22, 64, 0, 11, 0, 0, 0, 0, 'edge', true, 3);
  for (const y of [7.5, 14.5, 22]) b.ring(0, y, 0, R + 0.25, 96);
  // stepped rings then the dome
  const prof = [];
  for (let i = 0; i < 6; i++) { prof.push([R - i * 0.9, 22 + i * 1.3]); prof.push([R - (i + 1) * 0.9, 22 + i * 1.3]); }
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    prof.push([lerp(R - 5.4, 4.5, 1 - Math.cos(t * Math.PI / 2)), 29.8 + 13.5 * Math.sin(t * Math.PI / 2)]);
  }
  b.lathe(prof, 64, 0, 0, 0, 'edge', 10);
  b.ring(0, prof[prof.length - 1][1], 0, 4.5, 48);
  // the coffers, seen through the shell: 5 rings of 28
  const Ri = 21.4, cyI = 22;
  for (let k = 0; k < 5; k++) {
    const a0 = (k / 5) * 1.05 + 0.05, a1 = a0 + 0.17;
    for (let j = 0; j < 28; j++) {
      const q0 = (j / 28) * TAU + 0.03, q1 = q0 + TAU / 28 - 0.06;
      const P = (a, q, r = Ri) => [Math.cos(a) * Math.cos(q) * r, cyI + Math.sin(a) * r, Math.cos(a) * Math.sin(q) * r];
      b.line([P(a0, q0), P(a0, q1), P(a1, q1), P(a1, q0), P(a0, q0)]);
      const m = 0.25, qa = lerp(q0, q1, m), qb = lerp(q0, q1, 1 - m), aa = lerp(a0, a1, m), ab = lerp(a0, a1, 1 - m);
      b.line([P(aa, qa, Ri - 0.5), P(aa, qb, Ri - 0.5), P(ab, qb, Ri - 0.5), P(ab, qa, Ri - 0.5), P(aa, qa, Ri - 0.5)]);
    }
  }
  // intermediate block and portico
  b.box(34, 22, 8, 0, 11, R + 2);
  b.extrude([[-17, 0], [17, 0], [0, 5.5]], 1, 0, 22, R + 5.5);
  const cz = [R + 14, R + 10.5, R + 7];
  const col = flutedColumn(0.75, 0.64, 11.8, 0, 24, 4);
  for (let i = 0; i < 8; i++) {
    const x = lerp(-15.5, 15.5, i / 7);
    const rows = i === 0 || i === 7 || i === 2 || i === 5 ? cz : [cz[0]];
    rows.forEach((z) => {
      columnLines(b, x, 0.9, z, 0.75, 0.64, 11.8, 0);
      b.lathe([[0.64, 0], [0.9, 0.8], [1.0, 1.4]], 16, x, 12.7, z);
      b.box(2.1, 0.3, 2.1, x, 14.25, z);
    });
  }
  b.box(34, 0.9, 16, 0, 0.45, R + 10);
  b.box(34, 2.4, 9, 0, 15.6, R + 10.5);
  b.extrude([[-17.4, 0], [17.4, 0], [0, 5]], 1.2, 0, 16.8, R + 14.6);
  b.line([[-17.4, 16.8, R + 11], [0, 21.8, R + 11], [17.4, 16.8, R + 11]]);
  return b;
}

// ---------------------------------------------------------------- COLOSSEUM (AD 80)
export function colosseum() {
  const b = new MB('Colosseum');
  const A = 94, B = 78, N = 80;
  const levels = [[0, 10.5], [10.5, 11.8], [22.3, 11.6]];
  const P = (q, a = A, bb = B) => [Math.cos(q) * a, Math.sin(q) * bb];
  // outer wall: every bay of every storey is a pier-and-arch panel cut through the wall
  for (const [y0, h] of levels) {
    for (let i = 0; i < N; i++) {
      const q = (i / N) * TAU, q2 = ((i + 1) / N) * TAU, qm = (q + q2) / 2;
      const [x1, z1] = P(q), [x2, z2] = P(q2), [xm, zm] = P(qm);
      const tx = x2 - x1, tz = z2 - z1, len = Math.hypot(tx, tz), L = len * 0.51;
      const w = len * 0.6, sp = h * 0.52;
      const arc = [];
      for (let k = 0; k <= 10; k++) { const a = Math.PI - (k / 10) * Math.PI; arc.push([Math.cos(a) * w / 2, sp + Math.sin(a) * w / 2]); }
      b.extrude([[-L, 0], [-w / 2, 0], ...arc, [w / 2, 0], [L, 0], [L, h - 1.3], [-L, h - 1.3]], 2.6, xm, y0, zm, 0, Math.atan2(-tz, tx), 0, [], 'edge');
      // engaged half column on the pier
      const [xc, zc] = P(q, A + 1.3, B + 1.3);
      b.cyl(0.62, 0.7, h - 1.3, 8, xc, y0 + (h - 1.3) / 2, zc);
    }
    // entablature band over each storey
    b.put(new THREE.CylinderGeometry(1, 1, 1.3, 160, 1, true), b.mat(0, y0 + h - 0.65, 0, 0, 0, 0, A + 1.6, 1, B + 1.6), 'edge');
  }
  // attic storey with its windows and corbels
  b.put(new THREE.CylinderGeometry(1, 1, 14.5, 160, 1, true), b.mat(0, 34 + 7.25, 0, 0, 0, 0, A, 1, B), 'edge');
  b.put(new THREE.CylinderGeometry(1, 1, 1, 160, 1, true), b.mat(0, 48, 0, 0, 0, 0, A + 1.2, 1, B + 1.2), 'edge');
  for (let i = 0; i < N; i++) {
    const q = ((i + 0.5) / N) * TAU, [x, z] = P(q);
    if (i % 2 === 0) b.line([[x * 1.005, 38, z * 1.005], [x * 1.005, 40.4, z * 1.005]]);
    b.seg([x * 1.01, 45.5, z * 1.01], [x * 1.03, 46.5, z * 1.03]);
  }
  // cavea: stepped seating down to the arena
  const prof = [[40, 0], [40, 4]];
  for (let k = 0; k < 12; k++) {
    const r0 = lerp(44, A - 4, k / 12), r1 = lerp(44, A - 4, (k + 1) / 12), y = lerp(4, 40, (k + 1) / 12);
    prof.push([r0, y], [r1, y]);
  }
  prof.push([A - 1, 40], [A - 1, 0]);
  b.lathe(prof, 96, 0, 0, 0, 'edge', 30);
  b.fill[b.fill.length - 1].scale(1, 1, B / A);
  b.edges[b.edges.length - 1].scale(1, 1, B / A);
  // arena floor and the hypogeum walls
  b.cyl(43, 43, 0.4, 64, 0, 0.2, 0, 0, 0, 0, 'edge');
  b.fill[b.fill.length - 1].scale(1, 1, 27 / 43);
  b.edges[b.edges.length - 1].scale(1, 1, 27 / 43);
  for (let i = -6; i <= 6; i++) b.seg([i * 5, 0.45, -18], [i * 5, 0.45, 18]);
  return b;
}

// ---------------------------------------------------------------- NOTRE-DAME DE PARIS (1163–1345)
export function notreDame() {
  const b = new MB('Notre-Dame');
  const tw = 14.5;
  // towers
  for (const sx of [-1, 1]) {
    const x = sx * 13.3;
    b.box(tw, 69, tw, x, 34.5, 0, 0, 'edge');
    for (const dx of [-tw / 2 + 0.6, tw / 2 - 0.6]) b.box(1.2, 44, 1.6, x + dx, 22, tw / 2 + 0.4);
    // belfry lancets, two per face
    for (const f of [0, 1, 2, 3]) {
      const ang = (f * Math.PI) / 2;
      for (const off of [-3, 3]) {
        const arch = pointedArch(4, 5).map(([u, v]) => [u + off, v + 58]);
        const pts = [[off - 2, 46, 0], ...arch.map(([u, v]) => [u, v, 0]), [off + 2, 46, 0], [off - 2, 46, 0]];
        const m = new THREE.Matrix4().makeRotationY(ang).setPosition(x, 0, 0);
        const v3 = new THREE.Vector3();
        b.line(pts.map(([px, py]) => { v3.set(px, py, tw / 2 + 0.05).applyMatrix4(m); return [v3.x, v3.y, v3.z]; }));
      }
    }
    // balustrade and pinnacles
    for (let i = 0; i < 9; i++) b.seg([x - tw / 2 + i * (tw / 8), 69, tw / 2], [x - tw / 2 + i * (tw / 8), 70.4, tw / 2]);
    b.ring(x, 70.4, 0, tw / 2 * 1.41, 4, 'y', Math.PI / 4, Math.PI / 4 + TAU);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) b.cyl(0, 0.6, 3, 6, x + dx * (tw / 2 - 0.5), 71, dz * (tw / 2 - 0.5));
  }
  // centre block of the west front
  b.box(12.1, 45, tw - 2, 0, 22.5, -1);
  // portals: three pointed doors with archivolts
  for (const [x, w] of [[-13.3, 7], [0, 8], [13.3, 7]]) {
    for (let k = 0; k < 6; k++) {
      const s = 1 - k * 0.1;
      const arch = pointedArch(w * s, w * 0.7 * s, 14).map(([u, v]) => [x + u, 7 + v, tw / 2 + 0.5 - k * 0.25]);
      b.line([[x - (w * s) / 2, 0, tw / 2 + 0.5 - k * 0.25], ...arch, [x + (w * s) / 2, 0, tw / 2 + 0.5 - k * 0.25]]);
    }
    b.line([[x, 0, tw / 2 + 0.6], [x, 7, tw / 2 + 0.6]]);
  }
  // gallery of kings: 28 niches
  for (let i = 0; i < 28; i++) {
    const x = -19 + i * (38 / 27);
    const a = pointedArch(1.1, 1.0, 6).map(([u, v]) => [x + u, 19.6 + v, tw / 2 + 0.2]);
    b.line([[x - 0.55, 17, tw / 2 + 0.2], ...a, [x + 0.55, 17, tw / 2 + 0.2]]);
    b.line([[x, 17.2, tw / 2 + 0.25], [x, 18.9, tw / 2 + 0.25]]);
  }
  b.seg([-20, 16.8, tw / 2 + 0.3], [20, 16.8, tw / 2 + 0.3]);
  b.seg([-20, 21.4, tw / 2 + 0.3], [20, 21.4, tw / 2 + 0.3]);
  // the west rose, with tracery
  const rose = (cx, cy, cz, r, axis = 'z') => {
    const V = (u, v) => (axis === 'z' ? [cx + u, cy + v, cz] : [cx, cy + v, cz + u]);
    for (const k of [1, 0.93, 0.62, 0.3, 0.12]) { const p = []; for (let i = 0; i <= 72; i++) { const a = (i / 72) * TAU; p.push(V(Math.cos(a) * r * k, Math.sin(a) * r * k)); } b.line(p); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; b.line([V(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12), V(Math.cos(a) * r * 0.93, Math.sin(a) * r * 0.93)]); }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, p = [];
      for (let j = 0; j <= 16; j++) { const q = (j / 16) * TAU; p.push(V(Math.cos(a) * r * 0.46 + Math.cos(q) * r * 0.12, Math.sin(a) * r * 0.46 + Math.sin(q) * r * 0.12)); }
      b.line(p);
      const p2 = [];
      for (let j = 0; j <= 16; j++) { const q = (j / 16) * TAU; p2.push(V(Math.cos(a + 0.26) * r * 0.78 + Math.cos(q) * r * 0.1, Math.sin(a + 0.26) * r * 0.78 + Math.sin(q) * r * 0.1)); }
      b.line(p2);
    }
  };
  rose(0, 31, tw / 2 - 0.4, 6.5);
  // grand gallery of colonnettes
  for (let i = 0; i < 40; i++) { const x = -20 + i; b.seg([x, 40, tw / 2 + 0.2], [x, 44, tw / 2 + 0.2]); }
  // nave, choir and roof
  const NL = 110, NW = 13, NH = 33;
  b.box(NW, NH, NL, 0, NH / 2, -tw / 2 - NL / 2);
  b.box(NW + 14, 16, NL, 0, 8, -tw / 2 - NL / 2, 0, 'edge');
  b.extrude([[-NW / 2 - 0.5, 0], [NW / 2 + 0.5, 0], [0, 10]], NL, 0, NH, -tw / 2 - NL / 2, 0, 0, 0, [], 'edge');
  // clerestory lancets and flying buttresses
  for (let i = 0; i < 14; i++) {
    const z = -tw / 2 - 5 - i * 7.5;
    if (i === 7) continue;
    for (const sx of [-1, 1]) {
      const wx = sx * (NW / 2 + 0.05);
      const a = pointedArch(3, 3.2, 8).map(([u, v]) => [wx, 23 + v, z + u]);
      b.line([[wx, 18, z - 1.5], ...a, [wx, 18, z + 1.5], [wx, 18, z - 1.5]]);
      const px = sx * (NW / 2 + 13);
      b.box(1.6, 26, 2.2, px, 13, z);
      b.cyl(0, 0.9, 5, 6, px, 28.5, z);
      const fly = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16; fly.push([lerp(px, sx * NW / 2, t), 25 + Math.sin(t * Math.PI * 0.5) * 3 + t * 1.5, z]); }
      b.line(fly);
      b.line(fly.map(([x, y, zz]) => [x, y - 1.2, zz]));
    }
  }
  // transept with its roses
  const tz = -tw / 2 - 58;
  b.box(48, NH, 13, 0, NH / 2, tz);
  b.extrude([[-6.5, 0], [6.5, 0], [0, 10]], 48, 0, NH, tz, 0, Math.PI / 2, 0);
  rose(24.1, 22, tz, 6.5, 'x');
  rose(-24.1, 22, tz, 6.5, 'x');
  // apse
  b.cyl(NW / 2, NW / 2, NH, 24, 0, NH / 2, -tw / 2 - NL, 0, 0, 0, 'edge', true);
  for (let i = 0; i < 9; i++) {
    const q = Math.PI + (i / 8) * Math.PI, px = Math.cos(q) * 20, pz = -tw / 2 - NL + Math.sin(q) * -20;
    b.box(1.4, 24, 1.4, px, 12, pz);
    b.line([[px, 24, pz], [Math.cos(q) * NW / 2, 28, -tw / 2 - NL - Math.sin(q) * NW / 2]]);
  }
  // the spire over the crossing
  b.cyl(0, 4.2, 45, 8, 0, NH + 10 + 22.5, tz, 0, Math.PI / 8, 0, 'wire', false, 9);
  b.cyl(4.6, 4.6, 6, 8, 0, NH + 13, tz);
  return b;
}

// ---------------------------------------------------------------- BRUNELLESCHI'S DOME (1420–1436)
export function duomo() {
  const b = new MB('Duomo');
  const R = 22.5, D0 = 13;
  // octagonal drum with oculi
  b.cyl(R, R, D0, 8, 0, D0 / 2, 0, 0, Math.PI / 8, 0, 'edge');
  for (let f = 0; f < 8; f++) {
    const a = (f + 0.5) * (TAU / 8) + Math.PI / 8 - TAU / 16;
    const n = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const rr = R * Math.cos(TAU / 16) + 0.05;
    const p = [];
    for (let i = 0; i <= 32; i++) { const q = (i / 32) * TAU; const t = new THREE.Vector3(-n.z, 0, n.x); p.push([n.x * rr + t.x * Math.cos(q) * 2.2, 7 + Math.sin(q) * 2.2, n.z * rr + t.z * Math.cos(q) * 2.2]); }
    b.line(p);
  }
  // the pointed-fifth dome: eight sails
  const H = 34, prof = [];
  const rc = 1.6 * R; // the "pointed fifth": arcs struck from four-fifths of the span
  for (let i = 0; i <= 24; i++) {
    const y = (i / 24) * H;
    prof.push([Math.max(3.2, R - rc + Math.sqrt(Math.max(0, rc * rc - y * y))), D0 + y]);
  }
  b.lathe(prof, 8, 0, 0, 0, 'wire', 1);
  // horizontal courses between the ribs
  for (let k = 1; k < 24; k += 2) {
    const [r, y] = prof[k];
    b.ring(0, y, 0, r / Math.cos(TAU / 16) * Math.cos(TAU / 16), 8, 'y', Math.PI / 8, Math.PI / 8 + TAU);
  }
  // the white marble ribs, doubled
  for (let f = 0; f < 8; f++) {
    const a = (f / 8) * TAU;
    b.line(prof.map(([r, y]) => [Math.cos(a) * (r + 0.4), y + 0.2, Math.sin(a) * (r + 0.4)]));
  }
  // lantern
  b.cyl(3.4, 3.4, 8, 8, 0, D0 + H + 4, 0, 0, Math.PI / 8, 0, 'edge');
  for (let f = 0; f < 8; f++) {
    const a = (f / 8) * TAU;
    b.line([[Math.cos(a) * 3.4, D0 + H + 8, Math.sin(a) * 3.4], [Math.cos(a) * 5.2, D0 + H + 3, Math.sin(a) * 5.2], [Math.cos(a) * 4.6, D0 + H + 1.5, Math.sin(a) * 4.6], [Math.cos(a) * 3.8, D0 + H, Math.sin(a) * 3.8]]);
  }
  b.cyl(0.2, 3.6, 6, 8, 0, D0 + H + 11, 0);
  b.sphere(1.1, 0, D0 + H + 15, 0, 14, 10);
  b.seg([0, D0 + H + 16, 0], [0, D0 + H + 19, 0]);
  b.seg([-0.9, D0 + H + 18, 0], [0.9, D0 + H + 18, 0]);
  // lower drum and the tribunes
  b.cyl(R + 3, R + 3, 6, 8, 0, -3, 0, 0, Math.PI / 8, 0);
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i - 1) * (Math.PI / 2);
    b.cyl(10, 10, 12, 24, Math.cos(a) * (R + 11), -6, Math.sin(a) * (R + 11), 0, 0, 0, 'edge', true);
    b.lathe([[10, 0], [8, 3], [4, 5.5], [0.1, 6]], 16, Math.cos(a) * (R + 11), 0, Math.sin(a) * (R + 11), 'wire');
  }
  return b;
}

// ---------------------------------------------------------------- THE CAPITOL (dome 1855–1866)
export function capitol() {
  const b = new MB('Capitol');
  // the building
  b.box(229, 22, 107, 0, 11, 0);
  for (let i = 0; i < 24; i++) { const x = -40 + i * (80 / 23); b.cyl(0.7, 0.8, 14, 12, x, 29, 55); }
  b.box(84, 3, 12, 0, 37.5, 55);
  b.extrude([[-30, 0], [30, 0], [0, 9]], 2, 0, 39, 58);
  for (let i = 0; i < 60; i++) { const x = -112 + i * (224 / 59); if (Math.abs(x) < 44) continue; b.line([[x, 4, 53.6], [x, 9, 53.6]]); b.line([[x, 13, 53.6], [x, 18, 53.6]]); }
  // the dome: peristyle of 36 columns
  const y0 = 22;
  b.cyl(40, 40, 6, 72, 0, y0 + 3, 0, 0, 0, 0, 'edge', true);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    b.cyl(0.8, 0.9, 13, 10, Math.cos(a) * 36, y0 + 12.5, Math.sin(a) * 36, 0, 0, 0, 'wire');
  }
  b.ring(0, y0 + 19.5, 0, 37, 96);
  b.ring(0, y0 + 20.5, 0, 38, 96);
  b.cyl(32, 32, 16, 72, 0, y0 + 14, 0, 0, 0, 0, 'edge', true);
  b.cyl(30, 30, 8, 72, 0, y0 + 26, 0, 0, 0, 0, 'edge', true);
  for (let i = 0; i < 36; i++) { const a = ((i + 0.5) / 36) * TAU; b.line([[Math.cos(a) * 32.05, y0 + 9, Math.sin(a) * 32.05], [Math.cos(a) * 32.05, y0 + 16, Math.sin(a) * 32.05]]); }
  // ribbed shell
  const prof = [];
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * (Math.PI / 2) * 0.92; prof.push([Math.cos(a) * 30, y0 + 30 + Math.sin(a) * 30]); }
  b.lathe(prof, 36, 0, 0, 0, 'wire', 1);
  for (let k = 0; k < 3; k++) for (let i = 0; i < 36; i++) {
    const a = ((i + 0.5) / 36) * TAU, [r, y] = prof[3 + k * 5];
    b.line([[Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * r, y + 2.2, Math.sin(a) * r]]);
  }
  // tholos and the Statue of Freedom
  const ty = prof[prof.length - 1][1];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; b.cyl(0.35, 0.35, 8, 8, Math.cos(a) * 5.2, ty + 4, Math.sin(a) * 5.2); }
  b.ring(0, ty, 0, 6, 32);
  b.ring(0, ty + 8, 0, 6, 32);
  b.lathe([[6, 0], [4, 2.5], [1, 4], [0.1, 4.5]], 24, 0, ty + 8, 0, 'wire');
  b.cyl(0.6, 1.1, 6, 10, 0, ty + 15.5, 0, 0, 0, 0, 'wire');
  b.sphere(0.5, 0, ty + 19, 0, 10, 8);
  b.line([[0, ty + 19.6, 0], [0.2, ty + 21, 0], [0, ty + 21.4, 0], [-0.2, ty + 21, 0], [0, ty + 19.6, 0]]);
  return b;
}
