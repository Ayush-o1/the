// Small saved settings. Every read and write is wrapped because storage can be blocked
// (private windows, cleared site data). The site must work the same without it.
const memory = new Map();

export function readSetting(key) {
  try {
    const value = window.localStorage.getItem(`ak-${key}`);
    return value ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writeSetting(key, value) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(`ak-${key}`, value);
  } catch {
    // Storage is blocked. The in-memory copy keeps the choice for this visit.
  }
}
