// M5 deadLetter: a relay station in deep space. A hub, a ring, a long antenna and a dish.
// A light blinks, and pulses of signal spread outward from the dish.
import {
  Group,
  Mesh,
  CylinderGeometry,
  TorusGeometry,
  BoxGeometry,
  SphereGeometry,
  RingGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  DoubleSide,
  AdditiveBlending,
} from 'three';
import { disposeTree } from './util.js';

const PULSES = 3;
const PULSE_SECONDS = 4;

function mesh(geometry, material, position, rotation = [0, 0, 0]) {
  const part = new Mesh(geometry, material);
  part.position.set(...position);
  part.rotation.set(...rotation);
  return part;
}

export function createRelay() {
  const group = new Group();
  const metal = new MeshStandardMaterial({ color: 0xc9c4b8, metalness: 0.75, roughness: 0.4 });
  const dark = new MeshStandardMaterial({
    color: 0x2b3448,
    metalness: 0.4,
    roughness: 0.5,
    emissive: 0x10172a,
  });
  const station = new Group();
  station.scale.setScalar(1.6);
  group.add(station);

  station.add(mesh(new CylinderGeometry(1.1, 1.1, 3.2, 20), metal, [0, 0, 0]));
  station.add(mesh(new TorusGeometry(4.2, 0.18, 10, 64), metal, [0, 0, 0], [Math.PI / 2, 0, 0]));
  for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    station.add(
      mesh(
        new BoxGeometry(3.1, 0.1, 0.1),
        metal,
        [Math.cos(angle) * 2.6, 0, Math.sin(angle) * 2.6],
        [0, -angle, 0],
      ),
    );
  }
  station.add(mesh(new BoxGeometry(7, 0.06, 2.2), dark, [0, 2.6, 0]));
  station.add(mesh(new CylinderGeometry(0.06, 0.06, 7, 8), metal, [0, -4.8, 0]));
  const dish = mesh(
    new SphereGeometry(1.7, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2.4),
    metal,
    [0, -8.2, 0],
    [Math.PI, 0, 0],
  );
  station.add(dish);

  const beaconMaterial = new MeshBasicMaterial({ color: 0xffb454 });
  const beacon = mesh(new SphereGeometry(0.3, 12, 8), beaconMaterial, [0, 2, 0]);
  station.add(beacon);
  station.rotation.z = 0.35;

  // Signal pulses: flat rings that grow and fade, one after another.
  const pulseGeometry = new RingGeometry(0.96, 1, 64);
  const pulses = Array.from({ length: PULSES }, () => {
    const material = new MeshBasicMaterial({
      color: 0xffb454,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const ring = new Mesh(pulseGeometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -9;
    group.add(ring);
    return ring;
  });

  return {
    group,
    update(time) {
      station.rotation.y = time * 0.08;
      beaconMaterial.color.setHex(Math.sin(time * 3) > 0.4 ? 0xffb454 : 0x3a2a14);
      pulses.forEach((ring, i) => {
        const progress = (((time / PULSE_SECONDS + i / PULSES) % 1) + 1) % 1;
        ring.scale.setScalar(2 + progress * 22);
        ring.material.opacity = (1 - progress) * 0.5;
      });
    },
    dispose() {
      disposeTree(group);
      pulseGeometry.dispose();
    },
  };
}
