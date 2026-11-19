# Progress

Current phase: 9 and 10 complete locally, PR pending. Next: Phase 11 (launch).

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

### Phase 3 (merged, tag phase-3)
PR #4 merged, CI green.

### Phase 4: Hazards (done locally)
- Done: `core/hazard-timeline.js` (pure function of progress: hull, gravity, time scale, chroma, drift, fix, flicker, alert key and level), `lib/orbit.js` (closest approach, tested),
  `scene/post.js` (sanitise pass, bloom, lens pass with gravitational lensing, colour fringing at the peak only, faint vignette and grain, tone mapping; low tier renders directly),
  Belt (InstancedMesh of identical probes, 14 rocks with phrase sprites read from the page's Belt list, one rock on the flight path, click to break with fragments),
  drift markers (ghost ring, line, star-fix pulse), Europa conjunction (orbit arc, dashed debris track, debris moving along it, miss distance computed from the geometry: 4.2 km),
  camera shake (300 ms, 4 px max, once on first forward crossing), HUD hull gauge, alert line, flicker (about 2 per second at most), slowing mission clock near the well.
  All alert copy lives in `#hazard-copy` in index.html. Reduced motion (only reachable with ?lite=0): no shake, no tunnels, no flicker, no colour fringing, half lens strength.
- Found and fixed by looking: with bloom on, the Belt frame went fully black at 1440x900 (proved by switching bloom off: frame fine). Some pixel held NaN or infinity and the blur spread it.
  A sanitise pass before bloom fixes it. I did not find which pixel. It is a guard, not a diagnosis.
- Verified (ran it): `npm run check` passes (32 logic tests, JS 190 KB gzip of 350). 46 Playwright tests, WebKit scene tests skipped by design (D20).
  New: hull 100 to 94 to 71 along the route and back to 100 when scrubbed, europa alert reads "Close approach. Miss distance 4.2 km.", flight ends with "Arrived. Good enough to ship.",
  HUD dims at least 333 ms apart, hazards flow through low and high tiers without errors. Real GPU: 60 fps, draw calls 29-55, triangles under 32,000 (post passes included).
  Screenshots looked at: Belt, black hole at peak lensing, deadLetter, Europa with debris track.
- Not verified: WebKit, real phone, how colour fringing and lensing feel in motion (only still frames). Sound for hazards arrives in Phase 8.

### Phase 4 (merged, tag phase-4)
PR #5 merged after CI went green (first run failed on a tier-dependent leak test; fixed by pinning the tier with ?tier=).

### Phase 5: Simulations A, Argus and BlackWater (done locally)
- Done: `src/sims/` with pure logic (`argus-logic.js`, `blackwater-logic.js`), DOM and Canvas UIs, `ui-kit.js`, lazy mounting per simulation (`sims/index.js`), `styles/sims.css`.
  Argus: 36 synthetic accounts, seeded force layout, Inject anomaly (35 transactions in 6 hours), z-score detector, hover and a keyboard list of accounts, text outcome in an aria-live region.
  BlackWater: internal view next to the public page (private incidents change one and not the other), declare incident, lifecycle buttons that refuse bad moves with the real message, publish toggle, audit trail.
  Focus returns to the same control after a re-render, or to a sibling control when the pressed one disappears.
- Verified (ran it): 20 new logic tests pass (lifecycle table equals the real one, health rule, public/private, one audit entry per change, burst count, z-score, determinism).
  14 new Playwright tests pass in Chromium and WebKit (incl. axe at 360 and 1440 with both sims in use, keyboard flow). Screenshots at 1440 and 360 looked at; the first Argus layout piled nodes on the border, fixed by normalising the layout.
- Not done: the sims do not run in the Phase 2 flight HUD (they are page content under the panel, work in both modes).

### Phase 5 (merged, tag phase-5)
PR #6 merged. Its first CI run failed on the leak test again on the slow CI renderer (a lazily uploaded resource); the test now uses two warm-up flights.

### Phases 6 and 7: Simulations B and C (done locally, one PR, see D32)
- Done: BeetleJuice (reconcile 6 ledger and 6 settlement lines to one outcome each, then maker-checker with four people, audit log), deadLetter (5 real scenarios x 3 defences, labels and policy, approval card),
  theRedArmy (edit prompt, save immutable version, run 8 cases, comparison, CI gate), Europa (review-priority scoring, same pair in either order merged, SHA-256 hash-chained log with editable notes, verify, append, restore).
  Each has a pure logic module with tests, a DOM UI, keyboard access and a text outcome in an aria-live region. On a phone the BeetleJuice table becomes labelled cards.
- Verified (ran it): 98 logic tests pass (new: 25 for BeetleJuice and deadLetter, 21 for theRedArmy and Europa, including SHA-256 agreeing with Node crypto, tamper at entry 3 fails at exactly 3, rewritten hash moves failure to the next link).
  Playwright sims.spec.js: 42 tests pass in Chromium and WebKit, including axe at 360 and 1440 with every simulation in use. Screenshots looked at (1440 and 360); fixes: BeetleJuice table overflow on 360 solved with card layout.
- Not done: real-phone test; no screen reader pass (listed for MANUAL_QA).

### Phases 6 and 7 (merged, tags phase-6 and phase-7 on the same commit)
PR #7 merged after CI went green (two earlier CI runs failed on slow-renderer timing in scene tests; those tests now wait longer or compare steady state).

### Phase 8: Navigation and interaction layer (done locally)
- Done: Map dialog (M) listing every sector and every shortcut, fast travel by link; mission console (backtick) with help, missions, open, resume, contact, stack, uptime, whoami (pure `core/commands.js`);
  shortcuts B M ` J K L S (disabled while typing or a dialog is open); Briefing via shared dialog code; deep links that update the address as you move; return to the hash after simulations mount;
  GitHub data (Cargo hold, "Last transmission", 10-minute cache, hidden on failure); synthesized sound (ambient, thrust follows scroll speed, tick, alarm once per hazard), off by default, saved choice starts at first gesture;
  tab title "Signal lost"; Konami code (barrel roll in flight, a toast on the plain page); header buttons shrink to key letters below 1200 px with their names kept for screen readers.
- Also started (Phase 9): GSAP text reveals and hull decode (flight mode only), 404 page, social card tags and JSON-LD Person, `scripts/og-image.js` (the picture itself is not generated yet), `docs/ARCHITECTURE.md`, `docs/MANUAL_QA.md`.
- Verified (ran it): `npm run check` passes (110 logic tests; JS 217 KB gzip of 350, first load 26 KB). Full Playwright run: 120 of 121 passed, the one failure was a test selector that matched the new live regions; fixed and re-run green.
  New tests: map, console, shortcuts, deep links, GitHub data with a stand-in answer, cache, failure path, tab title, Konami in both modes, sound toggle, axe with map and console open.
- Not verified: sound by ear, the contact form's service path (needs a key, D36), motion reveals by eye in a real run.

### Phase 8 (merged, tag phase-8)
PR #8 merged, CI green.

### Phases 9 and 10: polish, QA, performance (done locally, one PR)
- Phase 9 done: 404 page, social card (`public/og.jpg` from `scripts/og-image.js`), Open Graph, Twitter and JSON-LD tags, GSAP text reveals and hull decode (checked by eye mid-animation and settled, no leftover markup),
  sim load-error message, em-dash check added to the banned-word test, voice read-through of Crew and hazard copy (one line reworded). Empty/loading/error states: contact form sending and error notes, GitHub hidden on failure, simulation load failure.
- Phase 10 done: test matrix run: 110 logic tests, 133 Playwright tests passed (25 skipped: flight tests in WebKit by design), five viewports (360, 390, 768, 1440, 1920) with axe and no horizontal scroll, JS disabled, WebGL disabled, reduced motion, scrub forward and back, resize mid-flight, tab hidden, Lite toggled mid-flight, 4x CPU throttle.
- Measured (local build, Lighthouse 12): desktop flight 99 / 100 / 100 / 100 (performance, accessibility, best practices, SEO); mobile flight 82 / 100 / 100 / 100; LCP 1.5 s mobile, CLS 0.011 mobile; INP proxy 160 ms worst on desktop under 4x throttle (D43).
  Budgets from `npm run budgets`: first load 26 KB (limit 60), JS 218 KB (350), fonts 102 KB (150), total 339 KB (700).
- Found by measuring and fixed: mobile performance 66 on the mid tier (D38), GitHub 403 console error (D39), missing source maps (D41).
- Budget misses recorded: flight length versus 1,100 vh (D17). Firefox not tested (D42).
- Not verified: real phone, real Safari, VoiceOver (docs/MANUAL_QA.md).

## Next
Phase 11: set repo description and topics, release notes, tag v1.0.0, final live check with Playwright, final message.
