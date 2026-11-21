// M6 Europa: a cracked ice moon with Jupiter huge and banded behind it.
import {
  Group,
  Mesh,
  SphereGeometry,
  Color,
  Line,
  LineDashedMaterial,
  LineBasicMaterial,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { shaderMaterial, disposeTree } from './util.js';
import iceFragment from '../../shaders/ice.frag.glsl?raw';
import gasFragment from '../../shaders/gasgiant.frag.glsl?raw';
import rings from '../../shaders/rings.glsl?raw';
import { EMPTY_MAP } from '../maps.js';

const MOON_RADIUS = 7;
const JUPITER_RADIUS = 60;
const JUPITER_POSITION = [30, 22, -110];

// A piece of debris crosses Europa's orbit on a straight track. Position and velocity are
// relative to the moon.
export const DEBRIS = { position: [-18, 11.6, 3], velocity: [1, 0, 0] };
// The debris travels this many units across the whole pass (local progress -0.5 to 0.5).
const TRACK_LENGTH = 36;

function orbitArc(moon, jupiter) {
  // Points on the circle around Jupiter that passes through the moon, a short arc either side of it.
  const radial = new Vector3(...moon).sub(new Vector3(...jupiter));
  const points = [];
  for (let step = -12; step <= 12; step += 1) {
    const angle = step * 0.012;
    const rotated = radial.clone().applyAxisAngle(new Vector3(0, 1, 0), angle);
    points.push(...rotated.add(new Vector3(...jupiter)).toArray());
  }
  return points;
}

export function createEuropa({ tier }) {
  const group = new Group();
  const segments = tier === 'low' ? [48, 32] : [96, 64];

  const moonMaterial = shaderMaterial({
    fragment: iceFragment,
    uniforms: { uMaps: { value: 0 }, uMap: { value: EMPTY_MAP } },
  });
  const moon = new Mesh(new SphereGeometry(MOON_RADIUS, ...segments), moonMaterial);
  group.add(moon);

  // Jupiter has no ring worth drawing at this distance: the ring inputs are switched off.
  const jupiterMaterial = shaderMaterial({
    fragment: `${rings}\n${gasFragment}`,
    uniforms: {
      uColA: { value: new Color(0x9c7a55) },
      uColB: { value: new Color(0xe3d3b8) },
      uColC: { value: new Color(0x6a4630) },
      uSeed: { value: 9.0 },
      uMaps: { value: 0 },
      uMap: { value: EMPTY_MAP },
      uRingNormal: { value: new Vector3(0, 1, 0) },
      uRingInner: { value: 0 },
      uRingOuter: { value: 0 },
      uCenter: { value: new Vector3() },
    },
  });
  const jupiter = new Mesh(new SphereGeometry(JUPITER_RADIUS, 96, 64), jupiterMaterial);
  // Behind and to the side, so the moon sits in front of the big planet's edge.
  jupiter.position.set(30, 22, -110);
  group.add(jupiter);

  // The orbit arc, the debris track (dashed) and the debris itself.
  const arcGeometry = new BufferGeometry();
  arcGeometry.setAttribute(
    'position',
    new Float32BufferAttribute(orbitArc([0, 0, 0], JUPITER_POSITION), 3),
  );
  const arcMaterial = new LineBasicMaterial({ color: 0xede7da, transparent: true, opacity: 0.22 });
  group.add(new Line(arcGeometry, arcMaterial));

  const [px, py, pz] = DEBRIS.position;
  const trackGeometry = new BufferGeometry();
  trackGeometry.setAttribute(
    'position',
    new Float32BufferAttribute([px, py, pz, px + TRACK_LENGTH, py, pz], 3),
  );
  const trackMaterial = new LineDashedMaterial({
    color: 0xff5a3c,
    dashSize: 1.2,
    gapSize: 0.9,
    transparent: true,
    opacity: 0.5,
  });
  const track = new Line(trackGeometry, trackMaterial);
  track.computeLineDistances();
  group.add(track);

  // The debris: a small tumbling fragment of a craft, foil on one face, bare metal on the rest.
  const debrisGeometry = new RoundedBoxGeometry(1.1, 0.45, 0.7, 2, 0.08);
  const debrisMaterial = new MeshStandardMaterial({
    color: 0xc79a4c,
    metalness: 0.9,
    roughness: 0.32,
  });
  const debris = new Mesh(debrisGeometry, debrisMaterial);
  group.add(debris);

  const arrived = new Set();
  let fadeStart = null;

  return {
    group,
    maps: tier === 'low' ? [] : ['europa', 'jupiter'],
    setMap(name, texture) {
      if (name === 'europa') moonMaterial.uniforms.uMap.value = texture;
      if (name === 'jupiter') jupiterMaterial.uniforms.uMap.value = texture;
      arrived.add(name);
      if (arrived.size === 2) fadeStart = -1;
    },
    update(time, camera, local) {
      if (fadeStart === -1) fadeStart = time;
      if (fadeStart !== null) {
        const k = Math.min(1, (time - fadeStart) / 0.9);
        moonMaterial.uniforms.uMaps.value = jupiterMaterial.uniforms.uMaps.value =
          k * k * (3 - 2 * k);
        if (k >= 1) fadeStart = null;
      }
      // The debris slides along its track as the probe passes: local progress -0.5 to 0.5 maps to the whole track.
      const along = Math.min(1, Math.max(0, local + 0.5));
      debris.position.set(px + along * TRACK_LENGTH, py, pz);
      debris.rotation.set(time * 1.3, time * 0.9, 0);
      jupiterMaterial.uniforms.uTime.value = time;
      moon.rotation.y = time * 0.015;
      jupiter.rotation.y = time * 0.004;
    },
    dispose: () => disposeTree(group),
  };
}
