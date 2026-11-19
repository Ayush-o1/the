// Matches the Konami code, one key at a time. A wrong key starts the match over.
// feed() returns true when the key moved the match forward, so the caller can keep that key from
// also triggering a shortcut (the code contains B).
const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function createKonami(onMatch) {
  let position = 0;
  return function feed(key) {
    const normalised = key.length === 1 ? key.toLowerCase() : key;
    let advanced = true;
    if (normalised === SEQUENCE[position]) {
      position += 1;
    } else {
      // The wrong key may itself be the start of a new attempt.
      position = normalised === SEQUENCE[0] ? 1 : 0;
      advanced = position === 1;
    }
    if (position === SEQUENCE.length) {
      position = 0;
      onMatch();
    }
    return advanced;
  };
}
