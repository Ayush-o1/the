varying vec3 vColor;
varying float vAlpha;
varying float vBig;

void main() {
  float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
  float core = smoothstep(1.0, 0.15, d);
  // The brightest stars get a faint halo, so they read as lights and not as bigger dots.
  float halo = vBig * pow(max(1.0 - d, 0.0), 3.0) * 0.45;
  gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
}
