// Keeps the address bar in step with the sector on screen, so the link you copy is the place you
// are. replaceState does not add history entries or fire hashchange, so it never moves the page.
import { collectStops } from '../core/sectors.js';

const SETTLE_MS = 200;

// A link such as /#blackwater jumps to the section when the page loads. The simulations then
// mount and change the height of everything above it, so the section drifts out of view. Once
// they are in, go back to the section, unless the visitor has already started scrolling.
export function keepHashInView(ready) {
  let moved = false;
  const markMoved = () => {
    moved = true;
  };
  for (const name of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
    window.addEventListener(name, markMoved, { once: true, passive: true });
  }
  ready.then(() => {
    if (moved || !window.location.hash) return;
    try {
      document.querySelector(window.location.hash)?.scrollIntoView();
    } catch {
      // A hash that is not a valid selector has nothing to scroll to.
    }
  });
}

export function initDeepLinks() {
  const stops = collectStops();
  let timer = null;

  function update() {
    const middle = window.innerHeight / 2;
    const current = stops.find((stop) => {
      const rect = stop.el.getBoundingClientRect();
      return rect.top <= middle && rect.bottom >= middle;
    });
    if (!current) return;
    const hash = current.id === stops[0]?.id ? '' : `#${current.id}`;
    if (hash !== window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      clearTimeout(timer);
      timer = setTimeout(update, SETTLE_MS);
    },
    { passive: true },
  );
}
