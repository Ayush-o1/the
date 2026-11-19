// Red supergiant: boiling convection cells from two layers of noise, darker toward the edge.
uniform float uTime;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = normalize(vObjPos);
  float slow = uTime * 0.05;
  float cells = fbm(p * 4.0 + vec3(0.0, slow, 0.0));
  float small = fbm(p * 11.0 - vec3(slow * 2.0));
  float heat = smoothstep(0.25, 0.85, cells * 0.7 + small * 0.4);
  vec3 color = mix(vec3(0.28, 0.03, 0.02), vec3(1.0, 0.36, 0.1), heat);
  color = mix(color, vec3(1.0, 0.82, 0.5), pow(heat, 4.0));
  float facing = max(dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0);
  color *= 0.5 + 0.7 * pow(facing, 0.6);
  gl_FragColor = vec4(color, 1.0);
}
