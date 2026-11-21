// M6 Europa: a cracked ice moon with Jupiter huge and banded behind it.
import {
  Group,
  Mesh,
  SphereGeometry,
  OctahedronGeometry,
  Color,
  Line,
  LineDashedMaterial,
  LineBasicMaterial,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three';
import { shaderMaterial, SUN_DIRECTION, disposeTree } from './util.js';
import iceFragment from '../../shaders/ice.frag.glsl?raw';
import gasFragment from '../../shaders/gasgiant.frag.glsl?raw';

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

  const moon = new Mesh(
    new SphereGeometry(MOON_RADIUS, ...segments),
    shaderMaterial({ fragment: iceFragment, uniforms: { uSunDir: { value: SUN_DIRECTION } } }),
  );
  group.add(moon);

  const jupiterMaterial = shaderMaterial({
    fragment: gasFragment,
    uniforms: {
      uSunDir: { value: SUN_DIRECTION },
      uColA: { value: new Color(0x7a5a38) },
      uColB: { value: new Color(0xc9a878) },
      uColC: { value: new Color(0x5a3a28) },
      uSeed: { value: 9.0 },
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
  const arcMaterial = new LineBasicMaterial({ color: 0xede7da, transparent: true, opacity: 0.35 });
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
    opacity: 0.8,
  });
  const track = new Line(trackGeometry, trackMaterial);
  track.computeLineDistances();
  group.add(track);

  const debrisGeometry = new OctahedronGeometry(0.7, 0);
  const debrisMaterial = new MeshStandardMaterial({
    color: 0xc9c4b8,
    metalness: 0.6,
    roughness: 0.5,
    emissive: 0x331108,
  });
  const debris = new Mesh(debrisGeometry, debrisMaterial);
  group.add(debris);

  return {
    group,
    update(time, camera, local) {
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
