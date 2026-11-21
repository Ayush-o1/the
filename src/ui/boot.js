// The boot cover. First visit only. It sits over the page while the flight compiles its shaders
// and uploads its buffers, so nothing hitches once the visitor starts to scroll. The line fills
// when the work is really done. It never lasts more than two seconds, and any key, tap or the
// Skip button ends it at once. The page underneath is already readable.
const MAX_MS = 2000;
const MIN_MS = 500;
const FADE_MS = 280;

export function runBoot({ ready }) {
  return new Promise((resolve) => {
    const cover = document.createElement('div');
    cover.className = 'boot';
    cover.innerHTML = `
      <div class="boot__inner">
        <p class="boot__name">Ayush Kumar</p>
        <p class="boot__role mono">Software engineer</p>
        <div class="boot__bar"><span class="boot__fill"></span></div>
        <p class="boot__note mono">Preparing the flight</p>
        <button type="button" class="btn btn--quiet boot__skip">Skip</button>
      </div>`;
    document.body.append(cover);
    const fill = cover.querySelector('.boot__fill');
    const skip = cover.querySelector('.boot__skip');
    skip.focus({ preventScroll: true });

    let finished = false;
    const started = performance.now();
    const timers = [];

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', finish);
      cover.classList.add('boot--out');
      setTimeout(() => {
        cover.remove();
        resolve();
      }, FADE_MS);
    }

    // The bar creeps to 85% while work is under way and completes when the work is done.
    requestAnimationFrame(() => {
      fill.style.transform = 'scaleX(0.85)';
    });
    ready.finally(() => {
      fill.style.transform = 'scaleX(1)';
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      timers.push(setTimeout(finish, wait));
    });
    timers.push(setTimeout(finish, MAX_MS));
    document.addEventListener('keydown', finish);
    cover.addEventListener('pointerdown', finish);
  });
}
