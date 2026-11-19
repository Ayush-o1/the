// Europa: pale ice with long brown cracks. Cracks are the thin lines where noise crosses 0.5.
uniform vec3 uSunDir;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = normalize(vObjPos);
  float tone = fbm(p * 5.0);
  vec3 color = mix(vec3(0.82, 0.8, 0.74), vec3(0.95, 0.94, 0.9), tone);
  float line = abs(fbm(p * 7.0 + 3.0) - 0.5);
  float crack = 1.0 - smoothstep(0.0, 0.035, line);
  float line2 = abs(fbm(p * 15.0 + 9.0) - 0.5);
  crack = max(crack, (1.0 - smoothstep(0.0, 0.02, line2)) * 0.6);
  color = mix(color, vec3(0.5, 0.3, 0.2), crack * 0.8);

  vec3 n = normalize(vWorldNormal);
  float diffuse = max(dot(n, normalize(uSunDir)), 0.0);
  gl_FragColor = vec4(color * (0.05 + 0.95 * diffuse), 1.0);
}
