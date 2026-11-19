// Small helpers for building simulation interfaces with plain DOM calls.

// el('button', { class: 'btn', type: 'button' }, 'Label') builds an element. Strings become text nodes.
export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value == null) continue;
    node.setAttribute(name, value === true ? '' : value);
  }
  node.append(...children);
  return node;
}

// Re-rendering replaces the buttons, which would drop keyboard focus. Mark a control with
// data-key, call this around the render, and focus goes back to the same control. If that control
// no longer exists (a status button for the status the incident is now in), focus goes to the
// control named by fallback(key), so keyboard users never get thrown back to the top of the page.
export function keepFocus(root, render, fallback = () => null) {
  const key = document.activeElement?.closest?.('[data-key]')?.dataset.key;
  render();
  if (!key) return;
  const target =
    root.querySelector(`[data-key="${key}"]`) ??
    root.querySelector(`[data-key="${fallback(key)}"]`);
  target?.focus();
}

// Replaces the sim's static fallback with the interactive app. The fallback stays in the HTML for
// visitors without JavaScript.
export function mountInto(simElement, app) {
  simElement.querySelector('.sim__static')?.setAttribute('hidden', '');
  simElement.append(app);
}
