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

// How close the flight must be to a heading's section before the heading plays, in stops. The
// headings and the camera read the same smoothed progress in the same frame, so the text arrives
// with the world, not ahead of it.
const ARRIVE = 0.35;

// stops: the flight's sections in order (scene.stops). Returns { update(param), stop() }: the
// scene's frame loop calls update with its smoothed progress.
export function initReveals(stops = []) {
  const observers = [];
  const splits = [];
  const waiting = [];

  function stopIndexOf(heading) {
    const index = stops.findIndex((stop) => stop.el?.contains(heading));
    return index < 0 ? 0 : index;
  }

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
      // Below the fold: hold the lines out of sight until the heading is on screen and the flight
      // has reached its section, then play once.
      gsap.set(split.lines, { yPercent: 110 });
      const item = { play, index: stopIndexOf(heading), seen: false, done: false };
      waiting.push(item);
      const observer = new IntersectionObserver(
        (entries) => {
          item.seen = entries.some((entry) => entry.isIntersecting);
        },
        { rootMargin: '0px 0px -10% 0px' },
      );
      observer.observe(heading);
      observers.push(observer);
    }
  });

  return {
    update(param) {
      for (const item of waiting) {
        if (item.done || !item.seen || param < item.index - ARRIVE) continue;
        item.done = true;
        item.play();
      }
    },
    stop() {
      for (const observer of observers) observer.disconnect();
      for (const split of splits) split.revert();
    },
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
