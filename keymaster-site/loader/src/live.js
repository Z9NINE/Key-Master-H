// Live entry for keymasterh.com. Runs as a classic script right after <div id="km-loader">.
// The scene is still a pure function of time; only this file reads a real clock.
//
// 1. Glass only. While the browser parses the page and warms up the 3D hero, only the frosted glass shows,
//    so nothing on screen can stutter.
// 2. Once frames arrive on time, the square grows in and turns until the page has loaded.
// 3. Then it stops upright and unlocks into the logo, which docks into the header as the glass clears.
// Until the loader hands off, the page behind the glass holds still (html.km-hold), so the glass is cheap to draw
// and nothing competes with the animation; the 3D keys start drifting the moment the logo lands.
(function () {
  const root = document.documentElement;
  const host = document.getElementById('km-loader');
  if (!host || !root.classList.contains('km-loading')) return;

  const LOGO = '.nav-logo img';
  const SMOOTH_FRAMES = 8;   // consecutive on-time frames before the square comes in
  const ON_TIME_MS = 24;     // a frame within 1.5 frames at 60Hz (and any faster display)
  const GATE_MAX = 3.5;      // seconds of glass alone at most, even on a device that never settles
  const MAX_WAIT = 8;        // seconds of turning at most: never hold the page hostage to a stalled request
  const page0 = performance.now();
  let pageLoaded = document.readyState === 'complete' ? page0 : null;
  addEventListener('load', () => { pageLoaded = performance.now(); }, { once: true });

  function finish() {
    host.remove();
    root.classList.remove('km-loading', 'km-hold');
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('km-hold');
    if (document.readyState === 'complete') finish();
    else addEventListener('load', finish, { once: true });
    setTimeout(finish, MAX_WAIT * 1000);
    return;
  }

  // 1. Glass only, until the page is parsed and frames arrive steadily.
  let lastFrame = page0, onTime = 0;
  requestAnimationFrame(function gate(now) {
    onTime = now - lastFrame < ON_TIME_MS ? onTime + 1 : 0;
    lastFrame = now;
    const parsed = document.readyState !== 'loading';
    if ((parsed && onTime >= SMOOTH_FRAMES) || (now - page0) / 1000 > GATE_MAX) start();
    else requestAnimationFrame(gate);
  });

  function start() {
    // The header logo is measured every frame, so scrolling or resizing mid-dock still lands exactly.
    const measure = () => {
      const img = document.querySelector(LOGO);
      const r = img && img.getBoundingClientRect();
      return r && r.width ? { x: r.x, y: r.y, w: r.width, h: r.height }
        : { x: innerWidth / 2 - 66, y: -140, w: 132, h: 64.73 }; // no header logo: leave upward
    };

    const scene = createScene(host, { vw: innerWidth, vh: innerHeight, frost: 'backdrop', dock: measure });
    addEventListener('resize', () => scene.resize(innerWidth, innerHeight));
    scene.seek(0); // the square at zero size: building the scene costs a frame, so the clock starts on the next one

    // 2 and 3. The square's clock starts here; a page that finished loading earlier counts as loaded at 0.
    let t0 = null;
    requestAnimationFrame(function frame(now) {
      if (t0 === null) t0 = now;
      const t = (now - t0) / 1000;
      if (pageLoaded !== null) scene.setLoaded(Math.max(0, (pageLoaded - t0) / 1000));
      if (t > MAX_WAIT) scene.setLoaded(MAX_WAIT);
      const s = scene.schedule();
      scene.seek(t);
      // Hand off to the real header logo once the dock spring has fully settled.
      if (t >= s.end + 0.35) finish();
      else requestAnimationFrame(frame);
    });
  }
})();
