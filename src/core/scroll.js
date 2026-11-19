// Smooth wheel scrolling with Lenis, driven by GSAP's ticker so the scroll and the render
// share one clock. Native scrolling stays: Lenis only eases the wheel, it never locks the page.
import Lenis from 'lenis';
import { gsap } from 'gsap';

export function createScroll() {
  // Touch scrolling stays native (syncTouch false). anchors lets in-page links glide.
  const lenis = new Lenis({ autoRaf: false, anchors: true, syncTouch: false });
  const onTick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(onTick);
  // Without this, GSAP skips time after a slow frame and the scroll would jump.
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy() {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    },
  };
}
