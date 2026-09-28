/* Launch-film score: 128 BPM, B minor, synthesised offline from the beat map
   in timeline.js, so every hit in the picture has a sound under it. */
'use strict';
(function () {
  const wav = Score.toWavBase64;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // Bm  G  D  A  (i VI III VII)
  const PROG = [[47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [50, 57, 62, 66, 69], [45, 52, 57, 61, 64]];
  const MELODY = [[66, 62, 64, 66], [67, 66, 62, 59], [69, 66, 64, 62], [64, 61, 64, 69]];
  const chordAt = (t) => PROG[Math.floor(t / BAR + 1e-6) % 4];
  const inBars = (t, a, b) => t >= bt(a) - 1e-6 && t < bt(b) - 1e-6;

  async function render(sr = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * sr), sr);
    const master = ctx.createGain(); master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.15;
    master.connect(comp).connect(ctx.destination);
    const irLen = sr * 2.8, ir = ctx.createBuffer(2, irLen, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c), r = rng(70 + c); for (let i = 0; i < irLen; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / irLen, 3.2); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.3; vg.connect(verb).connect(master);
    const dry = ctx.createGain(); dry.connect(master); dry.connect(vg);
    // the pumping bus: ducks under every kick
    const pump = ctx.createGain(); pump.connect(dry);
    pump.gain.setValueAtTime(1, 0);
    KICKS.forEach((t) => { pump.gain.setValueAtTime(1, Math.max(0, t - 0.005)); pump.gain.linearRampToValueAtTime(0.22, t + 0.012); pump.gain.linearRampToValueAtTime(1, t + BEAT * 0.7); });
    // a dotted-eighth delay for the arp and lead
    const dl = ctx.createDelay(1); dl.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 3500;
    dl.connect(dlf).connect(fb).connect(dl); dlf.connect(pump);
    const nLen = sr * 2, noise = ctx.createBuffer(1, nLen, sr); { const d = noise.getChannelData(0), r = rng(5); for (let i = 0; i < nLen; i++) d[i] = r() * 2 - 1; }
    const env = (g, t, a, p, h, r) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(p, t + a); g.gain.setValueAtTime(p, t + a + h); g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + r); };
    const pan = (n, p) => { const s = ctx.createStereoPanner(); s.pan.value = p; n.connect(s); return s; };
    const nz = (t, d) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, (t * 0.37) % 1.5); s.stop(t + d); return s; };
    const osc = (type, f, t, d) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(t + d); return o; };

    function kick(t, v = 1) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.09);
      const g = ctx.createGain(); env(g, t, 0.001, v, 0.04, 0.26); o.connect(g).connect(dry); o.start(t); o.stop(t + 0.4);
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
      const cg = ctx.createGain(); env(cg, t, 0.0005, v * 0.25, 0, 0.012); nz(t, 0.05).connect(f).connect(cg).connect(dry);
    }
    function snare(t, v = 0.3) {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.6;
      const g = ctx.createGain(); env(g, t, 0.001, v, 0.01, 0.15); nz(t, 0.25).connect(f).connect(g).connect(dry);
      const b = osc('triangle', 190, t, 0.15); const bg = ctx.createGain(); env(bg, t, 0.001, v * 0.6, 0, 0.08); b.connect(bg).connect(dry);
    }
    function clap(t, v = 0.28) {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      [0, 0.011, 0.022].forEach((d) => { g.gain.setValueAtTime(v, t + d); g.gain.exponentialRampToValueAtTime(v * 0.2, t + d + 0.009); });
      g.gain.setValueAtTime(v, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      nz(t, 0.3).connect(f).connect(g); pan(g, 0).connect(dry);
    }
    function hat(t, v = 0.06, open = false, p = 0.2) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000; const g = ctx.createGain(); env(g, t, 0.001, v, 0, open ? 0.18 : 0.035); nz(t, 0.25).connect(f).connect(g); pan(g, p).connect(dry); }
    function sub(t, m, d, v = 0.3) { const o = osc('sine', hz(m), t, d + 0.05); const g = ctx.createGain(); env(g, t, 0.005, v, d * 0.7, d * 0.3); o.connect(g).connect(pump); }
    function bassHit(t, m, d, v = 0.2) {
      const o = osc('sawtooth', hz(m), t, d + 0.05), o2 = osc('square', hz(m) * 0.5, t, d + 0.05);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(180, t + d);
      const g = ctx.createGain(); env(g, t, 0.003, v, d * 0.4, d * 0.6);
      o.connect(f); o2.connect(f); f.connect(g).connect(dry);
    }
    function supersaw(t0, t1, notes, v = 0.16, cut = 4200) {
      const out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(cut * 0.4, t0); lp.frequency.exponentialRampToValueAtTime(cut, t0 + 0.25); lp.Q.value = 1.2;
      lp.connect(out);
      notes.forEach((m) => [-28, -17, -8, 0, 8, 17, 28].forEach((det, k) => {
        const o = osc('sawtooth', hz(m), t0, t1 - t0 + 0.5); o.detune.value = det;
        const og = ctx.createGain(); og.gain.value = 1 / (notes.length * 7); o.connect(og); pan(og, (k - 3) / 3.5).connect(lp);
      }));
      out.gain.setValueAtTime(0.0001, t0); out.gain.linearRampToValueAtTime(v, t0 + 0.02); out.gain.setValueAtTime(v, t1 - 0.05); out.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.35);
      out.connect(pump);
    }
    function pad(t0, t1, notes, v, cut = 1800) {
      const out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.connect(out);
      notes.forEach((m) => [-10, 0, 10].forEach((det, k) => { const o = osc('sawtooth', hz(m), t0, t1 - t0 + 1); o.detune.value = det; const og = ctx.createGain(); og.gain.value = 1 / (notes.length * 3); o.connect(og); pan(og, (k - 1) * 0.7).connect(lp); }));
      out.gain.setValueAtTime(0.0001, t0); out.gain.linearRampToValueAtTime(v, t0 + 0.3); out.gain.setValueAtTime(v, t1); out.gain.linearRampToValueAtTime(0.0001, t1 + 0.8);
      out.connect(dry);
    }
    function pluck(t, m, v, p, dest = pump, send = true) {
      const o = osc('square', hz(m), t, 0.25), o2 = osc('triangle', hz(m) * 2, t, 0.25);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(5000, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.15);
      const g = ctx.createGain(); env(g, t, 0.002, v, 0, 0.16);
      o.connect(f); o2.connect(f); f.connect(g); const s = pan(g, p); s.connect(dest); if (send) s.connect(dl);
    }
    function lead(t, m, d, v = 0.1) {
      const o = osc('sawtooth', hz(m), t, d + 0.3), o2 = osc('square', hz(m + 12), t, d + 0.3);
      const lfo = osc('sine', 5.5, t, d + 0.3); const lg = ctx.createGain(); lg.gain.value = 9; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3200;
      const g = ctx.createGain(); env(g, t, 0.01, v, d * 0.7, 0.3);
      const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2).connect(f); o.connect(f); f.connect(g); g.connect(pump); g.connect(dl);
    }
    function piano(t, m, v) { const g = ctx.createGain(); [[1, 1], [2, 0.3], [3, 0.08]].forEach(([k, a]) => { const o = osc(k === 1 ? 'triangle' : 'sine', hz(m) * k, t, 3); const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); }); env(g, t, 0.004, v, 0, 2.8); g.connect(dry); }
    function impact(t, v = 1) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(26, t + 1.4);
      const g = ctx.createGain(); env(g, t, 0.002, v, 0.12, 1.9); o.connect(g).connect(dry); o.start(t); o.stop(t + 2.3);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(9000, t); f.frequency.exponentialRampToValueAtTime(250, t + 1.6);
      const g2 = ctx.createGain(); env(g2, t, 0.002, v * 0.5, 0.05, 1.8); nz(t, 2.1).connect(f).connect(g2).connect(dry);
      // a cymbal wash on top
      const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 5000;
      const g3 = ctx.createGain(); env(g3, t, 0.002, v * 0.12, 0.1, 2.2); nz(t, 2.5).connect(hf).connect(g3); pan(g3, 0).connect(dry);
    }
    function riser(t0, t1, v = 0.2) {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(10000, t1);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t1 - 0.02); g.gain.linearRampToValueAtTime(0.0001, t1);
      nz(t0, t1 - t0).connect(f).connect(g).connect(dry);
      const o = osc('sawtooth', 110, t0, t1 - t0); o.frequency.exponentialRampToValueAtTime(1320, t1);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(v * 0.22, t1 - 0.02); og.gain.linearRampToValueAtTime(0.0001, t1);
      o.connect(og).connect(dry);
    }
    function reverseCym(t1, d = 1.6, v = 0.18) {
      const t0 = t1 - d, f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t1 - 0.01); g.gain.linearRampToValueAtTime(0.0001, t1);
      nz(t0, d).connect(f).connect(g).connect(dry);
    }
    function whoosh(t, d = 0.5, v = 0.12) {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(600, t - d); f.frequency.exponentialRampToValueAtTime(6000, t); f.frequency.exponentialRampToValueAtTime(400, t + d * 0.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t - d); g.gain.exponentialRampToValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.6);
      nz(t - d, d * 1.7).connect(f).connect(g); pan(g, 0).connect(dry);
    }
    function blip(t, m, v = 0.06) { const o = osc('sine', hz(m), t, 0.2), o2 = osc('sine', hz(m + 19), t, 0.2); const g = ctx.createGain(); env(g, t, 0.001, v, 0, 0.12); o.connect(g); o2.connect(g); g.connect(dry); g.connect(dl); }

    // ---- drums from the shared beat map ----
    KICKS.forEach((t) => kick(t, inBars(t, 0, 2) ? 0.8 : 1));
    SNARES.forEach((t) => {
      const build = inBars(t, 2, 4) || inBars(t, 22, 24);
      if (build) {
        const bar = inBars(t, 2, 4) ? 2 : 22, k = (t - bt(bar)) / (BAR * 2);
        snare(t, 0.1 + 0.25 * k);
      } else { clap(t); snare(t, 0.12); }
    });
    // hats: sixteenths in the grooves, eighths in the breakdown
    for (let t = SEC.title; t < SEC.end - 0.01; t += BEAT / 4) {
      const i = Math.round(t / (BEAT / 4));
      if (inBars(t, 16, 18)) { if (i % 2 === 0) hat(t, 0.035, false, 0.3); continue; }
      if (inBars(t, 23.75, 24)) continue;
      hat(t, i % 4 === 2 ? 0.07 : 0.035, i % 4 === 2, i % 2 ? -0.3 : 0.3);
    }
    for (let t = SEC.warp; t < SEC.title - BEAT; t += BEAT / 2) hat(t + BEAT / 4, 0.03 + 0.03 * ((t - SEC.warp) / (SEC.title - SEC.warp)));

    // ---- A: ignition — four slams over a drone ----
    pad(0, SEC.warp + 0.2, [35, 47, 54], 0.12, 700);
    IGNITE_WORDS.forEach((_, i) => { const t = i * 2 * BEAT; impact(t, 0.55 + i * 0.1); [47, 54, 59].forEach((m) => piano(t, m + 12, 0.07)); sub(t, 35, BEAT * 1.6, 0.35); });
    // ---- warp: arp opens up, riser, gap ----
    for (let t = SEC.warp; t < SEC.title - BEAT; t += BEAT / 4) {
      const i = Math.round((t - SEC.warp) / (BEAT / 4)), ch = chordAt(t);
      pluck(t, ch[1 + (i % 4)] + 12, 0.035 + 0.05 * ((t - SEC.warp) / (SEC.title - SEC.warp)), i % 2 ? -0.4 : 0.4);
    }
    pad(SEC.warp, SEC.title - BEAT, [47, 54, 59, 62], 0.1, 1200);
    riser(SEC.warp, SEC.title - 0.02, 0.28);
    reverseCym(SEC.title);

    // ---- the grooves ----
    const groove = (b0, b1, o = {}) => {
      for (let t = bt(b0); t < bt(b1) - 1e-6; t += BEAT) {
        const ch = chordAt(t), b = Math.round((t - bt(b0)) / BEAT);
        sub(t, ch[0] - 12, BEAT * 0.95, 0.26);
        bassHit(t + BEAT / 2, ch[0] - (b % 4 === 3 ? 5 : 0), BEAT * 0.45, 0.17);
        if (o.arp !== false) for (let k = 0; k < 4; k++) pluck(t + k * BEAT / 4, ch[1 + ((b * 4 + k) % 4)] + 12, o.arpV || 0.05, k % 2 ? -0.45 : 0.45);
      }
      for (let bar = b0; bar < b1; bar++) {
        const t = bt(bar), ch = chordAt(t);
        if (o.saw) supersaw(t, t + BAR - 0.02, [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4] + 12], o.sawV || 0.15);
        else pad(t, t + BAR - 0.05, ch.slice(1, 5), 0.07, 1600);
        if (o.lead) MELODY[bar % 4].forEach((m, i) => lead(t + [0, 1.5, 2, 3][i] * BEAT, m + 12, [1.5, 0.5, 1, 1][i] * BEAT, 0.075));
      }
    };
    groove(4, 6, { saw: true, sawV: 0.17 });
    groove(6, 8, { arpV: 0.06 });
    groove(8, 12);
    groove(12, 16, { saw: true, lead: true });
    groove(18, 20, { arpV: 0.055 });
    groove(20, 22, { saw: true });
    groove(24, 28, { saw: true, sawV: 0.19, lead: true });

    // ---- breakdown: the timeline ----
    impact(SEC.timeline, 0.5);
    pad(SEC.timeline, SEC.globe - 0.1, [47, 54, 59, 62, 66], 0.14, 900);
    [[0, 74], [1, 73], [2, 71], [3, 69], [4, 71], [5, 69], [6, 66], [7, 69]].forEach(([b, m]) => piano(SEC.timeline + b * BEAT, m, 0.13));
    for (let t = SEC.timeline; t < SEC.globe; t += BEAT) sub(t, chordAt(t)[0] - 12, BEAT * 0.9, 0.12);
    riser(bt(17), SEC.globe - 0.02, 0.22);
    reverseCym(SEC.globe, 1.2);

    // ---- wall build ----
    for (let t = SEC.wall; t < SEC.finale - BEAT; t += BEAT / 4) {
      const i = Math.round((t - SEC.wall) / (BEAT / 4)), ch = chordAt(t);
      pluck(t, ch[1 + (i % 4)] + 12 + (i >= 16 ? 12 : 0), 0.05, i % 2 ? -0.4 : 0.4);
    }
    for (let bar = 22; bar < 24; bar++) sub(bt(bar), chordAt(bt(bar))[0] - 12, BAR - (bar === 23 ? BEAT : 0), 0.22);
    riser(SEC.wall, SEC.finale - 0.02, 0.3);
    reverseCym(SEC.finale, 2);

    // ---- impacts on the big moments, ticks on the small ones ----
    HITS.forEach((t) => { if (t >= SEC.title) impact(t, t === SEC.finale || t === SEC.title ? 1.15 : t > SEC.finale && t < SEC.end ? 0.6 : 0.85); });
    let ci = 0;
    TICKS.forEach((t) => {
      if (inBars(t, 6, 8)) blip(t, 78 + [0, 2, 4, 5, 7, 9, 11, 12][ci++ % 8], 0.05);
      else if (inBars(t, 22, 24)) blip(t, 71 + Math.round((t - SEC.wall) / (BEAT / 2)), 0.045);
      else blip(t, 83, 0.03);
    });
    [SEC.cards, SEC.heroes, SEC.timeline, SEC.chart, SEC.wall].forEach((t) => whoosh(t, 0.45, 0.13));

    // ---- end card: resolve to the relative major ----
    pad(SEC.end, DURATION - 0.4, [38, 50, 57, 62, 66, 69, 76], 0.26, 2800);
    sub(SEC.end, 38, 4, 0.3);
    [[0, 74], [0.5, 78], [1, 81], [1.5, 86]].forEach(([b, m]) => piano(SEC.end + b * BEAT * 2, m, 0.15));
    piano(SEC.end + BAR * 2, 74, 0.12); piano(SEC.end + BAR * 2, 81, 0.1);
    return ctx.startRendering();
  }
  window.Score = { render, toWavBase64: wav };
})();
