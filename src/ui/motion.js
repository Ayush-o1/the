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

// Returns { update(), stop() }. The scene's frame loop calls update in the same frame as the
// camera, before drawing, so a heading starts on the frame it is first seen. It plays once.
// (Holding headings until the camera arrived left cards on screen without their titles.)
export function initReveals() {
  const observers = [];
  const splits = [];
  const waiting = [];

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
      // Below the fold: hold the lines out of sight until the heading is on screen, then play once.
      gsap.set(split.lines, { yPercent: 110 });
      const item = { play, seen: false, done: false };
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
    update() {
      for (const item of waiting) {
        if (item.done || !item.seen) continue;
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
