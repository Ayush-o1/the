// Europa simulation logic.
//   - review-priority score: Europa src/modules/assessment/assessmentRules.js (weights 50/30/15/5)
//   - hash-chained log:      src/modules/audit/auditLedger.js (SHA-256 over the same fields)
// The satellites, debris and operators are made up. The catalog numbers are not real objects.

// The scoring rules, copied from the real DEFAULT_RULE_CONFIG.
const MISS_BANDS = [
  [0.5, 50],
  [1, 40],
  [2, 30],
  [5, 20],
  [10, 10],
];
const TCA_BANDS = [
  [12, 30],
  [24, 25],
  [48, 20],
  [72, 10],
];
const CLASSIFICATION = { critical: 75, high: 55, medium: 35 };

export function missScore(km) {
  const band = MISS_BANDS.find(([limit]) => km < limit);
  return band ? band[1] : 0;
}

export function timeScore(hours) {
  if (hours <= 0) return 0;
  const band = TCA_BANDS.find(([limit]) => hours < limit);
  return band ? band[1] : 0;
}

export function probabilityScore(maxProb) {
  if (!(maxProb > 0)) return 0;
  if (maxProb >= 1e-4) return 15;
  if (maxProb >= 1e-5) return 10;
  if (maxProb >= 1e-6) return 5;
  return 0;
}

export function freshnessScore(dse) {
  if (dse <= 1) return 5;
  if (dse <= 3) return 3;
  return 0;
}

// One key for a pair, whichever order the two objects were listed in.
export function pairKey(a, b) {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

export const EVENTS = [
  { id: 'e1', primary: 91001, secondary: 91017, missKm: 0.3, hours: 10, maxProb: 3e-4, dse: 0.5 },
  { id: 'e2', primary: 91004, secondary: 91022, missKm: 1.5, hours: 30, maxProb: 2e-5, dse: 2 },
  { id: 'e3', primary: 91017, secondary: 91001, missKm: 0.3, hours: 10, maxProb: 3e-4, dse: 0.5 },
  { id: 'e4', primary: 91009, secondary: 91031, missKm: 4.2, hours: 40, maxProb: 3e-6, dse: 2 },
  { id: 'e5', primary: 91012, secondary: 91040, missKm: 8, hours: 60, maxProb: 1e-7, dse: 5 },
];

export function assess(event) {
  const parts = [
    {
      name: 'Miss distance',
      max: 50,
      score: missScore(event.missKm),
      detail: `${event.missKm} km`,
    },
    {
      name: 'Time to closest approach',
      max: 30,
      score: timeScore(event.hours),
      detail: `${event.hours} h`,
    },
    {
      name: 'Probability bound',
      max: 15,
      score: probabilityScore(event.maxProb),
      detail: event.maxProb.toExponential(0),
    },
    {
      name: 'Data freshness',
      max: 5,
      score: freshnessScore(event.dse),
      detail: `${event.dse} days`,
    },
  ];
  const score = parts.reduce((sum, part) => sum + part.score, 0);
  // The real rule also calls anything closer than 0.5 km and under 24 hours critical, whatever the score.
  const severe = event.missKm < 0.5 && event.hours > 0 && event.hours < 24;
  let urgency = 'LOW';
  if (severe || score >= CLASSIFICATION.critical) urgency = 'CRITICAL';
  else if (score >= CLASSIFICATION.high) urgency = 'HIGH';
  else if (score >= CLASSIFICATION.medium) urgency = 'MEDIUM';
  return { score, urgency, parts, key: pairKey(event.primary, event.secondary) };
}

// Screens the events: one row per pair, because the same pair listed in the other order is the
// same event. Highest priority first.
export function screen(events = EVENTS) {
  const byKey = new Map();
  for (const event of events) {
    const assessment = assess(event);
    const existing = byKey.get(assessment.key);
    if (existing) existing.listings.push(event.id);
    else byKey.set(assessment.key, { ...assessment, listings: [event.id], missKm: event.missKm });
  }
  return [...byKey.values()].sort((a, b) => b.score - a.score);
}

// ---- Hash-chained log ----

export const GENESIS_PREV_HASH = '0'.repeat(64);

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Sorts keys at every level, so the same payload always gives the same text.
export function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`;
}

export function entryHash(entry) {
  const message = [
    entry.sequence,
    entry.action,
    entry.actorType,
    entry.actorId,
    canonicalStringify(entry.payload),
    entry.prevHash,
    entry.createdAt,
  ].join('|');
  return sha256Hex(message);
}

// Adds an entry that links to the one before it.
export async function appendEntry(
  log,
  { action, actorType = 'OPERATOR', actorId = 'op-1', payload, createdAt },
) {
  const previous = log[log.length - 1];
  const entry = {
    sequence: log.length + 1,
    action,
    actorType,
    actorId,
    payload,
    prevHash: previous ? previous.hash : GENESIS_PREV_HASH,
    createdAt: createdAt ?? new Date().toISOString(),
  };
  entry.hash = await entryHash(entry);
  log.push(entry);
  return entry;
}

export async function seedLog() {
  const log = [];
  const stamps = [
    '2026-11-18T09:00:00.000Z',
    '2026-11-18T09:05:00.000Z',
    '2026-11-18T09:20:00.000Z',
    '2026-11-18T10:02:00.000Z',
    '2026-11-18T10:30:00.000Z',
  ];
  const rows = [
    ['ACKNOWLEDGE', { pair: '91001:91017', note: 'Seen. Waiting for the next report.' }],
    ['REQUEST_REASSESSMENT', { pair: '91004:91022', note: 'Orbit data is two days old.' }],
    ['ESCALATE', { pair: '91001:91017', note: 'Miss distance shrank by 20 percent.' }],
    ['DISMISS', { pair: '91012:91040', note: 'Wide separation, long range.' }],
    ['ACKNOWLEDGE', { pair: '91009:91031', note: 'Monitoring.' }],
  ];
  for (const [index, [action, payload]] of rows.entries()) {
    await appendEntry(log, { action, payload, createdAt: stamps[index] });
  }
  return log;
}

// Walks the chain from the first entry to the last, in the same order of checks as the real verifier.
export async function verifyLog(log) {
  let expectedPrev = GENESIS_PREV_HASH;
  for (const [index, entry] of log.entries()) {
    if (entry.sequence !== index + 1) {
      return {
        valid: false,
        failedAt: entry.sequence,
        error: `Sequence gap detected: expected ${index + 1}, got ${entry.sequence}`,
      };
    }
    if (entry.prevHash !== expectedPrev) {
      return {
        valid: false,
        failedAt: entry.sequence,
        error: `Predecessor hash mismatch at sequence ${entry.sequence}`,
      };
    }
    if ((await entryHash(entry)) !== entry.hash) {
      return {
        valid: false,
        failedAt: entry.sequence,
        error: `Entry hash verification failed at sequence ${entry.sequence}`,
      };
    }
    expectedPrev = entry.hash;
  }
  return { valid: true, failedAt: null, error: null, total: log.length };
}
