// Planet ring: fine bands with a few gaps. Radius is normalised between inner and outer edge.
uniform float uInner;
uniform float uOuter;
uniform vec3 uColor;
varying float vRadius;
varying float vAngle;

void main() {
  float t = (vRadius - uInner) / (uOuter - uInner);
  float bands = fbm(vec3(t * 40.0, 1.0, 2.0));
  float gap = smoothstep(0.52, 0.55, t) * (1.0 - smoothstep(0.58, 0.61, t));
  float edge = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.9, 1.0, t));
  float alpha = (0.25 + 0.6 * bands) * (1.0 - 0.85 * gap) * edge;
  gl_FragColor = vec4(uColor * (0.6 + 0.6 * bands), alpha * 0.8 * uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
