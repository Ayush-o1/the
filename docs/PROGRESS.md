# Progress

Current phase: 3 complete locally, PR pending. Next: Phase 4 (hazards).

## Phase log

### Phase 0: Recon and setup (done, merged, tag phase-0)
- Six repos read (RECON.md), PLAN.md saved, DECISIONS.md, Vite scaffold, CI and Pages workflows, budgets script.
- Pages enabled (build_type workflow). Placeholder deployed, HTTP 200.

### Phase 1: Content and the Lite site (done locally)
- Done: tokens, fonts (5 woff2 files, about 105 KB), base/layout/components/dossier/art/lite CSS, full semantic index.html
  (hero, Belt, six dossiers with real copy and static simulation fallbacks, Cargo hold, Crew file, Contact form, footer, Briefing dialog),
  Briefing dialog + B key, contact form with mailto fallback, resume link removed at build when public/resume.pdf is missing,
  robots.txt, sitemap.xml, favicon.svg.
- Verified (ran it): `npm run check` passes; 26 Playwright tests pass in chromium and webkit (sections render, links have targets,
  axe 0 violations at 360/768/1440, no horizontal scroll, no-JS readable, Briefing opens on B and returns focus, mailto fallback);
  Lighthouse desktop on local preview: performance 100, accessibility 100, best practices 100, SEO 100 after adding robots.txt
  (first run was 92 because preview served HTML for /robots.txt). Screenshots at 360/768/1440 were looked at and fixed
  (hero horizon clipping, header overflow at 360, grid overflow from tables).
- Left for later phases: simulations (5-7), flight (2-4), OG image, JSON-LD (9), 404 page (9), cargo hold data (8), Cargo/telemetry.
- CLAIMS.md has 91 rows. CONTENT_REVIEW.md written.

### Phase 1 (merged, tag phase-1)
PR #2 merged. CI green. Lighthouse on local preview, desktop and mobile: 100 / 100 / 100 / 100 (performance, accessibility, best practices, SEO).

### Phase 2: Engine and flight (done locally)
- Done: capability detection and `decideMode`, tier monitor, damped follow, route math (pure, tested), lazy `scene/` chunk (Three.js + GSAP ticker + Lenis),
  renderer with DPR cap and context-loss fallback, star field (seeded, one Points), procedural probe with plume, camera on a Catmull-Rom route built from the page's sectors,
  pointer steering and banking, HUD (sector label, clock, corner brackets, flight path with six clickable dots, polite live region), boot sequence, role chooser,
  Lite/Flight toggle (L key), `?debug` overlay, focus moves to a section heading after navigation, reduced motion starts Lite and switches to Lite if it turns on mid-visit.
- Verified (ran it): `npm run check` passes (20 logic tests, budgets: first load 19 KB, JS 169.8 KB, fonts 102 KB, total 287 KB gzip/raw as the script counts).
  40 Playwright tests pass, 14 scene tests skipped in WebKit by design (D20). Scene tests cover start, HUD follow forwards and back, dots as links with focus,
  L toggle both ways, context loss to Lite, resize and scrub mid-flight, axe in flight mode at 360/768/1440, reduced motion, no WebGL 2, boot and role chooser.
  On the Mac GPU: 58-60 fps at three widths, also at 4x CPU throttle; zero console errors; draw calls 11-18, triangles under 6,000; geometry count stays at 12 across a full flight (no growth).
  Screenshots at 360, 768 and 1440 were looked at; fixes made: probe moved to the right third and made smaller, header made opaque, corner bracket CSS specificity, phone probe lowered.
- Not verified: Safari/WebKit flight, real phone, VoiceOver. Placeholder spheres stand in for worlds until Phase 3.
- Misses: flight length vs 1,100 vh (D17).

### Phase 2 (merged, tag phase-2)
PR #3 merged, CI green.

### Phase 3: Worlds and jumps (done locally)
- Done: shared noise chunk, 20 GLSL files, `scene/worlds/` with Earth, Argus (banded giant, ring, 14-36 satellites linked into a graph with one red node), BlackWater (black sphere, swirling
  accretion disk, upright lensing ring, photon ring, glow), BeetleJuice (convective red star, glow shell, flare, 60-160 GPU-animated dots in two streams with glowing mismatches),
  Mars, relay station (blinking beacon, signal pulses), Europa (cracked ice, Jupiter behind), the blue home dot. Nebula backdrop (off on low tier). Jump tunnel J1 and J2 with wider field of view,
  intensity a pure function of progress (`jumpIntensity`, tested). World manager creates a world when the probe is within 1.25 stops and disposes it beyond 1.9.
  Per-world framing: each world sits on the side of the screen opposite its dossier panel. `?tier=low|mid|high` forces a tier for testing. CSS pictures hide in flight mode.
- Verified (ran it): `npm run check` passes (22 logic tests; JS 177 KB gzip of 350, first load 19 KB, total 294 KB). 43 Playwright tests pass (17 skipped in WebKit by design).
  New scene tests: second full flight forwards and back ends with identical geometry and texture counts (no leak), low and high tiers fly the route without errors, draw calls under 200 and triangles under 300k.
  Real GPU numbers with ?debug: draw calls 11-33, triangles 1.4k-31k, 60 fps at 1440x900 and 360x740, no console errors, zero image, texture or model downloads (checked by an e2e test that watches every request; the debug overlay shows textures 1, which is not a downloaded file).
  Screenshots at 360 and 1440 were looked at: all six worlds, the jump tunnel mid-flight, contact with the home dot.
- Fixes found by looking: CSS pictures covered the 3D worlds, CSS horizon hid the 3D Earth, photon ring too thick, relay too small.
- Not verified: Safari, a real phone. Mobile portrait hides most of each world behind the dossier (by design: worlds move up and toward the middle).
- Note: "lens flare" is the glow plane with streaks on the star and black hole. Gravity-well lensing pass and chromatic aberration are Phase 4.

## Next
Phase 4: hazard timeline (pure functions of progress), the Belt (instanced probes, text rocks, steering, click to break, hull hit), gravity-well lensing, signal flicker, conjunction readout, drift and star fix, reduced-motion variants, camera shake.
Phase 2: capability and tier detection, lazy Three.js, renderer, loop, starfield, camera path, Lenis+GSAP, probe, HUD frame, boot, role chooser, Lite toggle, ?debug.
