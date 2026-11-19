# Recon notes (Phase 0)

Facts read from the six repos on 19 Nov 2026 (shallow clones in `/tmp/ayush-src/`, read-only).
Every site claim traces back here or to a file path listed in `CLAIMS.md`.

## Public contact details (Ayush's public GitHub profile and profile README)

- GitHub: https://github.com/Ayush-o1 (name "Ayush kumar", location Bangalore, India)
- Profile README: email `ayushh.pvt10@gmail.com` ("Fastest way to reach me")
- GitHub profile email field: `ayushh.ofc10@gmail.com`
- LinkedIn: https://linkedin.com/in/ayushh-o1
- LeetCode: https://leetcode.com/u/tZbaWZwiWk/ (profile README says C++ for DSA)
- Older portfolio: https://ayush-kumar-navy.vercel.app/

## Argus (Python, FastAPI, Neo4j, PostgreSQL, Redis, Next.js 16 + TypeScript frontend)

- Live: https://argus-rosy-one.vercel.app (repo homepage field). Repo has no license, no topics.
- Synthetic world: 70 cities, 50 countries, 10 regions. No real people. (README.md l.5)
- Graph algorithms via Neo4j GDS: PageRank, Betweenness, Louvain, Node2Vec, risk propagation, cycle detection (docs/analytics.md).
- Anomaly detector `backend/app/services/anomaly.py`: features tx_count, total_amount, max_burst_count
  (largest count of transactions in any 6-hour window). Isolation Forest (n_estimators=200) AND z-score >= 3.0
  must both agree. It never reads the generator's `flagged` or `storyline_id` fields.
  Verified in development: found a 35-transaction burst in 6 hours, z about 37 (docs/analytics.md).
- Audit log is a hash chain; `python -m app.cli verify-audit` recomputes it (README).
- Alerts: raised by named, versioned rules; re-running over unchanged world increments a count, no new row.
  Dismissal needs a reason from a fixed list.
- Honest limits (README "What this is not"): some planted anomalies are undetectable and reported as recall 0;
  precision/recall measured against one synthetic world only.
- Ingestion: dead-letter queue for rejected records; PostgreSQL job queue with FOR UPDATE SKIP LOCKED.
- Tests: backend/tests has many files (test_anomaly.py, test_alerting__.py, test_correlation__.py ...).
- Argus plan doc says 100 commits depth hit; shallow clone only.

## BlackWater (Node, Express, PostgreSQL, Prisma, Socket.IO, vanilla JS UI, zod, JWT, bcrypt)

- Live: https://blackwater-app.onrender.com. MIT.
- Incident states (prisma/schema.prisma, src/services/incident.service.js):
  TRIGGERED, ACKNOWLEDGED, RESOLVED, CLOSED.
  Allowed moves: TRIGGERED -> ACKNOWLEDGED | RESOLVED; ACKNOWLEDGED -> RESOLVED | TRIGGERED;
  RESOLVED -> TRIGGERED (reopen) | CLOSED; CLOSED -> nothing.
- Severities: CRITICAL, HIGH, MEDIUM, LOW. Service health derived, never stored (src/utils/serviceHealth.js):
  CRITICAL -> MAJOR_OUTAGE, HIGH -> PARTIAL_OUTAGE, MEDIUM/LOW -> DEGRADED, none open -> OPERATIONAL. Worst open incident wins.
- Timeline event types (src/utils/timelineEvents.js): INCIDENT_CREATED, INCIDENT_EDITED, STATUS_CHANGED,
  ASSIGNEE_CHANGED, UPDATE_ADDED, VISIBILITY_CHANGED.
- Every change locks the incident row (SELECT ... FOR UPDATE), checks the lifecycle table and writes the
  audit entry in the same transaction (README "How it works", docs/architecture.md l.28-30).
- Public status page reads an allow-list of fields and only published incidents.
- Socket.IO is a doorbell: server says "incident X changed", pages refetch via the API. Org-scoped rooms.
- Roles: ADMIN, MEMBER, VIEWER. Tests: tests/unit (4 files), tests/integration (23 files), e2e (6 specs).
- Limitations listed in README: no password reset, tokens not revocable, one instance only.

## BeetleJuice (Node, Express 5, pg, plain SQL, zod, no ORM, vanilla JS UI)

- No live URL. MIT.
- Synthetic data only. Compares ledger export with processor settlement export.
- Rules R01..R09 in docs/reconciliation-rules.md: exact match, amount mismatch, ambiguity guard,
  duplicate settlement, pending (settlement window), missing in ledger, missing in settlement,
  batch payout mismatch, fee variance. Break types: AMOUNT_MISMATCH, AMBIGUOUS_REFERENCE,
  DUPLICATE_SETTLEMENT, MISSING_IN_LEDGER, MISSING_IN_SETTLEMENT, BATCH_PAYOUT_MISMATCH, FEE_VARIANCE.
- Defaults: settlementWindowDays 2, amountTolerancePaise 0, feeRatePercent 2.0, feeTolerancePaise 1.
- Money is integer paise; amounts compared exactly.
- Break status: open -> pending_review -> resolved; rejected proposal reopens. Proposal: pending -> approved | rejected.
- Maker-checker: analyst proposes, a different supervisor approves or rejects. Self-approval refused in the
  service and again in the database (triggers) (README).
- Roles: analyst, supervisor, read-only auditor.
- Tests: README says 218 tests passing at v1.1.0 (113 unit, 74 integration, 31 browser). Not re-run by me.
- Engine invariant: every record gets exactly one result; checked over 200 seeded random inputs.

## theRedArmy (Node 22.9+, Express 5, Prisma 7, PostgreSQL, Redis, vanilla JS UI). Team project.

- No live URL. MIT. Contributors page: https://github.com/Ayush-o1/theRedArmy/graphs/contributors
  (19 commits in clone: 16 by Ayush's two author names, 3 by others). Do not name teammates.
- Immutable prompt versions; test suites with deterministic checks: contains, not_contains, equals, regex,
  max_length, min_length, is_json, json_field_equals, latency_under_ms (src/engine/assertions.js).
- Run = one job per test case in `run_cases`, claimed with FOR UPDATE SKIP LOCKED, leased; late write from a
  dead worker is rejected. Retries with exponential backoff + jitter, honours Retry-After.
- Redis token bucket (Lua) for provider rate limit. Response cache at temperature 0.
- Gate (src/modules/runs/compare.js `evaluateGate`): errored case -> failed; with baseline any regression -> failed,
  cases failing before and still failing are tolerated; without baseline any failed case -> failed.
- Demo: v1 prompt 8/8 pass; v2 (shortened, drops order number) 7 regress, 1 still passes.
- Simulated provider echoes the prompt; cannot judge quality (README says so).
- Tests: node:test + supertest + Playwright. Worker-race integration tests.
- README cites research (Parnin et al. 2023; RETAIN 2024).

## deadLetter (Node 22.18+, Express, Prisma, PostgreSQL, vanilla JS UI). No live URL. No license file.

- CaMeL-inspired (arXiv:2503.18813). Planner sees only the user request. Quarantined model reads untrusted
  text, has no tools, output always untrusted. Interpreter tracks labels. Policy engine answers allow/ask/deny.
- Label: integrity (trusted/untrusted), readers (public or restricted list), sources. Join only gets stricter.
- Policy (docs/POLICY_AND_LABELS.md): untrusted destination + private data -> deny
  (`untrusted_destination_private_data`); untrusted destination + public data -> ask; untrusted selector -> ask;
  untrusted control flow -> ask; trusted destination + public -> allow; named by user -> allow.
- Evaluation (README, docs/EVALUATION.md; deterministic mock models): 20 scenarios, 11 attacks + 9 normal.
  No defence: 11/11 attacks succeed. Session taint: 0/11, completes 4/9. deadLetter: 1/11 succeed, completes 8/9.
  The one attack that gets through: misleading summary sent to an allowed recipient. Numbers come with the
  README's own caveat (mock models, worst-case undefended agents).
- Tools are fakes; local prototype, not a security product (README says so).

## Europa (Node 22+, Express 5, PostgreSQL, vanilla JS UI, satellite.js 7.1.0). No live URL. MIT.

- Ingests CelesTrak SOCRATES close-approach CSV; canonical pair key min(id1,id2):max(id1,id2).
- Correlation: step tolerance 20 min, cumulative drift 45 min; two-key advisory locks.
- Review-priority score 0-100: miss distance 50, time to TCA 30, upper-bound probability metric 15, data freshness 5.
  Classes: CRITICAL >= 75, HIGH >= 55, MEDIUM >= 35, else LOW. Miss-distance bands (km):
  <0.5 -> 50, <1 -> 40, <2 -> 30, <5 -> 20, <10 -> 10, else 0 (src/modules/assessment/assessmentRules.js).
  Time to TCA thresholds (hours): 12, 24, 48, 72. README says "heuristic, not a collision probability".
- Audit ledger (src/modules/audit/auditLedger.js): SHA-256 over
  `sequence|actionType|actorType|actorId|canonicalPayload|prevHash|createdAtIso`; genesis prev hash is 64 zeros;
  canonical JSON sorts keys; DB triggers block UPDATE/DELETE; verifier walks genesis to head.
  Limit stated in code: a database admin could still rewrite the chain without external anchoring.
- Actions: ACKNOWLEDGE, ESCALATE, DISMISS, REQUEST_REASSESSMENT, with mandatory justification.
  Material contraction (>= 20%) triggers REQUIRES_RE_REVIEW.
- Experimental SGP4 screening via satellite.js, 100 ms fine step.
