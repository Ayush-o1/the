// BeetleJuice simulation: reconcile a ledger against a settlement file, then try the maker-checker
// workflow on a break. Try to approve your own fix and it is refused. Use the second approver and it goes through.
// The engine and the rules are in beetlejuice-logic.js.
import { el, keepFocus, mountInto } from './ui-kit.js';
import {
  LEDGER,
  SETTLEMENT,
  RESOLUTION_CODES,
  USERS,
  reconcile,
  createWorkflow,
  propose,
  decide,
  formatRupees,
} from './beetlejuice-logic.js';

export function mountBeetleJuice(sim) {
  const results = reconcile();
  const workflow = createWorkflow(results);
  let selected = results.find((r) => r.outcome === 'BREAK').ref;
  let message = 'Pick a break, then act as different people. Start by proposing a fix as Asha.';

  const table = el('table', { class: 'sim__table bj__table' });
  const panel = el('div', { class: 'bj__panel' });
  const audit = el('ol', { class: 'bw__audit', 'aria-label': 'Audit log' });
  const outcome = el('p', { class: 'sim__outcome', role: 'status' });
  const app = el('div', { class: 'sim__app' }, table, panel, audit, outcome);

  const userSelect = el(
    'select',
    { id: 'bj-user' },
    ...USERS.map((u) => el('option', { value: u.id }, `${u.name} (${u.role})`)),
  );
  const codeSelect = el(
    'select',
    { id: 'bj-code' },
    ...RESOLUTION_CODES.map((c) => el('option', { value: c }, c)),
  );
  const noteInput = el('input', { id: 'bj-note', type: 'text', autocomplete: 'off' });
  const mayPropose = el('input', { id: 'bj-may', type: 'checkbox' });
  const proposeButton = el(
    'button',
    { type: 'button', class: 'btn', 'data-key': 'propose' },
    'Propose',
  );
  const approveButton = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'approve' },
    'Approve',
  );
  const rejectButton = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'reject' },
    'Reject',
  );

  const actor = () => USERS.find((u) => u.id === userSelect.value);
  const currentBreak = () => workflow.breaks.find((b) => b.ref === selected);

  function renderTable() {
    const head = el(
      'thead',
      {},
      el(
        'tr',
        {},
        ...['Reference', 'Ledger', 'Settlement', 'Outcome', 'Rule'].map((h) =>
          el('th', { scope: 'col' }, h),
        ),
      ),
    );
    const body = el(
      'tbody',
      {},
      ...results.map((r) => {
        const isBreak = r.outcome === 'BREAK';
        const label = isBreak ? r.type : r.outcome;
        const lines =
          SETTLEMENT.filter((s) => s.ref === r.ref)
            .map((s) => formatRupees(s.paise))
            .join(' + ') || 'none';
        const ledger = LEDGER.find((l) => l.ref === r.ref);
        const refCell = isBreak
          ? el(
              'button',
              {
                type: 'button',
                class: 'btn btn--quiet bj__ref',
                'data-key': `ref-${r.ref}`,
                'data-ref': r.ref,
                'aria-pressed': String(r.ref === selected),
              },
              r.ref,
            )
          : r.ref;
        return el(
          'tr',
          {},
          el('th', { scope: 'row' }, refCell),
          el('td', { 'data-label': 'Ledger' }, ledger ? formatRupees(ledger.paise) : 'none'),
          el('td', { 'data-label': 'Settlement' }, lines),
          el('td', { 'data-label': 'Outcome' }, label),
          el('td', { 'data-label': 'Rule' }, r.rule),
        );
      }),
    );
    table.replaceChildren(
      el(
        'caption',
        {},
        'Synthetic ledger and settlement lines, as of 8 Nov 2026. Each reference gets one outcome.',
      ),
      head,
      body,
    );
  }

  function renderPanel() {
    const result = results.find((r) => r.ref === selected);
    const item = currentBreak();
    const proposalText = item.proposal
      ? `Proposed by ${item.proposal.byName}: ${item.proposal.code}. "${item.proposal.note}"${item.proposal.decided ? ` Decision: ${item.proposal.decided}.` : ''}`
      : 'No proposal yet.';
    panel.replaceChildren(
      el(
        'p',
        {},
        el('strong', {}, `${selected} ${result.type}`),
        ' ',
        el('span', { class: 'chip chip--active' }, item.status),
      ),
      el('p', { class: 'sim__note' }, `${result.rule}: ${result.why}`),
      el('p', { class: 'sim__note' }, proposalText),
      el(
        'div',
        { class: 'sim__controls' },
        el('div', { class: 'field' }, el('label', { for: 'bj-user' }, 'Acting as'), userSelect),
        el('div', { class: 'field' }, el('label', { for: 'bj-code' }, 'Resolution'), codeSelect),
        el('div', { class: 'field' }, el('label', { for: 'bj-note' }, 'Note'), noteInput),
      ),
      el('div', { class: 'sim__controls' }, proposeButton, approveButton, rejectButton),
      el(
        'div',
        { class: 'bj__switch' },
        mayPropose,
        el(
          'label',
          { for: 'bj-may' },
          'Let supervisors propose too (simulation only, so the second guard can be tested)',
        ),
      ),
    );
  }

  function render() {
    keepFocus(app, () => {
      renderTable();
      // The select, input and checkbox elements are reused, so what the visitor typed stays.
      renderPanel();
      audit.replaceChildren(
        ...workflow.audit.map((a) =>
          el('li', {}, `${a.user} (${a.role}): ${a.action} ${a.detail}`),
        ),
      );
      outcome.textContent = message;
    });
  }

  function report(result, success) {
    message = result.ok ? success : `Refused: ${result.error}`;
    if (result.code === 'ROLE')
      message += ' In the real app the role rule stops an analyst before anything else is checked.';
    if (result.code === 'SELF_DECISION_FORBIDDEN')
      message +=
        ' The database enforces the same rule with a trigger, and the blocked attempt is itself in the audit log.';
    render();
  }

  proposeButton.addEventListener('click', () => {
    workflow.supervisorsMayPropose = mayPropose.checked;
    report(
      propose(workflow, actor(), selected, { code: codeSelect.value, note: noteInput.value }),
      `${actor().name} proposed ${codeSelect.value}. The break is now pending_review.`,
    );
  });
  approveButton.addEventListener('click', () =>
    report(
      decide(workflow, actor(), selected, { decision: 'approved' }),
      `${actor().name} approved it. The break is resolved.`,
    ),
  );
  rejectButton.addEventListener('click', () =>
    report(
      decide(workflow, actor(), selected, { decision: 'rejected', note: noteInput.value }),
      `${actor().name} rejected it. The break is open again.`,
    ),
  );
  table.addEventListener('click', (event) => {
    const button = event.target.closest('[data-ref]');
    if (!button) return;
    selected = button.dataset.ref;
    message = `Selected ${selected}.`;
    render();
  });

  render();
  mountInto(sim, app);
}
