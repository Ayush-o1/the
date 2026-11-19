// The WebGL renderer and its canvas. Sizing, pixel ratio and context loss live here.
import { WebGLRenderer, ACESFilmicToneMapping, Color } from 'three';

export function createRenderer({ onContextLost }) {
  const renderer = new WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setClearColor(new Color(0x06070a), 1);
  // With post-processing there are several passes per frame. Counting them all (a manual reset in
  // the loop) gives honest draw call and triangle numbers for the ?debug overlay.
  renderer.info.autoReset = false;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const canvas = renderer.domElement;
  canvas.className = 'scene-canvas';
  // The canvas is decoration. The page text is the content.
  canvas.setAttribute('aria-hidden', 'true');
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    onContextLost();
  });

  let dprCap = 1.5;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  return {
    renderer,
    canvas,
    resize,
    setDprCap(cap) {
      dprCap = cap;
      resize();
    },
    get pixelRatio() {
      return renderer.getPixelRatio();
    },
    dispose() {
      renderer.dispose();
      canvas.remove();
    },
  };
}
