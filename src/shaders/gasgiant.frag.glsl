// A gas giant. With a map (Jupiter, from Cassini) it shows the real bands and the Great Red Spot;
// without one (Argus, and Jupiter until its map arrives) the bands are drawn: laminar zones with
// turbulent edges, festoons and one storm oval. Both get strong limb darkening, a soft
// terminator, and, if the planet has a ring, the ring's shadow.
// Needs rings.glsl in front of it (see scene/worlds/argus.js).
uniform float uTime;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform float uSeed;
uniform float uMaps;
uniform sampler2D uMap;
uniform vec3 uRingNormal;
uniform float uRingInner;
uniform float uRingOuter;
uniform vec3 uCenter;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying vec3 vWorldPos;

vec3 drawnBands(vec3 p) {
  float lat = p.y;
  // Turbulence grows toward the band edges, where the shear is.
  float warp = fbm(vec3(p.x * 2.5, lat * 9.0, p.z * 2.5 + uSeed) + vec3(uTime * 0.01, 0.0, 0.0));
  float y = lat + (warp - 0.5) * 0.06;
  float band = sin(y * 22.0 + sin(y * 7.0 + uSeed) * 1.4) * 0.5 + 0.5;
  float fine = fbm(vec3(p.x * 6.0, y * 70.0 + uSeed, p.z * 6.0));
  vec3 color = mix(uColA, uColB, smoothstep(0.1, 0.9, band));
  color = mix(color, uColC, smoothstep(0.45, 0.85, fine) * 0.45);
  // Festoons: thin dark wisps trailing from the bright zones.
  float festoon = smoothstep(0.62, 0.7, fbm(vec3(p.x * 9.0, y * 40.0, p.z * 9.0 + 4.0)));
  color = mix(color, uColC * 0.8, festoon * (1.0 - band) * 0.5);
  // One storm oval in the southern hemisphere.
  vec3 stormAt = normalize(vec3(0.6, -0.33, 0.73));
  vec3 q = p - stormAt;
  float oval = length(vec2(dot(q, normalize(cross(stormAt, vec3(0.0, 1.0, 0.0)))) * 0.6, q.y * 1.3));
  color = mix(color, uColB * vec3(1.08, 0.9, 0.82), (1.0 - smoothstep(0.05, 0.09, oval)) * 0.8);
  return color;
}

void main() {
  vec3 p = normalize(vObjPos);
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(vViewDir);
  vec3 drawn = drawnBands(p);
  vec3 albedo = uMaps > 0.0 ? mix(drawn, texture2D(uMap, vUv).rgb, uMaps) : drawn;

  float light = softLambert(n, 0.08);
  // The ring's shadow: follow the ray from this point toward the sun to the ring plane.
  float shade = 0.0;
  if (uRingOuter > 0.0) {
    vec3 ringN = normalize(uRingNormal);
    float denom = dot(sunDir(), ringN);
    if (abs(denom) > 1e-3) {
      float t = dot(uCenter - vWorldPos, ringN) / denom;
      if (t > 0.0) {
        float r = length(vWorldPos + sunDir() * t - uCenter);
        shade = ringDensity((r - uRingInner) / (uRingOuter - uRingInner)) * 0.85;
      }
    }
  }
  // Limb darkening: the edge of a gas giant is seen through more haze and is darker.
  float limb = pow(max(dot(n, v), 0.0), 0.35);
  vec3 color = albedo * (SUN_COLOR * light * (1.0 - shade) * (0.35 + 0.65 * limb) + FILL_COLOR);
  gl_FragColor = vec4(color, uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
