// Render individual frames to PNG for review.
//   node tools/stills.mjs <outDir> <t1> <t2> ...
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const server = await serve(path.resolve(here, '../film'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => m.type() === 'error' && console.error('page:', m.text()));
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/?export`);
await page.waitForFunction(() => window.FILM_READY, null, { timeout: 30000 });
for (const t of times) {
  const data = await page.evaluate((t) => {
    window.FILM.frame(parseFloat(t));
    return document.getElementById('film').toDataURL('image/jpeg', 0.85);
  }, t);
  const file = path.join(outDir, `t${String(t).padStart(6, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  console.log(file);
}
await browser.close();
server.close();
