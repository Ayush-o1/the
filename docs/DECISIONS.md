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
