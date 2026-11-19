uniform float uTime;
uniform float uPower;
varying float vAlong;

void main() {
  float flicker = 0.85 + 0.15 * sin(uTime * 40.0 + vAlong * 12.0);
  float core = pow(1.0 - vAlong, 1.6);
  vec3 hot = mix(vec3(1.0, 0.45, 0.15), vec3(1.0, 0.86, 0.6), core);
  gl_FragColor = vec4(hot, core * flicker * uPower);
}
