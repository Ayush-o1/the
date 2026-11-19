// A very faint warm haze painted on a huge inside-out sphere. It follows the camera, so it never
// gets closer, and it is drawn first so everything else covers it.
import { Mesh, SphereGeometry, BackSide } from 'three';
import { shaderMaterial } from './worlds/util.js';
import vertex from '../shaders/nebula.vert.glsl?raw';
import fragment from '../shaders/nebula.frag.glsl?raw';

export function createNebula() {
  const material = shaderMaterial({ vertex, fragment, side: BackSide, depthWrite: false });
  const geometry = new SphereGeometry(1500, 32, 16);
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return {
    object: mesh,
    update(time, cameraPosition) {
      material.uniforms.uTime.value = time;
      mesh.position.copy(cameraPosition);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
