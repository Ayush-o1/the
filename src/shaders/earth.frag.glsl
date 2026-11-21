// Earth as seen from orbit at dawn. Dark oceans with a sun glint, muted land, polar ice, soft
// clouds, a night side with a few warm city lights, and a bright thin limb on the lit side.
uniform float uTime;
uniform vec3 uSunDir;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = normalize(vObjPos);
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(vViewDir);
  vec3 sun = normalize(uSunDir);

  float height = fbm(p * 4.6 + 3.1);
  float land = smoothstep(0.5, 0.535, height);
  float ice = smoothstep(0.82, 0.9, abs(p.y) + (fbm(p * 6.0) - 0.5) * 0.12);

  vec3 deep = vec3(0.008, 0.035, 0.085);
  vec3 shallow = vec3(0.02, 0.13, 0.2);
  vec3 ocean = mix(deep, shallow, smoothstep(0.35, 0.5, height));
  float dry = fbm(p * 8.0 + 9.0);
  vec3 ground = mix(vec3(0.09, 0.11, 0.05), vec3(0.34, 0.27, 0.16), smoothstep(0.35, 0.65, dry));
  ground = mix(ground, vec3(0.14, 0.13, 0.12), smoothstep(0.62, 0.8, height));
  vec3 surface = mix(ocean, ground, land);
  surface = mix(surface, vec3(0.8, 0.85, 0.9), ice);

  float cloudField = fbm(p * 9.0 + vec3(uTime * 0.004, 0.0, 7.0));
  float cloud = smoothstep(0.56, 0.8, cloudField);

  float ndl = dot(n, sun);
  float day = smoothstep(-0.08, 0.3, ndl);
  float terminator = exp(-pow((ndl - 0.02) * 7.0, 2.0));

  vec3 color = surface * (0.025 + 1.25 * day);
  // Sun glint on the water, only where the water faces the sun and the camera together.
  vec3 reflected = reflect(-sun, n);
  float glint = pow(max(dot(reflected, v), 0.0), 36.0) * (1.0 - land) * (1.0 - ice) * day;
  color += vec3(1.0, 0.86, 0.62) * glint * 0.9;

  vec3 cloudColor = vec3(0.8, 0.8, 0.78) * (0.03 + 0.8 * day);
  cloudColor = mix(cloudColor, vec3(1.0, 0.62, 0.38) * 0.7, terminator * 0.55);
  color = mix(color, cloudColor, cloud * 0.75);

  // City lights on the night side: warm points on land, hidden under cloud.
  float towns = smoothstep(0.7, 0.86, fbm(p * 40.0)) * land * (1.0 - day) * (1.0 - cloud);
  color += vec3(1.0, 0.62, 0.28) * towns * 0.9;

  // The limb: thin and blue on the lit side, so the planet has an edge against black.
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  color += vec3(0.3, 0.52, 0.95) * rim * (0.05 + 0.95 * smoothstep(-0.2, 0.5, ndl)) * 0.45;

  gl_FragColor = vec4(color, 1.0);
}
