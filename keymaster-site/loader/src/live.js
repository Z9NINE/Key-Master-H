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
