// Frame-rate independent easing. Moving a fixed fraction each frame would feel different at
// 30 and 144 fps. This uses elapsed time, so the camera has the same "weight" on every screen.
// rate 4 to 8 is the useful range: lower feels heavier.
export function damp(current, target, rate, dt) {
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}
