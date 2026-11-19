// The mission console: a tiny command line in a dialog. Opened with the backtick key.
// The commands themselves are in core/commands.js. This file reads the page facts they need
// and carries out the actions they ask for.
import { $, $$ } from '../lib/dom.js';
import { runCommand } from '../core/commands.js';

function readContext() {
  const missions = $$('[data-mission]').map((el) => ({
    id: el.id,
    name: $('.dossier__callsign', el).textContent.trim(),
    status: $('.chip', el).textContent.trim(),
  }));
  const counts = new Map();
  for (const tag of $$('[data-mission] .tags .tag')) {
    const name = tag.textContent.trim();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const stackCounts = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const about = `${$('#hero-title').textContent.trim()}. ${$('.hero__eyebrow').textContent.trim().replace(/\s+/g, ' ')}. ${$('.hero .chip').textContent.trim()}.`;
  return {
    missions,
    stackCounts,
    about,
    hasResume: Boolean($('a[href$="resume.pdf"]')),
    uptimeSeconds: performance.now() / 1000,
  };
}

export function initConsole() {
  const dialog = $('#console');
  if (!dialog) return;
  const form = $('.console__form', dialog);
  const input = $('input', dialog);
  const log = $('[data-console-log]', dialog);
  const history = [];
  let cursor = 0;

  function print(text, className = '') {
    const line = document.createElement('li');
    line.textContent = text;
    if (className) line.className = className;
    log.append(line);
    log.scrollTop = log.scrollHeight;
  }

  function carryOut(action) {
    if (!action) return;
    dialog.close();
    if (action.type === 'goto') window.location.hash = action.id;
    if (action.type === 'resume') window.location.href = './resume.pdf';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    history.push(text);
    cursor = history.length;
    print(`> ${text}`, 'console__echo');
    const result = runCommand(text, readContext());
    for (const line of result.lines) print(line);
    input.value = '';
    carryOut(result.action);
  });

  // Up and down arrows walk back through earlier commands.
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    cursor = Math.min(history.length, Math.max(0, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
    input.value = history[cursor] ?? '';
  });

  dialog.addEventListener('close', () => {
    input.value = '';
  });
  // Typing starts at once when the dialog opens.
  new MutationObserver(() => {
    if (dialog.open) input.focus();
  }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
