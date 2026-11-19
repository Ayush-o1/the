# Ayush Kumar: a portfolio you fly through

**Live:** https://ayush-o1.github.io/the/

A small probe travels from Earth orbit past six destinations. Each destination is one of my projects, shown as a completed mission. The hazards on the way are the same kinds of failure those projects deal with: collisions, hostile input, a gravity well, drift.

Every project has a small simulation you can use in the page, with no login. Each one runs a rule copied from the real project, and says so.

## The idea

I build backend systems, and most of my projects are about what happens when something goes wrong. A portfolio that scrolls past six screenshots would hide that. So the page shows the failures instead:

| Mission | Project | Failure it deals with | Simulation |
|---|---|---|---|
| Argus | Graph analytics on synthetic data | Hidden patterns | A graph where a planted burst gets flagged by a z-score detector |
| BlackWater | Incident management and a status page | Outages | Declare an incident, walk the lifecycle, see private and public health differ |
| BeetleJuice | Payment settlement reconciliation | Money that does not match | Reconcile two files, then try to approve your own fix |
| theRedArmy | Prompt regression testing (team project) | Silent regressions | Shorten a prompt and watch the CI gate fail |
| deadLetter | An action firewall for AI agents | Prompt injection | Pick an attack and a defence and read each tool call's verdict |
| Europa | Satellite conjunction screening | Collisions and tampered records | Edit one log line and watch the hash chain break |

## How it is built

- **The HTML is the content.** All text is in `index.html`. The flight, the HUD, the Briefing, the Map and the Console read from the page. With JavaScript or WebGL off, it is a normal, fast, readable page ("Lite mode").
- **Vite and vanilla JavaScript.** No framework. Three.js for the flight, GSAP for the ticker and text reveals, Lenis to smooth the wheel. Every file is short and does one job.
- **Everything is procedural.** No images, textures or model files. Planets, the black hole, the star, the tunnel and the lensing are GLSL and geometry. Sound is synthesized with Web Audio, off by default.
- **Rules are pure functions.** Hazards, route mapping, tier selection and all six simulations are plain logic with tests, separate from the code that draws them. Scrolling backwards replays the hazards cleanly because they depend only on scroll position.
- **Honest numbers.** Every factual claim is in `docs/CLAIMS.md` with the file in the project repo that proves it.

More in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Numbers (measured, see `docs/DECISIONS.md`)

- First load (HTML, CSS and boot script): about 26 KB gzip. The 3D scene (Three.js, about 190 KB gzip) loads after the page is readable.
- Lighthouse on a local build: desktop 99 performance and 100 for accessibility, best practices and SEO. Mobile (flight mode) 82 performance, 100 for the rest.
- 60 fps on an M-series Mac with the GPU, also under a 4x CPU slowdown. Draw calls stay under 60 and triangles under 35,000 (post-processing passes included).
- 111 logic tests with the Node test runner, and 133 passing Playwright tests in Chromium and WebKit (the flight tests run in Chromium only), including axe accessibility checks at five viewport sizes.

## Run it

```bash
npm install
npm run dev        # development server
npm run check      # lint, format check, build, logic tests, size budgets
npm run test:e2e   # browser tests (needs: npx playwright install chromium webkit)
npm run build      # static site in dist/
```

Settings you may want to change (email, form key, repository deny-list) are in `src/config.js`.

## What it does not do

It does not claim more than the repos show. There is no CGPA, no certificate and no performance number that I could not reproduce. theRedArmy is a team project and is labelled as one. The simulations are small versions of the real rules, not the projects themselves, and each says so on the page.
