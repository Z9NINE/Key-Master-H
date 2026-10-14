// node design/scale.mjs
// Prints the fluid type and space tokens of the Key Master design system.
// Every size comes from three numbers per screen edge: the body size and the type ratio at 360px and at 1440px.
// Change them here, re-run, and paste the output into the :root block in index.html.
const MIN_W = 360, MAX_W = 1440;                 // fluid range: phone to desktop
const MIN = { base: 16, ratio: 1.15 };           // 360px: 16px body, steps grow 15%
const MAX = { base: 17, ratio: 1.25 };           // 1440px: 17px body, steps grow 25% (major third)
const STEPS = [-1, 0, 1, 2, 3, 4, 5, 6, 7];
const SPACE = { '3xs': 0.25, '2xs': 0.5, xs: 0.75, s: 1, m: 1.5, l: 2, xl: 3, '2xl': 4, '3xl': 6 }; // multiples of the body size
const PAIRS = [['xs', 's'], ['s', 'm'], ['m', 'l'], ['l', 'xl'], ['xl', '2xl'], ['2xl', '3xl']];       // grow one step across the range

const r = (v, d = 4) => +v.toFixed(d);
function fluid(a, b) { // a px at 360 -> b px at 1440, as a clamp()
  const slope = (b - a) / (MAX_W - MIN_W), icpt = a - slope * MIN_W;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (Math.abs(b - a) < 0.05) return `${r(a / 16)}rem`;
  return `clamp(${r(lo / 16)}rem, ${r(icpt / 16)}rem ${slope < 0 ? '-' : '+'} ${r(Math.abs(slope) * 100, 4)}vw, ${r(hi / 16)}rem)`;
}
const lines = ['      /* Type scale: step n = base x ratio^n. 360px: 16px x 1.15^n, 1440px: 17px x 1.25^n. */'];
for (const n of STEPS) {
  const a = MIN.base * MIN.ratio ** n, b = MAX.base * MAX.ratio ** n;
  lines.push(`      --step-${n < 0 ? 'm' + -n : n}: ${fluid(a, b)}; /* ${r(a, 1)} -> ${r(b, 1)}px */`);
}
lines.push('      /* Space scale: multiples of the body size (step 0). */');
for (const [k, m] of Object.entries(SPACE)) lines.push(`      --space-${k}: ${fluid(MIN.base * m, MAX.base * m)}; /* ${r(MIN.base * m, 2)} -> ${r(MAX.base * m, 2)}px */`);
lines.push('      /* Space pairs: one step at 360px growing to the next step at 1440px, for gaps that should open up on big screens. */');
for (const [a, b] of PAIRS) lines.push(`      --space-${a}-${b}: ${fluid(MIN.base * SPACE[a], MAX.base * SPACE[b])}; /* ${r(MIN.base * SPACE[a], 2)} -> ${r(MAX.base * SPACE[b], 2)}px */`);
console.log(lines.join('\n'));
