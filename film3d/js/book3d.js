/* THE INHERITANCE 3D — the book: real paper in a world of holograms. */
import * as THREE from 'three';

const PW3 = 3, PH3 = 4; // page size in world units
export { PW3, PH3 };

const cache = new Map();
// Page textures are drawn with the v1 page art (film/js/art.js, act1.js).
export function pageTexture(id, lt = 0, animated = false) {
  let e = cache.get(id);
  if (!e) {
    const c = makeCanvas(600, 800);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    e = { c, tex, drawn: -1 };
    cache.set(id, e);
  }
  if (e.drawn < 0 || (animated && e.drawn !== lt)) {
    const g = e.c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(TEX.paper, 0, 0, 600, 800);
    drawPageContent(g, id, lt);
    e.tex.needsUpdate = true;
    e.drawn = lt;
  }
  return e.tex;
}
export function pageMat(id) {
  return new THREE.MeshBasicMaterial({ map: pageTexture(id), color: 0x6f624e, side: THREE.FrontSide });
}

// A flat page lying in the xz plane, spine at x=0, extending toward +x or -x.
export function flatPage(side) {
  const g = new THREE.PlaneGeometry(PW3, PH3, 1, 1);
  g.rotateX(-Math.PI / 2);
  g.translate((side * PW3) / 2, 0, 0);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x6f624e }));
  return m;
}

// A turning page: front and back meshes on a shared bendable geometry.
export function turningPage() {
  const SEG = 24;
  const geom = new THREE.PlaneGeometry(PW3, PH3, SEG, 1);
  geom.rotateX(-Math.PI / 2);
  geom.translate(PW3 / 2, 0, 0);
  const base = geom.attributes.position.array.slice();
  const front = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x6f624e, side: THREE.FrontSide }));
  const backMat = new THREE.MeshBasicMaterial({ color: 0x9d8e74, side: THREE.BackSide });
  const back = new THREE.Mesh(geom, backMat);
  const g = new THREE.Group();
  g.add(front, back);
  g.set = (p, frontId, backId) => {
    const th = E.io(p) * Math.PI;
    const bend = Math.sin(p * Math.PI) * 0.9;
    const pos = geom.attributes.position;
    // walk across the page accumulating a curling angle
    for (let i = 0; i < pos.count; i++) {
      const u = base[i * 3] / PW3; // 0..1 from spine
      const z = base[i * 3 + 2];
      let x = 0, y = 0;
      const steps = Math.round(u * SEG);
      for (let k = 0; k < steps; k++) {
        const a = th + bend * (k / SEG) * (k / SEG) * (th < Math.PI / 2 ? -1 : 1) * 0.6;
        x += Math.cos(a) * (PW3 / SEG);
        y += Math.sin(a) * (PW3 / SEG);
      }
      pos.setXYZ(i, x, y + 0.01, z);
    }
    pos.needsUpdate = true;
    geom.computeBoundingSphere();
    front.material.map = pageTexture(frontId);
    const bt = pageTexture(backId);
    if (!bt.mirror) {
      bt.mirror = bt.clone();
      bt.mirror.wrapS = THREE.RepeatWrapping;
      bt.mirror.repeat.x = -1;
      bt.mirror.offset.x = 1;
    }
    bt.mirror.needsUpdate = true;
    back.material.map = bt.mirror;
    front.material.needsUpdate = true;
    back.material.needsUpdate = true;
    g.visible = p > 0 && p < 1;
  };
  return g;
}

export function bookBase() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(PW3 * 2 + 0.3, 0.12, PH3 + 0.3), new THREE.MeshBasicMaterial({ color: 0x2a170c }));
  cover.position.y = -0.09;
  const block = new THREE.Mesh(new THREE.BoxGeometry(PW3 * 2 + 0.04, 0.08, PH3 + 0.02), new THREE.MeshBasicMaterial({ color: 0x8c7a5e }));
  block.position.y = -0.046;
  g.add(cover, block);
  return g;
}

// Complete open book with page-turn state. Pages at y=0.
export function book() {
  const g = new THREE.Group();
  g.add(bookBase());
  const L = flatPage(-1), R = flatPage(1);
  const turn = turningPage();
  // gutter shadow
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, PH3), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.004;
  g.add(L, R, turn, sh);
  g.show = (left, right, tr, lt = 0, animLeft = false, animRight = false) => {
    L.material.map = pageTexture(left, lt, animLeft);
    R.material.map = pageTexture(tr ? tr.under : right, lt, animRight);
    L.material.needsUpdate = true;
    R.material.needsUpdate = true;
    if (tr) turn.set(tr.p, tr.front, tr.back);
    else turn.visible = false;
  };
  g.setLight = (k) => {
    const c = new THREE.Color(0x6f624e).multiplyScalar(k);
    L.material.color.copy(c);
    R.material.color.copy(c);
    turn.children[0].material.color.copy(c);
    turn.children[1].material.color.copy(c).multiplyScalar(0.85);
  };
  return g;
}
