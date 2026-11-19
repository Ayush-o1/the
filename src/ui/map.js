// The mission map: a list of every sector, for fast travel. The names come from the page's own
// data-sector attributes. Each entry is an ordinary link, so it also works as a deep link.
import { $ } from '../lib/dom.js';
import { collectStops } from '../core/sectors.js';

export function initMap() {
  const list = $('[data-map-list]');
  if (!list) return;
  for (const stop of collectStops()) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${stop.id}`;
    link.textContent = stop.name;
    item.append(link);
    list.append(item);
  }
}
