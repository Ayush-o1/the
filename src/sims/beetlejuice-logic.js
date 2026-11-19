// BeetleJuice simulation logic. A small version of the real engine and the maker-checker workflow:
//   - the passes and break types: BeetleJuice docs/reconciliation-rules.md (R01 to R08)
//   - maker-checker: src/modules/resolutions/resolution.service.js and src/lib/permissions.js
// Money is whole paise. The data is made up. Nothing is posted anywhere.

export const SETTINGS = { asOf: '2026-11-08', windowDays: 2, feeRateBp: 200, feeTolerancePaise: 1 };

export const LEDGER = [
  { ref: 'PAY-1001', paise: 500000, date: '2026-11-05' },
  { ref: 'PAY-1002', paise: 120000, date: '2026-11-05' },
  { ref: 'PAY-1003', paise: 80000, date: '2026-11-05' },
  { ref: 'PAY-1004', paise: 250000, date: '2026-11-01' },
  { ref: 'PAY-1005', paise: 64000, date: '2026-11-07' },
  { ref: 'PAY-1006', paise: 300000, date: '2026-11-04' },
];

export const SETTLEMENT = [
  { ref: 'PAY-1001', paise: 500000, feePaise: 10000 },
  { ref: 'PAY-1002', paise: 125000, feePaise: 2500 },
  { ref: 'PAY-1003', paise: 80000, feePaise: 1600 },
  { ref: 'PAY-1003', paise: 80000, feePaise: 1600 },
  { ref: 'PAY-1006', paise: 300000, feePaise: 6600 },
  { ref: 'PAY-9009', paise: 45000, feePaise: 900 },
];

export const RESOLUTION_CODES = [
  'CORRECT_LEDGER',
  'DISPUTE_WITH_PROCESSOR',
  'RECOVER_DUPLICATE',
  'WRITE_OFF',
  'NO_ACTION',
];

export const USERS = [
  { id: 'asha', name: 'Asha', role: 'analyst' },
  { id: 'dev', name: 'Dev', role: 'analyst' },
  { id: 'ravi', name: 'Ravi', role: 'supervisor' },
  { id: 'meera', name: 'Meera', role: 'supervisor' },
];

export function formatRupees(paise) {
  const sign = paise < 0 ? '-' : '';
  const whole = Math.floor(Math.abs(paise) / 100).toLocaleString('en-IN');
  const cents = String(Math.abs(paise) % 100).padStart(2, '0');
  return `${sign}₹${whole}.${cents}`;
}

// Expected fee in paise, rounded half up with integers only: 2.0000% is 200 basis points.
export function expectedFee(paise, rateBp = SETTINGS.feeRateBp) {
  return Math.floor((paise * rateBp + 5000) / 10000);
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

// Every record ends with exactly one explained outcome. Returns one result per reference.
export function reconcile(ledger = LEDGER, settlement = SETTLEMENT, settings = SETTINGS) {
  const refs = [...new Set([...ledger.map((r) => r.ref), ...settlement.map((r) => r.ref)])].sort();
  return refs.map((ref) => {
    const l = ledger.filter((r) => r.ref === ref);
    const s = settlement.filter((r) => r.ref === ref);
    const base = { ref, ledger: l[0] ?? null, settlement: s[0] ?? null };

    if (l.length === 1 && s.length === 0) {
      const late = daysBetween(l[0].date, settings.asOf) > settings.windowDays;
      return late
        ? {
            ...base,
            outcome: 'BREAK',
            type: 'MISSING_IN_SETTLEMENT',
            rule: 'R06',
            why: `Recorded ${l[0].date}. The ${settings.windowDays}-day window ended before ${settings.asOf}, and no settlement line exists.`,
          }
        : {
            ...base,
            outcome: 'PENDING',
            rule: 'R04',
            why: `Recorded ${l[0].date}, still inside the ${settings.windowDays}-day settlement window. Not a break yet.`,
          };
    }
    if (l.length === 0 && s.length >= 1) {
      return {
        ...base,
        outcome: 'BREAK',
        type: 'MISSING_IN_LEDGER',
        rule: 'R05',
        why: 'The processor settled it and the ledger has no record.',
      };
    }
    if (l.length === 1 && s.length === 1) {
      if (l[0].paise !== s[0].paise) {
        const difference = s[0].paise - l[0].paise;
        return {
          ...base,
          outcome: 'BREAK',
          type: 'AMOUNT_MISMATCH',
          rule: 'R02',
          why: `Ledger ${formatRupees(l[0].paise)}, settlement ${formatRupees(s[0].paise)}. Difference ${difference > 0 ? '+' : ''}${formatRupees(difference)}.`,
        };
      }
      const expected = expectedFee(l[0].paise, settings.feeRateBp);
      if (Math.abs(s[0].feePaise - expected) > settings.feeTolerancePaise) {
        return {
          ...base,
          outcome: 'BREAK',
          type: 'FEE_VARIANCE',
          rule: 'R08',
          why: `The amount matches. Fee charged ${formatRupees(s[0].feePaise)}, expected ${formatRupees(expected)} at 2%, tolerance 1 paisa.`,
        };
      }
      return {
        ...base,
        outcome: 'MATCHED',
        rule: 'R01',
        why: 'Same reference, same amount, fee as expected.',
      };
    }
    if (
      l.length === 1 &&
      s.length === 2 &&
      s[0].paise === l[0].paise &&
      s[1].paise === l[0].paise
    ) {
      return {
        ...base,
        outcome: 'BREAK',
        type: 'DUPLICATE_SETTLEMENT',
        rule: 'R03',
        why: 'One ledger entry, two identical settlement lines. The first matches, the second is a duplicate.',
      };
    }
    // Anything else that is not one to one cannot be paired without guessing.
    return {
      ...base,
      outcome: 'BREAK',
      type: 'AMBIGUOUS_REFERENCE',
      rule: 'R09',
      why: 'The records do not line up one to one, so nothing is paired by guesswork.',
    };
  });
}

// Maker-checker. A break moves open -> pending_review -> resolved, and a rejection reopens it.
export function createWorkflow(results = reconcile()) {
  const breaks = results
    .filter((r) => r.outcome === 'BREAK')
    .map((r) => ({ ref: r.ref, type: r.type, status: 'open', proposal: null }));
  return { breaks, audit: [], supervisorsMayPropose: false };
}

function log(workflow, user, action, detail) {
  workflow.audit.push({ user: user.name, role: user.role, action, detail });
}

function findBreak(workflow, ref) {
  return workflow.breaks.find((item) => item.ref === ref);
}

// Maker step.
export function propose(workflow, user, ref, { code, note }) {
  const mayPropose =
    user.role === 'analyst' || (workflow.supervisorsMayPropose && user.role === 'supervisor');
  if (!mayPropose) return { ok: false, error: 'Only analysts can propose a resolution.' };
  const item = findBreak(workflow, ref);
  if (!item) return { ok: false, error: 'No such break.' };
  if (item.status !== 'open') {
    return {
      ok: false,
      error:
        item.status === 'resolved'
          ? 'This break is already resolved.'
          : 'This break already has a proposal awaiting review.',
    };
  }
  if (!RESOLUTION_CODES.includes(code)) return { ok: false, error: 'Choose a resolution code.' };
  if ((note ?? '').trim().length < 10)
    return { ok: false, error: 'Explain the proposal in at least 10 characters.' };
  item.status = 'pending_review';
  item.proposal = { by: user.id, byName: user.name, code, note: note.trim(), decided: null };
  log(workflow, user, 'proposal.created', `${ref}: ${code}`);
  return { ok: true };
}

// Checker step. The refusals are in the order the real service checks them.
export function decide(workflow, user, ref, { decision, note }) {
  if (user.role !== 'supervisor')
    return { ok: false, error: 'Only supervisors can decide a proposal.', code: 'ROLE' };
  const item = findBreak(workflow, ref);
  if (!item?.proposal) return { ok: false, error: 'There is no proposal to decide.' };
  if (item.proposal.by === user.id) {
    log(workflow, user, 'proposal.self_decision_blocked', ref);
    return {
      ok: false,
      error: 'You cannot approve or reject a resolution you proposed.',
      code: 'SELF_DECISION_FORBIDDEN',
    };
  }
  if (item.proposal.decided)
    return { ok: false, error: `This proposal was already ${item.proposal.decided}.` };
  if (decision === 'rejected' && (note ?? '').trim().length < 5) {
    return { ok: false, error: 'A rejection needs a reason of at least 5 characters.' };
  }
  item.proposal.decided = decision;
  log(workflow, user, `proposal.${decision}`, ref);
  if (decision === 'approved') {
    item.status = 'resolved';
    log(workflow, user, 'break.resolved', ref);
  } else {
    item.status = 'open';
    log(workflow, user, 'break.reopened', ref);
  }
  return { ok: true };
}
