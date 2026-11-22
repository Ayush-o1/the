// An atmosphere seen from outside, drawn on the back faces of a shell around the planet. For each
// pixel the line of sight's closest approach to the planet gives the height of air it grazes: thin
// air glows faintly, the air just above the ground glows brightly, so the limb is a sharp bright
// line that fades outward. Lit where the sun reaches that point; at the terminator the colour
// turns to sunset; on the night side only a faint airglow remains.
uniform vec3 uCenter;
uniform float uRadius;
uniform float uThickness;
uniform vec3 uDay;
uniform vec3 uSunset;
uniform vec3 uAirglow;
uniform float uStrength;
varying vec3 vWorldPos;

void main() {
  vec3 ray = normalize(vWorldPos - cameraPosition);
  vec3 toCenter = uCenter - cameraPosition;
  float along = dot(toCenter, ray);
  vec3 closest = cameraPosition + ray * along - uCenter;
  float distance = length(closest);
  float height = clamp((distance - uRadius) / uThickness, 0.0, 1.0);
  vec3 up = closest / max(distance, 1e-4);

  float sunHeight = dot(up, sunDir());
  float lit = smoothstep(-0.28, 0.12, sunHeight);
  // Sunset orange, then a pale warm white, then the blue of the day side. Going straight from
  // orange to blue would pass through magenta, which no real limb shows.
  vec3 color = mix(uSunset, vec3(1.0, 0.86, 0.7), smoothstep(-0.16, 0.0, sunHeight));
  color = mix(color, uDay, smoothstep(0.0, 0.28, sunHeight));
  float glow = exp(-height * 5.0) * (1.0 - height);
  float line = exp(-height * 38.0);
  // The thin line right at the limb is whiter than the glow above it.
  vec3 lineColor = mix(color, vec3(0.8, 0.92, 1.0), 0.45 * smoothstep(0.05, 0.4, sunHeight));
  vec3 result = (color * glow * 0.55 + lineColor * line * 1.4) * lit + uAirglow * line * (1.0 - lit);
  result *= uStrength * uFade;
  gl_FragColor = vec4(result, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
