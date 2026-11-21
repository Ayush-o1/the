// Textures for the probe, made in code when the scene starts (nothing is downloaded).
// - Crinkled foil: a normal map of small flat facets at random tilts, the way a thermal blanket
//   is creased all over, so its reflections break into many small glints.
// - Solar cells: a grid of dark cells with thin silver lines and a pale frame.
// - The AK-01 plate and the radiator's mirror tiles.
import {
  CanvasTexture,
  DataTexture,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  LinearMipmapLinearFilter,
  LinearFilter,
} from 'three';
import { createRng } from '../lib/rng.js';

// A normal map of jittered-grid Voronoi facets. Each facet is a small plane with its own tilt;
// thin creases run along the facet borders.
export function foilNormalMap(size = 256, cells = 18, seed = 7) {
  const rng = createRng(seed);
  const points = [];
  const tilts = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      points.push([(x + 0.15 + rng() * 0.7) / cells, (y + 0.15 + rng() * 0.7) / cells]);
      tilts.push([(rng() - 0.5) * 0.9, (rng() - 0.5) * 0.9]);
    }
  }
  const data = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const u = (px + 0.5) / size;
      const v = (py + 0.5) / size;
      const cx = Math.floor(u * cells);
      const cy = Math.floor(v * cells);
      let best = Infinity;
      let second = Infinity;
      let bestIndex = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          // Wrap so the map tiles without a seam.
          const gx = (cx + ox + cells) % cells;
          const gy = (cy + oy + cells) % cells;
          const index = gy * cells + gx;
          const [qx, qy] = points[index];
          // (cx + ox - gx) is 0, or one whole tile when the neighbour wrapped round.
          const dx = qx - u + (cx + ox - gx) / cells;
          const dy = qy - v + (cy + oy - gy) / cells;
          const d = dx * dx + dy * dy;
          if (d < best) {
            second = best;
            best = d;
            bestIndex = index;
          } else if (d < second) {
            second = d;
          }
        }
      }
      let [nx, ny] = tilts[bestIndex];
      // A crease where two facets meet: a short, sharp ridge.
      const edge = Math.sqrt(second) - Math.sqrt(best);
      const crease = Math.max(0, 1 - edge * cells * 6);
      nx *= 1 - crease * 0.5;
      ny += crease * 0.35;
      const length = Math.hypot(nx, ny, 1);
      const offset = (py * size + px) * 4;
      data[offset] = Math.round(((nx / length) * 0.5 + 0.5) * 255);
      data[offset + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255);
      data[offset + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
      data[offset + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return [element, element.getContext('2d')];
}

function finish(element, anisotropy) {
  const texture = new CanvasTexture(element);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

// One array panel: columns x rows of cells, each a slightly different dark blue, with silver
// bus lines across every cell and a pale frame around the whole panel.
export function solarCellMap(anisotropy, columns = 12, rows = 8, seed = 3) {
  const rng = createRng(seed);
  const [element, g] = canvas(1024, 512);
  const frame = 14;
  g.fillStyle = '#b9bcc0';
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#1b1f27';
  g.fillRect(frame - 4, frame - 4, 1024 - 2 * frame + 8, 512 - 2 * frame + 8);
  const cw = (1024 - 2 * frame) / columns;
  const ch = (512 - 2 * frame) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const shade = rng() * 10;
      g.fillStyle = `rgb(${14 + shade}, ${24 + shade}, ${52 + shade * 1.6})`;
      const x = frame + c * cw + 2;
      const y = frame + r * ch + 2;
      g.fillRect(x, y, cw - 4, ch - 4);
      // Two thin silver bus lines across each cell.
      g.fillStyle = 'rgba(170, 176, 186, 0.55)';
      g.fillRect(x, y + (ch - 4) * 0.33, cw - 4, 1.5);
      g.fillRect(x, y + (ch - 4) * 0.66, cw - 4, 1.5);
    }
  }
  return finish(element, anisotropy);
}

// The back of a panel: a pale composite sheet with the faint pattern of the structure behind it.
export function panelBackMap(anisotropy) {
  const [element, g] = canvas(256, 128);
  g.fillStyle = '#c9c6bd';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(90, 90, 86, 0.35)';
  g.lineWidth = 2;
  for (let x = 32; x < 256; x += 32) {
    g.beginPath();
    g.moveTo(x, 6);
    g.lineTo(x, 122);
    g.stroke();
  }
  g.strokeRect(4, 4, 248, 120);
  return finish(element, anisotropy);
}

// Radiator: a grid of small mirror tiles. Used as a map on a near-mirror material.
export function radiatorMap(anisotropy) {
  const [element, g] = canvas(256, 256);
  g.fillStyle = '#5c6066';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const tone = 214 + ((x * 7 + y * 13) % 5) * 6;
      g.fillStyle = `rgb(${tone}, ${tone + 2}, ${tone + 6})`;
      g.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
    }
  }
  return finish(element, anisotropy);
}

// The name plate: AK-01 in black on white, with a thin signal-orange stripe.
export function markingMap(anisotropy) {
  const [element, g] = canvas(512, 192);
  g.fillStyle = '#e9e6de';
  g.fillRect(0, 0, 512, 192);
  g.fillStyle = '#ff6a3d';
  g.fillRect(0, 150, 512, 14);
  g.fillStyle = '#15171b';
  g.font = '600 104px "Geist Mono", ui-monospace, monospace';
  g.textBaseline = 'middle';
  g.fillText('AK-01', 34, 82);
  return finish(element, anisotropy);
}

// Blanket seams: the colour under the foil. Mostly white (the foil keeps its own colour) with a
// few darker taped seams and a slightly mottled tone, so a face does not read as one flat sheet.
export function foilSeamMap(anisotropy, seed = 11) {
  const rng = createRng(seed);
  const [element, g] = canvas(512, 512);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i += 1) {
    const tone = 225 + Math.floor(rng() * 30);
    g.fillStyle = `rgba(${tone}, ${tone}, ${tone}, 0.5)`;
    g.fillRect(rng() * 512, rng() * 512, 40 + rng() * 140, 30 + rng() * 120);
  }
  g.fillStyle = 'rgba(70, 60, 45, 0.55)';
  for (const x of [128, 384]) g.fillRect(x - 3, 0, 6, 512);
  for (const y of [170, 340]) g.fillRect(0, y - 3, 512, 6);
  return finish(element, anisotropy);
}
