// node loader/build.mjs
// Bundles the loader into one script and writes it into index.html between the km-loader markers.
// Safe to re-run: existing marked blocks are replaced, never duplicated. Needs only Node, no packages.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INDEX = join(HERE, '..', 'index.html');

const strip = (src) => src.replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
const [motion, geometry, scene, live] = await Promise.all(
  ['lib/motion.js', 'src/logo-geometry.js', 'src/scene.js', 'src/live.js'].map((f) => readFile(join(HERE, f), 'utf8')),
);
const bundle = `/* Key Master page loader. Source: loader/src, built by loader/build.mjs. */\n(function () {\n${[motion, geometry, scene].map(strip).join('\n')}\n${live}\n})();\n`;
if (/<\/script/i.test(bundle)) throw new Error('bundle contains </script and cannot be inlined');
await mkdir(join(HERE, 'dist'), { recursive: true });
await writeFile(join(HERE, 'dist', 'keymaster-loader.js'), bundle);

// Head: set the loading class before anything paints, and the frosted cover's first-paint style.
// Without JavaScript the class is never added, so the cover never shows.
const HEAD = `<!-- km-loader:head -->
<script>
  // km-loading shows the frosted glass from the first paint; km-hold keeps the page behind it still.
  // If the loader never runs, a safety timer clears both so the page can never stay covered.
  document.documentElement.classList.add('km-loading', 'km-hold');
  setTimeout(function () { document.documentElement.classList.remove('km-loading', 'km-hold'); }, 16000);
</script>
<style>
  #km-loader { display: none; }
  html.km-loading #km-loader {
    display: block; position: fixed; inset: 0; z-index: 2147483000;
    background: rgba(23, 49, 44, .62);
    -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px);
  }
  html.km-loading .nav-logo img { visibility: hidden; }
  html.km-hold .hero-glow { animation-play-state: paused; }
</style>
<!-- /km-loader:head -->`;

// Body: the cover and the inlined loader, first thing in <body> so the glass covers the page from the first paint.
const BODY = `<!-- km-loader:body -->
<div id="km-loader" aria-hidden="true"></div>
<script>
${bundle}</script>
<!-- /km-loader:body -->`;

const block = (name) => new RegExp(`<!-- km-loader:${name} -->[\\s\\S]*?<!-- /km-loader:${name} -->`);
let html = await readFile(INDEX, 'utf8');
html = block('head').test(html) ? html.replace(block('head'), () => HEAD) : html.replace('</title>', () => `</title>\n${HEAD}`);
html = block('body').test(html) ? html.replace(block('body'), () => BODY) : html.replace(/<body[^>]*>/, (m) => `${m}\n${BODY}`);
if (!block('head').test(html) || !block('body').test(html)) throw new Error('could not find </title> or <body> in index.html');
await writeFile(INDEX, html);
console.log(`loader: ${(bundle.length / 1024).toFixed(1)} KB, written into index.html`);
