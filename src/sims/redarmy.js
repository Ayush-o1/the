// theRedArmy simulation: edit a prompt, save it as a new version, run the suite and see whether
// the CI gate passes. The checks, the comparison and the gate are in redarmy-logic.js.
import { el, mountInto } from './ui-kit.js';
import {
  PROMPT_V2,
  createVersions,
  saveVersion,
  runSuite,
  compareRuns,
  evaluateGate,
} from './redarmy-logic.js';

const LABELS = {
  regressed: 'regressed',
  fixed: 'fixed',
  still_failing: 'still failing',
  still_passing: 'still passing',
  added: 'added',
  removed: 'removed',
};

export function mountRedArmy(sim) {
  const versions = createVersions();
  const runs = new Map();
  let message = 'Version 1 is saved. Run the suite to see the baseline, then change the prompt.';
  let shown = null;

  const editor = el('textarea', {
    id: 'ra-prompt',
    rows: '5',
    spellcheck: 'false',
    class: 'ra__editor',
  });
  editor.value = versions[0].text;
  const shorten = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'shorten' },
    'Shorten the prompt',
  );
  const save = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'save' },
    'Save as new version',
  );
  const runButton = el('button', { type: 'button', class: 'btn', 'data-key': 'run' }, 'Run suite');
  const versionLine = el('p', { class: 'sim__note' });
  const gate = el('p', { class: 'ra__gate', role: 'status' });
  const table = el('table', { class: 'sim__table' });
  const outcome = el('p', { class: 'sim__outcome', role: 'status' });
  const app = el(
    'div',
    { class: 'sim__app' },
    el(
      'div',
      { class: 'field' },
      el(
        'label',
        { for: 'ra-prompt' },
        'Prompt template. {{order}} and {{ticket}} are filled in for each case.',
      ),
      editor,
    ),
    el('div', { class: 'sim__controls' }, shorten, save, runButton),
    versionLine,
    gate,
    table,
    outcome,
  );

  const latest = () => versions[versions.length - 1];

  function renderTable() {
    if (!shown) {
      table.replaceChildren();
      return;
    }
    const { head, base, comparison } = shown;
    const rows = head.results.map((result) => {
      const before = base?.results.find((r) => r.id === result.id);
      const change = comparison?.items.find((item) => item.id === result.id)?.category;
      return el(
        'tr',
        {},
        el('th', { scope: 'row' }, result.name),
        el('td', {}, before ? before.status : 'none'),
        el('td', {}, result.status),
        el('td', {}, change ? LABELS[change] : 'no baseline'),
      );
    });
    table.replaceChildren(
      el(
        'caption',
        {},
        `Eight support tickets, checked by deterministic assertions. Version ${shown.number}${base ? ` against version ${shown.number - 1}` : ''}.`,
      ),
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          ...['Case', 'Before', 'Now', 'Change'].map((h) => el('th', { scope: 'col' }, h)),
        ),
      ),
      el('tbody', {}, ...rows),
    );
  }

  function render() {
    versionLine.textContent = `Saved versions: ${versions.map((v) => `v${v.number}`).join(', ')}. Versions never change once saved.`;
    outcome.textContent = message;
    renderTable();
  }

  shorten.addEventListener('click', () => {
    editor.value = PROMPT_V2;
    message =
      'Prompt shortened to save tokens. It no longer asks for the order number. Save it as a new version and run the suite.';
    render();
  });

  save.addEventListener('click', () => {
    const result = saveVersion(versions, editor.value);
    message = result.ok ? `Saved as version ${result.version.number}.` : result.error;
    render();
  });

  runButton.addEventListener('click', () => {
    const version = latest();
    const head = runSuite(version.text);
    runs.set(version.number, head);
    // The baseline is the previous version. If it was never run, run it now so the comparison has something to compare.
    const hasBase = version.number > 1;
    const base = hasBase
      ? (runs.get(version.number - 1) ?? runSuite(versions[version.number - 2].text))
      : null;
    const comparison = hasBase ? compareRuns(base, head) : null;
    const verdict = evaluateGate(head, comparison);
    shown = { number: version.number, head, base: hasBase ? base : null, comparison };
    gate.textContent = `CI gate: ${verdict.status.toUpperCase()}${verdict.reasons.length ? `. ${verdict.reasons.join('. ')}` : '.'}`;
    gate.dataset.state = verdict.status;
    message =
      verdict.status === 'passed'
        ? `Version ${version.number} passed ${head.results.length - head.failedCases} of ${head.results.length} cases.`
        : `Version ${version.number} failed the gate. Open the table to see which cases broke.`;
    render();
  });

  render();
  mountInto(sim, app);
}
