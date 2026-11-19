// Runs before bloom. A single bad pixel (not-a-number or infinite brightness) would otherwise be
// smeared across the whole screen by the blur. This replaces such pixels and caps extreme values.
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  bool bad = !(color.r == color.r) || !(color.g == color.g) || !(color.b == color.b);
  vec3 safe = bad ? vec3(0.0) : min(color.rgb, vec3(32.0));
  gl_FragColor = vec4(safe, 1.0);
}
