// The heads-up display. The sector label, clock and path are built from the page's own sectors
// (data-sector, data-mission), so nothing is written twice. Decorative parts are aria-hidden.
// The one part that matters to a screen reader, the current sector, is a polite live region.
import { $ } from '../lib/dom.js';
import { fillCopy } from './copy.js';

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function formatClock(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `T+${minutes}:${seconds}`;
}

// The Lite / Flight toggle lives in the header in both modes. Its label says what a click does.
export function setModeToggleLabel(mode) {
  const label = $('[data-mode-label]');
  if (label) label.textContent = mode === 'scene' ? 'Lite' : 'Flight';
}

export function mountHud(stops, copy) {
  const header = $('.site-header');
  const parts = [];
  const add = (parent, node, before = null) => {
    parent.insertBefore(node, before);
    parts.push(node);
    return node;
  };

  const sector = add(header, element('span', 'hud-sector mono'), $('nav', header));
  sector.setAttribute('aria-hidden', 'true');
  const clock = add(header, element('span', 'hud-clock mono', 'T+00:00'), $('nav', header));
  clock.setAttribute('aria-hidden', 'true');
  // The hull is a flavour gauge for the flight. Its tooltip says so.
  const hull = add(header, element('span', 'hud-hull mono'), $('nav', header));
  hull.setAttribute('aria-hidden', 'true');
  hull.title = copy['hull-note'] ?? '';

  // Hazard alerts. Decorative: they repeat what the scene shows, and the page text is the content.
  const alert = add(document.body, element('p', 'hud-alert mono'));
  alert.setAttribute('aria-hidden', 'true');
  alert.hidden = true;

  // Corner brackets. Nothing else is drawn on top of the page.
  const frame = add(document.body, element('div', 'hud-frame'));
  frame.setAttribute('aria-hidden', 'true');
  for (const corner of ['tl', 'tr', 'bl', 'br'])
    frame.append(element('span', `hud-frame__${corner}`));

  // Flight path: a line with one dot per mission and a marker for where you are.
  const path = add(document.body, element('nav', 'hud-path'));
  path.setAttribute('aria-label', 'Flight path');
  const line = element('ol', 'hud-path__line');
  path.append(line);
  const lastIndex = Math.max(1, stops.length - 1);
  stops.forEach((stop, index) => {
    if (!stop.isMission) return;
    const item = element('li', 'hud-path__stop');
    item.style.left = `${(index / lastIndex) * 100}%`;
    const link = element('a', 'hud-path__link');
    link.href = `#${stop.id}`;
    link.setAttribute('aria-label', `Fly to ${stop.name}`);
    link.append(element('span', 'hud-path__dot'));
    item.append(link);
    line.append(item);
  });
  const marker = element('span', 'hud-path__marker');
  marker.setAttribute('aria-hidden', 'true');
  path.append(marker);

  const live = add(document.body, element('p', 'visually-hidden'));
  live.setAttribute('aria-live', 'polite');

  let elapsed = 0;
  let lastSecond = -1;
  let lastHull = null;
  let lastAlert = '';
  let lastLevel = '';
  let glitching = false;

  function showAlert(hazard, values) {
    const key = hazard.alert?.key;
    const text = key ? fillCopy(copy[key], values) : '';
    const level = hazard.alert?.level ?? '';
    if (text === lastAlert && level === lastLevel) return;
    lastAlert = text;
    lastLevel = level;
    alert.textContent = text;
    alert.dataset.level = level;
    alert.dataset.key = key ?? '';
    alert.hidden = text === '';
  }

  // The hostile signal makes the HUD dim in short steps, about twice a second. Never faster than 3 a second.
  function setGlitch(hazard) {
    const on = hazard.flicker > 0.2 && Math.floor(performance.now() / 450) % 3 === 0;
    if (on === glitching) return;
    glitching = on;
    document.documentElement.classList.toggle('hud-glitch', on);
  }

  return {
    // Called once when the sector changes. Updates the label and the screen reader text.
    setSector(stop) {
      sector.textContent = stop.name;
      live.textContent = `Sector: ${stop.name}`;
    },
    // Called every frame: only touches the DOM when a value changed.
    update({ param, stops: count, dt, hazard, values }) {
      marker.style.left = `${(param / Math.max(1, count - 1)) * 100}%`;
      // Time runs slow near the black hole, so the clock advances by dt times the time scale.
      elapsed += dt * hazard.timeScale;
      const second = Math.floor(elapsed);
      if (second !== lastSecond) {
        lastSecond = second;
        clock.textContent = formatClock(second);
      }
      if (hazard.hull !== lastHull) {
        lastHull = hazard.hull;
        hull.textContent = fillCopy(copy['hull-label'], { hull: hazard.hull });
      }
      showAlert(hazard, values);
      setGlitch(hazard);
    },
    destroy() {
      document.documentElement.classList.remove('hud-glitch');
      for (const node of parts) node.remove();
    },
  };
}
