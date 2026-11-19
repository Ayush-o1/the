// A soft glow with two thin streaks, drawn on a plane that always faces the camera.
uniform vec3 uColor;
uniform float uStreaks;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c) * 2.0;
  float halo = pow(max(1.0 - d, 0.0), 2.4);
  float streak = pow(max(1.0 - abs(c.y) * 14.0, 0.0), 3.0) * max(1.0 - abs(c.x) * 2.0, 0.0)
               + pow(max(1.0 - abs(c.x) * 14.0, 0.0), 3.0) * max(1.0 - abs(c.y) * 2.0, 0.0);
  float alpha = (halo + streak * uStreaks) * uIntensity;
  gl_FragColor = vec4(uColor * alpha, alpha);
}
