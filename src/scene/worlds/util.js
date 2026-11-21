// Helpers shared by the world modules.
import { ShaderMaterial, Vector3 } from 'three';
import noise from '../../shaders/noise.glsl?raw';
import light from '../../shaders/light.glsl?raw';
import planetVertex from '../../shaders/planet.vert.glsl?raw';

// The direction the light comes from. One sun for the whole route: from the right and above,
// almost side-on to the camera. The worlds on the left of the screen are lit about 60 degrees off
// the line of sight, so each shows a lit face toward the text and a dark limb; the two on the
// right are crescents. The scene's key light, the reflections and every world shader use this
// same vector.
export const SUN_DIRECTION = new Vector3(0.78, 0.45, 0.05).normalize();

// Where the cold fill comes from: Earth, below the route.
export const FILL_DIRECTION = new Vector3(-0.2, -1, 0.25).normalize();

// Builds a ShaderMaterial. The fragment source gets the shared noise and light code in front of
// it. Every material gets the shared sun direction and a fade uniform; the world manager swaps in
// one fade value per world.
export function shaderMaterial({ vertex = planetVertex, fragment, uniforms = {}, ...options }) {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: `${noise}\n${light}\n${fragment}`,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIRECTION },
      uFade: { value: 1 },
      ...uniforms,
    },
    ...options,
  });
}

// Frees the GPU memory of everything under a group. Each world calls this from dispose()
// so flying back and forth does not leak.
export function disposeTree(root) {
  root.traverse((node) => {
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) material?.dispose();
  });
}
