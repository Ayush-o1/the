// Entry point. All content is in index.html, so this file only adds behaviour on top.
// Order matters: the page is readable first, the 3D scene loads afterwards.
import { initDialogs, toggleDialog, anyDialogOpen } from './ui/dialogs.js';
import { initContact } from './ui/contact.js';
import { initEducation } from './ui/education.js';
import { initSound } from './ui/sound.js';
import { initTabTitle } from './ui/tab-title.js';
import { initDeepLinks, keepHashInView } from './ui/deeplink.js';
import { initKeys } from './core/keys.js';
import { initA11y } from './core/a11y.js';
import { createAudio } from './core/audio.js';
import { detectEnvironment, decideMode } from './core/capabilities.js';
import { createModeController } from './core/mode.js';
import { readSetting, writeSetting } from './core/store.js';
import { runBoot } from './ui/boot.js';
import { mountDebug } from './ui/debug.js';
import { mountSimulations } from './sims/index.js';
import { setModeToggleLabel } from './ui/hud.js';
import { $ } from './lib/dom.js';

// ?tier=low, mid or high pins that tier, for testing. Otherwise it starts on mid and adapts.
const requestedTier = new URLSearchParams(window.location.search).get('tier');
const TIER_PINNED = ['low', 'mid', 'high'].includes(requestedTier);
// Phones start on the low tier: no post-processing, pixel ratio 1. The tier monitor can still
// move it up if frames come easily.
const SMALL_DEVICE = window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768;
const START_TIER = TIER_PINNED ? requestedTier : SMALL_DEVICE ? 'low' : 'mid';

function afterFirstPaint(callback) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

const env = detectEnvironment();
env.savedLite = readSetting('lite');
const decision = decideMode(env);

// Sound follows the flight: the thrust hiss follows scroll speed.
const audio = createAudio();
const modes = createModeController({
  env,
  startTier: START_TIER,
  pinTier: TIER_PINNED,
  onFrame: ({ thrust }) => audio.setThrust(thrust),
});
const sound = initSound(audio);

initDialogs();
keepHashInView(mountSimulations());
initContact();
initEducation();
initA11y();
initTabTitle();
initDeepLinks();

// Shortcuts do nothing while a dialog is open, so typing and reading are never interrupted.
const guarded = (action) => () => {
  if (!anyDialogOpen()) action();
};
initKeys({
  m: guarded(() => toggleDialog('menu')),
  s: guarded(() => sound.toggle()),
});

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
  const first = decision.mode === 'scene' ? runBoot(env, START_TIER) : Promise.resolve();
  first.then(() => writeSetting('visited', '1'));
}
