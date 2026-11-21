// A solar array: dark blue cells with fine gaps, and a sheen when the sun glints off it.
uniform vec3 uSunDir;
uniform vec2 uCells;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec2 cell = abs(fract(vObjPos.xy * uCells) - 0.5) * 2.0;
  float gap = smoothstep(0.9, 0.97, max(cell.x, cell.y));
  vec3 n = normalize(vWorldNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 sun = normalize(uSunDir);
  float diffuse = max(dot(n, sun), 0.0);
  vec3 reflected = reflect(-sun, n);
  float sheen = pow(max(dot(reflected, normalize(vViewDir)), 0.0), 18.0);
  vec3 base = mix(vec3(0.035, 0.07, 0.15), vec3(0.01, 0.015, 0.03), gap);
  gl_FragColor = vec4(base * (0.35 + 1.3 * diffuse) + vec3(0.6, 0.7, 0.9) * sheen * 0.6, 1.0);
}
