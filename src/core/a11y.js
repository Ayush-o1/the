// Focus management for in-page navigation. When the visitor jumps to a section (nav link, flight
// path dot, deep link), keyboard focus moves to that section's heading so screen readers and the
// next Tab press continue from there instead of from where the link was.
import { $ } from '../lib/dom.js';

function findById(hash) {
  try {
    return $(hash);
  } catch {
    // A hash that is not a valid selector, such as "#a b", has no target.
    return null;
  }
}

function focusHeading(hash) {
  if (!hash || hash.length < 2) return;
  const target = findById(hash);
  if (!target) return;
  const heading = target.matches('h1, h2, h3') ? target : $('h1, h2, h3', target);
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

export function initA11y() {
  window.addEventListener('hashchange', () => focusHeading(window.location.hash));
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const hash = link.getAttribute('href');
    // The browser moves focus itself for native jumps. This covers smooth-scroll and same-hash clicks.
    setTimeout(() => focusHeading(hash), 0);
  });
}
