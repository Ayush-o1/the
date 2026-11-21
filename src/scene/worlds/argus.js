// M1 Argus: a banded, ringed gas giant with a swarm of small satellites.
// Thin lines link neighbouring satellites into a graph, and one node is red.
import {
  Group,
  Mesh,
  SphereGeometry,
  RingGeometry,
  DoubleSide,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  LineSegments,
  LineBasicMaterial,
  Color,
  AdditiveBlending,
  Vector3,
  Quaternion,
} from 'three';
import { shaderMaterial, disposeTree } from './util.js';
import { createRng } from '../../lib/rng.js';
import ringVertex from '../../shaders/ring.vert.glsl?raw';
import ringFragment from '../../shaders/ring.frag.glsl?raw';
import gasFragment from '../../shaders/gasgiant.frag.glsl?raw';
import rings from '../../shaders/rings.glsl?raw';
import { EMPTY_MAP } from '../maps.js';
import satelliteVertex from '../../shaders/satellite.vert.glsl?raw';
import satelliteFragment from '../../shaders/satellite.frag.glsl?raw';

const RADIUS = 11;
const SATELLITES = { high: 36, mid: 26, low: 14 };
const RED_NODE = 7;
const Y_AXIS = new Vector3(0, 1, 0);

function buildSatellites(count) {
  const rng = createRng(1111);
  return Array.from({ length: count }, () => ({
    radius: RADIUS * (1.7 + rng() * 1.1),
    tilt: (rng() - 0.5) * 1.2,
    phase: rng() * Math.PI * 2,
    speed: (0.05 + rng() * 0.08) * (rng() < 0.5 ? 1 : -1),
  }));
}

function satellitePosition(sat, time, out, offset) {
  const angle = sat.phase + time * sat.speed;
  const x = Math.cos(angle) * sat.radius;
  const z = Math.sin(angle) * sat.radius;
  out[offset] = x;
  out[offset + 1] = z * Math.sin(sat.tilt);
  out[offset + 2] = z * Math.cos(sat.tilt);
}

export function createArgus({ tier }) {
  const group = new Group();
  const count = SATELLITES[tier];
  const sats = buildSatellites(count);

  // The planet and its ring share these, so each can shade the other.
  const center = new Vector3();
  const ringNormal = new Vector3(0, 0, 1);
  const inner = RADIUS * 1.32;
  const outer = RADIUS * 2.25;

  const planetMaterial = shaderMaterial({
    fragment: `${rings}\n${gasFragment}`,
    uniforms: {
      uColA: { value: new Color(0xbfa577) },
      uColB: { value: new Color(0xe6d8b6) },
      uColC: { value: new Color(0x8a7048) },
      uSeed: { value: 3.0 },
      uMaps: { value: 0 },
      uMap: { value: EMPTY_MAP },
      uRingNormal: { value: ringNormal },
      uRingInner: { value: inner },
      uRingOuter: { value: outer },
      uCenter: { value: center },
    },
  });
  const planet = new Mesh(new SphereGeometry(RADIUS, 96, 64), planetMaterial);
  group.add(planet);

  const ringMaterial = shaderMaterial({
    vertex: ringVertex,
    fragment: `${rings}\n${ringFragment}`,
    uniforms: {
      uInner: { value: inner },
      uOuter: { value: outer },
      uColor: { value: new Color(0xd9caa4) },
      uCenter: { value: center },
      uPlanetRadius: { value: RADIUS },
      uRingNormal: { value: ringNormal },
    },
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
  });
  const ring = new Mesh(new RingGeometry(inner, outer, 256, 1), ringMaterial);
  ring.rotation.x = Math.PI / 2 - 0.28;
  ring.rotation.z = -0.25;
  group.add(ring);
  // The planet spins about the ring's axis, so its bands run parallel to the ring.
  ring.updateMatrix();
  const axis = new Vector3(0, 0, 1).applyQuaternion(ring.quaternion);
  const tilt = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis);
  const spin = new Quaternion();

  // Satellites are points. Their positions are computed on the CPU because the lines need them too.
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const warm = new Color(0xede7da);
  const alert = new Color(0xff5a3c);
  sats.forEach((_, i) => {
    const color = i === RED_NODE ? alert : warm;
    colors.set([color.r, color.g, color.b], i * 3);
    sizes[i] = i === RED_NODE ? 120 : 70;
  });
  const pointGeometry = new BufferGeometry();
  pointGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  pointGeometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
  pointGeometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
  const pointMaterial = new ShaderMaterial({
    vertexShader: satelliteVertex,
    fragmentShader: satelliteFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(pointGeometry, pointMaterial);
  points.frustumCulled = false;
  group.add(points);

  // Lines join each satellite to the next one and to the one three along. Lines touching the red node are red.
  const pairs = [];
  for (let i = 0; i < count; i += 1) pairs.push([i, (i + 1) % count], [i, (i + 3) % count]);
  const linePositions = new Float32Array(pairs.length * 6);
  const lineColors = new Float32Array(pairs.length * 6);
  const dim = new Color(0x6f6a5f);
  pairs.forEach(([a, b], i) => {
    const color = a === RED_NODE || b === RED_NODE ? alert : dim;
    lineColors.set([color.r, color.g, color.b, color.r, color.g, color.b], i * 6);
  });
  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute('position', new Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new Float32BufferAttribute(lineColors, 3));
  const lines = new LineSegments(
    lineGeometry,
    new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  lines.frustumCulled = false;
  group.add(lines);

  return {
    group,
    update(time) {
      planetMaterial.uniforms.uTime.value = time;
      planet.quaternion.copy(tilt).multiply(spin.setFromAxisAngle(Y_AXIS, time * 0.01));
      group.updateMatrixWorld();
      planet.getWorldPosition(center);
      ringNormal.set(0, 0, 1).transformDirection(ring.matrixWorld);
      sats.forEach((sat, i) => satellitePosition(sat, time, positions, i * 3));
      pairs.forEach(([a, b], i) => {
        linePositions.set(positions.subarray(a * 3, a * 3 + 3), i * 6);
        linePositions.set(positions.subarray(b * 3, b * 3 + 3), i * 6 + 3);
      });
      pointGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.position.needsUpdate = true;
    },
    dispose: () => disposeTree(group),
  };
}
