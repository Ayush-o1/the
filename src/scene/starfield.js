// The star field: one Points object. Stars fill a long box around the whole route. Most are tiny
// and dim, a few are bright, and each has a colour temperature, so the sky has depth.
import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  AdditiveBlending,
} from 'three';
import { createRng } from '../lib/rng.js';
import vertexShader from '../shaders/star.vert.glsl?raw';
import fragmentShader from '../shaders/star.frag.glsl?raw';

const MAX_STARS = 9000;
const BOX = { x: 900, y: 600, zFront: 200, zBack: -1300 };

export function createStarfield() {
  const rng = createRng(20261121);
  const positions = new Float32Array(MAX_STARS * 3);
  const sizes = new Float32Array(MAX_STARS);
  const mags = new Float32Array(MAX_STARS);
  const temps = new Float32Array(MAX_STARS);
  const phases = new Float32Array(MAX_STARS);

  for (let i = 0; i < MAX_STARS; i += 1) {
    positions[i * 3] = (rng() - 0.5) * BOX.x;
    positions[i * 3 + 1] = (rng() - 0.5) * BOX.y;
    positions[i * 3 + 2] = BOX.zBack + rng() * (BOX.zFront - BOX.zBack);
    // Three classes: many faint pinpricks, some medium, very few bright.
    const roll = rng();
    if (roll > 0.985) {
      sizes[i] = 3 + rng() * 1.6;
      mags[i] = 0.9;
    } else if (roll > 0.85) {
      sizes[i] = 1.6 + rng() * 0.7;
      mags[i] = 0.55 + rng() * 0.2;
    } else {
      sizes[i] = 1;
      mags[i] = 0.18 + rng() * 0.3;
    }
    // Most stars are near neutral. The tails are blue-white and orange.
    temps[i] = Math.min(1, Math.max(0, 0.5 + (rng() + rng() + rng() - 1.5) * 0.7));
    phases[i] = rng() * Math.PI * 2;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aMag', new Float32BufferAttribute(mags, 1));
  geometry.setAttribute('aTemp', new Float32BufferAttribute(temps, 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;

  return {
    object: points,
    // Tiers show fewer stars by drawing only the first N.
    setCount(count) {
      geometry.setDrawRange(0, Math.min(count, MAX_STARS));
    },
    update(time, pixelRatio) {
      material.uniforms.uTime.value = time;
      material.uniforms.uScale.value = pixelRatio;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
