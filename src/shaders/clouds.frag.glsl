// Earth's cloud layer, on its own slightly larger sphere that turns at a different rate from the
// ground. Bright white in daylight, warm at the terminator, almost invisible at night. With the
// NASA cloud map when it has arrived; procedural clouds until then (and on the low tier).
uniform float uTime;
uniform float uMaps;
uniform sampler2D uClouds;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vec3 p = normalize(vObjPos);
  vec3 n = normalize(vWorldNormal);
  float ndl = dot(n, sunDir());

  float procedural = smoothstep(0.56, 0.8, fbm(p * 9.0 + vec3(0.0, 0.0, 7.0)));
  float mapped = uMaps > 0.0 ? smoothstep(0.12, 0.75, texture2D(uClouds, vUv).r) : 0.0;
  float cover = mix(procedural * 0.8, mapped, uMaps);
  // The map is 2048 px around the globe, coarser than the screen up close: fine noise breaks
  // each texel into smaller puffs and gaps, strongest at the cloud edges.
  float detail = fbm(p * 140.0 + vec3(0.0, uTime * 0.002, 0.0));
  cover = clamp(cover + (detail - 0.5) * 0.55 * cover * (1.0 - cover) * 4.0 * 0.5, 0.0, 1.0);

  float light = softLambert(n, 0.1);
  // Low sun reddens the light that reaches the cloud tops.
  vec3 tint = mix(vec3(1.0, 0.6, 0.38), vec3(1.0), smoothstep(0.0, 0.3, ndl));
  vec3 color = vec3(0.92) * (SUN_COLOR * tint * light + FILL_COLOR * 1.5);
  // Clouds thin out to nothing right at the limb, where the line of sight runs through haze.
  float facing = max(dot(n, normalize(vViewDir)), 0.0);
  float alpha = cover * smoothstep(0.0, 0.12, facing) * uFade;
  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
