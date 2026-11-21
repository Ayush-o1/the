// Europa: bright cream ice crossed by long tan-brown ridges (lineae) and mottled darker ground.
// With the USGS mosaic (uMaps = 1) the real lineae; without it, long thin drawn ones. No
// atmosphere, so the limb is sharp and the terminator is hard.
uniform float uMaps;
uniform sampler2D uMap;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
  vec3 p = normalize(vObjPos);
  vec3 ice = vec3(0.93, 0.9, 0.84);
  vec3 ridge = vec3(0.55, 0.4, 0.3);
  // Drawn: a few long great-circle ridges and soft mottling.
  float mottle = fbm(p * 4.0);
  float lines = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec3 axis = normalize(vec3(sin(fi * 2.1 + 0.3), cos(fi * 1.7), sin(fi * 3.3 + 1.0)));
    float wobble = (fbm(p * 6.0 + fi) - 0.5) * 0.02;
    lines = max(lines, 1.0 - smoothstep(0.002, 0.012, abs(dot(p, axis) + wobble)));
  }
  vec3 drawn = mix(ice, ridge, max(lines * 0.8, smoothstep(0.55, 0.8, mottle) * 0.35));
  vec3 albedo = drawn;
  if (uMaps > 0.0) {
    float m = texture2D(uMap, vUv).r;
    // The mosaic is low in contrast: stretch it, and keep the drawn ridges faintly on top so the
    // long lineae still read at this size.
    // Most of the map sits between 0.24 and 0.47 once decoded to linear.
    vec3 mapped = mix(ridge * 0.7, ice, smoothstep(0.2, 0.44, m));
    mapped = mix(mapped, ridge, lines * 0.5);
    albedo = mix(drawn, mapped, uMaps);
  }
  vec3 color = lightSurface(albedo * 0.95, normalize(vWorldNormal), 0.01);
  gl_FragColor = vec4(color, uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
