// Each star is a point with its own size in pixels, brightness and colour temperature. Only the
// largest few twinkle, and only a little: a sky where everything flickers looks like noise.
attribute float aSize;
attribute float aMag;
attribute float aTemp;
attribute float aPhase;
uniform float uTime;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
varying float vBig;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale;
  // Temperature runs from blue-white (0) through neutral (0.5) to orange-white (1).
  vec3 cool = vec3(0.62, 0.74, 1.0);
  vec3 neutral = vec3(1.0, 0.97, 0.92);
  vec3 warm = vec3(1.0, 0.76, 0.5);
  vColor = aTemp < 0.5 ? mix(cool, neutral, aTemp * 2.0) : mix(neutral, warm, (aTemp - 0.5) * 2.0);
  vBig = step(2.4, aSize);
  vAlpha = aMag * (1.0 - vBig * 0.14 * (0.5 + 0.5 * sin(uTime * 0.9 + aPhase)));
}
