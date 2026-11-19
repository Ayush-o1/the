# Progress

Current phase: 2 complete locally, PR pending. Next: Phase 3 (worlds and jumps).

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

## Next
Phase 3: six procedural worlds with GLSL, nebula, jump tunnel, lens flare, per-world framing, lazy init and dispose.
Phase 2: capability and tier detection, lazy Three.js, renderer, loop, starfield, camera path, Lenis+GSAP, probe, HUD frame, boot, role chooser, Lite toggle, ?debug.
