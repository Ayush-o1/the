// deadLetter simulation: pick an attack and a defence and watch what happens to each tool call.
// The labels and the policy are in deadletter-logic.js and follow the real project's rules.
import { el, mountInto } from './ui-kit.js';
import { SCENARIOS, DEFENCES, run } from './deadletter-logic.js';

const DEFENCE_NAMES = {
  none: 'No defence',
  taint: 'Session taint',
  deadletter: 'deadLetter',
};

const DEFENCE_HELP = {
  none: 'The agent obeys whatever it reads.',
  taint: 'After reading untrusted text, block every outbound call.',
  deadletter: 'Labels on every value, and a policy on every call.',
};

export function mountDeadLetter(sim) {
  let result = null;
  let approve = false;

  const scenarioSelect = el(
    'select',
    { id: 'dl-scenario' },
    ...SCENARIOS.map((s) => el('option', { value: s.id }, s.title)),
  );
  const defenceGroup = el(
    'fieldset',
    { class: 'dl__defences' },
    el('legend', { class: 'mono' }, 'Defence'),
    ...DEFENCES.map((id) =>
      el(
        'label',
        { class: 'dl__defence' },
        el('input', { type: 'radio', name: 'dl-defence', value: id, checked: id === 'deadletter' }),
        el('span', {}, el('strong', {}, DEFENCE_NAMES[id]), ' ', DEFENCE_HELP[id]),
      ),
    ),
  );
  const runButton = el('button', { type: 'button', class: 'btn', 'data-key': 'run' }, 'Run');
  const story = el('div', { class: 'dl__story' });
  const steps = el('ol', { class: 'dl__steps', 'aria-label': 'What happened, step by step' });
  const card = el('div', { class: 'dl__card' });
  const outcome = el(
    'p',
    { class: 'sim__outcome', role: 'status' },
    'Pick a scenario and a defence, then run it.',
  );
  const app = el(
    'div',
    { class: 'sim__app' },
    el(
      'div',
      { class: 'sim__controls' },
      el(
        'div',
        { class: 'field' },
        el('label', { for: 'dl-scenario' }, 'Scenario'),
        scenarioSelect,
      ),
      runButton,
    ),
    defenceGroup,
    story,
    steps,
    card,
    outcome,
  );

  const defence = () => defenceGroup.querySelector('input:checked').value;

  function renderStory() {
    const scenario = SCENARIOS.find((s) => s.id === scenarioSelect.value);
    const text = el(
      'p',
      { class: 'dl__source' },
      `${scenario.sourceName}: "${scenario.sourceText} `,
    );
    if (scenario.injected) text.append(el('mark', {}, scenario.injected));
    text.append('"');
    story.replaceChildren(el('p', {}, el('strong', {}, 'Your request: '), scenario.request), text);
  }

  function renderRun() {
    steps.replaceChildren(
      ...result.steps.map((s) =>
        el(
          'li',
          { class: s.hypothetical ? 'dl__step dl__step--maybe' : 'dl__step' },
          el(
            'p',
            {},
            el('code', {}, s.text),
            ' ',
            el('span', { class: `verdict verdict--${s.verdict}` }, s.verdict),
          ),
          el(
            'p',
            { class: 'sim__note' },
            `${s.label ? `${s.label}. ` : ''}${s.reason}${s.rule ? ` (${s.rule})` : ''}`,
          ),
        ),
      ),
    );
    card.replaceChildren();
    if (result.asks) {
      const yes = el(
        'button',
        { type: 'button', class: 'btn btn--quiet', 'data-key': 'yes' },
        'Approve the send',
      );
      const no = el(
        'button',
        { type: 'button', class: 'btn btn--quiet', 'data-key': 'no' },
        'Reject the send',
      );
      yes.addEventListener('click', () => start(true));
      no.addEventListener('click', () => start(false));
      card.append(
        el(
          'p',
          {},
          el('strong', {}, 'The run paused and asked you. '),
          'Look at the address before you decide.',
        ),
        el('div', { class: 'sim__controls' }, yes, no),
      );
    }
    outcome.textContent = result.outcome;
  }

  function start(answer) {
    approve = answer;
    result = run(scenarioSelect.value, defence(), { approve });
    renderStory();
    renderRun();
  }

  runButton.addEventListener('click', () => start(false));
  scenarioSelect.addEventListener('change', () => {
    result = null;
    steps.replaceChildren();
    card.replaceChildren();
    outcome.textContent = 'Run it to see what happens.';
    renderStory();
  });

  renderStory();
  mountInto(sim, app);
}
