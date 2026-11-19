// Short messages in the corner of the screen. They announce themselves politely and remove themselves.
import { $ } from '../lib/dom.js';

const SHOW_MS = 4000;

export function showToast(text) {
  const region = $('#toast');
  if (!region) return;
  const message = document.createElement('p');
  message.className = 'toast__message mono';
  message.textContent = text;
  region.append(message);
  setTimeout(() => message.remove(), SHOW_MS);
}
