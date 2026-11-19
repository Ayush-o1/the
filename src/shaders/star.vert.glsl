// Each star is a point. Size shrinks with distance and twinkles a little over time.
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uScale;
varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  float twinkle = 0.75 + 0.25 * sin(uTime * 1.3 + aPhase);
  gl_PointSize = clamp(aSize * uScale / -viewPosition.z, 1.0, 4.0);
  vColor = aColor;
  vTwinkle = twinkle;
}
