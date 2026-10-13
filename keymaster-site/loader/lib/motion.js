// Closed-form springs. Every value is a pure function of time: no state, no integration.
// A spring runs 0 -> 1 from rest; x(t) for t <= 0 is 0.

export const presets = {
  snappy:  { w: 26, z: 0.82 }, // buttons, toggles, leading edges (~1% overshoot)
  default: { w: 17, z: 0.86 }, // cards, containers, camera (~0.5% overshoot)
  heavy:   { w: 14, z: 1.0 },  // big type, logo lockups (no overshoot)
  playful: { w: 16, z: 0.45 }, // visible overshoot, mascots only
};

export function spring(t, preset = 'default') {
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
export function settleTime(preset = 'default', eps = 0.005) {
  let last = 0;
  for (let t = 0; t < 5; t += 1 / 600) if (Math.abs(1 - spring(t, preset)) > eps) last = t;
  return last;
}

// A value with several targets: one spring per change, each starting at its own time.
// changes: [{ at, to, preset }] in time order. Springs are summed, never restarted.
export function track(initial, changes) {
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
export function swapAlpha(t, inAt, outAt, preset = 'snappy') {
  return Math.min(1, Math.max(0, spring(t - inAt, preset) - spring(t - outAt, preset)));
}

export const lerp = (a, b, p) => a + (b - a) * p;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Seeded noise. Never Math.random.
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
