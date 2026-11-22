// A black hole and its accretion disk, traced per pixel. Each ray from the camera is bent by the
// hole's gravity (the Schwarzschild photon orbit equation, in units where the event horizon has
// radius 1) and marched until it falls in, escapes, or has crossed the disk. Bending is what makes
// the far side of the disk arch over the shadow and its underside show below it, with a thin
// photon ring hugging the shadow. The side of the disk turning toward the camera is brighter
// (Doppler beaming) and the light from near the hole is reddened (gravitational redshift).
// Drawn on a quad facing the camera; where a ray escapes without touching the disk the quad is
// clear, so the stars behind show through.
uniform float uTime;
uniform vec3 uCenter;
uniform float uScale;
uniform mat3 uToLocal;
uniform float uInner;
uniform float uOuter;
varying vec3 vWorldPos;

#ifndef STEPS
#define STEPS 120
#endif

vec3 diskColor(float r, float angle, out float density) {
  // Keplerian shear: inner rings turn faster, so the texture winds into spiral filaments.
  float spin = uTime * 0.6 * pow(r, -1.5) * 3.0;
  float a = angle + spin;
  float lr = log(r);
  float streaks = fbm(vec3(cos(a) * 3.0, sin(a) * 3.0, lr * 9.0));
  float fine = fbm(vec3(cos(a) * 9.0, sin(a) * 9.0, lr * 30.0 + 3.0));
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
  density = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.55, 1.0, t)) * (0.35 + 0.65 * streaks) * (0.7 + 0.5 * fine);
  // Temperature falls outward: white-yellow at the inner edge, deep orange at the outer.
  float heat = pow(uInner / r, 1.4);
  vec3 cool = vec3(0.85, 0.22, 0.04);
  vec3 warm = vec3(1.0, 0.62, 0.25);
  vec3 hot = vec3(1.0, 0.93, 0.8);
  vec3 color = mix(cool, warm, smoothstep(0.15, 0.55, heat));
  color = mix(color, hot, smoothstep(0.6, 1.0, heat));
  return color * (0.35 + 1.7 * heat);
}

void main() {
  vec3 dirWorld = normalize(vWorldPos - cameraPosition);
  vec3 pos = uToLocal * ((cameraPosition - uCenter) / uScale);
  vec3 dir = normalize(uToLocal * dirWorld);

  // Jump straight to a sphere around the hole: nothing bends much farther out.
  float start = uOuter * 1.2;
  float b = dot(pos, dir);
  float c = dot(pos, pos) - start * start;
  if (c > 0.0) {
    float disc = b * b - c;
    if (disc < 0.0 || -b - sqrt(disc) < 0.0) discard;
    pos += dir * (-b - sqrt(disc));
  }

  vec3 light = vec3(0.0);
  float alpha = 0.0;
  bool escaped = false;
  vec3 ring = vec3(0.0);
  vec3 h = cross(pos, dir);
  float h2 = dot(h, h);
  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);
    if (r < 1.0) {
      alpha = 1.0;
      break;
    }
    if (r > start * 1.05 && dot(pos, dir) > 0.0) {
      escaped = true;
      break;
    }
    float dt = clamp(0.09 * r * r / (1.0 + r), 0.03, 1.2);
    // The photon orbit equation in Cartesian form: acceleration -1.5 h^2 x / r^5.
    vec3 accel = -1.5 * h2 * pos / pow(r, 5.0);
    // Light that skims the photon sphere (r = 1.5) piles up into a thin bright ring.
    // Kept apart and added only if the ray escapes: rays that fall in never reach the camera.
    ring += (1.0 - alpha) * vec3(1.0, 0.82, 0.62) * exp(-pow((r - 1.52) * 14.0, 2.0)) * dt * 0.9;
    vec3 next = pos + dir * dt;
    vec3 nextDir = normalize(dir + accel * dt);
    if (pos.y * next.y < 0.0) {
      float k = pos.y / (pos.y - next.y);
      vec3 hit = mix(pos, next, k);
      float rh = length(hit.xz);
      if (rh > uInner && rh < uOuter) {
        float density;
        vec3 emitted = diskColor(rh, atan(hit.z, hit.x), density);
        // Doppler beaming: the gas orbits at about sqrt(0.5 / r) of light speed.
        float speed = sqrt(0.5 / rh);
        vec3 orbit = normalize(vec3(-hit.z, 0.0, hit.x));
        float cosine = dot(orbit, -dir);
        float doppler = 1.0 / (inversesqrt(1.0 - speed * speed) * (1.0 - speed * cosine));
        float redshift = sqrt(max(1.0 - 1.0 / rh, 0.0));
        // Capped, so the bright side blooms without flooding the shadow next to it.
        float boost = min(pow(doppler * redshift, 3.0), 2.5);
        emitted *= boost;
        // Approaching gas looks hotter and whiter, receding gas redder.
        emitted = mix(emitted, emitted * vec3(1.0, 0.75, 0.55), smoothstep(1.0, 0.6, doppler));
        float opacity = clamp(density * 0.95, 0.0, 1.0);
        light += (1.0 - alpha) * emitted * opacity;
        alpha += (1.0 - alpha) * opacity;
        if (alpha > 0.98) break;
      }
    }
    pos = next;
    dir = nextDir;
  }
  // A ray still close to the hole when the steps run out is spiralling in: it is part of the
  // shadow, so it is opaque black (whatever disk light it picked up stays in front).
  if (!escaped && alpha < 0.98 && length(pos) < start) alpha = 1.0;
  if (escaped) light += ring;
  // Premultiplied output: the shadow is opaque black, open sky is clear.
  gl_FragColor = vec4(light, alpha) * uFade;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
