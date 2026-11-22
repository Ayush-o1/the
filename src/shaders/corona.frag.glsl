// The red star's envelope: irregular dusty plumes beyond its edge, drawn on a quad facing the
// camera. Brightness falls off with distance from the edge, broken up by slowly turning noise,
// so the outline is ragged rather than a smooth halo.
uniform float uTime;
uniform float uRadius;
uniform float uSize;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec2 c = (vUv - 0.5) * uSize;
  float d = length(c);
  float out_ = max(d - uRadius, 0.0) / uRadius;
  float angle = atan(c.y, c.x);
  float plumes = fbm(vec3(cos(angle) * 2.0, sin(angle) * 2.0, out_ * 2.0 - uTime * 0.02));
  float fine = fbm(vec3(cos(angle) * 6.0, sin(angle) * 6.0, out_ * 5.0 + uTime * 0.03));
  float glow = exp(-out_ * 3.2) * (0.35 + 0.9 * plumes * plumes) * (0.75 + 0.5 * fine);
  float inside = smoothstep(uRadius * 0.98, uRadius * 1.02, d);
  float alpha = glow * inside * 0.9 * uFade;
  gl_FragColor = vec4(uColor * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
