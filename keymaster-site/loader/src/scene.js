import { spring, track, lerp, mulberry32 } from '../lib/motion.js';
import { G } from './logo-geometry.js';

// Key Master loader. seek(t) paints frame t; nothing carries between frames.
// Logo units are the site logo's own SVG units (viewBox 612 x 300.14).

export const BEAT = 0.5; // 120 BPM grid: turns, morph, click and dock all land on it
const SQUARE_C = [98.25, 175.28]; // square / plain body centre
const MARK_C = [98.25, 148.6];   // lock mark centre (shackle + body)
const LOCKUP_C = [306, 150.07];  // full logo centre
const KEY_FROM = -205;           // key cutout starts fully above the body
const BLADE_RIDGES = [159.9, 196.9, 233.9]; // y of the ridges in the key blade
const TOP_Y = 85.1;              // top edge of the plain body
const TIP_DEPTH = 31.74;         // how far the key tip pushes the bottom triangle out
const TIP_PARK = TIP_DEPTH + 4;  // where the triangle waits, tucked fully inside the body
const SHACKLE_LOCKED = 18;       // shackle sits this far lower while locked
const SHACKLE_POP = -42;         // how far the shackle shoots up on the click before springing back
const MIN_TURNS = 2;             // the square always completes at least this many quarter-turns
const NS = 'http://www.w3.org/2000/svg';

export function schedule(loadedAt = Infinity) {
  const L = loadedAt;
  const n = Number.isFinite(L) ? Math.max(MIN_TURNS, Math.ceil(L / BEAT)) : Infinity; // quarter-turns before unlocking
  const T1 = n * BEAT;         // spinning stops, square becomes the locked lock
  const Tk = T1 + BEAT / 2;    // key cutout starts pushing in
  const Tc = Tk + BEAT;        // key bottoms out: click, unlock
  const Tw = Tc + BEAT / 2;    // wordmark rises
  const Td = Tc + 2 * BEAT;    // logo docks into the header, frost clears
  return { L, n, T1, Tk, Tc, Tw, Td, Tf: Td + BEAT / 4, end: Td + 0.7 };
}

const keyOffset = (s, t) => KEY_FROM * (1 - spring(t - s.Tk, 'heavy'));

const shackleOffset = (s) => track(110, [
  { at: s.T1 + 0.05, to: SHACKLE_LOCKED, preset: 'default' },
  { at: s.Tc, to: SHACKLE_POP, preset: 'snappy' },
  { at: s.Tc + 0.11, to: 0, preset: 'default' },
]);

// First time after `from` that f(t) satisfies ok().
function when(from, f, ok) {
  for (let t = from; t < from + 2; t += 1 / 2000) if (ok(f(t))) return t;
  return from;
}

export function events(loadedAt) {
  const s = schedule(loadedAt);
  const turns = Array.from({ length: s.n }, (_, k) => k * BEAT);
  return {
    ...s,
    turns,
    tipEnters: when(s.Tk, (t) => keyOffset(s, t), (o) => 280.11 + o >= TOP_Y),
    ridges: BLADE_RIDGES.slice().reverse().map((y) => when(s.Tk, (t) => keyOffset(s, t), (o) => y + o >= TOP_Y)),
    tipPush: when(s.Tk, (t) => keyOffset(s, t), (o) => o >= -TIP_PARK),
    shackleLands: when(s.Tc + 0.11, shackleOffset(s), (v) => v >= -0.5),
  };
}

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

const fmt = (v) => Math.round(v * 100) / 100;

function roundedRect([x, y, w, h, r]) {
  const k = 0.5521 * r; // same corner curve as the logo
  return `M${fmt(x + r)},${fmt(y)}H${fmt(x + w - r)}C${fmt(x + w - r + k)},${fmt(y)} ${fmt(x + w)},${fmt(y + r - k)} ${fmt(x + w)},${fmt(y + r)}`
    + `V${fmt(y + h - r)}C${fmt(x + w)},${fmt(y + h - r + k)} ${fmt(x + w - r + k)},${fmt(y + h)} ${fmt(x + w - r)},${fmt(y + h)}`
    + `H${fmt(x + r)}C${fmt(x + r - k)},${fmt(y + h)} ${fmt(x)},${fmt(y + h - r + k)} ${fmt(x)},${fmt(y + h - r)}`
    + `V${fmt(y + r)}C${fmt(x)},${fmt(y + r - k)} ${fmt(x + r - k)},${fmt(y)} ${fmt(x + r)},${fmt(y)}Z`;
}

// opts: { vw, vh, dock: {x,y,w,h} | () => {x,y,w,h}, frost: 'canvas' | 'backdrop', page: HTMLImageElement, dpr }
export function createScene(host, opts) {
  let { vw, vh } = opts;
  const getDock = typeof opts.dock === 'function' ? opts.dock : () => opts.dock;
  let loadedAt = opts.loadedAt ?? Infinity;

  host.style.cssText += ';position:fixed;inset:0;overflow:hidden;z-index:2147483000;pointer-events:auto;';

  // Frost
  let canvas, ctx, grain, frostDiv;
  if (opts.frost === 'canvas') {
    const dpr = opts.dpr || 1;
    canvas = document.createElement('canvas');
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.cssText = `position:absolute;inset:0;width:${vw}px;height:${vh}px;`;
    host.appendChild(canvas);
    ctx = canvas.getContext('2d');
    grain = document.createElement('canvas');
    grain.width = canvas.width; grain.height = canvas.height;
    const g = grain.getContext('2d'), img = g.createImageData(grain.width, grain.height), rnd = mulberry32(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  } else {
    frostDiv = document.createElement('div');
    frostDiv.style.cssText = 'position:absolute;inset:0;';
    host.appendChild(frostDiv);
  }

  // Mark + wordmark
  const svg = el('svg', { width: vw, height: vh, viewBox: `0 0 ${vw} ${vh}` });
  svg.style.cssText = 'position:absolute;inset:0;overflow:visible;';
  host.appendChild(svg);
  const defs = el('defs', {}, svg);
  const big = { x: -2000, y: -2000, width: 4000, height: 4000 };
  const maskAttrs = (id) => ({ id, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', ...big });
  // The key cutout is exactly what the logo removes from the plain body: (body + tip) minus the logo.
  const notLogo = el('mask', maskAttrs('km-notlogo'), defs);
  el('rect', { ...big, fill: '#fff' }, notLogo);
  el('path', { d: G.LOCK, fill: '#000' }, notLogo);
  const mask = el('mask', maskAttrs('km-key'), defs);
  el('rect', { ...big, fill: '#fff' }, mask);
  const keyHole = el('g', {}, mask);
  const keyShape = el('g', { mask: 'url(#km-notlogo)' }, keyHole);
  el('path', { d: G.CUT_FIELD, fill: '#000' }, keyShape);
  // Legs stay seated: anything of the shackle below the body is clipped away.
  const seat = el('clipPath', { id: 'km-seat' }, defs);
  el('rect', { x: -100, y: -400, width: 400, height: 655 }, seat);

  const lockup = el('g', { fill: G.GOLD }, svg);
  const intro = el('g', {}, lockup);           // square entrance scale
  const rot = el('g', {}, intro);               // quarter turns
  const squash = el('g', {}, rot);              // click impulse
  const shackleSeat = el('g', { 'clip-path': 'url(#km-seat)' }, squash);
  const shackle = el('path', { d: G.SHACKLE }, shackleSeat); // behind the body
  const bodyGroup = el('g', { mask: 'url(#km-key)' }, squash);
  const body = el('path', { d: roundedRect(G.SQUARE_RECT) }, bodyGroup);
  const tip = el('path', { d: G.TIP }, bodyGroup);   // pushed out by the key tip

  const rows = [G.WORD_KEY, G.WORD_MASTER].map((paths, i) => {
    const clip = el('clipPath', { id: `km-row${i}` }, defs);
    const outer = el('g', { 'clip-path': `url(#km-row${i})` }, lockup);
    const inner = el('g', {}, outer);
    paths.forEach((d) => el('path', { d }, inner));
    const b = inner.getBBox();
    el('rect', { x: b.x - 8, y: b.y - 4, width: b.width + 16, height: b.height + 8 }, clip);
    return { inner, rise: b.height + 12 };
  });


  function seek(t) {
    const s = schedule(loadedAt);
    const dock = getDock();
    const s0 = Math.min(vw * 0.38, vh * 0.26) / 297.2; // px per logo unit while centred
    const sD = dock.w / G.VIEWBOX[0];

    // Quarter turns while loading; every one lands upright, so stopping is clean.
    const turns = Math.min(s.n, Math.floor(t / BEAT) + 1);
    let angle = 0;
    for (let k = 0; k < turns; k++) angle += 90 * spring(t - k * BEAT, 'snappy');
    angle -= 90 * Math.round(angle / 90); // a square at 90k looks identical; the lock must end at 0
    rot.setAttribute('transform', `rotate(${fmt(angle)} ${SQUARE_C[0]} ${SQUARE_C[1]})`);

    // Entrance, plus a small press on every quarter turn, like a key being turned
    let e = lerp(0.55, 1, spring(t, 'default'));
    for (let k = 0; k < turns; k++) e *= 1 - 0.08 * (spring(t - k * BEAT, 'snappy') - spring(t - k * BEAT - 0.1, 'default'));
    intro.setAttribute('transform', `translate(${SQUARE_C[0]} ${SQUARE_C[1]}) scale(${fmt(e * 1000) / 1000}) translate(${-SQUARE_C[0]} ${-SQUARE_C[1]})`);

    // Square -> plain lock body (the key does the rest)
    const pm = spring(t - s.T1, 'default');
    const rect = G.SQUARE_RECT.map((v, i) => lerp(v, G.BODY_PLAIN_RECT[i], pm));
    body.setAttribute('d', t - s.T1 > 0.6 ? G.BODY_PLAIN : roundedRect(rect));

    // Key cutout pushes down into the body; once its tip reaches the bottom it pushes the triangle out
    const o = keyOffset(s, t);
    keyHole.setAttribute('transform', `translate(0 ${fmt(o)})`);
    tip.setAttribute('transform', `translate(0 ${fmt(Math.max(o, -TIP_PARK))})`);

    // Shackle rises out of the body, locked; shoots up on the click and springs back to the logo
    const sh = shackleOffset(s)(t);
    shackle.setAttribute('transform', `translate(0 ${fmt(sh)})`);
    shackle.style.display = t < s.T1 ? 'none' : '';

    const sq = track(1, [
      { at: s.Tc, to: 0.965, preset: 'snappy' },
      { at: s.Tc + 0.06, to: 1, preset: 'default' },
    ])(t);
    const sx = 1 + (1 - sq) * 0.6;
    squash.setAttribute('transform', `translate(98.25 297.2) scale(${fmt(sx * 1000) / 1000} ${fmt(sq * 1000) / 1000}) translate(-98.25 -297.2)`);

    // Wordmark rises line by line
    rows.forEach((r, i) => {
      const dy = r.rise * (1 - spring(t - s.Tw - i * 0.08, 'heavy'));
      r.inner.setAttribute('transform', `translate(0 ${fmt(dy)})`);
    });

    // Camera: square centre -> mark centre -> lockup centre -> header slot
    const cx = track(SQUARE_C[0], [{ at: s.Tw, to: LOCKUP_C[0], preset: 'default' }])(t);
    const cy = track(SQUARE_C[1], [
      { at: s.T1, to: MARK_C[1], preset: 'default' },
      { at: s.Tw, to: LOCKUP_C[1], preset: 'default' },
    ])(t);
    const pd = spring(t - s.Td, 'heavy'); // logo lockup: no overshoot
    const S = s0 * Math.pow(sD / s0, pd);
    const ax = lerp(vw / 2, dock.x + dock.w / 2, pd), ay = lerp(vh / 2, dock.y + dock.h / 2, pd);
    lockup.setAttribute('transform', `translate(${fmt(ax)} ${fmt(ay)}) scale(${fmt(S * 10000) / 10000}) translate(${fmt(-cx)} ${fmt(-cy)})`);

    // Frost clears as the logo docks: blur and tint spring down, page settles to full size
    const f = 1 - spring(t - s.Tf, 'default');
    const blur = 22 * Math.max(0, f), tint = 0.62 * Math.max(0, f);
    if (ctx) {
      const dpr = canvas.width / vw, page = opts.page;
      const k = lerp(1, 0.985, Math.max(0, f));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = 'none';
      ctx.fillStyle = G.GREEN; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (page) {
        ctx.filter = blur > 0.05 ? `blur(${fmt(blur * dpr)}px)` : 'none';
        const w = canvas.width * k, h = canvas.height * k;
        ctx.drawImage(page, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.filter = 'none';
      }
      ctx.fillStyle = `rgba(23,49,44,${fmt(tint * 1000) / 1000})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (f > 0.002) {
        ctx.globalAlpha = 0.07 * f; ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(grain, 0, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      frostDiv.style.backdropFilter = frostDiv.style.webkitBackdropFilter = blur > 0.05 ? `blur(${fmt(blur)}px)` : 'none';
      frostDiv.style.background = `rgba(23,49,44,${fmt(tint * 1000) / 1000})`;
      host.style.pointerEvents = f > 0.05 ? 'auto' : 'none';
    }
    return t >= s.end;
  }

  return {
    seek,
    setLoaded(t) { if (!Number.isFinite(loadedAt)) loadedAt = t; },
    resize(w, h) { vw = w; vh = h; svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); },
    schedule: () => schedule(loadedAt),
  };
}
