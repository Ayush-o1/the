varying vec3 vColor;

uniform float uFade;

void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.15, d) * uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
