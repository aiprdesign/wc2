/* THREE THOUSAND YEARS — score. Reuses the WAV encoder from film/js/score.js. */
'use strict';
(function () {
  const wav = Score.toWavBase64;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61], [42, 49, 54, 57], [43, 50, 55, 59], [40, 47, 52, 55], [45, 52, 57, 61]];
  async function render(sr = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * sr), sr);
    const master = ctx.createGain(); master.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    const verb = ctx.createConvolver(), irLen = sr * 3.2, ir = ctx.createBuffer(2, irLen, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c), r = rng(40 + c); for (let i = 0; i < irLen; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / irLen, 3); }
    verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.5; vg.connect(verb).connect(master);
    const dry = ctx.createGain(); dry.connect(master); dry.connect(vg);
    const env = (g, t, a, p, h, r) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p, t + a); g.gain.setValueAtTime(p, t + a + h); g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + r); };
    const pan = (n, p) => { const s = ctx.createStereoPanner(); s.pan.value = p; n.connect(s); return s; };
    function piano(t, m, v, p = 0) {
      const g = ctx.createGain();
      [[1, 1], [2, 0.35], [3, 0.1]].forEach(([k, a]) => { const o = ctx.createOscillator(); o.type = k === 1 ? 'triangle' : 'sine'; o.frequency.value = hz(m) * k; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + 3.5); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(v * 0.3, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      pan(g, p).connect(dry);
    }
    function pad(t0, t1, notes, gain, cut = 1400) {
      const out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.connect(out);
      notes.forEach((m, i) => [-7, 6].forEach((det) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det; const og = ctx.createGain(); og.gain.value = 1 / (notes.length * 2); o.connect(og); pan(og, det < 0 ? -0.35 : 0.35).connect(lp); o.start(t0); o.stop(t1 + 1); }));
      out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(gain, t0 + 0.4); out.gain.setValueAtTime(gain, t1); out.gain.linearRampToValueAtTime(0, t1 + 0.8);
      out.connect(dry);
    }
    function boom(t, v, f0 = 80) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.6);
      const g = ctx.createGain(); env(g, t, 0.005, v, 0.05, 1.4); o.connect(g).connect(dry); o.start(t); o.stop(t + 1.8);
    }
    function pluck(t, m, v, p) { const o = ctx.createOscillator(); o.frequency.value = hz(m); const g = ctx.createGain(); env(g, t, 0.004, v, 0, 0.3); o.connect(g); pan(g, p).connect(dry); o.start(t); o.stop(t + 0.4); }
    // intro: a single held note, then the theme
    pad(0.3, INTRO, [38, 45], 0.08, 500);
    [[0.8, 62], [1.8, 69], [2.8, 66], [3.8, 74]].forEach(([t, m]) => piano(t, m, 0.14));
    boom(INTRO, 0.5);
    const N = STATIONS.length;
    for (let i = 0; i < N; i++) {
      const t0 = stationTime(i), ch = PROG[i % PROG.length], prog = i / (N - 1);
      pad(t0, t0 + STEP, ch, 0.08 + prog * 0.14, 900 + prog * 1800);
      pad(t0, t0 + STEP, [ch[0] - 12], 0.06 + prog * 0.06, 300);
      const era = i === 0 || STATIONS[i][5] !== STATIONS[i - 1][5];
      boom(t0 + 0.2, era ? 0.55 : 0.22, era ? 90 : 70);
      piano(t0 + 0.2, ch[3] + 12, 0.14, 0.2);
      const step = prog < 0.3 ? 0.39 : prog < 0.7 ? 0.26 : 0.19;
      for (let t = t0; t < t0 + STEP - 0.05; t += step) { const k = Math.round((t - t0) / step); pluck(t, ch[k % 4] + 24, 0.035 + prog * 0.03, ((k % 4) - 1.5) * 0.4); }
    }
    // finale: rise and resolve on D
    const te = stationTime(N - 1) + STEP;
    pad(te, DURATION - 0.5, [38, 50, 57, 62, 66, 69, 74], 0.3, 2600);
    boom(te, 0.8, 100);
    [[te + 1.5, 74], [te + 2.2, 78], [te + 2.8, 81], [DURATION - 3.2, 74], [DURATION - 3.2, 62]].forEach(([t, m]) => piano(t, m, 0.15));
    return ctx.startRendering();
  }
  window.Score = { render, toWavBase64: wav };
})();
