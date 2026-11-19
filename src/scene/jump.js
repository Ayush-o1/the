// The jump tunnel between missions: streaks rushing past along the inside of a cylinder around
// the camera, plus a wider field of view. How strong it is depends only on scroll progress, so
// scrubbing back and forth plays it cleanly in both directions.
import { Mesh, CylinderGeometry, BackSide, AdditiveBlending } from 'three';
import { shaderMaterial } from './worlds/util.js';
import vertex from '../shaders/tunnel.vert.glsl?raw';
import fragment from '../shaders/tunnel.frag.glsl?raw';

export const BASE_FOV = 55;
const EXTRA_FOV = 20;

export function createJump() {
  const geometry = new CylinderGeometry(7, 7, 120, 96, 1, true);
  // The cylinder's axis is y by default. Turn it so it runs along z, the direction the camera looks.
  geometry.rotateX(Math.PI / 2);
  const material = shaderMaterial({
    vertex,
    fragment,
    uniforms: { uAmount: { value: 0 } },
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;

  return {
    object: mesh,
    update(amount, time, camera) {
      mesh.visible = amount > 0.002;
      if (!mesh.visible) return;
      material.uniforms.uAmount.value = amount;
      material.uniforms.uTime.value = time;
      mesh.position.copy(camera.position);
      mesh.quaternion.copy(camera.quaternion);
    },
    // The field of view widens at the peak of the jump.
    fovFor(amount) {
      return BASE_FOV + EXTRA_FOV * amount;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
