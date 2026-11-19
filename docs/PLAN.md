# PLAN: Ayush Kumar, space-mission portfolio

Status: authoritative spec. Written 19 Nov 2026.
Repo: `Ayush-o1/the`. Local folder: `/Users/ayush/Desktop/the`.

---

## 0. Summary

A portfolio you fly through. A small probe travels from Earth orbit past six destinations. Each destination is one of Ayush's projects, shown as a completed mission. Hazards on the way are real failure types: collision, hostile signal, gravity well, drift. Those are the same failures his projects deal with.

- **Theme:** space (decision in section 1).
- **Through-line:** "Plan for failure." Three of six projects keep an audit trail. All six handle something going wrong.
- **Stack:** Vite + vanilla JS + Three.js + GSAP + Lenis. No React. No TypeScript.
- **Content lives in HTML.** The 3D layer is an enhancement. Without it, the site is a normal, fast, readable page ("Lite mode").
- **Every project has one small interactive simulation** that works in the browser with no login.
- **A 60-second Briefing** for recruiters who do not want to scroll.
- **12 phases.** Phase 1 ends with a deployable, complete site. The rest add the experience.

### Hard constraints (never change these)

| # | Constraint |
|---|---|
| C1 | Theme is space. |
| C2 | Visitors never log in. No accounts. The only backend call is the contact form. |
| C3 | Vanilla JavaScript. No React. No TypeScript. Ayush must be able to explain every file in an interview. |
| C4 | Every claim on the site is backed by evidence from the repos. Logged in `docs/CLAIMS.md`. |
| C5 | All content is readable and usable without WebGL and without JS animation. |
| C6 | The site never says it was "hand-coded" or "made without AI". Do not claim anything about how it was made. |
| C7 | Free hosting and free tools only. |
| C8 | Respect `prefers-reduced-motion`. Audio is off by default. |
| C9 | No interaction may block content. Every game-like moment is optional and skippable. |
| C10 | Write only to `Ayush-o1/the`. Other repos are read-only. |

---

## 1. Theme decision: space, not war

Ayush gave two themes. Space wins.

1. **His project names already are space.** Europa is a moon of Jupiter. BeetleJuice sounds like Betelgeuse, a red supergiant star. theRedArmy is red, so Mars. Argus is the hundred-eyed watcher, so a survey satellite. BlackWater maps to a black hole. deadLetter is a lost transmission. This fit is rare and free.
2. **Hazards map to real engineering.** Spacecraft are built around fault protection and telemetry. That is the same mindset as audit trails and incident handling.
3. **War makes rivals into enemies.** Other developers as "tank explosions" reads as hostile to a hiring panel. Space lets the competition be a harmless crowd of identical probes.
4. **He already built a War Room portfolio.** Radar sweep, HUD, boot sequence, Web Audio. Those ideas carry over. The new work is the 3D flight.
5. **Tone risk.** Space is safe for every employer on his target list, including banks and fintech.

What to take from the War Room work: boot sequence, HUD overlays, synthesized ambient audio. What to leave: battlefield imagery.

---

## 2. Reference review: yadavaman.com

The reference site (Aman Yadav, Site of the Month) is a single page. It has a boot-style loader ("EXECUTING FOLIO"), playful alternate nav labels, a 3D sphere bot, a grid of ten project cards and a small contact form. Button labels change with the target: "See Live", "View System", "See Code", "Look Inside".

| Take | Reason |
|---|---|
| Boot loader with personality | Sets tone in two seconds. |
| Button label says what the link does | Visitors know what a click will do. |
| One memorable 3D object | Gives the page a face. |

| Do not copy | Reason |
|---|---|
| Flat grid under a big hero | The journey should be the navigation, not a grid. |
| Placeholder text and duplicated labels seen on that page | Looks unfinished. |
| Ten projects | Six is enough. Depth beats count. |

---

## 3. Mission map

Each project becomes a destination. The set piece is chosen to match what the project actually does. Descriptions below come from his GitHub pins. Claude Code must verify details against each repo before writing copy.

### Primary missions (the three featured on his GitHub profile)

| # | Callsign | Body | Real project (from pin) | Failure it deals with | Set piece | Simulation (in the dossier) |
|---|---|---|---|---|---|---|
| M1 | **ARGUS** | Ringed gas giant with a swarm of small satellites | Privacy-first synthetic intelligence platform for graph analytics, anomaly detection and investigations, powered entirely by generated data. Python. | Hidden patterns | Satellites orbit. Thin lines link neighbours into a graph. One node turns red. | Node graph on synthetic data. Hover a node for details. Button "Inject anomaly" shows the detector flagging it. |
| M2 | **BLACKWATER** | Black hole | Incident management with a public status page: services, incident lifecycle with audit trail, invitations and roles, live updates. Node.js, Express, PostgreSQL, Prisma, Socket.IO, vanilla JS. | Outages | Gravity well. Light bends. The approach is the incident lifecycle. | Mini status page. Button "Declare incident" plays the real lifecycle states with an audit trail filling in. |
| M3 | **BEETLEJUICE** | Red supergiant star (a Betelgeuse nod) | Financial operations platform for automated payment settlement reconciliation, discrepancy detection and controlled break resolution with maker-checker approvals and audit trails. | Money that does not match | Two streams of dots (ledger, settlement) converge on the star. Mismatches glow. A ship uses a star fix to correct drift. | Two-column reconcile. Try to approve your own fix: blocked. Use the second approver: allowed. |

Why BlackWater is the black hole: an incident pulls everything toward it. The status page is the beacon that tells others what is happening. The approach arc maps one-to-one to the incident states. Use the repo's real state names.

### Secondary missions ("The Fleet")

| # | Callsign | Body | Real project (from pin) | Failure | Simulation |
|---|---|---|---|---|---|
| M4 | **THEREDARMY** | Mars | Self-hosted LLM prompt regression testing with background workers, PostgreSQL job queues, Redis rate limiting and CI regression gates. **Team project.** | Silent regressions after a prompt change | Edit a prompt, run the suite, see the gate pass or fail. |
| M5 | **DEADLETTER** | Relay station in deep space | CaMeL-inspired action firewall for AI agents. Stops untrusted content from triggering unauthorized tool actions or leaking private data, using information-flow control. | Hostile input (prompt injection) | Messages arrive. Some carry hidden instructions. See which ones the firewall quarantines and why. |
| M6 | **EUROPA** | Jupiter's moon, ice surface, Jupiter behind it | Space situational awareness workbench: satellite conjunction screening, event prioritization, orbital analysis, tamper-evident audit trails. JavaScript. | Collisions, tampered records | Screen close approaches. Edit one log line and watch the tamper-evident chain break. |

Why the order: the featured three come first because recruiters read the first items. The Fleet follows in a tighter format.

### Not on the main route
- **ContextForge**, older projects and any other repo appear in the "Cargo hold": a small list pulled live from the GitHub API (name, description, language). See section 8.

### Naming rules
- Use project names exactly as they appear on GitHub. Do not rename any project.
- theRedArmy is described as a team project. Do not name teammates. Link to the repo's contributors page instead.
- Do not use names or terms from the film *Interstellar* (no Endurance, Gargantua, Cooper, TARS and so on). The mood is borrowed. The names are original.

---

## 4. Audience and first 30 seconds

| Reader | What they want | What they get |
|---|---|---|
| Recruiter or campus panel | Name, role, top projects, resume, contact in under 60 seconds | **Briefing** dialog. One click from the first screen. Key `B`. |
| Engineer or hiring manager | How things are built | **Flight recorder** panel in each dossier (design decisions, trade-offs, stack, repo link). |
| Curious visitor | The experience | The full flight. |

The role chooser appears after the boot sequence. It remembers the choice.

---

## 5. Experience design

### 5.1 Flight plan

Total scroll length: **about 1,100 vh**. A full flight is about 2.5 minutes at a normal scroll. Positions are measured from the DOM at runtime. Do not hard-code pixel offsets.

| Sector | Scroll | What happens |
|---|---|---|
| S0 Launch | 100 vh | Earth below. Name, one line, status chip, buttons. Probe on the pad, engines idle. |
| S1 The Belt | 100 vh | Hazard 1. Crowd of identical probes and buzzword rocks. |
| M1 ARGUS | 120 vh | Orbit insertion. Dossier appears. |
| J1 | 30 vh | Jump tunnel. |
| M2 BLACKWATER | 150 vh | Approach, arc, slingshot. Hazard 2. |
| J2 | 30 vh | Jump tunnel. |
| M3 BEETLEJUICE | 120 vh | Star fix. |
| M4 to M6 The Fleet | 3 × 90 vh | Mars, relay station, Europa. Compact dossiers. |
| Crew file | 100 vh | About, education, tools. Station interior feel, calmer. |
| Contact | 100 vh | Probe turns toward a distant blue dot (home). "Open a channel." Form. |

Anything over 1,100 vh must be cut, not squeezed.

### 5.2 How flight works

- **Scroll moves the probe.** Scroll progress maps to a position along a Catmull-Rom curve. The mapping is piecewise: each section's pixel range maps to its own slice of the path.
- **The probe has mass.** The camera does not snap to the scroll position. It eases with frame-rate independent damping: `current += (target - current) * (1 - exp(-dt * 6))`. Tune the 6 between 4 and 8.
- **Pointer steers a little.** Mouse position shifts the probe up to a small lateral offset and a few degrees of roll. On touch there is no steering.
- **Scrubbing back works.** All hazards are pure functions of scroll progress plus a seeded RNG. Scrolling up reverses them cleanly.
- **Sound and one-shot events fire once**, on first forward crossing.

### 5.3 Hazards

Each hazard has: a trigger range, a visual, a HUD alert, a reduced-motion version, and a link to a real failure type.

| Hazard | Where | What it looks like | Alert copy (draft, refine in phase 9) | Link to real work |
|---|---|---|---|---|
| **The Belt** | S1 | 2,000 identical grey probes drift past (one `InstancedMesh`). About 14 larger rocks carry stock phrases (see section 7.4). The pointer steers. Clicking a rock breaks it. One rock clips the hull. | `CONTACTS 2,000. ALL IDENTICAL.` then `HULL 94%. NOTED.` | The "AI filler" and "everyone has the same portfolio" fear, made funny. |
| **Hostile signal** | M5 | HUD flickers. Incoming messages. One says to ignore previous instructions. | `UNTRUSTED SOURCE. QUARANTINED.` | deadLetter |
| **Conjunction warning** | M6 | Debris track crosses Europa's orbit. HUD shows a close-approach readout. | `CLOSE APPROACH. MISS DISTANCE 4.2 KM.` (use a value the sim computes) | Europa |
| **Gravity well** | M2 | Light bends around the black hole. Time readout slows. Slingshot out. | `GRAVITY WELL. DETECTED. INVESTIGATING.` then states from the real lifecycle | BlackWater |
| **Drift** | M3 | Position error grows, then a star fix zeroes it. | `DRIFT 0.8%. STAR FIX.` | BeetleJuice |

Rules:
- No flash faster than 3 per second. No full-screen white flash.
- Camera shake: 300 ms, at most 4 px. Off under reduced motion.
- Hull is a flavour gauge. It starts at 100%. The Belt drops it to 94%. It ends the flight near 71% with the line `Arrived. Good enough to ship.` It is a joke, not a metric. Label it as flight status, never as a code-quality number.

### 5.4 HUD

Always on, never in the way. `aria-hidden` for decorative parts.

- **Top left:** `AK-01` and sector name.
- **Top right:** mission clock `T+00:00` (real time on the page), Sound toggle, Lite toggle, Map button, Briefing button.
- **Bottom:** the flight path. A thin horizontal line with a dot for each mission. A marker shows current position. Dots are clickable (fast travel).
- **Corners:** thin bracket marks. Nothing else.
- **Mobile:** top bar shrinks to icons. Bottom path stays.

### 5.5 Mission dossier (the project panel)

Not a card. A docked panel with a chamfered corner. Desktop: left or right half, alternating. Mobile: bottom sheet, max 60% of the viewport, never covers the ship fully.

Contents, in order:
1. Designation line: `MISSION 01 / ARGUS` (mono, small).
2. Callsign (serif, large).
3. Status chip: `ACTIVE`, `COMPLETE` or `ARCHIVED`. Only what is true.
4. **Objective.** One or two sentences.
5. **What it does.** Three bullets at most.
6. **Hazards met.** Two or three real engineering problems from the repo and how they were handled.
7. **Simulation.** One interactive panel with the label `Simulation. Synthetic data. Not the live app.`
8. **Flight recorder** (collapsed by default, open by default for the Engineer role). Design decisions, trade-offs, stack.
9. Stack tags (mono).
10. Links with honest verbs: `Read the code`, `Open live demo` (only if one exists), `See the architecture` (only if a diagram exists).

### 5.6 Interaction list (no login)

| # | Feature | Priority |
|---|---|---|
| 1 | Role chooser | Must |
| 2 | Briefing dialog (key `B`) | Must |
| 3 | Mission map and fast travel (key `M`) | Must |
| 4 | Lite mode toggle | Must |
| 5 | Six simulations | Must |
| 6 | Pointer steering | Should |
| 7 | Click to break rocks in the Belt | Should |
| 8 | Mission console: backtick key opens a tiny command line (`help`, `missions`, `open argus`, `resume`, `contact`, `stack`, `uptime`, `whoami`) | Should |
| 9 | Live GitHub telemetry: "Last transmission: 2 days ago" from the public API, cached 10 minutes, hidden on failure | Should |
| 10 | Cargo hold: other repos listed from the GitHub API | Should |
| 11 | Deep links (`#argus`), history updated as you move | Must |
| 12 | Sound (synthesized, off by default) | Should |
| 13 | Tab title changes to `Signal lost` when the tab is hidden | Could |
| 14 | Konami code gives a barrel roll | Could |
| 15 | Click the tiny Argus satellite in the hero sky for a fact | Could |

Rejected: public guestbook or comment wall. It needs moderation and a backend, and spam in front of a recruiter hurts more than it helps. The contact form covers the need.

### 5.7 Transitions and loading

- **Boot sequence (first visit only, 2.2 s max, any key or tap skips).** Lines show real checks:
  ```
  AK-01 FLIGHT COMPUTER
  > display .... 1440x900 @2x
  > webgl ...... ok  (tier: mid)
  > motion ..... full
  > audio ...... off
  > hull ....... 100%
  READY
  ```
  On later visits there is no boot. Text and the hero show immediately.
- **Order of load:** HTML and CSS first. The hero text is readable at once. Three.js loads with dynamic `import()` after first paint. The canvas fades in over 600 ms. No blocking spinner.
- **Jump tunnels (J1, J2):** a short streak-and-tunnel shader. 30 vh of scroll. Skippable by jumping via the map.

---

## 6. Visual system

### 6.1 Mood
Dusty, warm, desaturated. Think film, not neon. Amber instrument light on a near-black void. Large empty space. Small bright objects. A faint grain and vignette. No purple-blue gradient glow. No glassmorphism.

### 6.2 Colour tokens

Contrast was computed (WCAG ratios).

| Token | Hex | Use | On `--void` | On `--panel` |
|---|---|---|---|---|
| `--void` | `#06070A` | Page background | n/a | n/a |
| `--panel` | `#0D1017` | Dossier, dialogs | n/a | n/a |
| `--star` | `#EDE7DA` | Main text (warm off-white) | 16.35 | 15.44 |
| `--dim` | `#9A978D` | Secondary text | 6.89 | 6.51 |
| `--amber` | `#FFB454` | Accent: links, HUD, buttons | 11.42 | 10.79 |
| `--alert` | `#FF5A3C` | Hazards only | 6.50 | 6.14 |
| `--ok` | `#7FD1B9` | "Nominal" status only | 11.25 | 10.62 |
| `--line` | `rgba(237,231,218,.18)` | Hairlines, borders | for non-text UI | |

Rules: amber is the one accent. Red appears only for hazards. Teal appears only for "OK". Never use more than two accents on one screen. Void on amber (button hover) is 11.42.

### 6.3 Type

Self-hosted from `@fontsource` (all three verified on npm). Subset to Latin. `font-display: swap`.

| Role | Font | Why |
|---|---|---|
| Display (name, callsigns, section titles) | **Instrument Serif** (regular and italic) | Editorial. Breaks the "tech site" look. Looks like a mission patch or a poster. |
| Body | **IBM Plex Sans** (400, 600) | Engineering heritage. Very readable. Pairs with its own mono. |
| HUD, labels, tags | **IBM Plex Mono** (400) | Instrument feel. Same family as the body. |

Not used on purpose: Inter, Space Grotesk, Orbitron and similar. They are the default look of generated space sites.

Scale (fluid):
- Display: `clamp(3rem, 9vw, 9rem)`, line-height 0.95, serif.
- H2: `clamp(2rem, 5vw, 4rem)`, serif.
- Body: `1.0625rem / 1.6`, max width 62ch.
- HUD: `0.75rem`, uppercase, letter-spacing `0.12em`, mono.

### 6.4 Components

- **Primary button.** Mono uppercase label. 1 px amber border. Corners chamfered 8 px with `clip-path`. Hover: fill amber, text becomes void, 120 ms. Active: moves 2 px down. Keyboard hint badge like `[B]` where a shortcut exists. Focus: 2 px amber outline with 3 px offset.
- **Secondary button.** Same shape, `--line` border, `--star` text.
- **Link.** Amber, underline with 3 px offset. Never just colour.
- **Tag.** Mono 0.75 rem, 1 px `--line` border, no fill.
- **Status chip.** Mono, `ACTIVE` in amber, `COMPLETE` in teal, `ARCHIVED` in dim.
- **Panel.** `--panel` at 92% opacity. 1 px `--line` border. One chamfered corner. No blur.
- **Grid.** 12 columns, 24 px gutters on desktop. Single column on mobile with 20 px side padding.
- **Spacing scale.** 4, 8, 12, 16, 24, 32, 48, 72, 112.

### 6.5 Motion rules

| Element | Motion |
|---|---|
| Text reveal | Lines slide up out of a mask. 0.9 s, `power3.out`, 0.06 s stagger. Triggered once per section. |
| Content reveals | Never longer than 1.2 s. Never delay reading. |
| HUD numbers | One-time decode effect on first show (GSAP ScrambleText). |
| Probe | Slow breathing offset, banking from lateral velocity, plume length from scroll velocity. |
| Camera | Damped. No sudden cuts except the jump tunnels. |
| Bloom | Engines, star, accretion disk only. |
| Chromatic aberration | Only at the peak of the gravity well. |
| Grain and vignette | Always on, very subtle. Off in Lite. |
| Parallax on text | None. |
| Reduced motion | No shake, no flash, no tunnels, no scrambles. Lite mode starts automatically. |

### 6.6 Imagery
No photos, no downloaded 3D models, no texture files. Everything is procedural: shaders, geometry, canvas. This keeps the repo small, the load fast and the licensing clean. Favicon is an inline SVG. The social card (OG image) is generated once with Playwright from the hero.

### 6.7 Sound
Synthesized with Web Audio. No audio files. Off by default. A visible toggle. The choice is saved.

- Ambient: two detuned oscillators, low-pass filter, slow LFO.
- Thrust: filtered noise. Gain follows scroll velocity.
- UI tick: 20 ms click.
- Alarm: two short tones, once per hazard.
- Master gain 0.15. Start only after a user gesture.

---

## 7. Content and voice

### 7.1 Voice
First person. Short sentences. Plain English. Specific nouns. Dry humour is fine. No motivation, no philosophy, no hype.

**Banned words and patterns:** passionate, leverage, seamless, cutting-edge, innovative, robust, synergy, delve, tapestry, elevate, unlock, empower, game-changer, journey, solutions, "in today's world", "not just X, but Y", three-item lists used as a reflex, em-dash chains, exclamation marks. The only exception is the fourteen Belt rock phrases in 7.4, which exist to mock these words.

Good: "BlackWater shows who is affected when something breaks."
Bad: "A robust, scalable platform empowering teams to seamlessly manage incidents."

### 7.2 Hero (draft, Claude Code may refine within the rules)
- Eyebrow: `AK-01 · Final-year B.Tech CS · Bengaluru · Graduating 2027`
- H1: `Ayush Kumar`
- Line: `I build backend systems. Most of my projects are about what happens when something goes wrong: an outage, a mismatch, bad input.`
- Status chip: `Looking for SDE and backend roles`
- Buttons: `Start the flight` (primary), `60-second briefing`, `Resume`, `GitHub`.

### 7.3 Dossier writing rules
- The Objective states what the project does in plain words.
- "Hazards met" lists real engineering problems. Source: README, commit history, issues, code. If a problem cannot be proven from the repo, do not write it.
- Numbers appear only if Claude Code can reproduce them by running the project, or they are printed in the repo's README or CI output. Otherwise leave numbers out.
- Do not use: "70+ REST APIs", "20 PostgreSQL models", "sub-30ms latency", the theRedArmy worker speedup figure. They are unverified.
- Do not claim React, TypeScript, AWS, Azure, GCP, Kafka, Docker or Selenium. Skills come from repo evidence only.
- LeetCode, if shown, reads "about 200 problems". No exact count.

### 7.4 Belt rock phrases
Stock phrases from generic portfolios. Examples: `passionate developer`, `AI-powered solutions`, `scalable and robust`, `full-stack ninja`, `fast learner`, `team player`, `cutting-edge`, `results-driven`, `10x`, `seamless experience`. Fourteen in total. They are the joke. Keep the tone light and not aimed at any person.

### 7.5 Claims policy
`docs/CLAIMS.md` has one row per factual claim on the site: claim, where it appears, evidence (file path and line, or commit hash, or CI log). A claim with no evidence is removed or rewritten.
`docs/CONTENT_REVIEW.md` lists everything Ayush should read once before sharing the link.

### 7.6 About ("Crew file")
Facts allowed: final-year B.Tech CS at Jain (Deemed-to-be University), Bengaluru, graduating 2027. CGPA is optional (`showCgpa` flag in `config.js`, default on only if it appears on his resume). Achievements, hackathon, certification: only if found in his resume source or GitHub profile. Skills: derived from repo evidence. No skill bars or percentages. Use words: `Use daily`, `Used in a project`, `Basic`.

---

## 8. Technical plan

### 8.1 Stack and reasons

| Choice | Reason |
|---|---|
| **Vite 8** (needs Node 20.19+ or 22.12+; check the Node version on Ayush's Mac in Phase 0) | Fast, plain, no framework needed. Easy static deploy. |
| **Vanilla JS, ES modules** | C3. Ayush knows it. Interview-safe. |
| **Plain CSS with custom properties**, split into small files | No build-time framework to learn. Tokens are the design system. |
| **Three.js with `WebGLRenderer`**, version pinned exactly | The renderer works on nearly every device. The `WebGPURenderer` has WebGL 2 fallback, but it is still the newer path, and for a site every visitor must open, the stable path is safer. Custom GLSL files for the shaders. |
| **GSAP + ScrollTrigger + SplitText + ScrambleText** | GSAP and all plugins are free, including commercial use. Standard for scroll timelines. |
| **Lenis**, driven by GSAP's ticker | Smooth wheel scrolling. Recent versions turn smoothing off for reduced-motion users. Disable on touch (`syncTouch: false`). |
| **Web Audio API** | No audio files. |
| **Playwright + axe-core** | Smoke tests, screenshots, keyboard and accessibility checks. |
| **ESLint + Prettier** | Consistent code. |
| **Node built-in test runner** (`node --test`) | For pure logic in simulations. No extra dependency. |
| **GitHub Actions + GitHub Pages** | Free. Already where the code lives. |

Verified on npm on 19 Nov 2026: three 0.187.0, gsap 3.15.1, lenis 1.3.27, vite 8.3.8, @playwright/test 1.65.1, @axe-core/playwright 4.14.0, and the three Fontsource packages. Claude Code must re-check with `npm view` and pin the exact versions it installs.

### 8.2 Architecture rules

1. **HTML is the source of truth for all text.** The mission list, Briefing, Map, Console and HUD read from the DOM (`data-mission`, `data-sector` attributes). Text is never duplicated in JS. This gives SEO, no-JS reading and one place to edit.
2. **Progressive enhancement.** Start-state hiding is done by JS after it confirms WebGL works. CSS never hides content before JS runs.
3. **Three.js loads lazily** with dynamic `import()` after first paint.
4. **Simulations use DOM, SVG or Canvas 2D**, not WebGL. They work in Lite mode.
5. **Small modules.** Each file under 250 lines. One job per file. Comments explain why, not what.
6. **Seeded RNG** (`lib/rng.js`) for anything random, so hazards are deterministic.
7. **Dispose what you create.** Worlds initialise when near and dispose when far. Check `renderer.info` for leaks.
8. **Failure isolation.** Each scene module runs inside `try/catch`. If the scene fails, add `html.lite` and carry on.

### 8.3 Folder layout

```
the/
├─ index.html              # all content, semantic
├─ vite.config.js          # base: './'
├─ package.json
├─ eslint.config.js  .prettierrc  .gitignore
├─ public/                 # favicon.svg, og.png, robots.txt, sitemap.xml, resume.pdf (if provided)
├─ src/
│  ├─ main.js              # boot, capability check, lazy-load scene
│  ├─ config.js            # links, form key, flags (showCgpa, repo deny-list)
│  ├─ styles/              # tokens, base, layout, hud, components, dossier, lite
│  ├─ core/                # capabilities, tier, state, scroll, loop, audio, keys, a11y
│  ├─ scene/               # renderer, camera-path, starfield, nebula, probe, post, jump
│  │  ├─ worlds/           # argus, blackwater, beetlejuice, mars, relay, europa
│  │  └─ hazards/          # index (timeline), belt, lensing, signal, conjunction
│  ├─ shaders/             # *.glsl (imported with ?raw)
│  ├─ ui/                  # hud, map, briefing, console, dossier, boot, role, toast
│  ├─ sims/                # argus, blackwater, beetlejuice, redarmy, deadletter, europa
│  └─ lib/                 # rng, dom, format
├─ tests/                  # smoke, a11y, keyboard, visual (Playwright); logic (node --test)
├─ docs/                   # PLAN, PROGRESS, DECISIONS, CLAIMS, CONTENT_REVIEW, BLOCKERS, DEPLOY, MANUAL_QA, ARCHITECTURE, HANDOFF
├─ scripts/                # og-image.js, check-budgets.js
└─ .github/workflows/      # ci.yml, pages.yml
```

### 8.4 Render tiers and Lite mode

| Tier | When | Rendering |
|---|---|---|
| `high` | Frame time stays under 12 ms | Bloom, grain, chromatic aberration, 2,000 belt probes, DPR up to 2 |
| `mid` | Start here | Bloom on, 1,200 belt probes, DPR up to 1.5 |
| `low` | Frame time over 24 ms for 90 frames, or small device | No post, 500 belt probes, DPR 1, fewer stars |
| `lite` | No WebGL2, reduced motion, `Save-Data`, user toggle, `?lite=1`, scene error | No canvas. CSS star background. Sections stack as a normal page. Simulations still work. |

Start at `mid`. Measure real frame time. Move up or down. Do not trust `deviceMemory` alone, because Safari does not expose it.

Other safeguards: pause rendering when the tab is hidden or the canvas is off screen. Handle `webglcontextlost` by switching to Lite. A `?debug` overlay shows FPS, tier, draw calls and triangles.

### 8.5 Performance budgets

| Metric | Budget |
|---|---|
| HTML + CSS + boot JS (first load) | 60 KB gzip or less |
| Total JS including Three.js | 350 KB gzip or less |
| Fonts | 150 KB or less |
| Total transfer | 700 KB or less |
| LCP (Fast 4G, 4x CPU slowdown) | 2.5 s or less |
| CLS | 0.05 or less |
| INP | 200 ms or less |
| Draw calls per frame | 200 or fewer |
| Triangles per frame | 300k or fewer |
| FPS | 60 on a laptop, 30 or more on a mid-range phone |
| Lighthouse desktop | Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+ |
| Lighthouse mobile | Performance 70+ (WebGL), other three 95+ |

`scripts/check-budgets.js` fails CI if bundle budgets are exceeded.

### 8.6 Accessibility

- Semantic landmarks, one `h1`, ordered headings. Skip link first.
- Canvas is `aria-hidden`. HUD decoration is `aria-hidden`. HUD status that matters (current sector) is in a polite `aria-live` region, updated at most once per sector.
- Full keyboard use: `Tab`, `Enter`, `Esc`. Shortcuts: `B` briefing, `M` map, `` ` `` console, `J` and `K` or arrow keys for next and previous mission, `L` lite toggle, `S` sound. Shortcuts are disabled when typing in a field. A visible shortcut list is in the Map dialog.
- Dialogs use `<dialog>`, trap focus, return focus on close.
- Focus is always visible.
- Text contrast 4.5:1 or better (all tokens above pass).
- No flash faster than 3 per second.
- Reduced motion is honoured at the start and when the setting changes.
- Touch targets 44 px or larger.
- Simulations have text equivalents of their outcome in an `aria-live` region.

### 8.7 SEO and sharing
Title, description, canonical, Open Graph and Twitter tags, JSON-LD `Person`, `robots.txt`, `sitemap.xml`, SVG favicon, `theme-color` `#06070A`, one generated OG image, a real `404.html`.
No analytics, no cookies. The footer says so. (Optional later: GoatCounter.)

### 8.8 Contact form
Fields: name, email, message, hidden honeypot. Sends through a free form endpoint (Web3Forms or Formspree). The endpoint key sits in `config.js`. **If the key is empty, the form falls back to a prefilled `mailto:` link**, so it works on day one. Show clear success and error states. Never claim a response time.

### 8.9 GitHub telemetry
`GET https://api.github.com/users/Ayush-o1/repos?per_page=100&sort=pushed`. Cache in `sessionStorage` for 10 minutes. If the call fails or is rate-limited, hide the telemetry silently. Use it for "Last transmission" and for the Cargo hold. Skip forks. Use a deny-list in `config.js`.

### 8.10 Hosting and deploy
- GitHub Pages, deployed by Actions on every push to `main`.
- `vite.config.js` uses `base: './'` so it works at `ayush-o1.github.io/the/` and on a custom domain.
- If Pages is unavailable (private repo on a free plan), keep the workflow in place and note it in `docs/DEPLOY.md`.
- Custom domain is optional and later.

### 8.11 Git workflow
- `main` is always deployable.
- One branch per phase: `phase/N-name`.
- Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Small commits. Meaningful messages.
- At the end of each phase: run `npm run check`, push, open a PR with `gh pr create`, merge with squash, tag `phase-N`.
- If `gh` or push fails: keep committing locally, write the problem in `docs/BLOCKERS.md`, continue with the next phase, report at the end.

---

## 9. Phases

Each phase leaves the site working. Sizes are for one agent session: S small, M medium, L large.

### Phase 0: Recon and setup (S)
- Check Node 20.19+ or 22.12+, git, `gh auth status`. Set up the repo and remote. If the remote has content, do not overwrite it. Branch from it.
- Shallow-clone the six repos read-only to `/tmp/ayush-src/`. Per project, extract: purpose, stack, real features, architecture, real state names, how to run, homepage URL, commit history highlights, tests.
- Read Ayush's public GitHub profile and profile README for LinkedIn, portfolio and public email.
- Write `docs/CLAIMS.md`, `docs/CONTENT_REVIEW.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`. Save this plan as `docs/PLAN.md`.
- Scaffold Vite. Install pinned dependencies. Set up ESLint, Prettier, Playwright, scripts (`dev`, `build`, `preview`, `lint`, `test`, `check`), CI and Pages workflows.
- **Done when:** `npm run check` passes on the empty shell, CI is green, Pages shows a placeholder.

### Phase 1: Content and the Lite site (M)
- Tokens, fonts, base CSS, layout.
- Full semantic HTML: hero, six dossiers (real copy), Crew file, Contact with form, footer, header nav, Briefing dialog markup.
- CSS-only star background. Skip link. Responsive from 360 px to 1920 px.
- Contact form with mailto fallback.
- **Done when:** the whole site is readable and usable with JS disabled. Lighthouse accessibility 95+. Every claim is in `CLAIMS.md`. Deployed.

### Phase 2: Engine and flight (L)
- Capability and tier detection. Lazy-load Three.js. Renderer, resize, DPR, loop, visibility pause.
- Starfield. Camera path. Lenis and GSAP sync. Damped scroll mapping. Probe model (procedural: bus, foil, dish, panels, boom, nozzles) and engine plume.
- HUD frame. Boot sequence. Role chooser. Lite toggle. Context-loss fallback. `?debug` overlay.
- **Done when:** the probe flies a placeholder path through all sectors. 60 fps on the M4. At least 45 fps with 4x CPU throttle. Reduced motion starts Lite. Section focus management works.

### Phase 3: Worlds and jumps (L)
- Six procedural worlds with GLSL: banded gas giant with ring, black hole with accretion disk, convective red star, Mars, relay station, Europa with Jupiter. Nebula backdrop. Jump tunnel. Lens flare. Per-world camera framing.
- Lazy init and dispose. Tier fallbacks.
- **Done when:** each world renders with zero texture downloads. Under 200 draw calls and 300k triangles. No leaks across a full flight in both directions.

### Phase 4: Hazards (M)
- Hazard timeline system (pure functions of progress).
- The Belt (instancing, text-sprite rocks, steering, click to break, hull hit). Gravity-well lensing pass and chromatic aberration. Signal flicker. Conjunction readout. Drift and star fix.
- Reduced-motion variants. Camera shake.
- **Done when:** scrubbing forward and back is clean. No flash over 3 per second. HUD text stays readable. Frame budget holds.

### Phase 5: Simulations A, Argus and BlackWater (M)
- Argus graph (Canvas 2D). BlackWater status page and lifecycle (DOM).
- Pure logic in testable modules. Keyboard access. Text outcome in `aria-live`.
- **Done when:** both work in Lite and Full. Logic tests pass.

### Phase 6: Simulations B, BeetleJuice and deadLetter (M)
- BeetleJuice maker-checker: self-approval blocked, second approver allowed.
- deadLetter firewall: trusted and untrusted messages, verdicts, reasons. Reasons must match the real design in the repo.
- **Done when:** same as phase 5.

### Phase 7: Simulations C, theRedArmy and Europa (M)
- theRedArmy regression gate (edit prompt, run suite, pass or fail).
- Europa conjunction screening and tamper-evident log (hash chain, edit breaks it). Use the real mechanism from the repo.
- **Done when:** same as phase 5.

### Phase 8: Navigation and interaction layer (M)
- Mission map and fast travel. Briefing dialog logic. Console. Keyboard shortcuts. Role behaviour. Deep links with history updates.
- GitHub telemetry and Cargo hold. Contact form wiring. Sound engine and toggle. Tab-title swap. Konami.
- **Done when:** the whole site is operable by keyboard alone. Every shortcut is listed in the Map dialog.

### Phase 9: Copy and motion polish (M)
- Full voice pass against the banned list. Microcopy. Hazard alert text. Easing curves. Grain and vignette. Text reveals. Button states. Loading and error states. 404. Favicon. OG image. JSON-LD. Sitemap.
- **Done when:** a read-through finds no banned word. Every hazard line is short and clear.

### Phase 10: QA, performance, accessibility (M)
- Run the test matrix (section 10). Fix what fails. Check budgets. Write `docs/MANUAL_QA.md` (what Ayush should test on a real phone and with VoiceOver).
- **Done when:** all budgets and Lighthouse targets are met, or each miss is recorded with a reason in `DECISIONS.md`.

### Phase 11: Launch (S)
- README written as a short case study. `docs/ARCHITECTURE.md`. Set GitHub repo description and topics with `gh`. Tag `v1.0.0`. Release notes.
- Final live check of the deployed URL with Playwright.
- `docs/HANDOFF.md`: what Ayush must still do (see section 12).
- **Done when:** the live site passes the smoke test and `PROGRESS.md` shows all phases complete.

Rough total: about 12 agent sessions. Phases 0 to 1 give a full usable site first, which helps with current applications.

---

## 10. Test matrix

| Area | Test |
|---|---|
| Browsers | Chromium and WebKit via Playwright. Firefox if available. |
| Viewports | 360×740, 390×844, 768×1024, 1440×900, 1920×1080 |
| Modes | Full, Lite, reduced motion, JS disabled, WebGL disabled |
| Smoke | Every section renders. Every link has a target. No console errors. |
| Keyboard | Reach every control. Open and close each dialog. Shortcuts work. Focus returns. |
| Accessibility | axe-core on Lite and Full, all viewports |
| Logic | `node --test` for all simulation logic |
| Visual | Screenshots of each sector at three viewports. Claude Code must open and look at them, and fix what looks wrong. |
| Performance | Lighthouse, budgets script, throttled run |
| Regression | Scrub forward and back. Resize mid-flight. Switch tabs. Toggle Lite mid-flight. |

Headless Chromium needs software GL for WebGL (for example `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`). Claude Code should find the working flags and record them in `docs/DECISIONS.md`.

---

## 11. Risks

| Risk | Plan |
|---|---|
| Scope grows | Fixed section lengths. Phases are ordered by value. Anything new goes to the backlog. |
| Recruiter has no patience | Briefing, Map, deep links, role chooser. |
| Weak phone | Tiers, adaptive DPR, Lite. |
| iOS Safari quirks (viewport height, context loss) | Use `svh` and `dvh`. Context-loss fallback. Test in WebKit. |
| Scroll hijack annoys people | Native scrolling stays. Lenis only smooths it. Never lock scroll. |
| Claims that are not true | `CLAIMS.md` evidence rule. |
| Site looks generated | Original copy rules, original fonts and palette, hazards tied to real work, no stock layouts. Do not claim a hand-made origin (C6). |
| GitHub API rate limit | Cache. Hide on failure. |
| Form spam | Honeypot. Provider filtering. |
| Pages not available | Workflow stays. Notes in `DEPLOY.md`. |
| Licensing | Everything procedural. Fonts are OFL. GSAP's free licence covers this use. Three.js is MIT. |
| Long build overruns one agent session | `PROGRESS.md` is the memory. Resume from it. |

---

## 12. Things only Ayush can supply (defaults keep the build moving)

| Item | Default if missing |
|---|---|
| `resume.pdf` | Put it at `public/resume.pdf`. If absent at build, the Resume button is hidden and `HANDOFF.md` lists it. |
| Public email | Use the public email on his GitHub profile if it exists. Otherwise the form and LinkedIn only. |
| Form endpoint key | `mailto:` fallback. |
| LinkedIn URL | Take it from his GitHub profile or README. Hide if not found. |
| Custom domain | Use the Pages URL. |
| Read `docs/CONTENT_REVIEW.md` once | Site ships with evidence-backed copy only. |

---

## 13. Backlog (not in v1)

- Autopilot mode (guided auto-scroll).
- Second theme using the same engine.
- Blog or write-ups section.
- Privacy-friendly analytics.
- Real glTF probe model.
- Sound design pass with recorded audio.

---

## 14. Sources used for this plan

- Reference site: https://www.yadavaman.com/
- GSAP is free, plugins included: https://github.com/greensock/GSAP
- Three.js `WebGPURenderer` and WebGL 2 fallback: https://threejs.org/manual/en/webgpurenderer
- Lenis and reduced motion: https://motion.dev/docs/lenis
- Vite static deploy to GitHub Pages: https://main.vite.dev/guide/static-deploy
- Vite 8 Node requirement: https://engine.needle.tools/docs/help/upgrading-vite
- Space portfolio, example: https://discourse.threejs.org/t/an-open-world-space-experience-as-a-portfolio/74951
- Scroll-driven 3D portfolio write-up: https://tympanus.net/codrops/?p=114641
- Three.js sites by technique, 2026: https://www.utsubo.com/blog/best-threejs-websites-2026
