// Behaviour shared by every dialog: open it from a button, close it with the backdrop or by
// following a link inside it. Esc and focus handling come from the native <dialog>.
import { $, $$ } from '../lib/dom.js';

export function openDialog(id) {
  const dialog = $(`#${id}`);
  if (dialog && !dialog.open) dialog.showModal();
}

export function toggleDialog(id) {
  const dialog = $(`#${id}`);
  if (!dialog) return;
  if (dialog.open) dialog.close();
  else dialog.showModal();
}

export function anyDialogOpen() {
  return $$('dialog').some((dialog) => dialog.open);
}

export function initDialogs() {
  for (const dialog of $$('dialog.panel')) {
    // The role chooser is a question, not a menu: only its own buttons close it.
    if (dialog.id === 'role') continue;
    dialog.addEventListener('click', (event) => {
      const clickedBackdrop = event.target === dialog;
      const clickedLink = event.target instanceof Element && event.target.closest('a[href^="#"]');
      if (clickedBackdrop || clickedLink) dialog.close();
    });
  }
  for (const button of $$('[data-open-dialog]')) {
    button.addEventListener('click', () => openDialog(button.dataset.openDialog));
  }
}
