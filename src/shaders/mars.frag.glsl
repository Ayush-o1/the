// Mars. With the Viking map (uMaps = 1) the real albedo features show: dark Syrtis Major, bright
// Arabia, the Valles Marineris scar. Without it, a low-contrast procedural surface in the same
// butterscotch colours. Thin air: little limb darkening, a soft pale haze at the edge.
uniform float uMaps;
uniform sampler2D uMap;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vec3 p = normalize(vObjPos);
  float terrain = fbm(p * 3.0);
  float detail = fbm(p * 12.0);
  vec3 drawn = mix(vec3(0.36, 0.17, 0.08), vec3(0.62, 0.36, 0.2), terrain);
  drawn = mix(drawn, vec3(0.22, 0.12, 0.08), smoothstep(0.55, 0.75, detail) * 0.45);
  float cap = smoothstep(0.9, 0.95, abs(p.y) + detail * 0.04);
  drawn = mix(drawn, vec3(0.85, 0.83, 0.8), cap);
  vec3 albedo = drawn;
  if (uMaps > 0.0) {
    // The Viking mosaic's colour is a reconstruction and its dark regions lean blue. Recolour by
    // brightness to Hubble's butterscotch (bright) and brown-grey (dark), keeping a little of the
    // map's own colour.
    vec3 map = texture2D(uMap, vUv).rgb;
    float lum = dot(map, vec3(0.2126, 0.7152, 0.0722));
    vec3 tone = mix(vec3(0.13, 0.09, 0.065), vec3(0.66, 0.42, 0.25), smoothstep(0.02, 0.3, lum));
    tone = mix(tone, vec3(0.86, 0.84, 0.8), smoothstep(0.42, 0.6, lum));
    albedo = mix(drawn, mix(tone, map, 0.2), uMaps);
  }

  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(vViewDir);
  vec3 color = lightSurface(albedo, n, 0.04);
  // Dust and water-ice haze at the limb: pale, faintly blue, only where the sun reaches.
  float rim = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  color += vec3(0.42, 0.44, 0.5) * rim * softLambert(n, 0.2) * 0.35;
  gl_FragColor = vec4(color, uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
