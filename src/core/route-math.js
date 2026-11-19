// Maps the page scroll position to a position along the flight route. Pure functions, no DOM.
//
// Each sector of the page is a "stop". A stop has a scroll position at which the sector is
// centred in the viewport. Between two stops the probe holds still for the first part of the gap
// (you are reading), travels in the middle, and holds again at the next stop.

const PLATEAU = 0.3;

function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// Scroll positions where each rectangle is centred. Rectangles are { top, bottom } in page pixels.
// The result is forced to be strictly increasing so the mapping below never divides by zero.
export function stopScrolls(rects, viewportHeight) {
  const scrolls = [];
  for (const rect of rects) {
    const centred = (rect.top + rect.bottom) / 2 - viewportHeight / 2;
    const previous = scrolls.length ? scrolls[scrolls.length - 1] : -Infinity;
    scrolls.push(Math.max(centred, previous + 1));
  }
  return scrolls;
}

// Returns a number from 0 to stops - 1. A whole number means "at that stop".
export function stopParam(scrolls, y) {
  const last = scrolls.length - 1;
  if (last < 0 || y <= scrolls[0]) return 0;
  if (y >= scrolls[last]) return last;
  let i = 0;
  while (y >= scrolls[i + 1]) i += 1;
  const u = (y - scrolls[i]) / (scrolls[i + 1] - scrolls[i]);
  const travel = smoothstep((u - PLATEAU) / (1 - 2 * PLATEAU));
  return i + travel;
}

// The stop whose centre is nearest to the current scroll position. Drives the sector label.
export function nearestStop(scrolls, y) {
  let best = 0;
  for (let i = 1; i < scrolls.length; i += 1) {
    if (Math.abs(scrolls[i] - y) < Math.abs(scrolls[best] - y)) best = i;
  }
  return best;
}

// How strong the jump tunnel is at this progress. Each jump is a pair of stop numbers. The
// tunnel is off at both ends and peaks half way, so it only plays while the probe is travelling.
export function jumpIntensity(param, jumps) {
  for (const [from, to] of jumps) {
    if (param > from && param < to) {
      const wave = Math.sin((Math.PI * (param - from)) / (to - from));
      return wave * wave;
    }
  }
  return 0;
}
