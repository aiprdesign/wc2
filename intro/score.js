/* Launch-film score: 120 BPM, B minor, synthesised offline. */
'use strict';
(function () {
  const wav = Score.toWavBase64;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = [[47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [50, 57, 62, 66, 69], [45, 52, 57, 61, 64]]; // Bm G D A
  const chordAt = (t) => PROG[Math.floor(t / BAR) % 4];
  async function render(sr = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * sr), sr);
    const master = ctx.createGain(); master.gain.value = 0.62;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    master.connect(comp).connect(ctx.destination);
    const irLen = sr * 2.6, ir = ctx.createBuffer(2, irLen, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c), r = rng(70 + c); for (let i = 0; i < irLen; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / irLen, 3.5); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.35; vg.connect(verb).connect(master);
    const dry = ctx.createGain(); dry.connect(master); dry.connect(vg);
    const nLen = sr * 2, noise = ctx.createBuffer(1, nLen, sr); { const d = noise.getChannelData(0), r = rng(5); for (let i = 0; i < nLen; i++) d[i] = r() * 2 - 1; }
    const env = (g, t, a, p, h, r) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(p, t + a); g.gain.setValueAtTime(p, t + a + h); g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + r); };
    const pan = (n, p) => { const s = ctx.createStereoPanner(); s.pan.value = p; n.connect(s); return s; };
    const nz = (t, d) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, (t * 0.37) % 1.5); s.stop(t + d); return s; };
    function kick(t, v = 0.9) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); const g = ctx.createGain(); env(g, t, 0.002, v, 0.02, 0.28); o.connect(g).connect(dry); o.start(t); o.stop(t + 0.4); }
    function hat(t, v = 0.08, open = false) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = ctx.createGain(); env(g, t, 0.001, v, 0, open ? 0.2 : 0.04); nz(t, 0.3).connect(f).connect(g); pan(g, 0.25).connect(dry); }
    function clap(t, v = 0.25) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.8; const g = ctx.createGain(); env(g, t, 0.002, v, 0.01, 0.16); nz(t, 0.3).connect(f).connect(g).connect(dry); }
    function bass(t, m, d, v = 0.22) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(160, t + d); const g = ctx.createGain(); env(g, t, 0.004, v, d * 0.5, d * 0.5); o.connect(f).connect(g).connect(dry); o.start(t); o.stop(t + d + 0.05); }
    function pluck(t, m, v, p) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); const g = ctx.createGain(); env(g, t, 0.003, v, 0, 0.22); o.connect(g); pan(g, p).connect(dry); o.start(t); o.stop(t + 0.3); }
    function pad(t0, t1, notes, gain, cut = 2000) {
      const out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.connect(out);
      notes.forEach((m) => [-9, 0, 9].forEach((det, k) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det; const og = ctx.createGain(); og.gain.value = 1 / (notes.length * 3); o.connect(og); pan(og, (k - 1) * 0.6).connect(lp); o.start(t0); o.stop(t1 + 0.8); }));
      out.gain.setValueAtTime(0.0001, t0); out.gain.linearRampToValueAtTime(gain, t0 + 0.15); out.gain.setValueAtTime(gain, t1); out.gain.linearRampToValueAtTime(0.0001, t1 + 0.6);
      out.connect(dry);
    }
    function impact(t, v = 1) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
      const g = ctx.createGain(); env(g, t, 0.003, v, 0.1, 1.8); o.connect(g).connect(dry); o.start(t); o.stop(t + 2.2);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(8000, t); f.frequency.exponentialRampToValueAtTime(300, t + 1.5);
      const g2 = ctx.createGain(); env(g2, t, 0.002, v * 0.45, 0.05, 1.6); nz(t, 2).connect(f).connect(g2).connect(dry);
    }
    function riser(t0, t1, v = 0.2) {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(9000, t1);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t1 - 0.02); g.gain.linearRampToValueAtTime(0.0001, t1);
      nz(t0, t1 - t0).connect(f).connect(g).connect(dry);
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t1);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(v * 0.25, t1 - 0.02); og.gain.linearRampToValueAtTime(0.0001, t1);
      o.connect(og).connect(dry); o.start(t0); o.stop(t1);
    }
    function piano(t, m, v) { const g = ctx.createGain(); [[1, 1], [2, 0.3]].forEach(([k, a]) => { const o = ctx.createOscillator(); o.type = k === 1 ? 'triangle' : 'sine'; o.frequency.value = hz(m) * k; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + 3); }); env(g, t, 0.004, v, 0, 2.8); g.connect(dry); }

    // A — cold open: a pulse like a heartbeat, three struck notes, a riser
    pad(0.2, 8, [35, 47, 54], 0.08, 600);
    for (let t = 0; t < 8; t += BEAT * 2) kick(t, 0.25);
    [[0.8, 66], [2.8, 69], [4.8, 74]].forEach(([t, m]) => { piano(t, m, 0.2); piano(t, m - 12, 0.12); });
    riser(5.5, SEC.title, 0.25);
    // B — the title slam
    impact(SEC.title, 1.1);
    pad(SEC.title, SEC.grid - 0.2, [47, 54, 59, 62, 66, 71], 0.18, 2600);
    riser(10.5, SEC.grid, 0.18);
    // C..F — the groove
    for (let t = SEC.grid; t < 56; t += BEAT) {
      const b = Math.round((t - SEC.grid) / BEAT);
      const inDash = t >= SEC.dash && t < SEC.finale;
      if (!inDash || b % 2 === 0) kick(t, t >= SEC.heroes ? 0.9 : 0.75);
      if (t >= SEC.heroes && b % 4 === 2 && !inDash) clap(t);
      hat(t + BEAT / 2, 0.07, b % 4 === 3);
      if (t >= SEC.heroes && !inDash) hat(t, 0.04);
      const ch = chordAt(t);
      bass(t, ch[0] - 12, BEAT * 0.9, inDash ? 0.12 : 0.22);
      bass(t + BEAT / 2, ch[0] - 12 + (b % 2 ? 7 : 0), BEAT * 0.45, inDash ? 0.08 : 0.16);
      for (let k = 0; k < 4; k++) pluck(t + k * BEAT / 4, ch[1 + ((b * 4 + k) % 4)] + 12, inDash ? 0.05 : 0.07, ((k % 2) - 0.5) * 0.8);
    }
    for (let t = SEC.grid; t < 56; t += BAR) pad(t, t + BAR - 0.05, chordAt(t).slice(0, 4), t >= SEC.heroes && t < SEC.dash ? 0.16 : t >= SEC.finale ? 0.2 : 0.1, t >= SEC.heroes ? 3200 : 1600);
    // a hit on every hero cut
    HEROES.forEach((_, i) => { const t = SEC.heroes + i * BAR; impact(t, 0.55); });
    riser(38, SEC.dash, 0.2);
    riser(46, SEC.finale, 0.3);
    impact(SEC.finale, 1.2);
    // resolve
    pad(56, 59.6, [38, 50, 57, 62, 66, 69, 74], 0.3, 3000);
    impact(56, 0.9);
    [[56.2, 74], [57, 78], [57.8, 81]].forEach(([t, m]) => piano(t, m, 0.18));
    return ctx.startRendering();
  }
  window.Score = { render, toWavBase64: wav };
})();
