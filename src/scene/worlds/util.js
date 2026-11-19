// Helpers shared by the world modules.
import { ShaderMaterial, Vector3 } from 'three';
import noise from '../../shaders/noise.glsl?raw';
import planetVertex from '../../shaders/planet.vert.glsl?raw';

// The direction the light comes from, the same one the scene's directional light uses.
export const SUN_DIRECTION = new Vector3(30, 40, 20).normalize();

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
