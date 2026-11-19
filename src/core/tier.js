// Render tiers. The site starts on "mid", measures real frame times and moves up or down.
// deviceMemory is not used because Safari does not expose it.

export const TIERS = {
  high: { dpr: 2, stars: 7000, beltProbes: 2000, post: true },
  mid: { dpr: 1.5, stars: 4500, beltProbes: 1200, post: true },
  low: { dpr: 1, stars: 2000, beltProbes: 500, post: false },
};

const SLOW_MS = 24;
// On a 60 Hz screen the gap between frames is never under 16.7 ms, so "fast" is judged by how long
// the frame's own work took, as long as the frames still arrive on time.
const FAST_WORK_MS = 6;
const ON_TIME_MS = 20;
const SLOW_FRAMES = 90;
const FAST_FRAMES = 300;
// A frame this long means the tab was hidden or the page was busy. It says nothing about speed.
const IGNORE_MS = 250;

export function createTierMonitor(startTier = 'mid') {
  let tier = startTier;
  let slow = 0;
  let fast = 0;

  function change(next) {
    tier = next;
    slow = 0;
    fast = 0;
    return next;
  }

  return {
    get tier() {
      return tier;
    },
    // Call once per frame with the time since the last frame and the time this frame's work took,
    // both in milliseconds. Returns the new tier or null.
    sample(frameMs, workMs = frameMs) {
      if (frameMs > IGNORE_MS) return null;
      slow = frameMs > SLOW_MS ? slow + 1 : 0;
      fast = workMs < FAST_WORK_MS && frameMs < ON_TIME_MS ? fast + 1 : 0;
      if (slow >= SLOW_FRAMES && tier === 'high') return change('mid');
      if (slow >= SLOW_FRAMES && tier === 'mid') return change('low');
      if (fast >= FAST_FRAMES && tier === 'mid') return change('high');
      return null;
    },
  };
}
