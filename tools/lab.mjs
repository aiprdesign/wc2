// Render individual models from film3d/lab.html:  node tools/lab.mjs <outDir> parthenon eiffel ...
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, ...names] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const server = await serve(path.resolve(here, '..'));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('page:', m.text()));
await page.goto(`http://127.0.0.1:${server.address().port}/film3d/lab.html`);
await page.waitForFunction(() => window.FILM_READY, null, { timeout: 30000 });
for (const n of names) {
  try {
    const t0 = Date.now();
    const [nm, f] = n.split(':');
    const data = await page.evaluate(([nm, f]) => window.FILM.capture(nm, parseFloat(f || '1')), [nm, f]);
    fs.writeFileSync(path.join(outDir, `${n.replace(':', '_')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    console.log(n, Date.now() - t0, 'ms');
  } catch (e) { console.error(n, e.message.split('\n')[0]); }
}
await browser.close();
server.close();
