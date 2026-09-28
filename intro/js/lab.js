/* Model lab: models from three angles under the intro's lighting.
   ?print=0.6 tests the reveal; ?m=name,name,... picks the models (procedural or real). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadReal, realModel, REAL, sculpt, isReal } from './real.js';
import { model } from '../../film3d/js/models.js';

const q = new URLSearchParams(location.search);
const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
r.toneMapping = THREE.ACESFilmicToneMapping;
r.setScissorTest(true);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0b14);
scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
const key = new THREE.DirectionalLight(0xffd6a0, 1.7); key.position.set(3, 5, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0x8a7dff, 3.0); rim.position.set(-4, 2.5, -5); scene.add(rim);
await loadReal('models/');
const pr = parseFloat(q.get('print') || '1');
const list = (q.get('m') ? q.get('m').split(',') : Object.keys(REAL)).map((n) => [n]);
const cols = 3, w = 1920 / cols, h = 1080 / list.length;
const cam = new THREE.PerspectiveCamera(35, w / h, 0.01, 500);
list.forEach(([n], row) => {
  const m = isReal(n) ? realModel(n, { height: 4 }) : sculpt(model(n, { height: 4 }), n);
  m.setOpacity(1).setPrint(pr);
  scene.add(m);
  [0.5, Math.PI / 2 + 0.3, Math.PI].forEach((a, col) => {
    const d = Math.max(m.height, m.width, m.depth) * 1.5;
    cam.position.set(Math.sin(a) * d, m.height * 0.8, Math.cos(a) * d);
    cam.lookAt(0, m.height / 2, 0);
    const y = (list.length - 1 - row) * h;
    r.setViewport(col * w, y, w, h); r.setScissor(col * w, y, w, h);
    r.render(scene, cam);
  });
  scene.remove(m);
});
window.LAB_READY = true;
