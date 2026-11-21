// The one place that smooths the flight. Scroll itself is native: the wheel, touch, keys and the
// scrollbar all move the page exactly as the browser does. The camera then follows the scroll
// position with a critically damped spring. It has memory of its own speed, so when the scroll
// direction changes the camera slows and turns instead of snapping, and it never overshoots.
// Nothing else in the site smooths scroll, so there is no double smoothing.

// Seconds for the camera to cover half the distance to where the scroll has put it.
export const CAMERA_HALF_LIFE = 0.35;

// For a critically damped spring, x(t) = (1 + wt) e^(-wt). It is half-way when wt is about 1.68.
const HALF_LIFE_FACTOR = 1.68;

export function omegaFor(halfLife) {
  return HALF_LIFE_FACTOR / halfLife;
}

// state is { x, v }. The step is the exact solution of the spring equation, so the result is the
// same at 30 and at 144 frames per second.
export function springStep(state, target, omega, dt) {
  const offset = state.x - target;
  const decay = Math.exp(-omega * dt);
  const lift = (state.v + omega * offset) * dt;
  state.v = (state.v - omega * lift) * decay;
  state.x = target + (offset + lift) * decay;
  return state.x;
}

export function createFollower(initial = 0, halfLife = CAMERA_HALF_LIFE) {
  const state = { x: initial, v: 0 };
  const omega = omegaFor(halfLife);
  return {
    get value() {
      return state.x;
    },
    get velocity() {
      return state.v;
    },
    step(target, dt) {
      return springStep(state, target, omega, dt);
    },
    jumpTo(value) {
      state.x = value;
      state.v = 0;
    },
  };
}

// Reads a duration token such as --t-reveal from the page's CSS, in seconds. JS and CSS share
// one set of numbers.
export function readDuration(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value / 1000 : value;
}
