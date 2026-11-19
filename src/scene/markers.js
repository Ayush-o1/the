// Stand-ins for the destinations: Earth below the launch pad and a small sphere beside each
// mission. They prove the route passes every sector. The real worlds replace them later.
import { Group, Mesh, SphereGeometry, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { WAYPOINTS } from './route.js';

const MISSION_COLORS = {
  argus: 0xa38a5c,
  blackwater: 0xffb454,
  beetlejuice: 0xff7a3c,
  theredarmy: 0xc8603a,
  deadletter: 0xc9c4b8,
  europa: 0xe9e5da,
};

export function createMarkers() {
  const group = new Group();
  const owned = [];

  const earthGeometry = new SphereGeometry(90, 48, 32);
  const earthMaterial = new MeshStandardMaterial({ color: 0x141821, roughness: 1 });
  const earth = new Mesh(earthGeometry, earthMaterial);
  earth.position.set(0, -98, 20);
  group.add(earth);
  owned.push(earthGeometry, earthMaterial);

  const markerGeometry = new SphereGeometry(3, 16, 12);
  owned.push(markerGeometry);
  let side = 1;
  for (const [id, color] of Object.entries(MISSION_COLORS)) {
    const material = new MeshBasicMaterial({ color });
    const marker = new Mesh(markerGeometry, material);
    const [x, y, z] = WAYPOINTS[id];
    marker.position.set(x + side * 16, y, z - 18);
    side = -side;
    group.add(marker);
    owned.push(material);
  }

  return {
    object: group,
    dispose() {
      for (const resource of owned) resource.dispose();
    },
  };
}
