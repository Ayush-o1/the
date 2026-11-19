// Keyboard shortcuts. Single keys are ignored while the user is typing or holding a modifier.
import { isTyping } from '../lib/dom.js';

export function initKeys(shortcuts) {
  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event.target)) return;
    const action = shortcuts[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    action();
  });
}
