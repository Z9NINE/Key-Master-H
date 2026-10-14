// node loader/tools/cut.mjs
// Precomputes the key cutout (CUT_FIELD minus the logo's lock) as one path and writes it into
// loader/src/logo-geometry.js as G.CUT, so the loader can cut with a cheap clip path instead of a mask.
// Only needed if the logo changes. Needs: npm i -D playwright polygon-clipping && npx playwright install chromium
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import polygonClipping from 'polygon-clipping';
const geoSrc = await readFile('loader/src/logo-geometry.js', 'utf8');
const G = JSON.parse(geoSrc.slice(geoSrc.indexOf('{'), geoSrc.lastIndexOf('}') + 1));
const b = await chromium.launch();
const pg = await b.newPage();
const sample = (d) => pg.evaluate((d) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); document.body.appendChild(svg);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); svg.appendChild(p);
  const L = p.getTotalLength(), pts = [];
  for (let s = 0; s < L; s += 0.05) { const q = p.getPointAtLength(s); pts.push([q.x, q.y]); }
  return pts;
}, d);
const lock = await sample(G.LOCK), field = await sample(G.CUT_FIELD);
await b.close();
// Douglas-Peucker, tolerance in logo units (0.01 = about 0.01px on a phone, 0.008px in the header)
function simplify(pts, tol) {
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, z] = stack.pop(); let idx = -1, max = 0;
    const [ax, ay] = pts[a], [zx, zy] = pts[z], dx = zx - ax, dy = zy - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < z; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len; if (d > max) { max = d; idx = i; } }
    if (max > tol) { keep[idx] = 1; stack.push([a, idx], [idx, z]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const ring = (pts) => { const r = simplify(pts, 0.01); r.push(r[0]); return r; };
const cut = polygonClipping.difference([ring(field)], [ring(lock)]);
const f = (v) => Math.round(v * 100) / 100;
const d = cut.map((poly) => poly.map((r) => 'M' + r.slice(0, -1).map(([x, y]) => `${f(x)},${f(y)}`).join('L') + 'Z').join('')).join('');
console.log('polygons', cut.length, 'points', cut.flat(2).length, 'path chars', d.length);
for (const file of ['loader/src/logo-geometry.js']) {
  const src = await readFile(file, 'utf8'), g = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  g.CUT = d;
  await writeFile(file, src.slice(0, src.indexOf('export const G')) .replace('// The key cutout is not stored: it is CUT_FIELD minus LOCK, computed in SVG at render time.', '// CUT is the key cutout: CUT_FIELD minus LOCK, precomputed by tools/cut.mjs so the loader can clip instead of mask.') + 'export const G = ' + JSON.stringify(g, null, 1) + ';\n');
}
