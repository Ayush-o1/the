// Earth, seen from low orbit: dark water, muted land, thin cloud bands and a soft limb.
uniform float uTime;
uniform vec3 uSunDir;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = normalize(vObjPos);
  float land = smoothstep(0.52, 0.58, fbm(p * 2.5));
  vec3 color = mix(vec3(0.03, 0.06, 0.1), vec3(0.2, 0.17, 0.11), land);
  float cloud = smoothstep(0.55, 0.8, fbm(p * 5.0 + vec3(uTime * 0.01, 0.0, 0.0)));
  color = mix(color, vec3(0.8, 0.8, 0.78), cloud * 0.5);

  vec3 n = normalize(vWorldNormal);
  float diffuse = max(dot(n, normalize(uSunDir)), 0.0);
  float limb = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 2.5);
  vec3 lit = color * (0.08 + 0.92 * diffuse) + vec3(0.35, 0.5, 0.7) * limb * 0.55 * (0.2 + diffuse);
  gl_FragColor = vec4(lit, 1.0);
}
