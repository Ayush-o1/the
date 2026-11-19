// Owns the switch between the 3D flight ("scene") and the plain page ("lite").
// Every way into lite goes through enterLite, so the page always ends up in a consistent state:
// the canvas is gone, the HUD is gone, html.lite is set and the content is untouched.
import { writeSetting } from './store.js';
import { setModeToggleLabel, mountHud } from '../ui/hud.js';

export function createModeController({ env, startTier }) {
  const html = document.documentElement;
  let current = 'lite';
  let scene = null;
  let hud = null;
  let loading = false;

  function teardown() {
    hud?.destroy();
    scene?.dispose();
    hud = null;
    scene = null;
  }

  function enterLite(reason, { save = false } = {}) {
    teardown();
    current = 'lite';
    html.classList.add('lite');
    html.classList.remove('scene');
    html.dataset.liteReason = reason;
    if (save) writeSetting('lite', '1');
    setModeToggleLabel('lite');
  }

  async function enterScene() {
    if (loading || current === 'scene') return;
    loading = true;
    try {
      // Three.js, GSAP and Lenis arrive in this chunk, after the page is already readable.
      const { startScene } = await import('../scene/index.js');
      teardown();
      scene = startScene({
        env,
        startTier,
        onContextLost: () => enterLite('graphics context lost'),
        onSector: (stop) => hud?.setSector(stop),
        onFrame: (state) => hud?.update(state),
      });
      hud = mountHud(scene.stops);
      hud.setSector(scene.stops[0]);
      current = 'scene';
      html.classList.remove('lite');
      delete html.dataset.liteReason;
      setModeToggleLabel('scene');
    } catch (error) {
      // A scene failure must never break the page. Warn for developers and carry on in lite.
      console.warn('Flight scene failed to start:', error);
      enterLite('scene error');
    } finally {
      loading = false;
    }
  }

  async function toggle() {
    if (current === 'scene') {
      enterLite('your choice', { save: true });
    } else {
      writeSetting('lite', '0');
      await enterScene();
    }
  }

  return {
    enterScene,
    enterLite,
    toggle,
    get current() {
      return current;
    },
    getStats: () => scene?.getStats() ?? null,
  };
}
