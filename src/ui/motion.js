// Motion polish for the flight. Only loaded when the 3D scene runs, never in Lite mode, and never
// under reduced motion. Two small effects:
//   text reveals: a heading's lines slide up out of a mask, 0.9 s, once per heading
//   decode:       the hull gauge scrambles into its first value, once
// Start-state hiding happens here, after the scene is confirmed to work, so the HTML is always
// readable on its own (plan 8.2 rule 2).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { $, $$ } from '../lib/dom.js';

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

const REVEAL_SECONDS = 0.9;
const STAGGER_SECONDS = 0.06;
// The page's own h1 is left alone: it is the first thing read and the largest paint.
const HEADINGS = '#main h2, .dossier__callsign';

function inViewNow(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

export function initReveals() {
  const observers = [];
  const splits = [];

  // Headings are split after fonts load, so the line breaks match what the visitor will see.
  document.fonts.ready.then(() => {
    for (const heading of $$(HEADINGS)) {
      const split = SplitText.create(heading, { type: 'lines', mask: 'lines' });
      splits.push(split);
      const play = () =>
        gsap.fromTo(
          split.lines,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: REVEAL_SECONDS,
            ease: 'power3.out',
            stagger: STAGGER_SECONDS,
            onComplete: () => split.revert(),
          },
        );
      if (inViewNow(heading)) {
        play();
        continue;
      }
      // Below the fold: hold the lines out of sight until the heading scrolls in, then play once.
      gsap.set(split.lines, { yPercent: 110 });
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          play();
        },
        { rootMargin: '0px 0px -10% 0px' },
      );
      observer.observe(heading);
      observers.push(observer);
    }
  });

  return () => {
    for (const observer of observers) observer.disconnect();
    for (const split of splits) split.revert();
  };
}

// Scrambles the hull gauge into its first value. Called once, after the HUD has written it.
export function decodeHull() {
  const hull = $('.hud-hull');
  if (!hull || !hull.textContent) return;
  gsap.to(hull, {
    duration: 0.9,
    scrambleText: { text: hull.textContent, chars: '0123456789', speed: 0.6 },
  });
}
