// Hazard alert text. It lives in index.html (the #hazard-copy block) so every line is edited in
// one place. {n}, {x}, {km} and {hull} are filled in with live values.
import { $$ } from '../lib/dom.js';

export function readCopy() {
  const copy = {};
  for (const el of $$('#hazard-copy [data-copy]')) copy[el.dataset.copy] = el.textContent.trim();
  return copy;
}

export function fillCopy(template, values) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}
