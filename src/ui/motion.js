// Text reveals for the flight: a heading's lines slide up out of a mask, once per heading.
// Only loaded when the 3D scene runs, never in Lite mode, and never under reduced motion.
// Start-state hiding happens here, after the scene is confirmed to work, so the HTML is always
// readable on its own.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { $$ } from '../lib/dom.js';

gsap.registerPlugin(SplitText);

const REVEAL_SECONDS = 0.64;
const STAGGER_SECONDS = 0.06;
// The hero title is left alone: it is the first thing read and the largest paint.
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
            ease: 'expo.out',
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

// The hero sequence: eyebrow, the three title rows, the lede, the buttons, the status line. One
// settle ease, one stagger. It runs once, after the boot cover, and ends in under 1.2 seconds.
export function revealHero() {
  const parts = $$('.hero__eyebrow, .hero__row, .hero__lede, .hero__actions, .hero__status');
  gsap.set(parts, { opacity: 0, y: 28 });
  document.documentElement.classList.remove('first');
  gsap.to(parts, {
    opacity: 1,
    y: 0,
    duration: REVEAL_SECONDS,
    ease: 'expo.out',
    stagger: STAGGER_SECONDS,
    clearProps: 'all',
  });
}
