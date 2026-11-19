// Bright at the edge, clear in the middle.
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
  gl_FragColor = vec4(uColor * edge, edge * 0.8);
}
