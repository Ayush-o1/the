// Planet maps from NASA and USGS (sources and licences: README). They are not needed to read the
// page or to fly: every world has a procedural surface that works without them. They load after
// the scene has started, decode off the main thread, and each world cross-fades to its map when
// it arrives. Slow connections, Save-Data and the low tier never fetch them.
import { ImageBitmapLoader, Texture, SRGBColorSpace, NoColorSpace } from 'three';

const FILES = {
  earthDay: { url: new URL('../assets/tex/earth-day.webp', import.meta.url).href, color: true },
  earthNight: { url: new URL('../assets/tex/earth-night.webp', import.meta.url).href },
  earthClouds: { url: new URL('../assets/tex/earth-clouds.webp', import.meta.url).href },
  mars: { url: new URL('../assets/tex/mars.webp', import.meta.url).href, color: true },
  europa: { url: new URL('../assets/tex/europa.webp', import.meta.url).href, color: true },
  jupiter: { url: new URL('../assets/tex/jupiter.webp', import.meta.url).href, color: true },
};

// The placeholder every map uniform holds until the real map arrives, so the shaders compile once.
export const EMPTY_MAP = new Texture();

export function mapsAllowed(tier) {
  if (tier === 'low') return false;
  if (typeof createImageBitmap !== 'function') return false;
  const connection = navigator.connection;
  if (connection?.saveData) return false;
  if (/(^|-)2g|3g/.test(connection?.effectiveType ?? '')) return false;
  return true;
}

// Loads one map. Resolves with a texture, or null if it could not be loaded (the world then keeps
// its procedural surface).
function loadOne(name, anisotropy) {
  const file = FILES[name];
  const loader = new ImageBitmapLoader();
  // ImageBitmaps cannot be flipped on upload, so they are flipped while decoding.
  loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
  return new Promise((resolve) => {
    loader.load(
      file.url,
      (bitmap) => {
        const texture = new Texture(bitmap);
        texture.flipY = false;
        texture.colorSpace = file.color ? SRGBColorSpace : NoColorSpace;
        texture.anisotropy = anisotropy;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      () => resolve(null),
    );
  });
}

// Loads the named maps one after another (the biggest first), and calls onMap(name, texture) for
// each as it arrives. Uploading to the GPU happens in initTexture, one map per call, so no single
// frame takes all the upload work.
export async function loadMaps({ renderer, names, onMap, isStopped }) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  for (const name of names) {
    if (isStopped()) return;
    const texture = await loadOne(name, anisotropy);
    if (!texture || isStopped()) continue;
    renderer.initTexture(texture);
    onMap(name, texture);
  }
}
