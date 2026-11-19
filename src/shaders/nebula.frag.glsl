// Backdrop haze: very faint warm clouds painted on a huge sphere around the camera.
uniform float uTime;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float clouds = fbm(d * 2.2 + vec3(0.0, uTime * 0.004, 0.0));
  float dust = fbm(d * 5.0 + 11.0);
  float amount = smoothstep(0.45, 0.85, clouds) * (0.4 + 0.6 * dust);
  vec3 color = mix(vec3(0.18, 0.07, 0.04), vec3(0.32, 0.2, 0.1), dust);
  gl_FragColor = vec4(color * amount * 0.55, 1.0);
}
