// Argus simulation: a graph of synthetic accounts. "Inject anomaly" plants a burst of 35
// transactions in six hours on one account and the z-score detector flags it.
// The detector and the data are in argus-logic.js. Drawing is plain Canvas 2D.
import { el, mountInto } from './ui-kit.js';
import {
  buildWorld,
  detect,
  injectAnomaly,
  layout,
  Z_THRESHOLD,
  WINDOW_HOURS,
} from './argus-logic.js';

const HEIGHT = 340;

function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function mountArgus(sim) {
  let world = buildWorld();
  let points = layout(world);
  let detection = detect(world);
  let selected = 0;
  let message = 'No account stands out. Inject an anomaly to see the detector work.';

  const canvas = el('canvas', { class: 'argus__canvas', role: 'img' });
  const detail = el('p', { class: 'argus__detail' });
  const list = el('ul', { class: 'argus__list', 'aria-label': 'Accounts with the highest bursts' });
  const outcome = el('p', { class: 'sim__outcome', role: 'status' });
  const inject = el('button', { type: 'button', class: 'btn' }, 'Inject anomaly');
  const reset = el('button', { type: 'button', class: 'btn btn--quiet' }, 'Reset');
  const note = el(
    'p',
    { class: 'sim__note' },
    `The rule here: flag an account whose most transactions in any ${WINDOW_HOURS} hours is ${Z_THRESHOLD} or more standard deviations above the rest. The real detector also needs an Isolation Forest to agree. This page runs the z-score half.`,
  );
  const app = el(
    'div',
    { class: 'sim__app' },
    el('div', { class: 'sim__controls' }, inject, reset),
    canvas,
    detail,
    list,
    outcome,
    note,
  );

  function draw() {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 600;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(HEIGHT * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, HEIGHT);
    const at = (i) => ({ x: points[i].x * (width - 24) + 12, y: points[i].y * (HEIGHT - 24) + 12 });
    const dim = cssColor('--line');
    const warn = cssColor('--alert');

    // Each pair of linked accounts is drawn once. Injected transactions are drawn in the alert colour.
    const drawn = new Set();
    for (const t of world.transactions) {
      const key =
        t.from < t.to ? `${t.from}-${t.to}-${t.injected}` : `${t.to}-${t.from}-${t.injected}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const a = at(t.from);
      const b = at(t.to);
      ctx.strokeStyle = t.injected ? warn : dim;
      ctx.lineWidth = t.injected ? 1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    detection.results.forEach((result, i) => {
      const { x, y } = at(i);
      ctx.beginPath();
      ctx.arc(x, y, result.flagged ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = result.flagged ? warn : cssColor('--star');
      ctx.fill();
      if (i === selected) {
        ctx.strokeStyle = cssColor('--amber');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    canvas.setAttribute(
      'aria-label',
      `Graph of ${world.accounts.length} synthetic accounts and their transactions. ${detection.flagged.length} flagged.`,
    );
  }

  function describe(result) {
    const verdict = result.flagged ? 'flagged' : 'not flagged';
    return `${result.id}: most transactions in ${WINDOW_HOURS} hours is ${result.burst}, z-score ${result.z.toFixed(1)}, ${verdict}.`;
  }

  function renderList() {
    const top = [...detection.results].sort((a, b) => b.burst - a.burst).slice(0, 6);
    list.replaceChildren(
      ...top.map((result) => {
        const button = el(
          'button',
          { type: 'button', class: 'btn btn--quiet', 'data-index': result.index },
          `${result.id} · burst ${result.burst} · z ${result.z.toFixed(1)}${result.flagged ? ' · FLAGGED' : ''}`,
        );
        return el('li', {}, button);
      }),
    );
  }

  function render() {
    detail.textContent = describe(detection.results[selected]);
    outcome.textContent = message;
    renderList();
    draw();
  }

  function nearest(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best = -1;
    let bestDistance = 18;
    points.forEach((p, i) => {
      const distance = Math.hypot(p.x * (rect.width - 24) + 12 - x, p.y * (HEIGHT - 24) + 12 - y);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    return best;
  }

  canvas.addEventListener('pointermove', (event) => {
    const i = nearest(event);
    if (i >= 0 && i !== selected) {
      selected = i;
      detail.textContent = describe(detection.results[i]);
      draw();
    }
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    selected = Number(button.dataset.index);
    detail.textContent = describe(detection.results[selected]);
    draw();
  });

  inject.addEventListener('click', () => {
    const index = injectAnomaly(world);
    if (index === null) {
      message = 'Every account has already had an anomaly. Reset to start again.';
    } else {
      detection = detect(world);
      selected = index;
      const hit = detection.results[index];
      message = hit.flagged
        ? `Flagged ${hit.id}: ${hit.burst} transactions inside ${WINDOW_HOURS} hours, z-score ${hit.z.toFixed(1)}. The other ${world.accounts.length - detection.flagged.length} accounts stayed quiet.`
        : `${hit.id} got a burst but its z-score is ${hit.z.toFixed(1)}, under ${Z_THRESHOLD}.`;
    }
    render();
  });

  reset.addEventListener('click', () => {
    world = buildWorld();
    points = layout(world);
    detection = detect(world);
    selected = 0;
    message = 'Reset. No account stands out.';
    render();
  });

  window.addEventListener('resize', draw);
  mountInto(sim, app);
  render();
}
