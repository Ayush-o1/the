// M2 BlackWater: a black hole, traced per pixel (shaders/blackhole.frag.glsl), drawn on a quad that
// always faces the camera, with a faint warm glow around it. The disk is tilted so the camera sees
// it a little from above, the angle at which the lensed far side arches over the shadow.
import {
  Group,
  Mesh,
  PlaneGeometry,
  Vector3,
  Matrix3,
  Matrix4,
  Euler,
  NormalBlending,
} from 'three';
import { shaderMaterial, disposeTree } from './util.js';
import { createGlow } from './glow.js';
import vertex from '../../shaders/atmosphere.vert.glsl?raw';
import fragment from '../../shaders/blackhole.frag.glsl?raw';

// World units per event-horizon radius. The shadow is about 2.6 of these across in radius.
const SCALE = 2.7;
const INNER = 3;
const OUTER = 11;
const STEPS = { high: 90, mid: 70, low: 44 };

export function createBlackWater({ tier }) {
  const group = new Group();
  const center = new Vector3();
  const tilt = new Matrix4().makeRotationFromEuler(new Euler(0.2, 0, 0.16));
  const toLocal = new Matrix3().setFromMatrix4(tilt).transpose();

  const material = shaderMaterial({
    vertex,
    fragment,
    uniforms: {
      uCenter: { value: center },
      uScale: { value: SCALE },
      uToLocal: { value: toLocal },
      uInner: { value: INNER },
      uOuter: { value: OUTER },
    },
    defines: { STEPS: STEPS[tier] ?? 100 },
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    premultipliedAlpha: true,
  });
  const size = OUTER * 1.3 * SCALE * 2;
  const quad = new Mesh(new PlaneGeometry(size, size), material);
  quad.frustumCulled = false;
  group.add(quad);

  const glow = createGlow({ color: 0xff9a4a, size: size * 1.1, intensity: 0.16 });
  glow.mesh.renderOrder = -1;
  group.add(glow.mesh);

  return {
    group,
    update(time, camera) {
      material.uniforms.uTime.value = time;
      group.getWorldPosition(center);
      quad.quaternion.copy(camera.quaternion);
      glow.face(camera);
    },
    dispose: () => disposeTree(group),
  };
}
