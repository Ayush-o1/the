# Progress

Current phase: 1 complete locally, PR pending. Next: Phase 2 (engine and flight).

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

## Next
Phase 2: capability and tier detection, lazy Three.js, renderer, loop, starfield, camera path, Lenis+GSAP, probe, HUD frame, boot, role chooser, Lite toggle, ?debug.
