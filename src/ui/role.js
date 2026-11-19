// The role chooser. It remembers the choice and only changes what opens first:
// Recruiter opens the Briefing, Engineer opens every flight recorder, Curious changes nothing.
import { $, $$ } from '../lib/dom.js';
import { readSetting, writeSetting } from '../core/store.js';
import { toggleBriefing } from './briefing.js';

const ROLES = ['recruiter', 'engineer', 'curious'];

export function applyRole(role, { opening = false } = {}) {
  document.documentElement.dataset.role = role;
  if (role === 'engineer') {
    for (const recorder of $$('[data-recorder]')) recorder.open = true;
  }
  // The Briefing only pops open at the moment of choosing, never on a later visit.
  if (role === 'recruiter' && opening) toggleBriefing();
}

export function savedRole() {
  const value = readSetting('role');
  return ROLES.includes(value) ? value : null;
}

// Resolves once the visitor has chosen or skipped. Skipping counts as "curious".
export function askRole() {
  const dialog = $('#role');
  if (!dialog) return Promise.resolve();
  return new Promise((resolve) => {
    let chosen = 'curious';
    dialog.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-role]') : null;
      if (!button) return;
      chosen = button.dataset.role;
      dialog.close();
    });
    dialog.addEventListener(
      'close',
      () => {
        writeSetting('role', chosen);
        applyRole(chosen, { opening: true });
        resolve();
      },
      { once: true },
    );
    dialog.showModal();
  });
}
