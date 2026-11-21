// Decides whether this visit gets the 3D flight ("scene") or the plain page ("lite").
// The page content is the same either way.

// A renderer that draws on the CPU instead of a graphics card (no GPU, a blocked driver, some
// virtual machines). The flight needs seconds to compile its shaders there and then runs at a
// few frames per second, so such browsers start on the plain page.
export function isSoftwareRenderer(name = '') {
  return /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(name);
}

function probeWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { webgl2: false, softwareGL: false };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    // Give the context back at once. The real renderer makes its own.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, softwareGL: isSoftwareRenderer(String(name)) };
  } catch {
    return { webgl2: false, softwareGL: false };
  }
}

export function detectEnvironment(win = window) {
  const params = new URLSearchParams(win.location.search);
  const gl = probeWebGL2();
  return {
    webgl2: gl.webgl2,
    softwareGL: gl.softwareGL,
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
  // A visitor who chose the flight with the toggle (saved as '0') keeps it, even in software.
  if (env.softwareGL && env.savedLite !== '0') return { mode: 'lite', reason: 'software graphics' };
  return { mode: 'scene', reason: 'default' };
}
