varying vec3 vColor;
varying float vFade;

void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d) * vFade);
}
