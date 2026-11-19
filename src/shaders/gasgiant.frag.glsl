// Banded gas giant. Latitude drives the bands, noise bends them and adds fine streaks.
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform float uSeed;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = normalize(vObjPos);
  float warp = fbm(vec3(p.x * 3.0, p.y * 6.0, p.z * 3.0 + uSeed) + uTime * 0.02);
  float band = sin((p.y + warp * 0.18) * 18.0) * 0.5 + 0.5;
  float fine = fbm(vec3(p.x * 2.0, p.y * 30.0 + uSeed, p.z * 2.0));
  vec3 color = mix(uColA, uColB, band);
  color = mix(color, uColC, fine * 0.5);

  vec3 n = normalize(vWorldNormal);
  float diffuse = max(dot(n, normalize(uSunDir)), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 3.0);
  vec3 lit = color * (0.07 + 0.93 * diffuse) + rim * 0.14 * uColB * diffuse;
  gl_FragColor = vec4(lit, 1.0);
}
