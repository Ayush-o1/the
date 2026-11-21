import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// WCAG 1.4.3: text needs a contrast ratio of at least 4.5 to 1. Colours are read from the design
// tokens, so changing a token that breaks a pairing fails here.
const css = readFileSync('src/styles/tokens.css', 'utf8');

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `token --${name} is missing or not a hex colour`);
  return match[1];
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// Text colour on the surfaces it is actually drawn on.
const TEXT = ['bone', 'bone-2', 'dim', 'signal', 'cold', 'ok'];
const SURFACES = ['ink', 'ink-2', 'ink-3'];

for (const text of TEXT) {
  for (const surface of SURFACES) {
    test(`--${text} on --${surface} reaches 4.5:1`, () => {
      const ratio = contrast(token(text), token(surface));
      assert.ok(ratio >= 4.5, `${text} on ${surface} is ${ratio.toFixed(2)}:1`);
    });
  }
}
