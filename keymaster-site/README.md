# Key Master website

The keymasterh.com site (`index.html`) with its page loader built in.

## The loader

The page opens under frosted green glass. While the browser is still busy (parsing the page, warming up the 3D hero), only the glass shows. As soon as frames arrive steadily, a gold square grows in and turns in quarter steps.
Once everything has loaded, the square stops upright and becomes the Key Master lock with the shackle closed.
The key-shaped cutout from the logo pushes down into it, carving the top with rounded corners and pushing out the bottom point.
Then it clicks, the shackle pops open, "Key Master" rises in, and the logo glides into its place in the header while the glass clears.
Behind the glass the page holds still until the logo lands, so nothing competes with the animation; then the 3D keys start drifting.

Previews: [desktop](preview/keymaster-loader-desktop.mp4) · [phone](preview/keymaster-loader-mobile.mp4)

- After loading finishes, the animation takes about 2 to 2.5 seconds before the page is interactive.
- The square waits for 8 on-time frames after the page is parsed, and at most 3.5 seconds, before it appears.
- If loading takes longer than 8 seconds after the square appears, the animation continues anyway.
- A safety timer in `<head>` uncovers the page after 16 seconds even if the loader never runs.
- The 3D hero's render loop checks the `km-hold` class on `<html>`: it draws its first frames (to warm up behind the glass), then pauses until the loader removes the class.
- With JavaScript off, the cover never appears.
- With "reduce motion" turned on, the cover simply disappears when the page has loaded.
- There is no sound on the website, since browsers block audio before a visitor interacts.
- It finds the header logo with the `.nav-logo img` selector. If that markup changes, update `LOGO` in `loader/src/live.js`.

## Design system

All sizes, spacing, colors and shapes follow one system derived from the body size; see [DESIGN.md](DESIGN.md) and `design/scale.mjs`.

## Files

```
index.html               the site; the loader is inlined between <!-- km-loader:... --> markers
loader/src/scene.js      the animation (a pure function of time: seek(t) draws frame t)
loader/src/live.js       runs the scene on the real page and hands off to the header logo
loader/src/logo-geometry.js  lock, shackle and wordmark shapes taken from the logo SVG
loader/lib/motion.js     spring physics used for every movement
loader/build.mjs         bundles the loader and writes it into index.html
loader/tools/cut.mjs     regenerates the key cutout if the logo ever changes
design/scale.mjs         generates the type and spacing scales
DESIGN.md                the design system rules, short version
preview/                 rendered previews
```

## Changing the loader

Edit files in `loader/src`, then rebuild (needs [Node.js](https://nodejs.org) 18+, no packages):

```bash
node loader/build.mjs
```

The rebuild replaces the marked blocks in `index.html`; nothing else in the page is touched.

Common tweaks in `loader/src/scene.js`:

| Setting | What it does |
|---|---|
| `SHACKLE_POP` | How high the shackle shoots up on the click (more negative = higher) |
| `BEAT` | The rhythm of everything; 0.5 = 120 BPM. Smaller is faster |
| `SHACKLE_LOCKED` | How deep the shackle sits while locked |
| `MIN_TURNS` | Quarter-turns the square always completes before unlocking, even on an instant load |

## Publishing with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, open **Settings → Pages**, set **Source** to "Deploy from a branch", and pick `main` / root.
3. To serve it at keymasterh.com, enter the domain under **Custom domain** on that page, then point your domain's DNS at GitHub Pages as GitHub describes there.
