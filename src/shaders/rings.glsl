// How much of the light a ring blocks at a normalised radius t (0 at the inner edge, 1 at the
// outer). Many thin ringlets, two sharp gaps and a soft fade at both edges. Shared by the ring
// itself and by the planet it shades, so the shadow on the planet matches the ring.
float ringDensity(float t) {
  if (t < 0.0 || t > 1.0) return 0.0;
  // Irregular ringlets at three scales (value noise along the radius), never a regular stripe.
  float coarse = fbm(vec3(t * 9.0, 0.37, 0.11));
  float medium = fbm(vec3(t * 48.0, 1.7, 2.3));
  float fineRing = vnoise(vec3(t * 260.0, 4.1, 0.9));
  float ringlets = clamp(0.25 + coarse * 0.9 + (medium - 0.5) * 0.7 + (fineRing - 0.5) * 0.35, 0.0, 1.0);
  float bands = 0.35 + 0.65 * smoothstep(0.05, 0.3, t) * (1.0 - 0.5 * smoothstep(0.75, 1.0, t));
  float gapA = 1.0 - (smoothstep(0.585, 0.6, t) - smoothstep(0.64, 0.655, t));
  float gapB = 1.0 - 0.9 * (smoothstep(0.885, 0.89, t) - smoothstep(0.9, 0.905, t));
  float edges = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.97, 1.0, t));
  return clamp(ringlets * bands * gapA * gapB * edges, 0.0, 1.0);
}
