// The Sound toggle. Off by default. The choice is saved, but sound can only start after a click
// or key press, so a saved "on" starts at the first one. The audio itself is in core/audio.js.
import { $ } from '../lib/dom.js';
import { readSetting, writeSetting } from '../core/store.js';

export function initSound(audio) {
  const button = $('[data-sound-toggle]');
  const html = document.documentElement;
  if (!button) return { toggle() {} };
  if (!('AudioContext' in window)) {
    button.remove();
    return { toggle() {} };
  }

  function show() {
    const on = audio.enabled;
    button.setAttribute('aria-pressed', String(on));
    $('[data-sound-label]', button).textContent = on ? 'Sound on' : 'Sound off';
    html.dataset.sound = on ? 'on' : 'off';
  }

  async function turnOn() {
    try {
      await audio.enable();
    } catch {
      // The browser refused. Stay off.
    }
    writeSetting('sound', audio.enabled ? 'on' : 'off');
    show();
  }

  function turnOff() {
    audio.disable();
    writeSetting('sound', 'off');
    show();
  }

  async function toggle() {
    if (audio.enabled) turnOff();
    else await turnOn();
  }

  button.addEventListener('click', toggle);
  show();

  // A saved "on" waits for the first gesture, then starts.
  if (readSetting('sound') === 'on') {
    const start = () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
      turnOn();
    };
    document.addEventListener('pointerdown', start);
    document.addEventListener('keydown', start);
  }

  // A 20 ms click for buttons and links.
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('button, a')) audio.tick();
  });

  return { toggle };
}
