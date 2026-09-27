// Render individual frames to PNG for review.
//   node tools/stills.mjs [--film film3d] <outDir> <t1> <t2> ...
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const di = argv.indexOf('--film');
const filmDir = di >= 0 ? argv.splice(di, 2)[1] : 'film';
const [outDir, ...times] = argv;
fs.mkdirSync(outDir, { recursive: true });

const server = await serve(path.resolve(here, '..'));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => m.type() === 'error' && console.error('page:', m.text()));
page.on('response', (r) => r.status() >= 400 && console.error('http', r.status(), r.url()));
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/${filmDir}/?export`);
await page.waitForFunction(() => window.FILM_READY, null, { timeout: 30000 });
for (const t of times) {
  const data = await page.evaluate((t) => {
    if (window.FILM.capture) return window.FILM.capture(parseFloat(t), 0.85);
    window.FILM.frame(parseFloat(t));
    return document.getElementById('film').toDataURL('image/jpeg', 0.85);
  }, t);
  const file = path.join(outDir, `t${String(t).padStart(6, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  console.log(file);
}
await browser.close();
server.close();
