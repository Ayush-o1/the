// The star field: one Points object. Stars fill a long box around the whole route.
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
  const rng = createRng(20261119);
  const positions = new Float32Array(MAX_STARS * 3);
  const colors = new Float32Array(MAX_STARS * 3);
  const sizes = new Float32Array(MAX_STARS);
  const phases = new Float32Array(MAX_STARS);

  for (let i = 0; i < MAX_STARS; i += 1) {
    positions[i * 3] = (rng() - 0.5) * BOX.x;
    positions[i * 3 + 1] = (rng() - 0.5) * BOX.y;
    positions[i * 3 + 2] = BOX.zBack + rng() * (BOX.zFront - BOX.zBack);
    // Mostly warm white, a few amber ones. No blue: the palette is warm.
    const warm = rng() < 0.15;
    colors[i * 3] = 1;
    colors[i * 3 + 1] = warm ? 0.78 : 0.94;
    colors[i * 3 + 2] = warm ? 0.5 : 0.85;
    sizes[i] = 60 + rng() * 140;
    phases[i] = rng() * Math.PI * 2;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
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
    update(time, pixelRatio, viewportHeight) {
      material.uniforms.uTime.value = time;
      material.uniforms.uScale.value = pixelRatio * viewportHeight * 0.5;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
