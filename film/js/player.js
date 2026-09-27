/* THE INHERITANCE — player: playback, scrubbing, sound, and the export hook. */
'use strict';

(function () {
  const canvas = document.getElementById('film');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(location.search);
  const exporting = params.has('export');
  if (exporting) document.body.classList.add('export');

  const $ = (id) => document.getElementById(id);
  const CHAPTERS = [
    ['open', 'Inheritance'], ['reason', 'Reason'], ['civic', 'Law'], ['beauty', 'Beauty'],
    ['science', 'Science'], ['industry', 'Industry'], ['connect', 'Connection'], ['medicine', 'Medicine'],
    ['explore', 'Exploration'], ['compute', 'Computation'], ['inherit', 'Entrusted'], ['chain', 'The Chain'],
    ['questions', 'The Chain'], ['pullback', 'Legacy'], ['title', 'Legacy'],
  ];

  let t = clamp(parseFloat(params.get('t')) || 0, 0, DURATION);
  let playing = false, wallStart = 0, tStart = 0;
  let audio = null, source = null, gain = null, buffer = null, soundOn = true;

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function draw() {
    Film.render(ctx, t);
    if (!exporting) {
      $('time').textContent = `${fmt(t)} / ${fmt(DURATION)}`;
      $('scrub').value = Math.round((t / DURATION) * 1000);
      let ch = '';
      for (const [k, name] of CHAPTERS) if (t >= T[k][0]) ch = name;
      $('chapter').textContent = ch;
    }
  }

  function now() {
    if (audio && source) return tStart + (audio.currentTime - wallStart);
    return tStart + (performance.now() / 1000 - wallStart);
  }
  function loop() {
    if (!playing) return;
    t = now();
    if (t >= DURATION) {
      t = DURATION;
      pause();
      draw();
      return;
    }
    draw();
    requestAnimationFrame(loop);
  }
  function startAudioAt(offset) {
    stopAudio();
    if (!audio || !buffer || !soundOn) return;
    source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start(0, offset);
    wallStart = audio.currentTime;
  }
  function stopAudio() {
    if (source) {
      try { source.stop(); } catch (e) { /* already stopped */ }
      source.disconnect();
      source = null;
    }
  }
  function play() {
    if (t >= DURATION - 0.05) t = 0;
    playing = true;
    tStart = t;
    wallStart = performance.now() / 1000;
    startAudioAt(t);
    $('play').textContent = 'Pause';
    $('play').setAttribute('aria-label', 'Pause');
    requestAnimationFrame(loop);
  }
  function pause() {
    if (playing) t = now();
    playing = false;
    stopAudio();
    $('play').textContent = 'Play';
    $('play').setAttribute('aria-label', 'Play');
  }
  async function prepareSound() {
    if (buffer) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
    gain = audio.createGain();
    gain.connect(audio.destination);
    $('status').textContent = 'Composing the score…';
    try {
      buffer = await Score.render(audio.sampleRate);
    } catch (e) {
      console.error(e);
      $('status').textContent = 'The score could not be prepared; playing without sound.';
    }
  }

  async function boot() {
    try {
      await Promise.all([
        document.fonts.load('400 40px "Cinzel"'),
        document.fonts.load('600 40px "Cinzel"'),
        document.fonts.load('italic 500 40px "Cormorant Garamond"'),
        document.fonts.load('italic 400 40px "Cormorant Garamond"'),
        document.fonts.load('500 40px "Cormorant Garamond"'),
      ]);
    } catch (e) { /* fall back to system serif */ }
    Film.init();
    if (exporting) {
      window.FILM = {
        duration: DURATION,
        fps: FPS,
        cues: CUES,
        frame(time) { t = time; Film.render(ctx, t); },
        async audio(sampleRate = 48000) {
          const buf = await Score.render(sampleRate);
          return Score.toWavBase64(buf);
        },
      };
      window.FILM_READY = true;
      return;
    }
    if (t === 0) {
      t = 116.8; // poster frame behind the gate
      draw();
      t = 0;
    } else draw();

    $('start').addEventListener('click', async () => {
      $('start').disabled = true;
      await prepareSound();
      $('gate').hidden = true;
      if (audio && audio.state === 'suspended') await audio.resume();
      play();
    });
    $('play').addEventListener('click', async () => {
      if (!$('gate').hidden) return $('start').click();
      playing ? pause() : play();
    });
    $('scrub').addEventListener('input', (e) => {
      const was = playing;
      if (was) pause();
      t = (e.target.value / 1000) * DURATION;
      $('gate').hidden = true;
      draw();
      if (was) play();
    });
    $('cc').addEventListener('click', () => {
      Film.captions = !Film.captions;
      $('cc').setAttribute('aria-pressed', String(Film.captions));
      if (!playing) draw();
    });
    $('snd').addEventListener('click', async () => {
      soundOn = !soundOn;
      $('snd').setAttribute('aria-pressed', String(soundOn));
      if (soundOn) await prepareSound();
      if (playing) { const cur = now(); tStart = cur; t = cur; wallStart = soundOn && audio ? audio.currentTime : performance.now() / 1000; soundOn ? startAudioAt(cur) : stopAudio(); if (!soundOn) wallStart = performance.now() / 1000; }
    });
    $('fs').addEventListener('click', () => {
      const el = document.querySelector('.stage');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'BUTTON') { e.preventDefault(); $('play').click(); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        const was = playing;
        if (was) pause();
        t = clamp(t + (e.code === 'ArrowRight' ? 5 : -5), 0, DURATION);
        $('gate').hidden = true;
        draw();
        if (was) play();
      }
    });
  }
  boot();
})();
