// Decides whether this visit gets the 3D flight ("scene") or the plain page ("lite").
// The page content is the same either way.

function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    // Give the context back at once. The real renderer makes its own.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectEnvironment(win = window) {
  const params = new URLSearchParams(win.location.search);
  return {
    webgl2: hasWebGL2(),
    reducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(navigator.connection?.saveData),
    queryLite: params.get('lite'),
    debug: params.has('debug'),
    savedLite: null,
    touch: win.matchMedia('(pointer: coarse)').matches,
  };
}

// Pure: same input, same answer. Order matters: the explicit choices win over automatic ones.
export function decideMode(env) {
  if (env.queryLite === '1') return { mode: 'lite', reason: 'link asked for lite' };
  if (!env.webgl2) return { mode: 'lite', reason: 'no WebGL 2' };
  if (env.queryLite === '0') return { mode: 'scene', reason: 'link asked for the flight' };
  if (env.savedLite === '1') return { mode: 'lite', reason: 'your saved choice' };
  if (env.reducedMotion) return { mode: 'lite', reason: 'reduced motion' };
  if (env.saveData) return { mode: 'lite', reason: 'data saver' };
  return { mode: 'scene', reason: 'default' };
}
