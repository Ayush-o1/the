// Entry point. All content is in index.html, so this file only adds behaviour on top.
// Order matters: the page is readable first, the 3D scene loads afterwards.
import { initBriefing } from './ui/briefing.js';
import { initDialogs, toggleDialog, anyDialogOpen } from './ui/dialogs.js';
import { initMap } from './ui/map.js';
import { initConsole } from './ui/console.js';
import { initContact } from './ui/contact.js';
import { initGithub } from './ui/github.js';
import { initSound } from './ui/sound.js';
import { initTabTitle, initKonami, moveMission } from './ui/extras.js';
import { initDeepLinks, keepHashInView } from './ui/deeplink.js';
import { initKeys } from './core/keys.js';
import { initA11y } from './core/a11y.js';
import { createAudio } from './core/audio.js';
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

// Sound follows the flight: the thrust hiss follows scroll speed and each hazard sounds an alarm once.
const audio = createAudio();
const alarmed = new Set();
function onFrame({ thrust, hazard }) {
  audio.setThrust(thrust);
  const key = hazard.alert?.key;
  if (hazard.alert?.level === 'hazard' && !alarmed.has(key)) {
    alarmed.add(key);
    audio.alarm();
  }
}

const modes = createModeController({ env, startTier: START_TIER, pinTier: TIER_PINNED, onFrame });
const sound = initSound(audio);

initBriefing();
initMap();
initConsole();
initDialogs();
keepHashInView(mountSimulations());
initContact();
initA11y();
initTabTitle();
initKonami(() => modes.barrelRoll());
initDeepLinks();
initGithub();

// Shortcuts do nothing while a dialog is open, so typing and reading are never interrupted.
const guarded = (action) => () => {
  if (!anyDialogOpen()) action();
};
initKeys({
  b: guarded(() => toggleDialog('briefing')),
  m: guarded(() => toggleDialog('map')),
  '`': guarded(() => toggleDialog('console')),
  j: guarded(() => moveMission(1)),
  k: guarded(() => moveMission(-1)),
  l: guarded(() => modes.toggle()),
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
  firstVisit(env, decision);
} else {
  const role = savedRole();
  if (role) applyRole(role);
}
