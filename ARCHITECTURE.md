# Architecture

One page of HTML, a stylesheet, and JavaScript that adds behaviour on top. Nothing is required to read the site except the HTML.

## The rule that shapes everything

**Text lives in `index.html`.** Project dossiers, the summary, the menu and the section names that the flight shows are all read from the page (`data-mission`, `data-sector`). JavaScript never holds a second copy of the content. So there is one place to edit, the page works without scripts, and search engines see the real text.

## Layers

```
index.html            all content, semantic, readable without scripts or WebGL
src/styles/           tokens, base, layout, components, dossier, art (CSS pictures), sims, hud, lite
src/main.js           decides lite or scene, wires the shared UI
src/core/             pure logic and small services (no DOM unless stated)
src/ui/               DOM behaviour: dialogs, flight progress, reveals, sound, contact form
src/sims/             six simulations: one pure logic file and one DOM file each
src/scene/            the 3D flight, loaded lazily with import()
src/shaders/          GLSL files, imported with ?raw
src/assets/tex/       planet maps (WebP), built by scripts/make-textures.py, loaded lazily
dev/                  look-dev page for single assets; development only, never built
src/fonts/            three subset font files, built by scripts/subset-fonts.sh
```

### Lite and scene

`core/capabilities.js` decides the mode from WebGL 2, reduced motion, Save-Data, the saved choice and `?lite`. `core/mode.js` owns the switch: every way into Lite goes through `enterLite`, so the page always ends in one consistent state. The scene is a dynamic import started after first paint, inside a try/catch. If it fails, the page carries on as Lite.

### Motion

Scroll is native: the wheel, touch, keys and the scrollbar all move the page as the browser does. Exactly one thing smooths it, the camera. `core/motion.js` follows the scroll position with a critically damped spring (half-life 0.25 s). The spring keeps its own velocity, so a change of scroll direction slows and turns the camera and never snaps it, and it cannot overshoot. Everything on the page that moves with the flight (the progress line, the heading reveals) reads the same smoothed progress in the same frame, before it is drawn. Travel between sections uses smootherstep, so acceleration is continuous where a section starts and ends. All durations, easings and the stagger are CSS custom properties in `styles/tokens.css`; JavaScript reads them from there.

### The scene

- `route.js` has one waypoint per section id. `core/route-math.js` turns the scroll position into a position along that route. The probe stays at a stop while its section is on screen and travels in the space between sections.
- Every world is built once, before the first frame. `warmup.js` compiles all shaders and uploads all buffers in short tasks while the visitor reads the first screen; the canvas fades in only when its first frame is drawn, so no shader is compiled while the visitor scrolls. A world is shown when the probe is near it and hidden once it has gone by, a pure function of progress.
- The camera never snaps. Progress follows the scroll through the spring above.
- The opening (`camera-path.js`): the camera starts tilted up into the stars, with the Earth and the probe just below the frame, and levels out by progress 0.15, so they rise into view as the flight begins. The nebula is faint in the opening and full strength by the first project.
- Worlds fade in and out over 0.5 s; whether one should show is a pure function of progress.
- `post.js` runs a sanitise pass, bloom on highlights only, a lens pass (gravitational lensing and a colour fringe near the black hole, one colour grade, vignette, grain), then ACES tone mapping with a dither so dark gradients do not band. The scene renders into a 4x multisampled target. The low tier skips all of it.
- `lighting.js`: one sun direction (`worlds/util.js`) for the key light, the reflections and every world shader, a weak cold fill from Earth, and a reflection map made with PMREM from a small procedural sky.
- `probe.js` and `worlds/relay.js` are built in code from `hardware.js`: parts merged per material, foil, cells and plates made as textures at load (`probe-textures.js`).
- `maps.js` loads the planet maps (NASA and USGS imagery, see README) after the warm-up, decoded off the main thread and uploaded before the first frame when they arrive in time. Every mapped world has a procedural surface as its fallback, used on the low tier, with Save-Data and on slow connections.
- The black hole (`shaders/blackhole.frag.glsl`) is traced per pixel: rays bend around it, so the far side of the disk shows over the shadow.
- Tiers (`core/tier.js`) start at mid and move on measured frame work. `?tier=` pins one for tests.

### Simulations

Each has pure logic that mirrors a rule from the real project (the file header names the source file) and a UI that only draws and reports. Logic is tested with `node --test`. Outcomes are also written as text into an `aria-live` region.

## Choices

| Choice                     | Reason                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| Vanilla JS, ES modules     | Every file can be read and explained. No framework to learn.                 |
| WebGLRenderer, not WebGPU  | Works on nearly every device.                                                |
| Native scroll              | Works the same for wheel, touch, keyboard and scrollbar. No second smoother. |
| Few image files, no models | Geometry, shaders and canvas, plus six public planet maps loaded lazily.     |
| Pure logic split from DOM  | Rules are testable and the UI stays thin.                                    |
| Lazy scene and simulations | First load stays small. Three.js arrives after the page is readable.         |
| Subset fonts               | Three files, 53 KB in total. Fraunces is fixed at its display size.          |

## Tests

- `npm test`: logic tests with the Node test runner (`tests/logic/`), including checks on the built page for the title, social tags, JSON-LD and where education details may appear, and a contrast check of every colour token pair.
- `npm run test:e2e`: Playwright in Chromium and WebKit (`tests/e2e/`). The flight tests need WebGL, so Chromium runs with software-GL flags. WebKit runs the plain-page tests.
- `npm run budgets`: fails if the built site exceeds the size budgets (the planet maps have their own).
- `dev/lookdev.html` (with `npm run dev`): one asset at a time with a turntable, a light control, lit and unlit, a silhouette mode and a tone-mapping switch. A test keeps it out of `dist/`.
- `npm run check`: lint, format check, build, logic tests and budgets.
