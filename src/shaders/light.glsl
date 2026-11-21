// Shared by every hand-written world shader (prepended in scene/worlds/util.js), so all of them are
// lit by the same sun as the probe: one warm key from uSunDir and a weak cold fill (earthshine and
// starlight). No dark side is ever pure black, and none is brighter than a sliver of the key.
uniform vec3 uSunDir;
// 0 to 1. A world fades in and out with this instead of popping (see scene/worlds/index.js).
uniform float uFade;

const vec3 SUN_COLOR = vec3(1.0, 0.95, 0.88);
const vec3 FILL_COLOR = vec3(0.010, 0.014, 0.024);

vec3 sunDir() {
  return normalize(uSunDir);
}

// Lambert with a soft terminator: the light does not stop dead at 90 degrees, it rolls off over a
// narrow band, as it does on a planet with an atmosphere or a rough surface.
float softLambert(vec3 n, float soften) {
  float ndl = dot(n, sunDir());
  return smoothstep(-soften, 1.0, ndl) * max(ndl + soften, 0.0) / (1.0 + soften);
}

vec3 lightSurface(vec3 albedo, vec3 n, float soften) {
  return albedo * (SUN_COLOR * softLambert(n, soften) + FILL_COLOR);
}
