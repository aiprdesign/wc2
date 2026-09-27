/* Model lab: renders one model at a time for inspection (?export for the stills tool). */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { U, C } from './holo.js';
import * as A from './models_arch.js';
import * as TT from './models_tech.js';

const ALL = { ...A, ...TT };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), preserveDrawingBuffer: true });
renderer.setSize(1920, 1080, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const composer = new EffectComposer(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 5000);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(960, 540), 0.8, 0.4, 0.75));
composer.addPass(new OutputPass());
buildTextures();
window.FILM = {
  capture(name, f = 1) {
    scene.clear();
    const m = ALL[name]().build({ height: 10, color: C.cyan });
    scene.add(m);
    const d = Math.max(m.width, m.height * 1.8, m.depth) * 1.25 * f;
    camera.position.set(d * 0.75, m.height * 0.55, d * 0.9);
    camera.lookAt(0, m.height * 0.45, 0);
    U.time.value = 1;
    composer.render();
    return renderer.domElement.toDataURL('image/jpeg', 0.85);
  },
};
window.FILM_READY = true;
