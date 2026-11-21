// Post-processing: bloom (engines, star and disk only, by a high brightness threshold), the lens
// pass for the gravity well, then tone mapping. Low tier skips all of it and renders directly.
import { Vector2, WebGLRenderTarget, HalfFloatType } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import vertexShader from '../shaders/fullscreen.vert.glsl?raw';
import fragmentShader from '../shaders/lens.frag.glsl?raw';
import sanitizeShader from '../shaders/sanitize.frag.glsl?raw';

export function createPost({ renderer, scene, camera }) {
  const size = renderer.getSize(new Vector2());
  // 4x multisampling keeps edges smooth now that the scene renders into a texture first.
  const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  composer.addPass(
    new ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader,
      fragmentShader: sanitizeShader,
    }),
  );

  // Threshold 1 on linear colour: only things brighter than white, like the star and the disk, glow.
  const bloom = new UnrealBloomPass(size, 0.45, 0.5, 1.0);
  composer.addPass(bloom);

  const lens = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uCenter: { value: new Vector2(0.5, 0.5) },
      uStrength: { value: 0 },
      uChroma: { value: 0 },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uGrain: { value: 0.03 },
      uVignette: { value: 0.3 },
    },
    vertexShader,
    fragmentShader,
  });
  composer.addPass(lens);
  composer.addPass(new OutputPass());

  return {
    render() {
      composer.render();
    },
    setSize(width, height, pixelRatio) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
      lens.uniforms.uAspect.value = width / height;
    },
    // center is a screen position, 0 to 1. strength and chroma are 0 to 1.
    setLens({ center, strength, chroma, time }) {
      if (center) lens.uniforms.uCenter.value.copy(center);
      lens.uniforms.uStrength.value = strength;
      lens.uniforms.uChroma.value = chroma;
      lens.uniforms.uTime.value = time % 10;
    },
    dispose() {
      composer.dispose();
      target.dispose();
    },
  };
}
