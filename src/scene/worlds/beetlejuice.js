// M3 BeetleJuice: a red supergiant. Two streams of dots, the ledger and the settlement, fall toward it.
// Dots that do not match glow brighter.
import {
  Group,
  Mesh,
  SphereGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  AdditiveBlending,
  BackSide,
  Color,
} from 'three';
import { shaderMaterial, disposeTree } from './util.js';
import { createGlow } from './glow.js';
import { createRng } from '../../lib/rng.js';
import sunFragment from '../../shaders/sun.frag.glsl?raw';
import streamVertex from '../../shaders/stream.vert.glsl?raw';
import streamFragment from '../../shaders/stream.frag.glsl?raw';
import shellVertex from '../../shaders/shell.vert.glsl?raw';
import shellFragment from '../../shaders/shell.frag.glsl?raw';

const RADIUS = 16;
const DOTS = { high: 160, mid: 110, low: 60 };

function buildStreams(count) {
  const rng = createRng(4242);
  const starts = new Float32Array(count * 3);
  const kinds = new Float32Array(count);
  const mismatches = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const kind = i % 2;
    // The two streams come from opposite sides, spread out like two ribbons.
    const side = kind === 0 ? -1 : 1;
    starts[i * 3] = side * (70 + rng() * 30);
    starts[i * 3 + 1] = (rng() - 0.5) * 36;
    starts[i * 3 + 2] = (rng() - 0.5) * 50;
    kinds[i] = kind;
    mismatches[i] = i % 11 === 0 ? 1 : 0;
    phases[i] = rng();
  }
  return { starts, kinds, mismatches, phases };
}

export function createBeetleJuice({ tier }) {
  const group = new Group();

  const starMaterial = shaderMaterial({ fragment: sunFragment });
  group.add(new Mesh(new SphereGeometry(RADIUS, 96, 64), starMaterial));

  // A fresnel shell: bright at the edge, so the star looks like it is burning into the dark.
  const shellMaterial = new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    uniforms: { uColor: { value: new Color(0xff5a2a) } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
  });
  group.add(new Mesh(new SphereGeometry(RADIUS * 1.18, 48, 32), shellMaterial));

  const streams = buildStreams(DOTS[tier]);
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(new Float32Array(DOTS[tier] * 3), 3),
  );
  geometry.setAttribute('aStart', new Float32BufferAttribute(streams.starts, 3));
  geometry.setAttribute('aKind', new Float32BufferAttribute(streams.kinds, 1));
  geometry.setAttribute('aMismatch', new Float32BufferAttribute(streams.mismatches, 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(streams.phases, 1));
  const streamMaterial = new ShaderMaterial({
    vertexShader: streamVertex,
    fragmentShader: streamFragment,
    uniforms: { uTime: { value: 0 }, uStarRadius: { value: RADIUS } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const dots = new Points(geometry, streamMaterial);
  dots.frustumCulled = false;
  group.add(dots);

  const flare = createGlow({ color: 0xff7a3c, size: RADIUS * 7, intensity: 0.55, streaks: 0.5 });
  group.add(flare.mesh);

  return {
    group,
    update(time, camera) {
      starMaterial.uniforms.uTime.value = time;
      streamMaterial.uniforms.uTime.value = time;
      flare.face(camera);
    },
    dispose: () => disposeTree(group),
  };
}
