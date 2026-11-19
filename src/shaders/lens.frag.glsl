// Final screen pass: gravitational lensing around the black hole, colour fringing at the peak of
// the well, and a very faint vignette and film grain.
uniform sampler2D tDiffuse;
uniform vec2 uCenter;
uniform float uStrength;
uniform float uChroma;
uniform float uAspect;
uniform float uTime;
uniform float uGrain;
uniform float uVignette;
varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 scale = vec2(uAspect, 1.0);
  vec2 v = (vUv - uCenter) * scale;
  float r = length(v);
  vec2 dir = v / max(r, 0.0001);

  // Pull the picture toward the hole: samples come from nearer the centre, most strongly close to it.
  float bend = uStrength * 0.035 / (r + 0.08) * smoothstep(0.9, 0.2, r);
  vec2 offset = dir * bend / scale;
  vec2 fringe = dir * uChroma * 0.006 * smoothstep(0.0, 0.5, r) / scale;

  vec2 base = clamp(vUv - offset, 0.001, 0.999);
  float red = texture2D(tDiffuse, clamp(base - fringe, 0.001, 0.999)).r;
  float green = texture2D(tDiffuse, base).g;
  float blue = texture2D(tDiffuse, clamp(base + fringe, 0.001, 0.999)).b;
  vec3 color = vec3(red, green, blue);

  float vignette = 1.0 - uVignette * smoothstep(0.35, 1.1, length((vUv - 0.5) * scale));
  float grain = (hash12(vUv * vec2(1920.0, 1080.0) + uTime * 60.0) - 0.5) * uGrain;
  gl_FragColor = vec4(color * vignette + grain, 1.0);
}
