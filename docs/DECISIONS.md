# Decisions

Format: ID, date, decision, reason.

## D01 (19 Nov 2026) Node 24 on this Mac

Node is v24.22.1. Vite 8 needs 20.19+ or 22.12+, so it is fine. CI uses Node 22 to match the plan's floor.

## D02 Contact email

The public GitHub profile email field says `ayushh.ofc10@gmail.com`. The profile README says
"Fastest way to reach me" and gives `ayushh.pvt10@gmail.com`. Both are public. The site uses the README one
because Ayush wrote it as the preferred address. The contact form falls back to a `mailto:` to this address.
Change it in `src/config.js` (and the `mailto:` links in `index.html`) if the other is preferred.

## D03 Commit and PR text

Commits and PR descriptions carry no tool or authorship trailers. C6 says nothing may state or imply how
the site was made, and a trailer does exactly that in a public repo.

## D04 Planning inputs stay out of git

`BUILD_PROMPT.md`, `RESEARCH_PROMPT.md` and the root `PLAN.md` are in `.gitignore`. They are inputs to the work, not part of the site.
`docs/PLAN.md` is the verbatim copy the build prompt asks for and is committed, because `docs/PROGRESS.md` and `docs/PLAN.md`
are the memory for later sessions. `HANDOFF.md` tells Ayush that the docs folder describes the process and
can be moved out of the public repo if he prefers (C6 is about the site itself).

## D05 Argus facts that differ from the plan table

The plan says "Argus. Python." The repo is Python (FastAPI, Neo4j, PostgreSQL, Redis) with a Next.js and TypeScript frontend.
Plan 7.3 forbids claiming React or TypeScript. The site therefore lists the backend stack only and does not mention the
frontend framework. The Crew file does not list React or TypeScript at all.

## D06 Argus simulation uses the z-score half only

The real detector needs Isolation Forest AND z-score >= 3.0. The browser simulation cannot run scikit-learn.
It implements the z-score on the 6-hour burst count only, and says so in its caption.

## D07 BeetleJuice drift hazard

The plan's "DRIFT 0.8%. STAR FIX." hazard is flavour. The real counterpart is rule R08 (fee variance, fee tolerance 1 paisa).
The HUD line stays short; the dossier names the real rule.

## D08 Resume

`resume.pdf` was not found in the project folder. The Resume button is hidden when `public/resume.pdf` is absent
at build time. Listed in `HANDOFF.md`.

## D09 Skills wording
Plan 7.6 offers three words: Use daily, Used in a project, Basic. C++ does not fit any of them (it is DSA practice, not a project, and "Basic" undersells it).
The Crew file adds a fourth group, "For practice". Docker is left out on purpose (plan 7.3) even though repos contain Dockerfiles.
Vitest, Supertest, Playwright, pytest and GitHub Actions appear in "Used in a project" (BlackWater, Argus, theRedArmy CI files). MongoDB is left out: none of the six repos use it.

## D10 Status chips
Chips are static HTML, set by one rule: ACTIVE = the repo had a commit in the 30 days before 19 Nov 2026; COMPLETE = shipped (live URL or documented release or launch checklist) with no commit in that window; ARCHIVED = none used.
BlackWater (9 Nov), BeetleJuice (9 Nov), theRedArmy (9 Nov) and deadLetter (5 Nov) are ACTIVE. Argus (26 Aug) and Europa (19 Oct) are COMPLETE.
They go stale if Ayush stops or restarts work. `HANDOFF.md` says so.

## D11 Live demo links
Argus (https://argus-rosy-one.vercel.app) and BlackWater (https://blackwater-app.onrender.com) both answered HTTP 200 on 19 Nov 2026.
Argus's page is a landing page with an "Enter Argus" button. BlackWater needs a sign-in or registration. The label stays "Open live demo".
`HANDOFF.md` asks Ayush to confirm what visitors can actually do there.

## D12 Roles and the "no login" rule
C2 says visitors to this site never log in. The two external demos are other sites. The simulations on this site need no login.

## D13 Hero line
Kept the plan's draft verbatim. It passes the voice rules.

## D14 Missions are shown in HTML order, not randomised
Plan 3 puts the featured three first. The page follows that.

## D15 Preview server note
`vite preview` answers unknown paths with index.html (status 200), so tests that check for a missing file must also check the content type.

## D16 Headless WebGL flags
Software rendering works in headless Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
It is slow (16 to 55 fps in my runs) and only proves the scene runs. These flags are in `playwright.config.js`.
For frame rate I used the Mac's GPU: `--use-gl=angle --use-angle=metal --ignore-gpu-blocklist` (`GL=metal node scripts/scene-check.js`).
With that, the scene held 58 to 60 fps at 1440x900, 768x1024 and 360x740, also under a 4x CPU throttle (CDP `Emulation.setCPUThrottlingRate`).
60 is the display's refresh cap, so this shows "not below 60", not how much headroom there is.

## D17 Flight length is driven by the content, not by 1,100 vh
Plan 5.1 wants about 1,100 vh and says to cut, not squeeze. The six dossiers are real content with evidence behind each line,
so the page is longer: about 13.7 screens at 1440x900 (12,317 px) as of Phase 1. Positions are measured from the DOM, as the plan asks,
and the probe holds still while a dossier is read. Cutting would remove claims or the simulations. Flight recorders are collapsed by default, which already trims it.
Recorded as a miss against 5.1. Revisit in Phase 10 if the pacing feels long.

## D18 Tier monitor measures work time for "fast"
Plan 8.4 says `high` needs frame time under 12 ms. On a 60 Hz screen the gap between frames is 16.7 ms at best, so that could never happen.
`sample(frameMs, workMs)` now promotes to `high` when the frame's own JS and submit time stays under 6 ms and frames arrive on time (under 20 ms) for 300 frames.
Demotion is unchanged: 90 frames over 24 ms.

## D19 GSAP use so far
Phase 2 uses only GSAP's ticker (to share one clock with Lenis). ScrollTrigger, SplitText and ScrambleText are not imported yet. They arrive with the Phase 9 text reveals if needed, to keep the bundle small.

## D20 WebKit and the scene
Playwright's WebKit does not get the software-GL flags, so the scene tests run in Chromium only and WebKit runs the Lite tests (and falls back to Lite if it has no WebGL 2).
Real Safari behaviour (iOS viewport units, context loss) goes on `docs/MANUAL_QA.md`.

## D21 Phone header
At 599 px and narrower, with JavaScript on, the header nav links are hidden. The header keeps the brand, sector name, Briefing and Lite buttons, and the flight path bar at the bottom is the way around.
Without JavaScript the nav stays.

## D22 Start the flight
The hero button "Start the flight" is a link to #belt. In flight mode that scrolls the probe into the first sector. In Lite it jumps to the same place.
