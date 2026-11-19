// Reads the page's sectors from the DOM. A sector is any element with data-sector that does not
// contain another one, so "Missions" (the wrapper) is skipped and each mission article counts.
import { $$ } from '../lib/dom.js';

export function collectStops() {
  return $$('[data-sector]')
    .filter((el) => !el.querySelector('[data-sector]'))
    .map((el) => ({ id: el.id, name: el.dataset.sector, isMission: 'mission' in el.dataset, el }));
}

// Page-pixel rectangles of the stops, for route-math.
export function measureStops(stops) {
  const offset = window.scrollY;
  return stops.map(({ el }) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top + offset, bottom: rect.bottom + offset };
  });
}
