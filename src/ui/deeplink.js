// Keeps the address bar in step with the sector on screen, so the link you copy is the place you
// are. replaceState does not add history entries or fire hashchange, so it never moves the page.
import { collectStops } from '../core/sectors.js';

const SETTLE_MS = 200;

// A link such as /#blackwater jumps to the section when the page loads. The simulations then
// mount and change the height of everything above it, so the section drifts out of view. Once
// they are in, go back to the section, unless the visitor has already started scrolling.
// While a deep link is still settling, the address must not be rewritten: an early scroll event
// (before the browser's own jump lands) would see the top of the page and erase the link.
let holdAddress = false;

export function keepHashInView(ready) {
  const initialHash = window.location.hash;
  holdAddress = Boolean(initialHash);
  let moved = false;
  const markMoved = () => {
    moved = true;
    holdAddress = false;
  };
  for (const name of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
    window.addEventListener(name, markMoved, { once: true, passive: true });
  }
  // The page keeps changing height until the simulations are in, the fonts have swapped and the
  // load event has fired. Go back to the section once all three are done.
  const loaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  // Jumps straight to the section, with no smooth scrolling, unless the visitor has moved or the
  // section is already near the top of the screen.
  function goToHash() {
    if (moved || !initialHash) return;
    try {
      const target = document.querySelector(initialHash);
      if (!target) return;
      const top = target.getBoundingClientRect().top;
      if (Math.abs(top) > window.innerHeight * 0.25) target.scrollIntoView({ behavior: 'instant' });
    } catch {
      // A hash that is not a valid selector has nothing to scroll to.
    }
  }

  // Check once everything has settled, and twice more shortly after, in case a late layout change
  // (a slow font, a simulation on a slow machine) moved the section again.
  Promise.allSettled([ready, document.fonts.ready, loaded]).then(() => {
    goToHash();
    setTimeout(goToHash, 600);
    setTimeout(() => {
      goToHash();
      holdAddress = false;
    }, 1800);
  });
}

export function initDeepLinks() {
  const stops = collectStops();
  let timer = null;

  function update() {
    if (holdAddress) return;
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
