// A planet's ring: many ringlets and two gaps (rings.glsl). Lit from the front it is matte cream;
// seen from the unlit side it glows faintly with light scattered through it. The planet's shadow
// falls across it.
uniform float uInner;
uniform float uOuter;
uniform vec3 uColor;
uniform vec3 uCenter;
uniform float uPlanetRadius;
uniform vec3 uRingNormal;
varying float vRadius;
varying vec3 vWorldPos;

void main() {
  float t = (vRadius - uInner) / (uOuter - uInner);
  float density = ringDensity(t);
  vec3 ringN = normalize(uRingNormal);
  vec3 toCamera = normalize(cameraPosition - vWorldPos);
  float sunSide = dot(ringN, sunDir());
  float viewSide = dot(ringN, toCamera);
  // Same side as the sun: reflected light. Other side: light scattered through the ring.
  float lit = sunSide * viewSide > 0.0 ? abs(sunSide) : 0.25 * (1.0 - density) * abs(sunSide) + 0.05;
  // The planet's shadow: does the ray toward the sun pass through the planet?
  vec3 oc = vWorldPos - uCenter;
  float b = dot(oc, sunDir());
  float c = dot(oc, oc) - uPlanetRadius * uPlanetRadius;
  float shadow = (b < 0.0 && b * b - c > 0.0) ? 1.0 : 0.0;
  vec3 color = uColor * (0.75 + 0.35 * density) * (SUN_COLOR * lit * (1.0 - shadow) + FILL_COLOR);
  // Close to the camera the ring would cross the frame as huge flat slabs: fade it there.
  float near = smoothstep(10.0, 40.0, length(cameraPosition - vWorldPos));
  gl_FragColor = vec4(color, density * 0.92 * uFade * near);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
