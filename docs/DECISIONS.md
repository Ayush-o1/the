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

## D23 Hazard text lives in HTML
Alert lines, the hull label and its tooltip are in `#hazard-copy` in index.html, read by `src/ui/copy.js`. One place to edit in the Phase 9 copy pass.
The alert for the Belt says "Contacts {n}" with the real number of probes drawn on the current tier (500, 1,200 or 2,000), not always 2,000.

## D24 Hull numbers
Steps: 100, 94 (Belt), 85 (BlackWater), 81 (BeetleJuice), 76 (deadLetter), 71 (Europa). It is labelled as flight status and its tooltip says it measures nothing about the code (plan 5.3).

## D25 Conjunction miss distance
The debris moves along a fixed straight track relative to the moon. `lib/orbit.js` computes the closest approach, and the HUD shows `distance x 0.35 km per unit`.
The geometry was chosen so the result is 4.2 km, the plan's example, but the number shown is what the function returns. A unit test covers the maths.

## D26 NaN guard before bloom
See PROGRESS Phase 4. Keep the sanitise pass unless the source of the bad pixel is found and fixed.

## D27 Click to break
The canvas sits behind the page, so clicks cannot reach it. A click on bare page background (html, body, main or section, not on any control or panel) is cast into the scene.
Broken rocks stay broken for that visit. This is the one place scene state depends on a user action, not on scroll alone (plan 5.2 allows it: it is a click, not a hazard).

## D28 BeetleJuice maker-checker, honestly
In the real app the role rule comes first: only analysts propose and only supervisors decide, so an analyst trying to approve is refused for their role. The "cannot approve your own proposal" check is a second guard, also in a database trigger.
The simulation shows both. To make the second guard testable it has a switch, "Let supervisors propose too (simulation only)". That switch is not a feature of BeetleJuice and is labelled as such. The plan's "try to approve your own fix, blocked; second approver, allowed" is covered by that switch.

## D29 deadLetter simulation scope
Five of the 20 real scenarios, three defences, fake tools, no models. It does not reproduce the project's evaluation numbers. It shows one of the project's own limits (the misleading summary), as the project does.

## D30 theRedArmy simulation scope
Checks implemented: contains, not_contains, max_length. The real engine has more (equals, regex, is_json, json_field_equals, min_length, latency). Retries, rate limiting and random provider failures are not simulated.

## D31 Europa simulation
Scoring bands and hash-chain fields are copied from the repo. SGP4 propagation and the correlation windows are not simulated. In the real scoring the rule "under 0.5 km and under 24 hours is critical" can never decide alone with the default weights (that case already scores 75), and the simulation notes this in a test.

## D32 Phases 6 and 7 shipped together
Both sets of simulations share `src/sims/index.js`, the styles and the e2e file, so splitting them cleanly would have meant two half-working branches. They are one PR. Tags phase-6 and phase-7 point at the same merge commit.

## D33 Mission shortcuts
Next and previous mission are J and K only. The plan also mentions arrow keys, but the arrows scroll the page and are part of the Konami code, so using them would make both worse. Every shortcut is listed in the Map dialog.
A key that is part of the Konami code (the B) is kept away from the Briefing shortcut while the code is being typed.

## D34 GitHub data and the footer
The Cargo hold and "Last transmission" call GitHub's public API from the visitor's browser (plan 8.9), cached in sessionStorage for 10 minutes and hidden on failure. That request is visible to GitHub, so the footer says where the list comes from. "No analytics. No cookies." stays true.

## D35 Skipped: the Argus satellite fact
Plan 5.6 item 15 ("click the tiny Argus satellite in the hero sky for a fact") is a Could and is not built. It would need a clickable object in the 3D sky and a fact list that duplicates dossier text.

## D36 Contact form service path
With an empty key in `src/config.js` the form opens a prefilled email, which the tests cover. The path that posts to Web3Forms is written and read-checked but cannot be tested without a real key. It is on the HANDOFF list for Ayush to try once.

## D37 Deep links and the simulations
Mounting the simulations changes the height of everything above a mission, so a link like `/#blackwater` could land away from its section. After the simulations mount, the page scrolls back to the hash, unless the visitor has already scrolled.

## D38 Phones start on the low tier
Plan 8.4 lists "small device" as a reason for the low tier. A coarse pointer and a viewport under 768 px now start on low (no post-processing, pixel ratio 1). The tier monitor can still raise it.
Found by Lighthouse: mobile performance was 66 on the mid tier and 82 on low (TBT 3.7 s down to 0.7 s).

## D39 GitHub is requested late
The request waits until the Cargo hold or footer is within 600 px of the screen, and is made once. GitHub allows few unauthenticated requests per hour per address, and a 403 prints a console error that costs Lighthouse Best Practices. Most visitors never reach the Cargo hold, so most visits make no request.

## D40 Share card is a JPEG outside the budget
`public/og.jpg` (195 KB) is a screenshot of the real hero from `scripts/og-image.js`. Only link previews fetch it, so it and the `.map` files are left out of the page budgets in `scripts/check-budgets.js`.

## D41 Source maps
`build.sourcemap` is on, because Lighthouse's `valid-source-maps` audit asks for them. Browsers only download maps when developer tools are open.

## D42 Firefox
Playwright is run in Chromium and WebKit. Firefox is not installed in this environment, so Firefox is a manual check (docs/MANUAL_QA.md).

## D43 INP
Measured by scripted interaction in the flight under a 4x CPU throttle (PerformanceObserver event timing): worst click or key response 160 ms on a desktop viewport, 88 ms on a phone viewport. Target is 200 ms. Not measured on a real phone.
