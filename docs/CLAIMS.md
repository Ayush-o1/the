# Claims

One row per factual claim on the site. Evidence is a file path in the project repos (clones in `/tmp/ayush-src/<repo>/`),
or a line in `docs/RECON.md` that cites one. A claim without evidence is removed.

| #   | Claim | Where on site | Evidence |
| --- | ----- | ------------- | -------- |
| # | Claim | Where on site | Evidence |
|---|---|---|---|
| 1 | Final-year B.Tech CS, Bengaluru, graduating 2027 | Hero, Crew, Briefing | Supplied by Ayush in docs/PLAN.md 7.2 and 7.6; GitHub profile location Bangalore, India (RECON.md) |
| 2 | Studies at Jain (Deemed-to-be University) | Crew file | docs/PLAN.md 7.6 (Ayush's own facts) |
| 3 | I build backend systems; projects are about outages, mismatches, bad input | Hero | Six project READMEs: BlackWater (incidents), BeetleJuice (reconciliation breaks), deadLetter (injection), Argus/Europa (anomalies, tampering) |
| 4 | Looking for SDE and backend roles | Hero, Briefing, Crew | docs/PLAN.md 7.2 and RESEARCH context (Ayush's stated goal) |
| 5 | Email ayushh.pvt10@gmail.com, LinkedIn linkedin.com/in/ayushh-o1, GitHub Ayush-o1, LeetCode u/tZbaWZwiWk | Contact, Crew | Public profile README of github.com/Ayush-o1/Ayush-o1 (RECON.md) |
| 6 | Five of the six projects use plain HTML, CSS and JavaScript for the interface | Crew | BlackWater README 'Stack'; BeetleJuice README 'No front-end framework'; theRedArmy README 'vanilla JavaScript modules'; deadLetter README 'public/ plain HTML, CSS and ES modules'; Europa README 'zero-framework'. Argus is the sixth (Next.js) |
| 7 | Use daily: JavaScript, Node.js, Express, PostgreSQL, Prisma | Crew | Profile README 'Most days:' line |
| 8 | Used in a project: Python, FastAPI, Neo4j, Redis, Socket.IO, Vitest, Supertest, Playwright, pytest, GitHub Actions | Crew | Profile README 'In specific projects' and 'Testing and delivery' lines; Argus README (pytest), BlackWater package.json |
| 9 | C++ for data structures and algorithms on LeetCode | Crew | Profile README last paragraph |
| 10 | Fourteen stock phrases | Belt | Count enforced by tests/logic/banned-words.test.js |
| 11 | 70 real cities in 50 countries, no real people | Argus Objective | Argus README.md lines 1-5 |
| 12 | Analyst follows links between people, accounts, shipments; runs graph algorithms; opens cases | Argus Objective | Argus README 'What this is' |
| 13 | PageRank, community detection, cycle detection on a Neo4j graph | Argus What it does | Argus docs/analytics.md (PageRank, Louvain, Cycle Detection sections); README 'Analytics Engine' |
| 14 | Named, versioned alert rules; append-only audit log with a command that re-checks the hash chain | Argus What it does | Argus README 'Cases & Alerts' and 'Development workflow' (verify-audit) |
| 15 | Records land raw first; rejects go to a dead-letter queue with a reason | Argus What it does | Argus README 'Ingestion' |
| 16 | Anomaly detector needs Isolation Forest and z-score of 3 or more; never reads generator answer key | Argus Hazards, Simulation | Argus docs/analytics.md 'Transaction Anomaly Detection' (backend/app/services/anomaly.py) |
| 17 | A planted burst of 35 transactions in six hours scored about 37 | Argus Simulation | Argus docs/analytics.md 'verified live during development: ... 35 transactions in 6 hours, z≈37σ'. Not re-run by me |
| 18 | Precision and recall published against ground truth; undetectable storylines listed with recall 0 and the reason | Argus Hazards | Argus README 'What this is not' |
| 19 | Silent drop makes a gap look like a quiet world | Argus Hazards | Argus README 'Ingestion' ('a silent source otherwise looks exactly like a quiet world') |
| 20 | Transactions are edge properties so account-to-account is the money graph | Argus Recorder | Argus docs/analytics.md 'Why an Account/TRANSACTED_WITH projection' |
| 21 | Neo4j graph; PostgreSQL identity, audit, job queue with FOR UPDATE SKIP LOCKED; restart postpones a batch | Argus Recorder | Argus README 'Technology stack' and 'Ingestion' |
| 22 | No hosted AI; narratives from templates; optional local model assistant | Argus Recorder | Argus README 'Architecture at a glance' and 'Local Intelligence Layer' |
| 23 | One instance, one tenant; rate limiting per process | Argus Recorder | Argus README 'What this is not', last bullet |
| 24 | Stack Python, FastAPI, Neo4j, PostgreSQL, Redis | Argus tags | Argus README 'Technology stack' |
| 25 | Live demo at argus-rosy-one.vercel.app | Argus links | GitHub repo homepage field; HTTP 200 on 19 Nov 2026 (DECISIONS D11) |
| 26 | Status COMPLETE | Argus chip | DECISIONS D10 (last commit 26 Aug 2026, live deploy) |
| 27 | Public status page; services; declare incident; fixed lifecycle; team chooses what customers see | BlackWater Objective | BlackWater README intro and 'What it does' |
| 28 | TRIGGERED, ACKNOWLEDGED, RESOLVED, CLOSED; closed is final | BlackWater What it does, Simulation | BlackWater src/services/incident.service.js lines 11-17 |
| 29 | Table of allowed moves (TRIGGERED to ACKNOWLEDGED or RESOLVED, etc.) | BlackWater Simulation | BlackWater src/services/incident.service.js lines 13-18 |
| 30 | Service health calculated from open incidents, never stored; worst open incident wins | BlackWater What it does, Hazards | BlackWater src/utils/serviceHealth.js; prisma/schema.prisma comment |
| 31 | Only published incidents on the public page; refreshes over Socket.IO | BlackWater What it does | BlackWater README 'What it does' and 'How it works' |
| 32 | Each change locks the row, checks lifecycle, writes audit entry in one transaction | BlackWater Hazards, Recorder | BlackWater README 'How it works'; docs/architecture.md lines 21-30 |
| 33 | Public page uses an allow-list of fields; every query filtered by organization | BlackWater Hazards | BlackWater README 'How it works'; src/utils/publicDto.js; tests/integration/exposure.test.js, isolation.test.js |
| 34 | Doorbell live updates; plain HTML/CSS/JS served by Express; one instance; no password reset or email | BlackWater Recorder | BlackWater README 'How it works', 'Stack', 'Limitations' |
| 35 | Stack Node.js, Express, PostgreSQL, Prisma, Socket.IO, vanilla JS | BlackWater tags | BlackWater README 'Stack' |
| 36 | Live demo at blackwater-app.onrender.com | BlackWater links | GitHub homepage field; HTTP 200 on 19 Nov 2026 |
| 37 | Status ACTIVE | BlackWater chip | DECISIONS D10 (last commit 9 Nov 2026) |
| 38 | Merchant ledger vs processor settlement; explains differences; maker-checker; synthetic data only | BeetleJuice Objective | BeetleJuice README intro and blockquote |
| 39 | Strict CSV checks; rejected rows listed with reason | BeetleJuice What it does | BeetleJuice README 'What it does' first bullet |
| 40 | Rules in fixed order; each record exactly one explained outcome | BeetleJuice What it does | BeetleJuice docs/reconciliation-rules.md intro and 'Passes' |
| 41 | Analyst proposes, different supervisor approves or rejects | BeetleJuice What it does | BeetleJuice README 'What it does' maker-checker bullet |
| 42 | Ambiguous references become AMBIGUOUS_REFERENCE for every record involved | BeetleJuice Hazards | BeetleJuice docs/reconciliation-rules.md rule R09 |
| 43 | Settlement window and as-of date; results immutable; later run re-evaluates | BeetleJuice Hazards | BeetleJuice docs/reconciliation-rules.md R04/R06; docs/domain-model.md 'Status models' |
| 44 | Self-approval refused in service and by database triggers | BeetleJuice Hazards | BeetleJuice README 'What it does' and 'Key design decisions' |
| 45 | Ledger 1,200.00 vs settlement 1,250.00 gives AMOUNT_MISMATCH, difference +50.00 | BeetleJuice Simulation | BeetleJuice docs/reconciliation-rules.md 'R02' example |
| 46 | Integer paise; fees as exact fractions with one half-up rule | BeetleJuice Recorder | BeetleJuice README 'Key design decisions' |
| 47 | DB enforces one result per record per run, one pending proposal per break, no self-approval | BeetleJuice Recorder | BeetleJuice README 'Key design decisions'; docs/domain-model.md |
| 48 | Plain SQL no ORM; engine is a pure function | BeetleJuice Recorder | BeetleJuice README 'Architecture in brief'; docs/reconciliation-rules.md first paragraph |
| 49 | No bank-holiday calendar; calendar-day window | BeetleJuice Recorder | BeetleJuice docs/reconciliation-rules.md 'Inputs and configuration' |
| 50 | Stack Node.js, Express, PostgreSQL, plain SQL | BeetleJuice tags | BeetleJuice README 'Architecture in brief' |
| 51 | Status ACTIVE | BeetleJuice chip | DECISIONS D10 (last commit 9 Nov 2026) |
| 52 | Tests LLM prompts; cases once, run every version, see what broke; CI can call it and fail the build | theRedArmy Objective | theRedArmy README intro |
| 53 | Immutable prompt versions run against a suite | theRedArmy What it does | theRedArmy README 'What it does' |
| 54 | One job per test case in a PostgreSQL queue, separate worker processes | theRedArmy What it does | theRedArmy README 'How it works' |
| 55 | Gate tolerates cases that already failed, fails when a passing case regresses | theRedArmy What it does | theRedArmy src/modules/runs/compare.js evaluateGate; docs/architecture.md 'CI gate' |
| 56 | FOR UPDATE SKIP LOCKED, leases, late write from dead worker rejected | theRedArmy Hazards | theRedArmy README 'What it does' |
| 57 | Redis token bucket; retry with backoff and jitter; permanent errors not retried | theRedArmy Hazards | theRedArmy README 'What it does' |
| 58 | Run compared with baseline: regressed, fixed, still failing, added, removed | theRedArmy Hazards | theRedArmy README 'Run comparison' |
| 59 | Demo: v1 passes 8 cases, v2 drops the order number, 7 regress, 1 passes | theRedArmy Simulation | theRedArmy README 'Demo account' |
| 60 | run_cases is the queue; run and jobs inserted in one transaction | theRedArmy Recorder | theRedArmy README 'How it works' step 1 |
| 61 | Only deterministic checks | theRedArmy Recorder | theRedArmy src/engine/assertions.js header comment |
| 62 | Simulated provider echoes the prompt | theRedArmy Recorder | theRedArmy README 'What it does' paragraph after the list |
| 63 | Team project; contributors listed on GitHub | theRedArmy Recorder, links, chip | gh api repos/Ayush-o1/theRedArmy/contributors (four contributors). No names used |
| 64 | Stack Node.js, Express, PostgreSQL, Prisma, Redis | theRedArmy tags | theRedArmy README 'Tech stack' |
| 65 | Status ACTIVE | theRedArmy chip | DECISIONS D10 (last commit 9 Nov 2026) |
| 66 | Firewall between an AI agent and its tools; untrusted text cannot choose tool or destination of private data; local prototype with fake tools; CaMeL design | deadLetter Objective | deadLetter README intro and 'The idea in one minute' |
| 67 | Planner sees only the request; model with no tools reads untrusted text; interpreter tracks labels | deadLetter What it does | deadLetter README 'The idea in one minute' |
| 68 | Every tool call checked: allow, ask, deny | deadLetter What it does | deadLetter docs/POLICY_AND_LABELS.md 'Policy' |
| 69 | 20 scenarios, 11 attacks, 9 normal tasks, three defences | deadLetter What it does | deadLetter README 'Results' |
| 70 | Does not guess maliciousness; asks where a value came from | deadLetter Hazards | deadLetter README 'The idea in one minute' |
| 71 | Untrusted destination plus private data is denied; no human override | deadLetter Hazards, Simulation | deadLetter docs/POLICY_AND_LABELS.md matrix and 'From ask to execution' |
| 72 | Mock models; one attack gets through, a misleading summary to an allowed recipient | deadLetter Hazards | deadLetter README 'Results' |
| 73 | Policy matrix rows | deadLetter Simulation | deadLetter docs/POLICY_AND_LABELS.md 'The matrix' |
| 74 | Plans are schema-checked JSON, nothing evaluated; labels only more restrictive; second implementation checks first on random graphs; single-use token; audit before action | deadLetter Recorder | deadLetter README 'How it is built'; docs/POLICY_AND_LABELS.md |
| 75 | Human approval can be mistaken; tools are fakes | deadLetter Recorder | deadLetter README 'Limits' |
| 76 | Link to arXiv 2503.18813 | deadLetter links | deadLetter README intro |
| 77 | Stack Node.js, Express, PostgreSQL, Prisma | deadLetter tags | deadLetter README 'Requirements' and 'How it is built'; package.json |
| 78 | Status ACTIVE | deadLetter chip | DECISIONS D10 (last commit 5 Nov 2026) |
| 79 | Workbench for satellite close approaches; reads public reports; tracks miss distance changes; ranks review; hash-chained log | Europa Objective | Europa README intro and 'Core Implemented Capabilities' |
| 80 | Same pair recognised when order swaps (min:max key) | Europa What it does, Hazards | Europa README 'Event Correlation Engine' |
| 81 | Score 0 to 100 from miss distance, time to TCA, probability bound, data freshness | Europa What it does | Europa src/modules/assessment/assessmentRules.js DEFAULT_RULE_CONFIG |
| 82 | Review actions need a reason; entries hold previous hash | Europa What it does | Europa README 'Operational Reviews & Cryptographic Audit'; src/modules/audit/auditLedger.js |
| 83 | 20% or more contraction flags re-review | Europa Hazards | Europa README 'Operational Reviews & Cryptographic Audit' |
| 84 | DB triggers block update and delete on the log; verifier walks chain | Europa Hazards | Europa README architecture diagram 'Audit Ledger'; auditLedger.js verify function |
| 85 | Hash covers sequence, action, actor, payload, previous hash, time (SHA-256) | Europa Simulation | Europa src/modules/audit/auditLedger.js computeEntryHash |
| 86 | Score is a heuristic, not a collision probability | Europa Recorder | Europa src/modules/assessment/assessmentRules.js header comment |
| 87 | Appends serialised with an advisory lock | Europa Recorder | Europa auditLedger.js appendAuditEntry |
| 88 | A database administrator could still rewrite the chain without external anchoring | Europa Recorder | Europa auditLedger.js header 'Limitation Notice' |
| 89 | Stack JavaScript, Node.js, Express, PostgreSQL, satellite.js | Europa tags | Europa README 'Technology Stack' |
| 90 | Status COMPLETE | Europa chip | DECISIONS D10 (last commit 19 Oct 2026) |
| 91 | No analytics, no cookies | Footer | The site sets none; no analytics script or cookie code exists in src/ or index.html |
| 92 | The Argus simulation flags an account whose most transactions in any 6 hours is 3 or more standard deviations above the rest; the real detector also needs an Isolation Forest | Argus simulation note | Argus docs/analytics.md 'Transaction Anomaly Detection' (6-hour burst count, z >= 3.0, both methods must agree). D06 |
| 93 | Simulation: internal health counts all open incidents, the public page counts only published ones; open means not RESOLVED or CLOSED | BlackWater simulation | BlackWater src/services/health.service.js (CLOSED_STATUSES, publicOnly) |
| 94 | Simulation: error text "Invalid state transition from X to Y" and "Incident is closed and cannot be modified" | BlackWater simulation | BlackWater src/services/incident.service.js validateTransition |
| 95 | Simulation: audit entry types INCIDENT_CREATED, STATUS_CHANGED, VISIBILITY_CHANGED | BlackWater simulation | BlackWater src/utils/timelineEvents.js |
| 96 | Hull gauge steps and hazard alert lines are a joke, not a metric | Flight HUD | docs/PLAN.md 5.3. Not a factual claim about the projects |
| 97 | Conjunction alert shows a miss distance computed by lib/orbit.js from the debris track | Flight HUD | tests/logic/hazards.test.js; DECISIONS D25. Illustration, not Europa's real output |
