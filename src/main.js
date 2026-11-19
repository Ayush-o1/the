// Entry point. All content is in index.html, so this file only adds behaviour on top.
// Order matters: the page is readable first, the 3D scene loads afterwards.
import { initBriefing, toggleBriefing } from './ui/briefing.js';
import { initContact } from './ui/contact.js';
import { initKeys } from './core/keys.js';
import { initA11y } from './core/a11y.js';
import { detectEnvironment, decideMode } from './core/capabilities.js';
import { createModeController } from './core/mode.js';
import { readSetting, writeSetting } from './core/store.js';
import { runBoot } from './ui/boot.js';
import { askRole, applyRole, savedRole } from './ui/role.js';
import { mountDebug } from './ui/debug.js';
import { mountSimulations } from './sims/index.js';
import { setModeToggleLabel } from './ui/hud.js';
import { $ } from './lib/dom.js';

// ?tier=low, mid or high pins that tier, for testing. Otherwise it starts on mid and adapts.
const requestedTier = new URLSearchParams(window.location.search).get('tier');
const TIER_PINNED = ['low', 'mid', 'high'].includes(requestedTier);
const START_TIER = TIER_PINNED ? requestedTier : 'mid';

function afterFirstPaint(callback) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

async function firstVisit(env, decision) {
  if (decision.mode === 'scene') await runBoot(env, START_TIER);
  await askRole();
  writeSetting('visited', '1');
}

const env = detectEnvironment();
env.savedLite = readSetting('lite');
const decision = decideMode(env);
const modes = createModeController({ env, startTier: START_TIER, pinTier: TIER_PINNED });

initBriefing();
mountSimulations();
initContact();
initA11y();
initKeys({ b: toggleBriefing, l: () => modes.toggle() });

const toggleButton = $('[data-mode-toggle]');
if (env.webgl2) {
  toggleButton?.addEventListener('click', () => modes.toggle());
} else {
  // Without WebGL 2 there is no flight to go back to.
  toggleButton?.remove();
}

if (decision.mode === 'lite') {
  modes.enterLite(decision.reason);
} else {
  setModeToggleLabel('scene');
  afterFirstPaint(() => modes.enterScene());
}

// Switching to lite when the reduced-motion setting turns on mid-visit.
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
  if (event.matches) modes.enterLite('reduced motion');
});

if (env.debug) mountDebug(modes.getStats, () => modes.current);

if (readSetting('visited') !== '1') {
  firstVisit(env, decision);
} else {
  const role = savedRole();
  if (role) applyRole(role);
}
