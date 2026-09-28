// Converts a TrueType/WOFF font into three.js typeface JSON for extruded 3D lettering.
//   npm pack opentype.js   # extract it
//   node tools/build-typeface.mjs <font.woff> <opentype dir> <out.json>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [src, otDir, out] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const opentype = require(path.resolve(otDir, 'dist/opentype.js'));
const buf = fs.readFileSync(src);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = 1000 / font.unitsPerEm;
const r = (v) => Math.round(v * scale);
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?\'"-–—·&()/+=';
const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  if (!g) continue;
  let o = '';
  for (const c of g.path.commands) {
    if (c.type === 'M') o += `m ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'L') o += `l ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Q') o += `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
    else if (c.type === 'C') o += `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.trim() };
}
// glyph.path is in font units, y-up, which is what the typeface format expects
const json = {
  glyphs,
  familyName: process.argv[5] || 'Cinzel',
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: 0,
  underlineThickness: 0,
  boundingBox: { yMin: r(font.tables.head.yMin), xMin: r(font.tables.head.xMin), yMax: r(font.tables.head.yMax), xMax: r(font.tables.head.xMax) },
  resolution: 1000,
  original_font_information: { copyright: 'OFL font', license: 'SIL Open Font License 1.1' },
};
fs.writeFileSync(out, JSON.stringify(json));
console.log(`${Object.keys(glyphs).length} glyphs -> ${out}`);
