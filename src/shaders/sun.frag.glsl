// Red supergiant. It gives off its own light, so no scene lighting reaches it. A few huge
// convection cells cross the disc, bright in the middle and dark in the lanes between, slowly
// changing. The limb is much darker and redder than the centre (limb darkening), so the star
// reads as a glowing ball of gas, not a lit sphere.
uniform float uTime;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

// Distance to the nearest of a jittered grid of points: small in the middle of a cell, large at
// the lanes between cells.
float cells(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  float best = 8.0;
  for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
      for (int z = -1; z <= 1; z++) {
        vec3 g = vec3(float(x), float(y), float(z));
        vec3 r = g + hash33(i + g) - f;
        best = min(best, dot(r, r));
      }
  return sqrt(best);
}

void main() {
  vec3 p = normalize(vObjPos);
  float slow = uTime * 0.03;
  // The cells drift and deform with a slow warp.
  vec3 warped = p * 2.6 + (vec3(fbm(p * 2.0 + slow), fbm(p * 2.0 - slow + 7.0), fbm(p * 2.0 + 3.0)) - 0.5) * 0.9;
  float big = 1.0 - smoothstep(0.15, 0.95, cells(warped));
  float small = 1.0 - smoothstep(0.1, 0.9, cells(warped * 3.2 + 11.0));
  float heat = clamp(big * 0.75 + small * 0.3 + (fbm(p * 7.0 + slow) - 0.5) * 0.3, 0.0, 1.0);

  float mu = max(dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0);
  // Limb darkening, strong for a cool giant.
  float limb = 1.0 - 0.93 * (1.0 - pow(mu, 0.6));
  vec3 lanes = vec3(0.2, 0.025, 0.01);
  vec3 body = vec3(1.0, 0.27, 0.06);
  vec3 hot = vec3(1.0, 0.55, 0.22);
  vec3 color = mix(lanes, body, smoothstep(0.1, 0.6, heat));
  color = mix(color, hot, smoothstep(0.65, 1.0, heat));
  // Toward the limb the light comes from higher, cooler gas: redder as well as dimmer.
  color = mix(color * vec3(1.0, 0.55, 0.4), color, mu);
  gl_FragColor = vec4(color * limb * 0.85, uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
