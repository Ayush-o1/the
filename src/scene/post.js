// Post-processing, in order: a clean-up pass, bloom (only things brighter than white: the sun's
// glints, the black hole's disk, the red star), the lens pass (gravity well, the colour grade,
// a faint fringe at bright edges, grain), then tone mapping and sRGB in the output pass, which also
// dithers the final 8-bit picture so the dark gradients of space do not band. The scene renders
// into a 4x multisampled target, so thin parts (array frames, struts, antennas) do not shimmer.
// The low tier skips all of it and renders directly.
import { Vector2, WebGLRenderTarget, HalfFloatType } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import vertexShader from '../shaders/fullscreen.vert.glsl?raw';
import fragmentShader from '../shaders/lens.frag.glsl?raw';
import sanitizeShader from '../shaders/sanitize.frag.glsl?raw';

// Triangular-distributed noise of one 8-bit step, added after the sRGB conversion. It turns the
// visible steps of a dark gradient into fine noise the eye averages away.
const DITHER = /* glsl */ `
float ditherHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

function ditheredOutputPass() {
  const pass = new OutputPass();
  const source = pass.material.fragmentShader.replace('void main() {', `${DITHER}\nvoid main() {`);
  // The dither goes last in main(), after tone mapping and the sRGB conversion.
  const end = source.lastIndexOf('}');
  pass.material.fragmentShader = `${source.slice(0, end)}
    float noise = ditherHash(gl_FragCoord.xy) + ditherHash(gl_FragCoord.xy + 71.3) - 1.0;
    gl_FragColor.rgb += noise / 255.0;
  }`;
  return pass;
}

export function createPost({ renderer, scene, camera }) {
  const size = renderer.getSize(new Vector2());
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

  // Threshold 1 on linear colour: only things brighter than white glow.
  const bloom = new UnrealBloomPass(size, 0.42, 0.55, 1.0);
  composer.addPass(bloom);

  const lens = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uCenter: { value: new Vector2(0.5, 0.5) },
      uStrength: { value: 0 },
      uChroma: { value: 0 },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uGrain: { value: 0.022 },
      uVignette: { value: 0.3 },
    },
    vertexShader,
    fragmentShader,
  });
  composer.addPass(lens);
  composer.addPass(ditheredOutputPass());

  return {
    // The passes themselves, for the look-dev page and ?debug framing scripts.
    passes: { bloom, lens },
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
