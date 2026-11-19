// Where the probe is when each sector is centred on screen. Keyed by the section id in index.html.
// The route runs mostly down the -z axis. x and y bend it so the flight is not a straight line.
// A sector with no entry here keeps the previous sector's position.
import { CatmullRomCurve3, Vector3 } from 'three';

export const WAYPOINTS = {
  launch: [0, 0, 0],
  belt: [6, 1, -70],
  argus: [-4, 2, -160],
  blackwater: [8, -2, -270],
  beetlejuice: [-6, 3, -380],
  theredarmy: [4, -1, -470],
  deadletter: [-5, 2, -550],
  europa: [6, 0, -630],
  cargo: [0, -2, -690],
  crew: [-3, 1, -740],
  contact: [0, 0, -820],
};

// Builds the curve through one waypoint per stop. Catmull-Rom passes through every control
// point, and getPoint(i / (stops - 1)) lands exactly on stop i.
export function buildRoute(stopIds) {
  let last = WAYPOINTS.launch;
  const points = stopIds.map((id) => {
    last = WAYPOINTS[id] ?? last;
    return new Vector3(...last);
  });
  // A curve needs two distinct points. Pad if the page has fewer than two sectors.
  if (points.length < 2) points.push(new Vector3(0, 0, -100));
  return new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}
