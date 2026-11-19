// Closest approach between a debris object moving in a straight line and a fixed body.
// The scene's Europa conjunction hazard uses it, and so will the Europa simulation.

// How many kilometres one scene unit stands for in the conjunction readout.
export const KM_PER_UNIT = 0.35;

// position and velocity are [x, y, z]. center is the body. Returns the time of closest
// approach (can be negative if the debris is already moving away) and the miss distance.
export function closestApproach(position, velocity, center) {
  const rel = position.map((value, i) => value - center[i]);
  const speedSquared = velocity.reduce((sum, v) => sum + v * v, 0);
  if (speedSquared === 0) return { time: 0, distance: Math.hypot(...rel) };
  const time = -rel.reduce((sum, value, i) => sum + value * velocity[i], 0) / speedSquared;
  const closest = rel.map((value, i) => value + velocity[i] * time);
  return { time, distance: Math.hypot(...closest) };
}

export function missDistanceKm(position, velocity, center) {
  return closestApproach(position, velocity, center).distance * KM_PER_UNIT;
}
