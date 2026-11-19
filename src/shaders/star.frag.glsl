varying vec3 vColor;
varying float vTwinkle;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float alpha = smoothstep(0.5, 0.0, d) * vTwinkle * 0.8;
  gl_FragColor = vec4(vColor, alpha);
}
