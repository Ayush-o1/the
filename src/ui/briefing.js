// The Briefing dialog. Its text lives in index.html: the mission list is read from the
// mission articles and the links are copied from the Contact section, so nothing is written twice.
import { $, $$ } from '../lib/dom.js';

const MISSIONS_SHOWN = 3;

function fillMissions(list) {
  for (const mission of $$('[data-mission]').slice(0, MISSIONS_SHOWN)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${mission.id}`;
    link.textContent = $('.dossier__callsign', mission).textContent;
    const summary = document.createElement('p');
    summary.textContent = $('.dossier__objective', mission).textContent.trim().replace(/\s+/g, ' ');
    item.append(link, summary);
    list.append(item);
  }
}

function fillLinks(list) {
  for (const item of $$('[data-contact-links] li')) {
    list.append(item.cloneNode(true));
  }
}

export function initBriefing() {
  const dialog = $('#briefing');
  if (!dialog) return;

  fillMissions($('[data-briefing-missions]', dialog));
  fillLinks($('[data-briefing-links]', dialog));

  // Following a link inside the dialog closes it so the page underneath is visible.
  dialog.addEventListener('click', (event) => {
    const clickedBackdrop = event.target === dialog;
    const clickedLink = event.target instanceof Element && event.target.closest('a[href^="#"]');
    if (clickedBackdrop || clickedLink) dialog.close();
  });

  for (const button of $$('[data-open-dialog="briefing"]')) {
    button.addEventListener('click', () => dialog.showModal());
  }
}

export function toggleBriefing() {
  const dialog = $('#briefing');
  if (!dialog) return;
  if (dialog.open) dialog.close();
  else dialog.showModal();
}
