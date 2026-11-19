# Architecture

One page of HTML, a stylesheet, and JavaScript that adds behaviour on top. Nothing is required to read the site except the HTML.

## The rule that shapes everything

**Text lives in `index.html`.** The mission list, the Briefing, the Map, the Console, the HUD sector names and the hazard alert lines are all read from the page (`data-mission`, `data-sector`, `#hazard-copy`). JavaScript never holds a second copy of the content. So there is one place to edit, the page works without scripts, and search engines see the real text.

## Layers

```
index.html            all content, semantic, readable without scripts or WebGL
src/styles/           tokens, base, layout, components, dossier, art (CSS pictures), sims, hud, lite
src/main.js           decides lite or scene, wires the shared UI
src/core/             pure logic and small services (no DOM unless stated)
src/ui/               DOM behaviour: dialogs, HUD, boot, role chooser, console, map, sound, GitHub data
src/sims/             six simulations: one pure logic file and one DOM file each
src/scene/            the 3D flight, loaded lazily with import()
src/shaders/          GLSL files, imported with ?raw
```

### Lite and scene

`core/capabilities.js` decides the mode from WebGL 2, reduced motion, Save-Data, the saved choice and `?lite`. `core/mode.js` owns the switch: every way into Lite goes through `enterLite`, so the page always ends in one consistent state. The scene is a dynamic import started after first paint, inside a try/catch. If it fails, the page carries on as Lite.

### The scene

- `route.js` has one waypoint per sector id. `core/route-math.js` turns the scroll position into a position along that route. Each sector's rectangle is measured from the DOM, so the flight follows the real page height.
- The camera never snaps. Progress follows the scroll with `damp()`, a frame-rate independent ease.
- `worlds/` holds one module per destination. `worlds/index.js` creates a world when the probe is near and disposes it when it is far, so GPU memory does not grow.
- Hazards are a **pure function of progress** (`core/hazard-timeline.js`). Scrubbing forwards and backwards gives the same answer. One-shot events (shake, alarm) fire on the first forward crossing only.
- `post.js` runs a sanitise pass, bloom, a lens pass (gravity-well lensing, colour fringing at the peak, faint vignette and grain) and tone mapping. The low tier skips all of it.
- Tiers (`core/tier.js`) start at mid and move on measured frame work. `?tier=` pins one for tests.

### Simulations

Each has pure logic that mirrors a rule from the real project (the file header names the source file) and a UI that only draws and reports. Logic is tested with `node --test`. Outcomes are also written as text into an `aria-live` region.

## Why these choices

| Choice | Reason |
|---|---|
| Vanilla JS, ES modules | Every file can be read and explained. No framework to learn. |
| WebGLRenderer, not WebGPU | Works on nearly every device. |
| No image, texture or model files | Everything is shaders, geometry and canvas. Small, no licences. |
| Pure logic split from DOM | Rules are testable and the UI stays thin. |
| Lazy scene and simulations | First load stays small. Three.js arrives after the page is readable. |

## Tests

- `npm test`: logic tests with the Node test runner (`tests/logic/`).
- `npm run test:e2e`: Playwright in Chromium and WebKit (`tests/e2e/`). The flight tests need WebGL, so Chromium runs with software-GL flags (see `docs/DECISIONS.md` D16). WebKit runs the plain-page tests.
- `npm run budgets`: fails if the built site exceeds the size budgets.
- `npm run check`: lint, format check, build, logic tests and budgets.
