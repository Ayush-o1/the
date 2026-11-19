import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState,
  declareIncident,
  changeStatus,
  setPublic,
  healthOf,
  worstHealth,
  describeEvent,
  TRANSITIONS,
} from '../../src/sims/blackwater-logic.js';

const services = ['API', 'Dashboard', 'Webhooks'];

function fresh() {
  return createState(services);
}

test('the lifecycle table matches the real project', () => {
  assert.deepEqual(TRANSITIONS, {
    TRIGGERED: ['ACKNOWLEDGED', 'RESOLVED'],
    ACKNOWLEDGED: ['RESOLVED', 'TRIGGERED'],
    RESOLVED: ['TRIGGERED', 'CLOSED'],
    CLOSED: [],
  });
});

test('a declared incident starts as TRIGGERED, private, and is in the audit trail', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'HIGH' });
  assert.equal(incident.status, 'TRIGGERED');
  assert.equal(incident.isPublic, false);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].type, 'INCIDENT_CREATED');
});

test('allowed moves work and each one writes exactly one audit event', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'LOW' });
  for (const next of ['ACKNOWLEDGED', 'RESOLVED', 'CLOSED']) {
    const before = state.events.length;
    assert.equal(changeStatus(state, incident.id, next).ok, true);
    assert.equal(state.events.length, before + 1);
  }
  assert.equal(incident.status, 'CLOSED');
});

test('a move that is not in the table is refused and leaves no trace', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'LOW' });
  const result = changeStatus(state, incident.id, 'CLOSED');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Invalid state transition from TRIGGERED to CLOSED.');
  assert.equal(incident.status, 'TRIGGERED');
  assert.equal(state.events.length, 1);
});

test('closed is final, even for visibility', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'LOW' });
  changeStatus(state, incident.id, 'RESOLVED');
  changeStatus(state, incident.id, 'CLOSED');
  assert.equal(
    changeStatus(state, incident.id, 'TRIGGERED').error,
    'Incident is closed and cannot be modified.',
  );
  assert.equal(setPublic(state, incident.id, true).ok, false);
});

test('a resolved incident can be reopened', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'LOW' });
  changeStatus(state, incident.id, 'RESOLVED');
  assert.equal(changeStatus(state, incident.id, 'TRIGGERED').ok, true);
  assert.equal(incident.status, 'TRIGGERED');
});

test('health is the worst open incident, and no open incidents means operational', () => {
  const state = fresh();
  assert.equal(healthOf(state, 'API'), 'OPERATIONAL');
  declareIncident(state, { service: 'API', severity: 'MEDIUM' });
  assert.equal(healthOf(state, 'API'), 'DEGRADED');
  const critical = declareIncident(state, { service: 'API', severity: 'CRITICAL' }).incident;
  assert.equal(healthOf(state, 'API'), 'MAJOR_OUTAGE');
  changeStatus(state, critical.id, 'RESOLVED');
  assert.equal(healthOf(state, 'API'), 'DEGRADED');
  assert.equal(healthOf(state, 'Dashboard'), 'OPERATIONAL');
});

test('severity to health mapping', () => {
  const state = fresh();
  for (const [severity, health] of [
    ['CRITICAL', 'MAJOR_OUTAGE'],
    ['HIGH', 'PARTIAL_OUTAGE'],
    ['MEDIUM', 'DEGRADED'],
    ['LOW', 'DEGRADED'],
  ]) {
    const s = fresh();
    declareIncident(s, { service: 'Webhooks', severity });
    assert.equal(healthOf(s, 'Webhooks'), health);
  }
  assert.equal(state.incidents.length, 0);
});

test('the public page ignores private incidents, and publishing changes what visitors see', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'CRITICAL' });
  assert.equal(healthOf(state, 'API'), 'MAJOR_OUTAGE');
  assert.equal(healthOf(state, 'API', { publicOnly: true }), 'OPERATIONAL');
  setPublic(state, incident.id, true);
  assert.equal(healthOf(state, 'API', { publicOnly: true }), 'MAJOR_OUTAGE');
  setPublic(state, incident.id, false);
  assert.equal(healthOf(state, 'API', { publicOnly: true }), 'OPERATIONAL');
});

test('worstHealth ranks outages above degraded', () => {
  assert.equal(worstHealth(['DEGRADED', 'PARTIAL_OUTAGE']), 'PARTIAL_OUTAGE');
  assert.equal(worstHealth([]), 'OPERATIONAL');
});

test('unknown service or severity is rejected', () => {
  const state = fresh();
  assert.equal(declareIncident(state, { service: 'Nope', severity: 'LOW' }).ok, false);
  assert.equal(declareIncident(state, { service: 'API', severity: 'NOPE' }).ok, false);
});

test('audit events read as sentences', () => {
  const state = fresh();
  const { incident } = declareIncident(state, { service: 'API', severity: 'HIGH' });
  changeStatus(state, incident.id, 'ACKNOWLEDGED');
  assert.equal(describeEvent(state.events[1]), 'Status changed: TRIGGERED to ACKNOWLEDGED');
});
