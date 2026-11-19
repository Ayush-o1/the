// Jump tunnel: streaks that rush toward the camera along the inside of a cylinder.
uniform float uTime;
uniform float uAmount;
varying vec2 vUv;

void main() {
  float angle = vUv.x * 160.0;
  float lane = floor(angle);
  float offset = hash31(vec3(lane, 1.0, 2.0));
  float speed = 0.6 + offset * 1.4;
  float along = fract(vUv.y * 3.0 - uTime * speed + offset * 7.0);
  float streak = smoothstep(0.0, 0.02, along) * (1.0 - smoothstep(0.02, 0.35, along));
  float lanePresence = step(0.55, offset);
  float across = 1.0 - abs(fract(angle) - 0.5) * 2.0;
  float body = streak * lanePresence * smoothstep(0.0, 0.5, across);
  vec3 color = mix(vec3(1.0, 0.55, 0.2), vec3(1.0, 0.9, 0.7), body);
  float alpha = body * uAmount * 0.55;
  gl_FragColor = vec4(color * alpha, alpha);
}
