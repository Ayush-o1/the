// A glow plane that always faces the camera. Used for the star, the black hole and the home dot.
import { Mesh, PlaneGeometry, AdditiveBlending, Color } from 'three';
import { shaderMaterial } from './util.js';
import vertex from '../../shaders/glow.vert.glsl?raw';
import fragment from '../../shaders/glow.frag.glsl?raw';

export function createGlow({ color, size, intensity = 1, streaks = 0 }) {
  const material = shaderMaterial({
    vertex,
    fragment,
    uniforms: {
      uColor: { value: new Color(color) },
      uStreaks: { value: streaks },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(new PlaneGeometry(size, size), material);
  mesh.frustumCulled = false;
  return {
    mesh,
    // Turns the plane to face the camera. Called every frame by the world that owns it.
    face(camera) {
      mesh.quaternion.copy(camera.quaternion);
    },
    setIntensity(value) {
      material.uniforms.uIntensity.value = value;
    },
  };
}
