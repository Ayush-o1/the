// Backdrop haze: very faint cool clouds painted on a huge sphere around the camera. Cool on purpose:
// the only warm light in the scene is the sun, so the haze must not compete with it.
uniform float uTime;
uniform float uStrength;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float clouds = fbm(d * 2.2 + vec3(0.0, uTime * 0.004, 0.0));
  float dust = fbm(d * 5.0 + 11.0);
  float amount = smoothstep(0.45, 0.85, clouds) * (0.4 + 0.6 * dust);
  vec3 color = mix(vec3(0.03, 0.07, 0.11), vec3(0.08, 0.15, 0.19), dust);
  gl_FragColor = vec4(color * amount * 0.6 * uStrength, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
