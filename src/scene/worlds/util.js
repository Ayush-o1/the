// Helpers shared by the world modules.
import { ShaderMaterial, Vector3 } from 'three';
import noise from '../../shaders/noise.glsl?raw';
import planetVertex from '../../shaders/planet.vert.glsl?raw';

// The direction the light comes from. One sun for the whole route: from the upper left, in front
// of the camera, so every world has its lit side toward the text and its shadow away from it.
// The scene's directional light and every world shader use this same vector.
export const SUN_DIRECTION = new Vector3(-30, 36, 26).normalize();

// Builds a ShaderMaterial. The fragment source gets the shared noise functions in front of it.
export function shaderMaterial({ vertex = planetVertex, fragment, uniforms = {}, ...options }) {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: `${noise}\n${fragment}`,
    uniforms: { uTime: { value: 0 }, ...uniforms },
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
