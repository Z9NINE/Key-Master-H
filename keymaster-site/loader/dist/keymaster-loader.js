/* Key Master page loader. Source: loader/src, built by loader/build.mjs. */
(function () {
// Closed-form springs. Every value is a pure function of time: no state, no integration.
// A spring runs 0 -> 1 from rest; x(t) for t <= 0 is 0.

const presets = {
  snappy:  { w: 26, z: 0.82 }, // buttons, toggles, leading edges (~1% overshoot)
  default: { w: 17, z: 0.86 }, // cards, containers, camera (~0.5% overshoot)
  heavy:   { w: 14, z: 1.0 },  // big type, logo lockups (no overshoot)
  playful: { w: 16, z: 0.45 }, // visible overshoot, mascots only
};

function spring(t, preset = 'default') {
  if (t <= 0) return 0;
  const { w, z } = typeof preset === 'string' ? presets[preset] : preset;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const s = Math.sqrt(z * z - 1), r1 = -w * (z - s), r2 = -w * (z + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// Time for a spring to stay within eps of its target.
function settleTime(preset = 'default', eps = 0.005) {
  let last = 0;
  for (let t = 0; t < 5; t += 1 / 600) if (Math.abs(1 - spring(t, preset)) > eps) last = t;
  return last;
}

// A value with several targets: one spring per change, each starting at its own time.
// changes: [{ at, to, preset }] in time order. Springs are summed, never restarted.
function track(initial, changes) {
  return (t) => {
    let v = initial, from = initial;
    for (const c of changes) {
      v += (c.to - from) * spring(t - c.at, c.preset);
      from = c.to;
    }
    return v;
  };
}

// Text inside a morphing box: in after the morph starts, out before the next one.
function swapAlpha(t, inAt, outAt, preset = 'snappy') {
  return Math.min(1, Math.max(0, spring(t - inAt, preset) - spring(t - outAt, preset)));
}

const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Seeded noise. Never Math.random.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Generated from the Key Master logo SVG in index.html. Do not hand-edit.
// The key cutout is not stored: it is CUT_FIELD minus LOCK, computed in SVG at render time.
// CUT_FIELD is the plain body + tip, inset 1.5 units from every edge it shares with the logo (and open
// upward), so the cutout has no edges coincident with the silhouette that could leave antialiasing seams.
const G = {
 "LOCK": "M177.01,88.43l-3.89,3.89c-.92.92-2.49.27-2.49-1.03v-17.75C170.64,34.85,140.73,2.1,102.09.1,60.36-2.06,25.85,31.13,25.85,72.39h0c-.23,4.55,2.09,8.96,6.15,11.04,9.62,4.92,19.2-1.94,19.2-11.03,0-27.14,22.99-48.92,50.56-46.92,24.72,1.79,43.53,23.06,43.53,47.85v42.61c0,2.7-1.07,5.3-2.99,7.21l-23.59,23.59h0c-3.39,3.36-5.49,8.01-5.49,13.15s2.1,9.79,5.49,13.14v10.71c-3.39,3.35-5.49,8-5.49,13.14s2.1,9.79,5.49,13.14v10.71c-3.39,3.35-5.49,8-5.49,13.14s2.1,9.79,5.49,13.14v14.58c0,2.4-.95,4.7-2.65,6.4l-12.12,12.12c-3.15,3.15-8.25,3.15-11.4,0l-12.12-12.12c-1.7-1.7-2.65-4-2.65-6.4v-14.58c3.39-3.35,5.49-8,5.49-13.14s-2.1-9.79-5.49-13.14v-10.71c3.39-3.35,5.49-8,5.49-13.14s-2.1-9.79-5.49-13.14v-10.71c3.39-3.35,5.49-8,5.49-13.14s-2.1-9.79-5.49-13.14h0s-58.29-58.3-58.29-58.3c-7.19-7.19-19.47-2.1-19.47,8.07v157.54c0,6.3,5.11,11.41,11.41,11.41h43.88c2.6,0,5.09,1.03,6.93,2.87l28.87,28.87c3.95,3.95,10.36,3.95,14.31,0l28.87-28.87c1.84-1.84,4.33-2.87,6.93-2.87h43.88c6.3,0,11.41-5.11,11.41-11.41V96.5c0-10.16-12.29-15.25-19.47-8.07Z",
 "BODY_PLAIN_RECT": [
  0,
  85.1,
  196.5,
  180.36,
  11.41
 ],
 "BODY_PLAIN": "M11.41,85.1H185.09C191.39,85.1 196.5,90.21 196.5,96.51V254.05C196.5,260.35 191.39,265.46 185.09,265.46H11.41C5.11,265.46 0,260.35 0,254.05V96.51C0,90.21 5.11,85.1 11.41,85.1Z",
 "SQUARE_RECT": [
  3.25,
  80.28,
  190,
  190,
  16
 ],
 "TIP": "M55.3,265.46c2.6,0,5.09,1.03,6.93,2.87l28.87,28.87c3.95,3.95,10.36,3.95,14.31,0l28.87-28.87c1.84-1.84,4.33-2.87,6.93-2.87V250H55.3Z",
 "CUT_FIELD": "M1.5,40H195V254.05L185.09,263.96H136.53L104.79,295.7H91.72L59.98,263.96H11.41L1.5,254.05Z",
 "SHACKLE": "M170.63,230V73.54C170.64,34.85,140.73,2.1,102.09.1,60.36-2.06,25.85,31.13,25.85,72.39h0c-.23,4.55,2.09,8.96,6.15,11.04,9.62,4.92,19.2-1.94,19.2-11.03,0-27.14,22.99-48.92,50.56-46.92,24.72,1.79,43.53,23.06,43.53,47.85V230Z",
 "WORD_KEY": [
  "M247.32,89.7h3.31c3.07,0,5.28-.96,6.63-2.88l20.12-29.2c1.19-1.55,2.46-2.63,3.83-3.22,1.37-.59,3.08-.89,5.12-.89h18.04l-26.5,36.14c-1.88,2.5-3.91,4.29-6.07,5.4,1.55.57,2.96,1.37,4.23,2.39,1.27,1.02,2.45,2.35,3.56,3.99l27,41.48h-18.53c-1.19,0-2.2-.08-3.04-.25-.84-.16-1.56-.41-2.18-.74-.61-.33-1.15-.73-1.6-1.2-.45-.47-.88-1.01-1.29-1.63l-20.25-31.11c-.74-1.15-1.67-1.95-2.79-2.42-1.13-.47-2.65-.71-4.57-.71h-5.03v38.04h-20.74V53.5h20.74v36.2Z",
  "M334.69,78.29c4.21,0,8.07.65,11.56,1.96,3.5,1.31,6.51,3.21,9.02,5.71,2.51,2.5,4.48,5.55,5.89,9.17,1.41,3.62,2.12,7.72,2.12,12.3,0,1.43-.06,2.6-.18,3.5-.12.9-.35,1.62-.68,2.15s-.77.9-1.32,1.1-1.26.31-2.12.31h-36.69c.61,5.32,2.23,9.17,4.85,11.56,2.62,2.39,5.99,3.59,10.12,3.59,2.21,0,4.11-.27,5.71-.8s3.01-1.12,4.26-1.78,2.39-1.25,3.44-1.78c1.04-.53,2.14-.8,3.28-.8,1.51,0,2.66.55,3.43,1.66l5.52,6.81c-1.96,2.25-4.08,4.08-6.35,5.49-2.27,1.41-4.6,2.51-6.99,3.31s-4.79,1.35-7.18,1.66c-2.4.31-4.68.46-6.84.46-4.46,0-8.64-.73-12.55-2.18-3.91-1.45-7.32-3.61-10.25-6.47-2.92-2.86-5.24-6.42-6.93-10.68-1.7-4.25-2.55-9.2-2.55-14.85,0-4.25.73-8.28,2.18-12.09,1.45-3.8,3.54-7.14,6.26-10s6.01-5.13,9.88-6.81c3.86-1.68,8.23-2.52,13.1-2.52ZM335.05,91.42c-3.64,0-6.48,1.03-8.53,3.1-2.04,2.06-3.4,5.04-4.05,8.93h23.74c0-1.51-.2-2.99-.58-4.42-.39-1.43-1.02-2.71-1.9-3.83-.88-1.12-2.04-2.03-3.47-2.73-1.43-.69-3.17-1.04-5.22-1.04Z",
  "M397.2,159.4c-.57,1.27-1.27,2.2-2.09,2.79-.82.59-2.13.89-3.93.89h-14.23l12.27-25.77-25.4-58.04h16.81c1.47,0,2.61.33,3.4.98.8.65,1.38,1.43,1.75,2.33l10.43,27.42c.98,2.54,1.78,5.07,2.39,7.61.41-1.31.85-2.61,1.32-3.9.47-1.29.95-2.57,1.44-3.83l9.45-27.3c.37-.94,1.02-1.73,1.96-2.36.94-.63,1.96-.95,3.07-.95h15.34l-33.99,80.13Z"
 ],
 "WORD_MASTER": [
  "M274.65,229.59c.76,1.68,1.48,3.4,2.18,5.15.7-1.8,1.42-3.56,2.18-5.28.76-1.72,1.56-3.35,2.42-4.91l22.95-45.16c.41-.78.83-1.38,1.26-1.81.43-.43.91-.75,1.44-.95.53-.2,1.13-.33,1.81-.37.68-.04,1.46-.06,2.36-.06h15.83v89.39h-18.28v-51.41c0-2.49.12-5.19.37-8.1l-23.68,45.95c-.74,1.43-1.73,2.52-2.98,3.25-1.25.74-2.67,1.1-4.26,1.1h-2.82c-1.6,0-3.02-.37-4.26-1.1-1.25-.74-2.24-1.82-2.98-3.25l-23.81-46.01c.16,1.43.29,2.85.37,4.26.08,1.41.12,2.71.12,3.9v51.41h-18.28v-89.39h15.83c.9,0,1.69.02,2.36.06.68.04,1.28.16,1.81.37.53.21,1.01.52,1.44.95.43.43.85,1.03,1.26,1.81l23.01,45.34c.82,1.56,1.61,3.17,2.36,4.85Z",
  "M383.46,265.6c-1.8,0-3.16-.25-4.08-.74s-1.69-1.51-2.3-3.07l-1.35-3.5c-1.6,1.35-3.13,2.54-4.6,3.56-1.47,1.02-3,1.89-4.57,2.61-1.58.72-3.25,1.25-5.03,1.6s-3.75.52-5.92.52c-2.9,0-5.54-.38-7.91-1.13-2.37-.76-4.39-1.87-6.04-3.34-1.66-1.47-2.94-3.3-3.83-5.49-.9-2.19-1.35-4.71-1.35-7.58,0-2.25.57-4.56,1.72-6.93,1.14-2.37,3.13-4.53,5.95-6.47,2.82-1.94,6.63-3.57,11.41-4.88,4.79-1.31,10.82-2.04,18.1-2.21v-2.7c0-3.72-.77-6.41-2.3-8.07-1.53-1.66-3.71-2.48-6.53-2.48-2.25,0-4.09.24-5.52.74-1.43.49-2.71,1.04-3.83,1.66-1.13.61-2.22,1.17-3.28,1.66-1.06.49-2.33.74-3.8.74-1.31,0-2.41-.33-3.31-.98s-1.64-1.43-2.21-2.33l-3.43-5.95c3.84-3.4,8.11-5.92,12.79-7.58,4.68-1.66,9.7-2.48,15.06-2.48,3.84,0,7.31.62,10.4,1.87s5.71,2.99,7.85,5.22c2.15,2.23,3.79,4.88,4.94,7.94s1.72,6.42,1.72,10.06v39.76h-8.71ZM361.62,254c2.45,0,4.6-.43,6.44-1.29,1.84-.86,3.7-2.25,5.58-4.17v-8.84c-3.8.16-6.93.49-9.39.98-2.45.49-4.4,1.1-5.83,1.84-1.43.74-2.42,1.58-2.98,2.52-.55.94-.83,1.96-.83,3.07,0,2.17.59,3.69,1.78,4.57,1.19.88,2.92,1.32,5.22,1.32Z",
  "M444.75,215.9c-.49.78-1.01,1.33-1.56,1.66-.55.33-1.26.49-2.12.49s-1.8-.19-2.7-.58c-.9-.39-1.87-.81-2.91-1.26-1.04-.45-2.22-.87-3.53-1.26-1.31-.39-2.8-.58-4.48-.58-2.41,0-4.26.46-5.55,1.38-1.29.92-1.93,2.2-1.93,3.84,0,1.19.42,2.17,1.26,2.94.84.78,1.95,1.46,3.34,2.06,1.39.59,2.96,1.16,4.72,1.69s3.56,1.13,5.4,1.78c1.84.65,3.64,1.42,5.4,2.3,1.76.88,3.33,1.96,4.72,3.25,1.39,1.29,2.5,2.85,3.34,4.69.84,1.84,1.26,4.05,1.26,6.63,0,3.15-.57,6.05-1.72,8.71-1.15,2.66-2.85,4.95-5.12,6.87-2.27,1.92-5.07,3.42-8.4,4.48-3.33,1.06-7.17,1.6-11.5,1.6-2.17,0-4.34-.21-6.5-.61-2.17-.41-4.26-.96-6.29-1.66s-3.9-1.52-5.61-2.48c-1.72-.96-3.19-1.99-4.42-3.1l4.42-6.99c.49-.82,1.11-1.46,1.87-1.93.76-.47,1.73-.71,2.91-.71,1.1,0,2.1.25,2.98.74s1.83,1.02,2.85,1.6c1.02.57,2.22,1.1,3.59,1.6,1.37.49,3.1.74,5.18.74,1.47,0,2.72-.15,3.74-.46s1.84-.73,2.45-1.26,1.06-1.12,1.35-1.78.43-1.33.43-2.03c0-1.27-.43-2.31-1.29-3.13-.86-.82-1.98-1.52-3.37-2.12-1.39-.59-2.98-1.14-4.76-1.66-1.78-.51-3.59-1.09-5.43-1.75-1.84-.65-3.65-1.44-5.43-2.36s-3.36-2.09-4.75-3.5c-1.39-1.41-2.52-3.14-3.37-5.18-.86-2.04-1.29-4.52-1.29-7.42,0-2.7.52-5.27,1.57-7.7,1.04-2.43,2.61-4.57,4.69-6.41,2.09-1.84,4.7-3.3,7.85-4.39,3.15-1.08,6.83-1.63,11.04-1.63,2.29,0,4.51.21,6.66.61,2.15.41,4.16.98,6.04,1.72,1.88.74,3.6,1.61,5.15,2.61,1.55,1,2.92,2.1,4.11,3.28l-4.29,6.69Z",
  "M481.75,266.58c-3.03,0-5.7-.44-8.01-1.32-2.31-.88-4.26-2.13-5.83-3.74-1.58-1.61-2.77-3.57-3.59-5.86-.82-2.29-1.23-4.85-1.23-7.67v-32.88h-5.4c-.98,0-1.82-.32-2.51-.95-.7-.63-1.04-1.56-1.04-2.79v-7.42l10.12-1.96,3.74-15.52c.49-1.96,1.88-2.95,4.17-2.95h9.94v18.59h15.77v13.01h-15.77v31.6c0,1.47.36,2.69,1.07,3.65s1.75,1.44,3.1,1.44c.69,0,1.28-.07,1.75-.21.47-.14.88-.31,1.23-.49s.67-.35.98-.49c.31-.14.66-.21,1.07-.21.57,0,1.03.13,1.38.4.35.27.71.69,1.07,1.26l5.77,9.02c-2.45,1.84-5.21,3.22-8.28,4.14-3.07.92-6.24,1.38-9.51,1.38Z",
  "M533.53,200.99c4.21,0,8.07.65,11.56,1.96,3.5,1.31,6.5,3.21,9.02,5.71,2.52,2.5,4.48,5.55,5.89,9.17,1.41,3.62,2.12,7.72,2.12,12.3,0,1.43-.06,2.6-.18,3.5-.12.9-.35,1.62-.67,2.15-.33.53-.77.9-1.32,1.1-.55.21-1.26.31-2.12.31h-36.69c.61,5.32,2.23,9.17,4.85,11.56s5.99,3.59,10.12,3.59c2.21,0,4.11-.27,5.71-.8s3.01-1.12,4.26-1.78c1.25-.65,2.39-1.25,3.44-1.78,1.04-.53,2.14-.8,3.28-.8,1.51,0,2.66.55,3.43,1.66l5.52,6.81c-1.96,2.25-4.08,4.08-6.35,5.49-2.27,1.41-4.6,2.51-6.99,3.31s-4.79,1.35-7.18,1.66c-2.39.31-4.67.46-6.84.46-4.46,0-8.64-.73-12.55-2.18-3.91-1.45-7.32-3.61-10.25-6.47-2.92-2.86-5.24-6.42-6.93-10.68-1.7-4.25-2.55-9.2-2.55-14.85,0-4.25.73-8.28,2.18-12.09,1.45-3.8,3.54-7.14,6.26-10,2.72-2.86,6.01-5.13,9.88-6.81s8.23-2.52,13.1-2.52ZM533.9,214.12c-3.64,0-6.48,1.03-8.53,3.1-2.04,2.06-3.4,5.04-4.05,8.93h23.74c0-1.51-.2-2.99-.58-4.42-.39-1.43-1.02-2.71-1.9-3.83-.88-1.12-2.03-2.03-3.47-2.73-1.43-.69-3.17-1.04-5.22-1.04Z",
  "M571.63,265.6v-63.62h11.29c.94,0,1.73.08,2.36.25.63.16,1.17.42,1.6.77.43.35.76.81.98,1.38.22.57.42,1.27.58,2.09l.92,5.4c2-3.43,4.28-6.14,6.84-8.13s5.49-2.98,8.8-2.98c2.86,0,5.19.67,6.99,2.02l-1.23,13.99c-.21.9-.54,1.51-1.01,1.84-.47.33-1.12.49-1.93.49-.33,0-.76-.02-1.29-.06-.53-.04-1.08-.09-1.66-.15s-1.16-.12-1.75-.18c-.59-.06-1.14-.09-1.63-.09-2.78,0-5,.75-6.66,2.24-1.66,1.49-3.06,3.55-4.2,6.17v38.59h-19.02Z"
 ],
 "VIEWBOX": [
  612,
  300.14
 ],
 "GOLD": "#f6bd42",
 "GREEN": "#17312c"
};


// Key Master loader. seek(t) paints frame t; nothing carries between frames.
// Logo units are the site logo's own SVG units (viewBox 612 x 300.14).

const BEAT = 0.5; // 120 BPM grid: turns, morph, click and dock all land on it
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
const NS = 'http://www.w3.org/2000/svg';

function schedule(loadedAt = Infinity) {
  const L = Math.max(0.3, loadedAt);
  const n = Number.isFinite(L) ? Math.ceil(L / BEAT) : Infinity; // quarter-turns started before load
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

function events(loadedAt) {
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
function createScene(host, opts) {
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

// Live entry for keymasterh.com. Runs as a classic script right after <div id="km-loader">.
// The scene is still a pure function of time; only this file reads a real clock.
(function () {
  const root = document.documentElement;
  const host = document.getElementById('km-loader');
  if (!host || !root.classList.contains('km-loading')) return;

  const LOGO = '.nav-logo img';
  const MAX_WAIT = 8; // seconds: never hold the page hostage to a stalled request
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  function finish() {
    host.remove();
    root.classList.remove('km-loading');
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (document.readyState === 'complete') finish();
    else addEventListener('load', finish, { once: true });
    setTimeout(finish, MAX_WAIT * 1000);
    return;
  }

  // The header logo is measured every frame, so scrolling or resizing mid-dock still lands exactly.
  const measure = () => {
    const img = document.querySelector(LOGO);
    const r = img && img.getBoundingClientRect();
    return r && r.width ? { x: r.x, y: r.y, w: r.width, h: r.height }
      : { x: innerWidth / 2 - 66, y: -140, w: 132, h: 64.73 }; // no header logo: leave upward
  };

  host.style.background = 'none';
  host.style.backdropFilter = host.style.webkitBackdropFilter = 'none';
  const scene = createScene(host, {
    vw: innerWidth, vh: innerHeight, frost: 'backdrop',
    dock: measure,
  });
  addEventListener('resize', () => scene.resize(innerWidth, innerHeight));

  const loaded = () => scene.setLoaded(now());
  if (document.readyState === 'complete') loaded();
  else addEventListener('load', loaded, { once: true });

  (function frame() {
    const t = now();
    if (t > MAX_WAIT) scene.setLoaded(MAX_WAIT);
    const s = scene.schedule();
    scene.seek(t);
    // Hand off to the real header logo once the dock spring has fully settled.
    if (t >= s.end + 0.35) finish();
    else requestAnimationFrame(frame);
  })();
})();

})();
