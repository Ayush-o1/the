// The flight's on-screen furniture: a thin path along the bottom with one tick per project and a
// marker for where you are, and a polite live region that names the current section for screen
// readers. Both are built from the page's own sections (data-sector), so nothing is written twice.
import { $ } from '../lib/dom.js';

function element(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

// The Skip the flight / Start the flight toggle lives in the header in both modes. Its label says
// what a click does.
export function setModeToggleLabel(mode) {
  const label = $('[data-mode-label]');
  if (label) label.textContent = mode === 'scene' ? 'Skip the flight' : 'Start the flight';
}

export function mountHud(stops) {
  const parts = [];
  const add = (node) => {
    document.body.append(node);
    parts.push(node);
    return node;
  };

  const path = add(element('nav', 'hud-path'));
  path.setAttribute('aria-label', 'Flight path');
  const line = element('ol', 'hud-path__line');
  path.append(line);
  const lastIndex = Math.max(1, stops.length - 1);
  stops.forEach((stop, index) => {
    if (!stop.isMission) return;
    const item = element('li', 'hud-path__stop');
    item.style.left = `${(index / lastIndex) * 100}%`;
    const link = element('a', 'hud-path__link');
    link.href = `#${stop.id}`;
    link.setAttribute('aria-label', `Go to ${stop.name}`);
    link.append(element('span', 'hud-path__dot'));
    item.append(link);
    line.append(item);
  });
  const marker = element('span', 'hud-path__marker');
  marker.setAttribute('aria-hidden', 'true');
  path.append(marker);

  const live = add(element('p', 'visually-hidden'));
  live.setAttribute('aria-live', 'polite');

  return {
    // Called when the section changes.
    setSector(stop) {
      live.textContent = `Section: ${stop.name}`;
    },
    // Called every frame.
    update({ param, stops: count }) {
      marker.style.left = `${(param / Math.max(1, count - 1)) * 100}%`;
    },
    destroy() {
      for (const node of parts) node.remove();
    },
  };
}
