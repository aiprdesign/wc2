/* THE INHERITANCE 3D — renderer, scene registry, holographic transitions,
   bloom and lens treatment. Deterministic: render(t) depends only on t. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { U } from './holo.js';

const REG = [];
export function scene3(key, build) {
  REG.push({ key, build, s: T[key][0], e: T[key][1] });
}

// Renders one or two scenes and blends them with a holographic dissolve.
class MixPass extends Pass {
  constructor(engine) {
    super();
    this.engine = engine;
    const opt = { type: THREE.HalfFloatType, samples: 4 };
    this.rtA = new THREE.WebGLRenderTarget(W, H, opt);
    this.rtB = new THREE.WebGLRenderTarget(W, H, opt);
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uTime: U.time },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D tA; uniform sampler2D tB; uniform float uMix; uniform float uTime; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          vec2 cell = floor(vUv * vec2(240.0, 135.0));
          float n = h(cell) * 0.12 + abs(vUv.x - 0.5) * 0.7 + h(vec2(cell.y, 3.0)) * 0.18;
          float m = uMix * 1.3 - 0.15;
          float k = smoothstep(n - 0.08, n + 0.08, m);
          float edge = smoothstep(0.1, 0.0, abs(n - m)) * step(0.001, uMix) * step(uMix, 0.999);
          vec2 off = vec2((h(vec2(cell.y, floor(uTime * 20.0))) - 0.5) * 0.02 * edge, 0.0);
          vec4 a = texture2D(tA, vUv + off), b = texture2D(tB, vUv - off);
          gl_FragColor = mix(a, b, k) + vec4(0.35, 0.85, 1.0, 0.0) * edge * 0.25;
        }`,
    }));
  }
  render(renderer, writeBuffer) {
    const { a, b, mix, t } = this.engine.current;
    renderer.setRenderTarget(this.rtA);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    if (a) renderer.render(a.scene, a.camera);
    if (b) {
      renderer.setRenderTarget(this.rtB);
      renderer.clear();
      renderer.render(b.scene, b.camera);
    }
    const u = this.quad.material.uniforms;
    u.tA.value = this.rtA.texture;
    u.tB.value = (b ? this.rtB : this.rtA).texture;
    u.uMix.value = b ? mix : 0;
    renderer.setRenderTarget(writeBuffer);
    this.quad.render(renderer);
  }
}

const LENS = {
  uniforms: { tDiffuse: { value: null }, uTime: U.time, uAberr: { value: 0.0015 }, uVig: { value: 0.9 }, uFlash: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uAberr; uniform float uVig; uniform float uFlash; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float d = dot(c, c);
      vec2 off = c * uAberr * (1.0 + d * 6.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= 1.0 - smoothstep(0.15, 0.75, d) * uVig;
      col *= 0.96 + 0.04 * sin(vUv.y * 1080.0 * 1.5);
      col += (h(vUv * 1000.0 + fract(uTime * 7.0)) - 0.5) * 0.035;
      col += vec3(1.0, 0.95, 0.85) * uFlash;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class Engine3D {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }));
    this.composer.setPixelRatio(1);
    this.composer.setSize(W, H);
    this.composer.addPass(new MixPass(this));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.9, 0.45, 0.62);
    this.composer.addPass(this.bloom);
    this.lens = new ShaderPass(LENS);
    this.composer.addPass(this.lens);
    this.composer.addPass(new OutputPass());
    this.current = {};
    this.built = new Map();
  }
  async init() {
    for (const r of REG) {
      const s = await r.build();
      s.camera = s.camera || new THREE.PerspectiveCamera(40, W / H, 0.05, 5000);
      s.camera.aspect = W / H;
      s.camera.updateProjectionMatrix();
      this.built.set(r.key, { ...r, ...s });
    }
  }
  render(t) {
    U.time.value = t;
    const active = [...this.built.values()].filter((s) => t >= s.s && t < s.e);
    const a = active[0], b = active[1];
    let mix = 0;
    if (a) a.update(t - a.s, t);
    if (b) {
      b.update(t - b.s, t);
      mix = E.sine(seg(t, b.s, a.e));
    }
    const fx = (b && mix > 0.5 ? b : a) || {};
    this.bloom.strength = fx.bloom == null ? 0.9 : typeof fx.bloom === 'function' ? fx.bloom(t - fx.s) : fx.bloom;
    this.lens.uniforms.uFlash.value = fx.flash ? fx.flash(t - fx.s) : 0;
    this.current = { a, b, mix, t };
    this.composer.render();
    return { a, b, mix };
  }
  overlay(ctx, t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of this.built.values()) if (s.hud && t >= s.s && t < s.e) {
      ctx.save();
      s.hud(ctx, t - s.s, t);
      ctx.restore();
    }
    const lb = letterbox(t);
    if (lb > 0.5) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, lb);
      ctx.fillRect(0, H - lb, W, lb);
    }
    if (Film.captions) Film.caption(ctx, t, lb);
    const edge = Math.max(1 - seg(t, 0, 0.6), seg(t, DURATION - 1.2, DURATION));
    if (edge > 0) { ctx.fillStyle = `rgba(0,0,0,${edge})`; ctx.fillRect(0, 0, W, H); }
  }
}
