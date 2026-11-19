// Small bright dots for Argus's satellites. Size shrinks with distance.
attribute vec3 aColor;
attribute float aSize;
varying vec3 vColor;

void main() {
  vColor = aColor;
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(aSize / -viewPosition.z * 6.0, 2.0, 14.0);
  gl_Position = projectionMatrix * viewPosition;
}
