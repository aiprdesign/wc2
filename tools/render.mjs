// Export the film to MP4 (H.264 + AAC) with its score, plus an SRT of the voiceover.
//
//   npm install            # playwright
//   FFMPEG=/path/to/ffmpeg node tools/render.mjs [out/the-inheritance.mp4] [--workers 3] [--from 0 --to 126]
//
// Frames are rendered headlessly by the same code the browser player uses, so the
// export is frame-exact. Needs an ffmpeg build with libx264 and aac.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const out = path.resolve(args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'out/the-inheritance.mp4');
const workers = parseInt(opt('--workers', String(Math.max(1, Math.min(4, os.cpus().length - 1)))), 10);
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inheritance-'));
fs.mkdirSync(path.dirname(out), { recursive: true });
const server = await serve(path.resolve(here, '../film'));
const url = `http://127.0.0.1:${server.address().port}/?export`;
const browser = await chromium.launch();

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.FILM_READY, null, { timeout: 60000 });
  return page;
}

const first = await openPage();
const meta = await first.evaluate(() => ({ duration: window.FILM.duration, fps: window.FILM.fps, cues: window.FILM.cues }));
const from = parseFloat(opt('--from', '0')), to = parseFloat(opt('--to', String(meta.duration)));
const f0 = Math.round(from * meta.fps), f1 = Math.round(to * meta.fps);
const total = f1 - f0;
console.log(`rendering ${total} frames at ${meta.fps} fps with ${workers} workers`);

// score
const t0 = Date.now();
const wav = await first.evaluate(() => window.FILM.audio(48000));
fs.writeFileSync(path.join(tmp, 'score.wav'), Buffer.from(wav, 'base64'));
console.log(`score rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (args.includes('--audio-only')) {
  fs.copyFileSync(path.join(tmp, 'score.wav'), out.replace(/\.mp4$/, '.wav'));
  await browser.close();
  server.close();
  process.exit(0);
}

// frames
let done = 0;
const started = Date.now();
async function work(page, w) {
  for (let f = f0 + w; f < f1; f += workers) {
    const data = await page.evaluate((t) => {
      window.FILM.frame(t);
      return document.getElementById('film').toDataURL('image/jpeg', 0.95);
    }, f / meta.fps);
    fs.writeFileSync(path.join(tmp, `f${String(f - f0).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    if (++done % 150 === 0) {
      const rate = done / ((Date.now() - started) / 1000);
      console.log(`  ${done}/${total} frames (${rate.toFixed(1)}/s)`);
    }
  }
}
const pages = [first];
for (let i = 1; i < workers; i++) pages.push(await openPage());
await Promise.all(pages.map((p, i) => work(p, i)));
await browser.close();
server.close();

const enc = spawnSync(ffmpeg, [
  '-y', '-loglevel', 'error',
  '-framerate', String(meta.fps), '-i', path.join(tmp, 'f%06d.jpg'),
  '-ss', String(from), '-i', path.join(tmp, 'score.wav'),
  '-map', '0:v', '-map', '1:a', '-shortest',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'film',
  '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart',
  out,
], { stdio: 'inherit' });
if (enc.status !== 0) process.exit(enc.status || 1);

// captions as a sidecar, timed for a narrator
const ts = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const srt = meta.cues.map(([s, e, t], i) => `${i + 1}\n${ts(s)} --> ${ts(e)}\n${t}\n`).join('\n');
fs.writeFileSync(out.replace(/\.mp4$/, '.srt'), srt);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${out}`);
