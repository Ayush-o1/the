// M2 BlackWater: a black hole. A dark sphere, a swirling accretion disk, a thin photon ring and a
// second, upright ring that hints at light from the far side of the disk bending over the top.
import {
  Group,
  Mesh,
  SphereGeometry,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  AdditiveBlending,
} from 'three';
import { shaderMaterial, disposeTree } from './util.js';
import { createGlow } from './glow.js';
import ringVertex from '../../shaders/ring.vert.glsl?raw';
import diskFragment from '../../shaders/disk.frag.glsl?raw';

const RADIUS = 7;

function diskMaterial(inner, outer, alpha) {
  return shaderMaterial({
    vertex: ringVertex,
    fragment: diskFragment,
    uniforms: { uInner: { value: inner }, uOuter: { value: outer }, uAlpha: { value: alpha } },
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

export function createBlackWater({ tier }) {
  const group = new Group();
  const detail = tier === 'low' ? 96 : 192;

  const hole = new Mesh(
    new SphereGeometry(RADIUS, 48, 32),
    new MeshBasicMaterial({ color: 0x000000 }),
  );
  group.add(hole);

  const flatMaterial = diskMaterial(RADIUS * 1.5, RADIUS * 4.2, 1);
  const flat = new Mesh(new RingGeometry(RADIUS * 1.5, RADIUS * 4.2, detail, 1), flatMaterial);
  flat.rotation.x = Math.PI / 2 - 0.2;
  flat.rotation.z = 0.15;
  group.add(flat);

  const bentMaterial = diskMaterial(RADIUS * 1.5, RADIUS * 2.4, 0.55);
  const bent = new Mesh(new RingGeometry(RADIUS * 1.5, RADIUS * 2.4, detail, 1), bentMaterial);
  bent.rotation.z = 0.15;
  group.add(bent);

  const photon = new Mesh(
    new RingGeometry(RADIUS * 1.1, RADIUS * 1.14, detail, 1),
    new MeshBasicMaterial({ color: 0xffc27a, side: DoubleSide, transparent: true, opacity: 0.7 }),
  );
  group.add(photon);

  const glow = createGlow({ color: 0xffb454, size: RADIUS * 9, intensity: 0.35 });
  group.add(glow.mesh);

  return {
    group,
    update(time, camera) {
      flatMaterial.uniforms.uTime.value = time;
      bentMaterial.uniforms.uTime.value = time;
      // The photon ring and the upright ring always face the camera, as a lensed ring does.
      photon.quaternion.copy(camera.quaternion);
      bent.quaternion.copy(camera.quaternion);
      glow.face(camera);
    },
    dispose: () => disposeTree(group),
  };
}
