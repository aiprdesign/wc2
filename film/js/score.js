/* THE INHERITANCE — the score, synthesised offline so it is identical on
   every render and locked to the picture. D major / B minor. */
'use strict';

const Score = (function () {
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // chords as MIDI notes (low → high)
  const CH = {
    Bm: [47, 54, 59, 62, 66],
    G: [43, 50, 55, 59, 62],
    D: [50, 57, 62, 66, 69],
    A: [45, 52, 57, 61, 64],
    Em: [40, 52, 55, 59, 64],
    Fs: [42, 54, 58, 61, 66],
  };
  const PROG = ['Bm', 'G', 'D', 'A'];
  const BAR = 2.4, START = 10.9;

  function chordAt(t) {
    const i = Math.floor((t - START) / BAR);
    return CH[PROG[((i % 4) + 4) % 4]];
  }

  async function render(sr = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * sr), sr);
    const master = ctx.createGain();
    master.gain.value = 0.72;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;
    master.connect(comp).connect(ctx.destination);

    // hall reverb
    const verb = ctx.createConvolver();
    const irLen = Math.floor(sr * 3.6), ir = ctx.createBuffer(2, irLen, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c), r = rng(300 + c);
      for (let i = 0; i < irLen; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / irLen, 3.2);
    }
    verb.buffer = ir;
    const verbIn = ctx.createGain();
    verbIn.gain.value = 0.55;
    verbIn.connect(verb).connect(master);
    const dry = ctx.createGain();
    dry.connect(master);
    dry.connect(verbIn);

    // shared noise
    const nLen = sr * 4, noise = ctx.createBuffer(1, nLen, sr);
    { const d = noise.getChannelData(0), r = rng(7); for (let i = 0; i < nLen; i++) d[i] = r() * 2 - 1; }
    const brown = ctx.createBuffer(1, nLen, sr);
    { const d = brown.getChannelData(0), r = rng(8); let last = 0; for (let i = 0; i < nLen; i++) { last = (last + 0.02 * (r() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }

    function env(g, t0, a, peak, hold, rel) {
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + a);
      g.gain.setValueAtTime(peak, t0 + a + hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel);
    }
    function pan(node, p) {
      const pn = ctx.createStereoPanner();
      pn.pan.value = p;
      node.connect(pn);
      return pn;
    }
    function noiseSrc(buf, t0, dur, loop = true) {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = loop;
      s.start(t0, (t0 * 1.37) % 3);
      s.stop(t0 + dur);
      return s;
    }

    // --- instruments
    function piano(t, m, vel = 0.2, p = 0, dest = dry) {
      const f = hz(m);
      const g = ctx.createGain();
      [[1, 1], [2, 0.35], [3, 0.12], [4, 0.05]].forEach(([k, a]) => {
        const o = ctx.createOscillator();
        o.type = k === 1 ? 'triangle' : 'sine';
        o.frequency.value = f * k * (1 + (k - 1) * 0.0008);
        const og = ctx.createGain();
        og.gain.value = a;
        o.connect(og).connect(g);
        o.start(t);
        o.stop(t + 4.5);
      });
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.005);
      g.gain.exponentialRampToValueAtTime(vel * 0.3, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.4);
      pan(g, p).connect(dest);
    }
    function pad(t0, t1, notes, gain, cutoff = 1100, a = 0.8, r = 1.2, type = 'sawtooth') {
      const out = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cutoff;
      lp.Q.value = 0.4;
      lp.connect(out);
      notes.forEach((m, i) => {
        for (const det of [-7, 6]) {
          const o = ctx.createOscillator();
          o.type = type;
          o.frequency.value = hz(m);
          o.detune.value = det + (i % 2 ? 3 : -2);
          const og = ctx.createGain();
          og.gain.value = 1 / (notes.length * 2);
          o.connect(og);
          pan(og, det < 0 ? -0.35 : 0.35).connect(lp);
          o.start(t0);
          o.stop(t1 + r + 0.1);
        }
      });
      out.gain.setValueAtTime(0, t0);
      out.gain.linearRampToValueAtTime(gain, t0 + a);
      out.gain.setValueAtTime(gain, Math.max(t0 + a, t1));
      out.gain.linearRampToValueAtTime(0, t1 + r);
      out.connect(dry);
    }
    function pluck(t, m, vel = 0.08, p = 0) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz(m);
      const g = ctx.createGain();
      env(g, t, 0.004, vel, 0, 0.35);
      o.connect(g);
      pan(g, p).connect(dry);
      o.start(t);
      o.stop(t + 0.5);
    }
    function ostinato(t, m, vel = 0.12) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1800, t);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.12);
      const g = ctx.createGain();
      env(g, t, 0.004, vel, 0.02, 0.1);
      o.connect(lp).connect(g).connect(dry);
      o.start(t);
      o.stop(t + 0.2);
    }
    function boom(t, vel = 0.9, f0 = 90) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.6);
      const g = ctx.createGain();
      env(g, t, 0.005, vel, 0.05, 1.6);
      o.connect(g).connect(dry);
      o.start(t);
      o.stop(t + 2);
      const n = noiseSrc(noise, t, 0.4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const ng = ctx.createGain();
      env(ng, t, 0.002, vel * 0.5, 0, 0.3);
      n.connect(lp).connect(ng).connect(dry);
    }
    function sfxNoise(t, dur, type, freq, vel, q = 0.8, p = 0, a = 0.005) {
      const n = noiseSrc(noise, t, dur + 0.05);
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      env(g, t, a, vel, 0, Math.max(0.01, dur - a));
      n.connect(f).connect(g);
      pan(g, p).connect(dry);
    }
    function tone(t, f, dur, vel, type = 'sine', p = 0) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      env(g, t, 0.003, vel, 0, dur);
      o.connect(g);
      pan(g, p).connect(dry);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    function heartbeat(t, vel) {
      for (const [d, v] of [[0, 1], [0.22, 0.7]]) {
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(70, t + d);
        o.frequency.exponentialRampToValueAtTime(40, t + d + 0.12);
        const g = ctx.createGain();
        env(g, t + d, 0.01, vel * v, 0.02, 0.16);
        o.connect(g).connect(dry);
        o.start(t + d);
        o.stop(t + d + 0.3);
      }
    }
    function swellNoise(t0, t1, buf, type, freq, peak, dest = dry) {
      const n = noiseSrc(buf, t0, t1 - t0);
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + (t1 - t0) * 0.4);
      g.gain.linearRampToValueAtTime(peak * 0.8, t0 + (t1 - t0) * 0.8);
      g.gain.linearRampToValueAtTime(0, t1);
      n.connect(f).connect(g).connect(dest);
      return f;
    }

    // ------------------------------------------------------------ OPENING
    const wind = swellNoise(0, 12.5, noise, 'bandpass', 420, 0.09);
    wind.Q.value = 0.7;
    wind.frequency.setValueCurveAtTime(new Float32Array([300, 520, 380, 600, 340, 450]), 0, 12.4);
    pad(1.5, 10.2, [38, 45], 0.07, 400, 3, 1.5);
    [[1.9, 62], [2.9, 69], [3.9, 66], [4.9, 64], [5.9, 62], [6.9, 57]].forEach(([t, m], i) => piano(t, m, 0.13 + i * 0.01, (i % 2 ? 0.2 : -0.2)));
    [4.0, 4.5, 5.0, 5.5].forEach((t) => sfxNoise(t + 0.1, 0.28, 'highpass', 2200, 0.07, 0.6, 0.3, 0.06));
    sfxNoise(5.95, 0.65, 'bandpass', 5000, 0.02, 2, -0.3, 0.05); // the pen
    // hammer on stone
    tone(6.95, 1760, 0.4, 0.12, 'sine', -0.3);
    tone(6.95, 2640, 0.25, 0.06, 'sine', -0.3);
    sfxNoise(6.95, 0.18, 'lowpass', 500, 0.3, 0.8, -0.3);
    // telescope turns
    sfxNoise(7.75, 0.75, 'bandpass', 900, 0.03, 3, -0.2, 0.2);
    // gears: tick, then jam
    for (let t = 8.95; t < 9.3; t += 0.09) sfxNoise(t, 0.03, 'highpass', 3000, 0.08, 1, 0.3);
    boom(9.3, 0.25, 70);
    sfxNoise(9.3, 0.25, 'lowpass', 300, 0.3, 1, 0.3);
    // tried again: ticks accelerate
    for (let t = 10.25, dt = 0.2; t < 11.0; t += dt, dt *= 0.82) sfxNoise(t, 0.03, 'highpass', 3000, 0.09, 1, 0.3);

    // ------------------------------------------------------------ THE THEME
    // strings across the acts, shaped by section
    const dyn = [
      [10.9, 0.12], [13, 0.16], [18.9, 0.2], [30, 0.2], [37.6, 0.13], [47, 0.05], [50.4, 0.28], [55.8, 0.22],
      [60.6, 0.07], [67.4, 0.18], [73.4, 0],
    ];
    const dynAt = (t) => { let v = 0; for (const [s, g] of dyn) if (t >= s) v = g; return v; };
    boom(10.9, 0.6, 80);
    for (let t = START; t < 73.3; t += BAR) {
      const g = dynAt(t);
      if (g <= 0) continue;
      const chord = chordAt(t);
      const end = Math.min(t + BAR, 73.4);
      pad(t, end - 0.05, chord.slice(0, 4), g, g > 0.2 ? 1600 : 1000, 0.25, 0.45);
      pad(t, end - 0.05, [chord[0] - 12], g * 0.7, 300, 0.2, 0.45, 'triangle');
    }
    // piano arpeggios over reason, civic, beauty
    for (let t = START; t < 37.5; t += 0.3) {
      const chord = chordAt(t), k = Math.round((t - START) / 0.3);
      const m = chord[1 + (k % 4)] + 12;
      piano(t, m, t < 18.9 ? 0.05 : 0.065, ((k % 4) - 1.5) * 0.25);
    }
    // a melody for beauty
    [[30.4, 74], [31.6, 73], [32.2, 71], [33.2, 69], [34.4, 71], [35.0, 74], [35.6, 76], [36.8, 78]].forEach(([t, m]) => piano(t, m, 0.16, 0.1));
    // voices murmur in the civic space
    for (let i = 0; i < 18; i++) sfxNoise(17.6 + i * 0.13, 0.3, 'bandpass', 500 + (i * 137) % 600, 0.035, 4, ((i * 0.37) % 1) * 1.2 - 0.6, 0.08);
    // words land like stone
    [19.75, 20.25, 20.75, 21.25, 21.75].forEach((t) => boom(t, 0.3, 60));
    sfxNoise(22.95, 1.0, 'lowpass', 200, 0.12, 1, 0, 0.4); // dissolving throne
    boom(26.5, 0.5, 70); // the press
    sfxNoise(26.5, 0.12, 'lowpass', 900, 0.25);
    for (let i = 0; i < 30; i++) sfxNoise(28.2 + i * 0.07, 0.08, 'bandpass', 1800, 0.03, 1.5, ((i * 0.61) % 1) * 1.6 - 0.8); // wings
    // science: a lonely high line, then the struck model
    [[38.2, 81], [39.8, 78], [41.0, 76], [43.2, 74], [44.6, 73], [46.0, 71]].forEach(([t, m]) => piano(t, m, 0.1, -0.2));
    sfxNoise(42.9, 0.4, 'highpass', 1800, 0.06, 1, 0, 0.02);
    sfxNoise(43.35, 0.8, 'highpass', 1200, 0.1, 0.6, 0, 0.01); // it shatters
    for (let i = 0; i < 12; i++) pluck(43.6 + i * 0.12, 86 - (i % 5) * 2, 0.04, ((i % 3) - 1) * 0.5);
    // ------------------------------------------------------------ INDUSTRY
    boom(47.45, 0.3, 60); sfxNoise(47.45, 0.2, 'lowpass', 400, 0.3); // fails
    boom(48.15, 0.3, 60); sfxNoise(48.15, 0.2, 'lowpass', 400, 0.3);
    tone(49.05, 3200, 0.3, 0.03); // the glint
    sfxNoise(49.6, 0.03, 'highpass', 2500, 0.5); // CLICK
    tone(49.6, 1400, 0.06, 0.1);
    for (let t = 49.6, dt = 0.28; t < 50.4; t += dt, dt *= 0.8) sfxNoise(t, 0.03, 'highpass', 2800, 0.12);
    boom(50.4, 1.0, 100);
    swellNoise(50.3, 51.9, noise, 'highpass', 2000, 0.05); // steam
    for (let t = 50.4; t < 55.5; t += 0.15) ostinato(t, chordAt(t)[0], 0.1);
    for (let t = 50.4; t < 55.5; t += 1.2) boom(t, 0.45, 80);
    swellNoise(51.8, 53.3, brown, 'lowpass', 300, 0.35); // the train
    for (let t = 51.9; t < 53.3; t += 0.18) sfxNoise(t, 0.05, 'lowpass', 700, 0.1);
    sfxNoise(55.45, 0.6, 'highpass', 1500, 0.3, 0.5, 0, 0.005); // lightning
    boom(55.45, 0.6, 120);
    // ------------------------------------------------------------ CONNECTION
    ['s', 'l', 's', 's', '', 'l', 's', 'l'].forEach((c, i) => c && tone(55.95 + i * 0.1, 760, c === 'l' ? 0.12 : 0.05, 0.06, 'sine', 0.2));
    for (let i = 0; i < 12; i++) tone(56.7 + i * 0.1, 300 + Math.sin(i) * 80, 0.12, 0.03, 'triangle', -0.3 + i * 0.05); // a voice on the wire
    for (let t = 55.8; t < 60.4; t += 0.15) pluck(t, chordAt(t)[1 + (Math.round(t / 0.15) % 4)] + 24, 0.05, Math.sin(t * 3) * 0.6);
    // ------------------------------------------------------------ MEDICINE
    for (let t = 60.6; t < 65.0; t += 1.5) heartbeat(t, 0.35);
    for (let t = 65.0; t < 68; t += 0.82) heartbeat(t, 0.55);
    [[61.4, 66], [62.6, 64], [63.8, 62], [65.6, 69], [66.4, 74]].forEach(([t, m]) => piano(t, m, 0.12));
    // ------------------------------------------------------------ EXPLORATION
    for (let t = 67.4; t < 71.3; t += 0.3) piano(t, chordAt(t)[1 + (Math.round(t / 0.3) % 4)] + 12, 0.05 + (t - 67.4) * 0.012);
    pad(69.0, 73.35, [38, 45, 50, 54, 57, 62], 0.3, 2400, 2.5, 0.02);
    swellNoise(71.4, 73.4, brown, 'lowpass', 160, 1.2); // ignition
    boom(71.4, 1.0, 70);
    boom(72.6, 0.8, 60);
    // silence, then a breath of light in space
    pad(76.5, 81.2, [74, 81], 0.025, 3000, 3, 1.2, 'sine');
    // ------------------------------------------------------------ COMPUTATION
    for (let t = 81.6; t < 87.0; t += 0.125) {
      const k = Math.round((t - 81.6) / 0.125);
      pluck(t, CH[PROG[Math.floor((t - 81.6) / 1.2) % 4]][1 + (k % 4)] + 24, 0.045, ((k % 4) - 1.5) * 0.4);
    }
    pad(81.6, 86.8, [50, 57, 62], 0.07, 900, 1.5, 1.2);
    // ------------------------------------------------------------ INHERITANCE
    sfxNoise(86.95, 0.4, 'lowpass', 800, 0.15, 0.8, 0, 0.1); // the book closes
    boom(87.75, 0.25, 50);
    sfxNoise(87.8, 1.0, 'bandpass', 700, 0.04, 1, 0, 0.3); // it slides
    [[89.4, 62], [90.4, 66], [91.4, 69], [92.6, 71], [93.8, 69], [94.8, 74]].forEach(([t, m]) => piano(t, m, 0.13));
    pad(89.0, 96.4, [47, 54, 59, 62], 0.07, 800, 2, 0.8);
    boom(91.0, 0.35, 50); sfxNoise(91.0, 0.5, 'lowpass', 500, 0.2); // collapse
    sfxNoise(92.55, 0.3, 'highpass', 900, 0.05); // sag
    pad(94.3, 96.9, [50, 57, 62, 66, 69], 0.16, 2200, 0.4, 0.3); // it works
    tone(94.3, hz(86), 2.5, 0.03);
    // ------------------------------------------------------------ THE CHAIN
    for (let i = 0; i < 15; i++) {
      const t = 96.7 + i * 0.2;
      boom(t, 0.2 + i * 0.02, 70 + i * 4);
      piano(t, [50, 54, 57, 62, 66, 69, 74, 78][i % 8] + (i >= 8 ? 0 : 0), 0.08 + i * 0.006);
    }
    pad(96.6, 99.72, [38, 50, 57, 62, 66], 0.26, 2600, 2.8, 0.03);
    swellNoise(97.2, 99.72, noise, 'highpass', 3000, 0.08);
    // ------------------------------------------------------------ QUESTIONS & LEGACY
    [[100.3, 62], [101.3, 66], [102.3, 69], [103.5, 64], [104.7, 62], [105.5, 66], [106.1, 69]].forEach(([t, m]) => piano(t, m, 0.12));
    pad(100.2, 106.6, [47, 54, 59], 0.05, 700, 2, 1);
    // the pullback: strings rise and resolve
    const rise = [['G', 106.4], ['D', 108.4], ['A', 110.4], ['Bm', 111.8], ['G', 113.0]];
    rise.forEach(([c, t], i) => pad(t, (rise[i + 1] || [0, 114.4])[1], CH[c], 0.14 + i * 0.03, 1400 + i * 300, 0.8, 0.5));
    pad(114.4, 122.5, [38, 50, 57, 62, 66, 69, 74], 0.42, 2600, 0.6, 3.3);
    boom(114.4, 0.5, 60);
    [[107.0, 74], [108.4, 73], [109.8, 71], [110.3, 69], [111.6, 71], [112.5, 74], [113.4, 76], [114.4, 78]].forEach(([t, m]) => piano(t, m, 0.15, 0.1));
    // title
    piano(116.4, 62, 0.14);
    piano(116.4, 50, 0.1);
    piano(123.3, 74, 0.16);
    piano(123.3, 62, 0.1);
    pad(119.0, 124.5, [50, 57, 62], 0.06, 900, 2, 1.5, 'triangle');

    return ctx.startRendering();
  }

  function toWavBase64(buf) {
    const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const bytes = new Uint8Array(44 + len * ch * 2);
    const v = new DataView(bytes.buffer);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true);
    v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, len * ch * 2, true);
    const data = [];
    for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { v.setInt16(o, Math.max(-1, Math.min(1, data[c][i])) * 32767, true); o += 2; }
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }

  return { render, toWavBase64 };
})();
