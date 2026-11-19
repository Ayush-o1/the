// BlackWater simulation: a miniature status page. Declare an incident, walk it through the real
// lifecycle and watch the audit trail fill in. The rules are in blackwater-logic.js.
import { el, keepFocus, mountInto } from './ui-kit.js';
import {
  STATUSES,
  SEVERITIES,
  createState,
  declareIncident,
  changeStatus,
  setPublic,
  healthOf,
  allowedMoves,
  describeEvent,
} from './blackwater-logic.js';

const SERVICES = ['API', 'Dashboard', 'Webhooks'];

// A move button vanishes when its status becomes the current one. Focus then goes to the same
// incident's Publish button, which is always there.
function focusFallback(key) {
  const match = /^move-(\d+)-/.exec(key);
  return match ? `pub-${match[1]}` : null;
}

function healthLabel(health) {
  return health.replace('_', ' ').toLowerCase();
}

function healthList(state, publicOnly) {
  const list = el('ul', { class: 'bw__services' });
  for (const service of SERVICES) {
    const health = healthOf(state, service, { publicOnly });
    list.append(
      el(
        'li',
        {},
        el('span', {}, service),
        el('span', { class: `health health--${health}` }, healthLabel(health)),
      ),
    );
  }
  return list;
}

export function mountBlackWater(sim) {
  let state = createState(SERVICES);
  let message = 'No incidents yet. Declare one and see what the two views do.';

  const serviceSelect = el(
    'select',
    { id: 'bw-service' },
    ...SERVICES.map((s) => el('option', { value: s }, s)),
  );
  const severitySelect = el(
    'select',
    { id: 'bw-severity' },
    ...SEVERITIES.map((s) => el('option', { value: s }, s.toLowerCase())),
  );
  severitySelect.value = 'CRITICAL';
  const declare = el(
    'button',
    { type: 'button', class: 'btn', 'data-key': 'declare' },
    'Declare incident',
  );
  const reset = el(
    'button',
    { type: 'button', class: 'btn btn--quiet', 'data-key': 'reset' },
    'Reset',
  );
  const outcome = el('p', { class: 'sim__outcome', role: 'status' });
  const views = el('div', { class: 'bw__views' });
  const incidents = el('ul', { class: 'bw__incidents' });
  const audit = el('ol', { class: 'bw__audit', 'aria-label': 'Audit trail' });

  const controls = el(
    'div',
    { class: 'sim__controls' },
    el('div', { class: 'field' }, el('label', { for: 'bw-service' }, 'Service'), serviceSelect),
    el('div', { class: 'field' }, el('label', { for: 'bw-severity' }, 'Severity'), severitySelect),
    declare,
    reset,
  );
  const app = el('div', { class: 'sim__app' }, controls, views, incidents, audit, outcome);

  function incidentRow(incident) {
    const moves = allowedMoves(incident);
    const buttons = STATUSES.filter((status) => status !== incident.status).map((status) => {
      const allowed = moves.includes(status);
      return el(
        'button',
        {
          type: 'button',
          class: 'btn btn--quiet bw__move',
          'data-key': `move-${incident.id}-${status}`,
          'data-incident': incident.id,
          'data-status': status,
          // Not-allowed moves stay clickable so the visitor can see the real refusal message.
          'aria-disabled': allowed ? false : 'true',
        },
        status,
      );
    });
    const publish = el(
      'button',
      {
        type: 'button',
        class: 'btn btn--quiet bw__publish',
        'data-key': `pub-${incident.id}`,
        'data-incident': incident.id,
        'aria-pressed': String(incident.isPublic),
      },
      incident.isPublic ? 'Published' : 'Private',
    );
    return el(
      'li',
      {},
      el(
        'p',
        {},
        el('strong', {}, `#${incident.id} ${incident.title}`),
        ' ',
        el('span', { class: 'chip chip--active' }, incident.status),
        ' ',
        el('span', { class: 'tag' }, incident.severity.toLowerCase()),
      ),
      el('div', { class: 'bw__actions' }, ...buttons, publish),
    );
  }

  function render() {
    keepFocus(
      app,
      () => {
        views.replaceChildren(
          el(
            'section',
            { 'aria-label': 'Internal view' },
            el('p', { class: 'mono' }, 'Internal view'),
            healthList(state, false),
          ),
          el(
            'section',
            { 'aria-label': 'Public status page' },
            el('p', { class: 'mono' }, 'Public status page'),
            healthList(state, true),
          ),
        );
        incidents.replaceChildren(...state.incidents.map(incidentRow));
        audit.replaceChildren(
          ...state.events.map((event) =>
            el('li', {}, `#${event.incidentId} ${describeEvent(event)}`),
          ),
        );
        outcome.textContent = message;
      },
      focusFallback,
    );
  }

  declare.addEventListener('click', () => {
    const result = declareIncident(state, {
      service: serviceSelect.value,
      severity: severitySelect.value,
    });
    message = result.ok
      ? `Incident #${result.incident.id} declared on ${result.incident.service}. The internal view shows ${healthLabel(healthOf(state, result.incident.service))}. The public page still shows ${healthLabel(healthOf(state, result.incident.service, { publicOnly: true }))} because the incident is private.`
      : result.error;
    render();
  });

  reset.addEventListener('click', () => {
    state = createState(SERVICES);
    message = 'Reset. No incidents.';
    render();
  });

  incidents.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = Number(button.dataset.incident);
    if (button.dataset.status) {
      const result = changeStatus(state, id, button.dataset.status);
      message = result.ok
        ? `Incident #${id} is now ${result.incident.status}. One audit entry was written.`
        : `Refused: ${result.error}`;
    } else {
      const incident = state.incidents.find((item) => item.id === id);
      const result = setPublic(state, id, !incident.isPublic);
      message = result.ok
        ? `Incident #${id} is now ${incident.isPublic ? 'published: visitors can see it' : 'private again'}.`
        : `Refused: ${result.error}`;
    }
    render();
  });

  render();
  mountInto(sim, app);
}
