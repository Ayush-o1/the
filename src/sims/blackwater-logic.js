// BlackWater simulation logic. The rules are copied from the real project:
//   - lifecycle table:  src/services/incident.service.js (ALLOWED_TRANSITIONS)
//   - health rule:      src/utils/serviceHealth.js and src/services/health.service.js
//   - audit event types: src/utils/timelineEvents.js
// No DOM here, so node --test can check every rule.

export const STATUSES = ['TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'];

// Each status lists the statuses it may move to. CLOSED is final.
export const TRANSITIONS = {
  TRIGGERED: ['ACKNOWLEDGED', 'RESOLVED'],
  ACKNOWLEDGED: ['RESOLVED', 'TRIGGERED'],
  RESOLVED: ['TRIGGERED', 'CLOSED'],
  CLOSED: [],
};

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const HEALTH_FOR_SEVERITY = {
  CRITICAL: 'MAJOR_OUTAGE',
  HIGH: 'PARTIAL_OUTAGE',
  MEDIUM: 'DEGRADED',
  LOW: 'DEGRADED',
};

// Worst first. The position in this list is the ranking.
const HEALTH_WORST_FIRST = ['MAJOR_OUTAGE', 'PARTIAL_OUTAGE', 'DEGRADED', 'OPERATIONAL'];

// Resolved and closed incidents no longer count toward health.
const NOT_OPEN = ['RESOLVED', 'CLOSED'];

export function createState(services) {
  return { services: [...services], incidents: [], events: [], nextId: 1 };
}

function record(state, incident, type, detail) {
  state.events.push({ incidentId: incident.id, type, detail });
}

export function declareIncident(state, { service, severity }) {
  if (!state.services.includes(service)) return { ok: false, error: 'Unknown service.' };
  if (!SEVERITIES.includes(severity)) return { ok: false, error: 'Unknown severity.' };
  const incident = {
    id: state.nextId,
    title: `${service} is failing`,
    service,
    severity,
    status: 'TRIGGERED',
    isPublic: false,
  };
  state.nextId += 1;
  state.incidents.push(incident);
  record(state, incident, 'INCIDENT_CREATED', `${severity} on ${service}`);
  return { ok: true, incident };
}

// The same checks as the real service: closed is final, and the move must be in the table.
export function changeStatus(state, id, next) {
  const incident = state.incidents.find((item) => item.id === id);
  if (!incident) return { ok: false, error: 'No such incident.' };
  if (incident.status === 'CLOSED') {
    return { ok: false, error: 'Incident is closed and cannot be modified.' };
  }
  if (!TRANSITIONS[incident.status].includes(next)) {
    return { ok: false, error: `Invalid state transition from ${incident.status} to ${next}.` };
  }
  const previous = incident.status;
  incident.status = next;
  record(state, incident, 'STATUS_CHANGED', `${previous} to ${next}`);
  return { ok: true, incident };
}

export function setPublic(state, id, isPublic) {
  const incident = state.incidents.find((item) => item.id === id);
  if (!incident) return { ok: false, error: 'No such incident.' };
  if (incident.status === 'CLOSED') {
    return { ok: false, error: 'Incident is closed and cannot be modified.' };
  }
  if (incident.isPublic === isPublic) return { ok: true, incident };
  incident.isPublic = isPublic;
  record(state, incident, 'VISIBILITY_CHANGED', isPublic ? 'published' : 'made private');
  return { ok: true, incident };
}

export function worstHealth(statuses) {
  return HEALTH_WORST_FIRST.find((status) => statuses.includes(status)) ?? 'OPERATIONAL';
}

// Health is calculated every time it is read and never stored. publicOnly is the privacy switch:
// the public page only looks at published incidents.
export function healthOf(state, service, { publicOnly = false } = {}) {
  const open = state.incidents.filter(
    (incident) =>
      incident.service === service &&
      !NOT_OPEN.includes(incident.status) &&
      (!publicOnly || incident.isPublic),
  );
  return worstHealth(open.map((incident) => HEALTH_FOR_SEVERITY[incident.severity]));
}

export function allowedMoves(incident) {
  return TRANSITIONS[incident.status];
}

// The audit trail as a sentence, newest last.
export function describeEvent(event) {
  const labels = {
    INCIDENT_CREATED: 'Incident declared',
    STATUS_CHANGED: 'Status changed',
    VISIBILITY_CHANGED: 'Visibility changed',
  };
  return `${labels[event.type] ?? event.type}: ${event.detail}`;
}
