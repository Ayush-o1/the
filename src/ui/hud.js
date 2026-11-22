// The flight's on-screen furniture: a thin progress line under the header, and a polite live region
// that names the current section for screen readers. The line sits at the top edge so it never
// covers the text being read. It is decorative: the Menu lists every place as a link. The section
// names come from the page's own sections (data-sector), so nothing is written twice.
import { $ } from '../lib/dom.js';

function element(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

// The 3D switch lives in the header in both modes. Its label says what a click does.
export function setModeToggleLabel(mode) {
  const label = $('[data-mode-label]');
  if (label) label.textContent = mode === 'scene' ? 'Turn off 3D' : 'Turn on 3D';
}

export function mountHud() {
  const parts = [];
  const add = (node) => {
    document.body.append(node);
    parts.push(node);
    return node;
  };

  const progress = add(element('div', 'hud-progress'));
  progress.setAttribute('aria-hidden', 'true');
  const fill = element('span', 'hud-progress__fill');
  progress.append(fill);

  const live = add(element('p', 'visually-hidden'));
  live.setAttribute('aria-live', 'polite');

  return {
    // Called when the section changes.
    setSector(stop) {
      live.textContent = `Section: ${stop.name}`;
    },
    // Called every frame.
    update({ param, stops: count }) {
      fill.style.transform = `scaleX(${param / Math.max(1, count - 1)})`;
      // Hidden through the opening, where a few pixels of line would read as a stray mark.
      progress.style.opacity = String(Math.min(1, Math.max(0, (param - 0.4) / 0.4)));
    },
    destroy() {
      for (const node of parts) node.remove();
    },
  };
}
