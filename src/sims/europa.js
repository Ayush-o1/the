// Europa simulation: screen close approaches by review priority, then edit one line of a
// hash-chained log and watch the chain break. The scoring and the hashing are in europa-logic.js.
import { el, mountInto } from './ui-kit.js';
import { screen, seedLog, appendEntry, verifyLog } from './europa-logic.js';

const ACTIONS = ['ACKNOWLEDGE', 'ESCALATE', 'DISMISS', 'REQUEST_REASSESSMENT'];
const short = (hash) => `${hash.slice(0, 10)}...`;

export async function mountEuropa(sim) {
  let log = await seedLog();
  let failedAt = null;
  let message = 'The log is intact. Change a note and the chain will say where it breaks.';

  const rows = el('div', { class: 'eu__events' });
  const list = el('ol', { class: 'eu__log', 'aria-label': 'Audit log, oldest first' });
  const outcome = el('p', { class: 'sim__outcome', role: 'status' });
  const verify = el(
    'button',
    { type: 'button', class: 'btn', 'data-key': 'verify' },
    'Verify chain',
  );
  const reset = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'reset' },
    'Restore the log',
  );
  const actionSelect = el(
    'select',
    { id: 'eu-action' },
    ...ACTIONS.map((a) => el('option', { value: a }, a)),
  );
  const noteInput = el('input', { id: 'eu-note', type: 'text', autocomplete: 'off' });
  const append = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'append' },
    'Append entry',
  );

  const app = el(
    'div',
    { class: 'sim__app' },
    el('p', { class: 'mono' }, 'Review queue, highest priority first'),
    rows,
    el('p', { class: 'mono' }, 'Audit log'),
    list,
    el('div', { class: 'sim__controls' }, verify, reset),
    el(
      'div',
      { class: 'sim__controls' },
      el('div', { class: 'field' }, el('label', { for: 'eu-action' }, 'Action'), actionSelect),
      el('div', { class: 'field' }, el('label', { for: 'eu-note' }, 'Reason'), noteInput),
      append,
    ),
    outcome,
  );

  function renderEvents() {
    rows.replaceChildren(
      ...screen().map((item) =>
        el(
          'details',
          { class: 'eu__event' },
          el(
            'summary',
            {},
            el('span', { class: 'mono' }, item.key),
            ' ',
            el('span', { class: `urgency urgency--${item.urgency}` }, item.urgency),
            ` score ${item.score}, miss ${item.missKm} km${item.listings.length > 1 ? `, listed ${item.listings.length} times, shown once` : ''}`,
          ),
          el(
            'ul',
            { class: 'dossier__list' },
            ...item.parts.map((p) =>
              el('li', {}, `${p.name}: ${p.detail}, ${p.score} of ${p.max}`),
            ),
          ),
        ),
      ),
    );
  }

  function renderLog() {
    list.replaceChildren(
      ...log.map((entry, index) => {
        const input = el('input', {
          type: 'text',
          value: entry.payload.note,
          'aria-label': `Note for entry ${entry.sequence}`,
          class: 'eu__note',
          'data-index': index,
        });
        return el(
          'li',
          { class: entry.sequence === failedAt ? 'eu__entry eu__entry--broken' : 'eu__entry' },
          el('p', { class: 'mono' }, `#${entry.sequence} ${entry.action} by ${entry.actorId}`),
          input,
          el(
            'p',
            { class: 'sim__note' },
            `hash ${short(entry.hash)} · links to ${short(entry.prevHash)}`,
          ),
        );
      }),
    );
    outcome.textContent = message;
  }

  async function check() {
    const result = await verifyLog(log);
    failedAt = result.failedAt;
    message = result.valid
      ? `Chain intact: ${result.total} entries, first to last.`
      : `Chain broken. ${result.error}. Nothing after that point can be trusted.`;
    renderLog();
  }

  list.addEventListener('change', async (event) => {
    const input = event.target.closest('.eu__note');
    if (!input) return;
    // The note changes but the stored hash does not. That mismatch is what the chain catches.
    const entry = log[Number(input.dataset.index)];
    entry.payload = { ...entry.payload, note: input.value };
    await check();
    list.querySelector(`[data-index="${input.dataset.index}"]`)?.focus();
  });
  verify.addEventListener('click', check);
  reset.addEventListener('click', async () => {
    log = await seedLog();
    failedAt = null;
    message = 'Log restored. The chain is intact.';
    renderLog();
  });
  append.addEventListener('click', async () => {
    await appendEntry(log, {
      action: actionSelect.value,
      payload: { pair: '91001:91017', note: noteInput.value.trim() || 'No reason given.' },
    });
    noteInput.value = '';
    await check();
  });

  renderEvents();
  renderLog();
  mountInto(sim, app);
}
