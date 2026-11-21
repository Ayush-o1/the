// Adds a CGPA line to the Education section when the config says it may be shown.
import { config } from '../config.js';
import { $ } from '../lib/dom.js';

export function initEducation() {
  const line = $('[data-cgpa]');
  if (!line || !config.showCgpa || !config.cgpa) return;
  line.textContent = `CGPA ${config.cgpa}.`;
  line.hidden = false;
}
