// Maps the page scroll position to a position along the flight route. Pure functions, no DOM.
//
// Each section of the page is a "stop". The probe stays at a stop for as long as that section is
// on screen, and travels to the next one in the space between them.

export function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// Like smoothstep, but its second derivative is also zero at both ends, so a motion that starts
// or stops with it has no jump in acceleration.
export function smootherstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// The exposure at this progress: each stop has its own, blended smoothly between neighbours.
export function exposureAt(param, exposures) {
  if (exposures.length === 0) return 1;
  const last = exposures.length - 1;
  const i = Math.min(last, Math.max(0, Math.floor(param)));
  const next = Math.min(last, i + 1);
  return exposures[i] + (exposures[next] - exposures[i]) * smootherstep(param - i);
}

// How far below the top of the viewport a section's title sits when the probe is "at" the stop.
const TITLE_MARGIN = 0.12;

// For each section, the range of scroll positions over which the probe stays at its stop. The
// range starts when the title is just under the header and ends when the bottom of the section is
// just above the bottom of the screen, so the world stays in place for the whole time the section is
// being read. A short section gets a single point. Ranges are forced to be strictly increasing so
// the mapping below never divides by zero. Rectangles are { top, bottom } in page pixels.
export function stopScrolls(rects, viewportHeight) {
  const ranges = [];
  let previousEnd = -Infinity;
  for (const rect of rects) {
    let from = rect.top - TITLE_MARGIN * viewportHeight;
    let to = rect.bottom - (1 - TITLE_MARGIN) * viewportHeight;
    if (to < from) from = to = (from + to) / 2;
    from = Math.max(from, previousEnd + 1);
    to = Math.max(to, from);
    ranges.push({ from, to });
    previousEnd = to;
  }
  return ranges;
}

// Returns a number from 0 to stops - 1. A whole number means "at that stop". The probe travels
// only in the gap between two sections, eased at both ends.
export function stopParam(ranges, y) {
  const last = ranges.length - 1;
  if (last < 0 || y <= ranges[0].to) return 0;
  if (y >= ranges[last].from) return last;
  let i = 0;
  while (y >= ranges[i + 1].from) i += 1;
  if (y <= ranges[i].to) return i;
  return i + smoothstep((y - ranges[i].to) / (ranges[i + 1].from - ranges[i].to));
}

// The stop whose range is nearest to the current scroll position. Drives the section label.
export function nearestStop(ranges, y) {
  const distance = (range) => (y < range.from ? range.from - y : y > range.to ? y - range.to : 0);
  let best = 0;
  for (let i = 1; i < ranges.length; i += 1) {
    if (distance(ranges[i]) < distance(ranges[best])) best = i;
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

// How present the probe is, 0 to 1, given its progress and the stops that are projects. It is 0
// while a project is being read, so the probe never sits behind a dossier, and 1 in the gaps
// between projects and at the start and end. A pure function of progress.
export function probePresence(param, projectStops) {
  let nearest = Infinity;
  for (const index of projectStops) nearest = Math.min(nearest, Math.abs(param - index));
  return smoothstep((nearest - 0.12) / 0.23);
}

// How strongly gravity bends the picture around a stop, 0 to 1. It is a pure function of progress,
// so scrubbing back gives the same picture as flying forward. Zero beyond one stop away.
export function wellStrength(param, index) {
  const closeness = 1 - Math.min(1, Math.abs(param - index));
  return smoothstep(closeness);
}
