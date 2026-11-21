// The boot sequence. First visit only, 2.2 seconds at most, and any key or tap skips it.
// The lines report real checks about this browser.
const LINE_MS = 280;
const FADE_MS = 180;

function buildLines(env, tier) {
  const dpr = Math.round((window.devicePixelRatio || 1) * 10) / 10;
  return [
    'Ayush Kumar',
    `> display .... ${window.innerWidth}x${window.innerHeight} @${dpr}x`,
    `> webgl ...... ${env.webgl2 ? 'ok' : 'missing'}  (tier: ${tier})`,
    `> motion ..... ${env.reducedMotion ? 'reduced' : 'full'}`,
    '> audio ...... off',
    'Ready',
  ];
}

export function runBoot(env, tier) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'boot';
    // Decorative. Screen readers should go straight to the page.
    overlay.setAttribute('aria-hidden', 'true');
    const text = document.createElement('pre');
    text.className = 'boot__text mono';
    overlay.append(text);
    document.body.append(overlay);

    const lines = buildLines(env, tier);
    let shown = 0;
    let finished = false;
    const timers = [];

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', finish);
      document.removeEventListener('pointerdown', finish);
      overlay.classList.add('boot--out');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, FADE_MS);
    }

    function showNext() {
      if (finished) return;
      text.textContent = lines.slice(0, shown + 1).join('\n');
      shown += 1;
      if (shown < lines.length) timers.push(setTimeout(showNext, LINE_MS));
      else timers.push(setTimeout(finish, LINE_MS));
    }

    document.addEventListener('keydown', finish);
    document.addEventListener('pointerdown', finish);
    showNext();
  });
}
