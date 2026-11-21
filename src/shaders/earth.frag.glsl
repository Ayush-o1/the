// Earth from orbit. With the NASA maps (uMaps = 1): real continents, dark oceans with a broad sun
// glint, city lights only on the night side, cloud shadows near the terminator, and a blue haze
// toward the limb. Without them (uMaps = 0, slow networks and the low tier) the same lighting runs
// over a procedural surface. The clouds themselves are a separate, slightly larger sphere.
uniform float uTime;
uniform float uMaps;
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uClouds;
uniform vec3 uSunObj;
uniform float uCloudShift;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec2 vUv;

const vec3 OCEAN = vec3(0.0035, 0.011, 0.028);

vec3 proceduralSurface(vec3 p, out float water, out float lights) {
  float height = fbm(p * 4.6 + 3.1);
  float land = smoothstep(0.5, 0.535, height);
  float ice = smoothstep(0.82, 0.9, abs(p.y) + (fbm(p * 6.0) - 0.5) * 0.12);
  float dry = fbm(p * 8.0 + 9.0);
  vec3 ground = mix(vec3(0.05, 0.06, 0.025), vec3(0.22, 0.17, 0.1), smoothstep(0.35, 0.65, dry));
  vec3 surface = mix(OCEAN, ground, land);
  water = (1.0 - land) * (1.0 - ice);
  lights = smoothstep(0.7, 0.86, fbm(p * 40.0)) * land;
  return mix(surface, vec3(0.6, 0.64, 0.68), ice);
}

vec3 mappedSurface(vec2 uv, out float water, out float lights) {
  vec3 day = texture2D(uDay, uv).rgb;
  // The maps paint every ocean one flat navy; water is where blue clearly leads.
  water = smoothstep(0.0, 0.006, day.b - max(day.r, day.g) * 1.3) * (1.0 - smoothstep(0.03, 0.06, day.b));
  // Land seen through the whole atmosphere is a little flatter and darker than the map.
  float grey = dot(day, vec3(0.2126, 0.7152, 0.0722));
  vec3 land = mix(vec3(grey), day, 0.82) * 0.85;
  lights = texture2D(uNight, uv).r;
  return mix(land, OCEAN, water);
}

void main() {
  vec3 p = normalize(vObjPos);
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(vViewDir);
  vec3 sun = sunDir();
  float ndl = dot(n, sun);

  float waterA, lightsA, waterB, lightsB;
  vec3 surfaceA = proceduralSurface(p, waterA, lightsA);
  vec3 surfaceB = uMaps > 0.0 ? mappedSurface(vUv, waterB, lightsB) : surfaceA;
  if (uMaps <= 0.0) { waterB = waterA; lightsB = lightsA; }
  vec3 surface = mix(surfaceA, surfaceB, uMaps);
  float water = mix(waterA, waterB, uMaps);
  float lights = mix(lightsA, lightsB * lightsB * 1.6, uMaps);

  // Cloud shadow: the cloud that shades this point sits a little toward the sun.
  float shadow = 0.0;
  if (uMaps > 0.0) {
    vec3 east = normalize(vec3(p.z, 0.0, -p.x) + 1e-5);
    vec3 north = normalize(vec3(0.0, 1.0, 0.0) - p * p.y + 1e-5);
    vec3 s = normalize(uSunObj);
    float rise = max(dot(p, s), 0.12);
    vec2 toward = vec2(dot(s, east), dot(s, north)) * 0.008 / rise;
    float ring = max(length(p.xz), 0.05);
    vec2 cuv = vUv + vec2(uCloudShift + toward.x / (6.2832 * ring), toward.y / 3.1416);
    shadow = smoothstep(0.15, 0.7, texture2D(uClouds, cuv).r) * 0.55 * uMaps;
  }

  float light = softLambert(n, 0.06);
  vec3 color = surface * (SUN_COLOR * light * (1.0 - shadow) + FILL_COLOR);

  // Ocean glint: broad and soft with a brighter core, only on water and only in daylight.
  vec3 h = normalize(sun + v);
  float spec = pow(max(dot(n, h), 0.0), 70.0) * 0.35 + pow(max(dot(n, h), 0.0), 900.0) * 3.0;
  float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  color += vec3(1.0, 0.9, 0.75) * spec * water * smoothstep(0.0, 0.15, ndl) * (1.0 - shadow) * (0.6 + fresnel);

  // City lights: only where the ground is in darkness, warm sodium colour.
  float night = 1.0 - smoothstep(-0.12, 0.05, ndl);
  color += vec3(1.0, 0.58, 0.24) * lights * night * 0.55;

  // Air above the whole day side scatters blue light, so a sunlit ocean reads deep blue, not black.
  color += vec3(0.012, 0.026, 0.062) * light;

  // Haze toward the limb: blue in daylight, orange where the terminator meets it.
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5);
  float dayside = smoothstep(-0.15, 0.35, ndl);
  vec3 haze = mix(vec3(0.85, 0.42, 0.18), vec3(0.28, 0.5, 1.0), smoothstep(0.0, 0.35, ndl));
  color += haze * rim * dayside * 0.32;

  gl_FragColor = vec4(color, uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
