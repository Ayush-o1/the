// Two streams of dots flow toward the star: the ledger and the settlement. Mismatched dots glow.
// Positions are computed here from time, so the CPU does no per-dot work.
attribute vec3 aStart;
attribute float aKind;
attribute float aMismatch;
attribute float aPhase;
uniform float uTime;
uniform float uStarRadius;
varying vec3 vColor;
varying float vFade;

void main() {
  float progress = fract(uTime * 0.045 + aPhase);
  // Ease in so dots accelerate as they fall.
  float eased = progress * progress;
  vec3 pos = mix(aStart, vec3(0.0), eased);
  // A small swirl keeps the two streams from looking like straight lines.
  float swirl = (1.0 - eased) * 2.0;
  pos.x += sin(uTime * 0.6 + aPhase * 20.0) * swirl;
  pos.y += cos(uTime * 0.5 + aPhase * 17.0) * swirl;

  vec3 ledger = vec3(1.0, 0.72, 0.33);
  vec3 settlement = vec3(0.93, 0.9, 0.85);
  vColor = mix(ledger, settlement, aKind);
  float glow = aMismatch * (0.6 + 0.4 * sin(uTime * 3.0 + aPhase * 30.0));
  vColor = mix(vColor, vec3(1.0, 1.0, 1.0), glow);
  vFade = smoothstep(0.0, 0.1, progress) * (1.0 - smoothstep(0.9, 1.0, progress));

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = clamp((90.0 + aMismatch * 160.0) / -mv.z * 6.0, 2.0, 16.0);
  gl_Position = projectionMatrix * mv;
}
