// Accretion disk. Hot and bright at the inner edge, swirling, brighter on the side moving toward us.
uniform float uTime;
uniform float uInner;
uniform float uOuter;
uniform float uAlpha;
varying float vRadius;
varying float vAngle;

void main() {
  float t = clamp((vRadius - uInner) / (uOuter - uInner), 0.0, 1.0);
  float swirl = vAngle + uTime * 0.9 / (0.4 + t * 2.0);
  float streaks = fbm(vec3(cos(swirl) * (1.0 + t * 4.0), sin(swirl) * (1.0 + t * 4.0), t * 6.0));
  float doppler = 0.65 + 0.35 * cos(vAngle - 0.6);
  float heat = pow(1.0 - t, 1.6);
  vec3 color = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.92, 0.7), heat);
  float brightness = (0.25 + 0.95 * streaks) * (0.25 + 1.2 * heat) * doppler;
  float edge = smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.7, 1.0, t));
  gl_FragColor = vec4(color * brightness, edge * uAlpha);
}
