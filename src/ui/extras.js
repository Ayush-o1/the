// Small touches: the tab title when you look away, the Konami code, and moving between missions.
import { $$ } from '../lib/dom.js';
import { createKonami } from '../core/konami.js';
import { isTyping } from '../lib/dom.js';
import { showToast } from './toast.js';

// When the tab is hidden the title changes, and it comes back when you do.
export function initTabTitle() {
  const original = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Signal lost' : original;
  });
}

// The Konami code turns the probe once. Without a probe (plain page) it says so.
export function initKonami(rollProbe) {
  const feed = createKonami(() => {
    showToast(rollProbe() ? 'Barrel roll.' : 'Barrel roll. There is no probe on the plain page.');
  });
  // Capture phase, so it runs before the shortcut handler. A key that is part of the code, such as
  // the B near the end, is then kept away from the shortcuts.
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (feed(event.key) && event.key.toLowerCase() === 'b') event.stopImmediatePropagation();
    },
    true,
  );
}

// Moves to the next or previous mission relative to what is on screen. Uses the address so the
// browser's back button and the focus handling in core/a11y.js work as they do for any link.
export function moveMission(step) {
  const missions = $$('[data-mission]');
  if (missions.length === 0) return;
  // The address says where we are heading, even while a smooth scroll is still going, so pressing
  // J twice quickly goes two missions on. If it is not a mission, use the one nearest the middle.
  let current = missions.findIndex((el) => `#${el.id}` === window.location.hash);
  if (current < 0) {
    const middle = window.innerHeight / 2;
    missions.forEach((el, index) => {
      if (el.getBoundingClientRect().top <= middle) current = index;
    });
  }
  const next = Math.min(missions.length - 1, Math.max(0, current + step));
  window.location.hash = missions[next].id;
}
