// The hazard timeline. A pure function of scroll progress, so scrubbing forwards and backwards
// always gives the same answer. No DOM, no clock, no randomness.
//
// "param" is the route position from route-math (0 at launch, 1 at the Belt, and so on).
// Each hazard is placed relative to the stop it belongs to, and `index` turns a section id into its stop number.

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const HULL_START = 100;
export const HULL_END = 71;
export const DRIFT_PEAK = 0.8;

export function createTimeline(index) {
  const belt = index('belt');
  const well = index('blackwater');
  const drift = index('beetlejuice');
  const signal = index('deadletter');
  const europa = index('europa');
  const contact = index('contact');

  // The hull is a joke gauge, not a code-quality number. It drops a little at each hazard.
  const hullSteps = [
    { at: belt + 0.05, to: 94 },
    { at: well + 0.3, to: 85 },
    { at: drift + 0.4, to: 81 },
    { at: signal + 0.1, to: 76 },
    { at: europa + 0.1, to: HULL_END },
  ];

  // Alerts in route order. The first range that contains the progress wins.
  // from and to are offsets (in stops) from the hazard's own stop.
  const alertRanges = [
    { key: 'belt-contacts', at: belt, from: -0.3, to: 0.05, level: 'hazard' },
    { key: 'belt-hull', at: belt, from: 0.05, to: 0.6, level: 'hazard' },
    { key: 'well-detected', at: well, from: -0.95, to: -0.4, level: 'hazard' },
    { key: 'incident-triggered', at: well, from: -0.4, to: -0.1, level: 'hazard' },
    { key: 'incident-acknowledged', at: well, from: -0.1, to: 0.15, level: 'hazard' },
    { key: 'incident-resolved', at: well, from: 0.15, to: 0.4, level: 'info' },
    { key: 'incident-closed', at: well, from: 0.4, to: 0.6, level: 'info' },
    { key: 'drift', at: drift, from: -0.35, to: 0.1, level: 'hazard' },
    { key: 'star-fix', at: drift, from: 0.1, to: 0.5, level: 'info' },
    { key: 'msg-1', at: signal, from: -0.6, to: -0.25, level: 'info' },
    { key: 'msg-2', at: signal, from: -0.25, to: 0.05, level: 'info' },
    { key: 'msg-hostile', at: signal, from: 0.05, to: 0.3, level: 'hazard' },
    { key: 'signal-quarantined', at: signal, from: 0.3, to: 0.7, level: 'hazard' },
    { key: 'conjunction', at: europa, from: -0.5, to: 0.5, level: 'hazard' },
    { key: 'arrived', at: contact, from: -0.4, to: 1, level: 'info' },
  ];

  function hullAt(param) {
    let hull = HULL_START;
    for (const step of hullSteps)
      hull += (step.to - hull) * smoothstep(step.at, step.at + 0.2, param);
    return hull;
  }

  function driftAt(param) {
    const grow = smoothstep(drift - 0.35, drift + 0.1, param);
    const fix = smoothstep(drift + 0.1, drift + 0.5, param);
    return DRIFT_PEAK * grow * (1 - fix);
  }

  return {
    evaluate(param) {
      const gravity = Math.max(0, 1 - Math.abs(param - well)) ** 2;
      const hit = alertRanges.find((r) => param >= r.at + r.from && param < r.at + r.to);
      return {
        hull: Math.round(hullAt(param)),
        gravity,
        // Time near the well runs slow: the mission clock follows this.
        timeScale: 1 - 0.85 * gravity,
        // Colour fringing only at the very peak of the well.
        chroma: smoothstep(0.7, 1, gravity),
        drift: driftAt(param),
        // 0 before the star fix, 1 after it. The fix ring spreads while this moves between the two.
        fix: smoothstep(drift + 0.1, drift + 0.5, param),
        // The HUD flickers while the hostile signal is near. Strength 0 to 1.
        flicker: Math.max(0, 1 - Math.abs(param - signal) / 0.7),
        alert: hit ? { key: hit.key, level: hit.level } : null,
      };
    },
    // Where the Belt's hull hit happens. Shake and sound fire once, on the first forward crossing.
    beltHit: belt + 0.05,
    stops: { belt, well, drift, signal, europa, contact },
  };
}
