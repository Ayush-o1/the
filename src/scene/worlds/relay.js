// M5 deadLetter: a relay station in deep space, built like the probe (scene/hardware.js): a foil
// bus, two large white dishes on side booms with ribs and feeds, long solar wings above and below,
// an omni mast with a steady beacon. Faint rings of signal spread from the dishes; they are the
// story's device, so they stay thin and quiet.
import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  ConeGeometry,
  PlaneGeometry,
  RingGeometry,
  TorusGeometry,
  SphereGeometry,
  Vector3,
  Quaternion,
  MeshBasicMaterial,
  DoubleSide,
  AdditiveBlending,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createBuilder, dishGeometry, createHardwareMaterials } from '../hardware.js';
import { disposeTree } from './util.js';

const PULSES = 3;
const PULSE_SECONDS = 5;
const UP = new Vector3(0, 1, 0);

export function createRelay() {
  const group = new Group();
  const owned = [];
  const own = (resource) => {
    owned.push(resource);
    return resource;
  };
  const m = createHardwareMaterials(4, own);
  const b = createBuilder();
  const station = new Group();
  station.scale.setScalar(1.55);
  group.add(station);

  // Bus: gold blanket, a black side and mirror radiators on the front and back.
  b.add(m.gold, new RoundedBoxGeometry(2.0, 2.2, 2.0, 3, 0.08));
  b.add(m.black, new RoundedBoxGeometry(0.05, 1.9, 1.8, 1, 0.02), [1.01, 0, 0]);
  for (const z of [-1, 1]) {
    b.add(m.radiator, new RoundedBoxGeometry(1.6, 1.4, 0.04, 1, 0.015), [0, -0.2, z * 1.01]);
  }
  b.add(m.silver, new RoundedBoxGeometry(1.5, 0.3, 1.5, 2, 0.05), [0, 1.25, 0]);

  // Two large dishes on booms, pointing forward and a little down.
  for (const side of [-1, 1]) {
    const mount = new Vector3(side * 1.0, 0.4, 0);
    const center = new Vector3(side * 3.1, 0.6, 0.4);
    b.rod(m.aluminium, mount.toArray(), center.toArray(), 0.07, 10);
    const axis = new Vector3(side * 0.25, -0.15, 1).normalize();
    const turn = new Quaternion().setFromUnitVectors(UP, axis);
    const radius = 2.1;
    const focal = 1.3;
    b.add(m.paint, dishGeometry(radius, focal, 0.04), center.toArray(), turn);
    const rimCenter = center.clone().addScaledVector(axis, (radius * radius) / (4 * focal));
    const rimTurn = turn
      .clone()
      .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2));
    b.add(m.aluminium, new TorusGeometry(radius, 0.03, 6, 72), rimCenter.toArray(), rimTurn);
    // Ribs across the dish, and the feed on three struts.
    const sideways = new Vector3(1, 0, 0).applyQuaternion(turn);
    const focus = center.clone().addScaledVector(axis, focal);
    for (let k = 0; k < 8; k += 1) {
      const around = sideways.clone().applyAxisAngle(axis, (k * Math.PI) / 4);
      const tip = rimCenter.clone().addScaledVector(around, radius);
      b.rod(m.aluminium, center.toArray(), tip.toArray(), 0.015, 4);
      if (k % 3 === 0) b.rod(m.aluminium, tip.toArray(), focus.toArray(), 0.02, 6);
    }
    b.add(m.anodised, new ConeGeometry(0.14, 0.32, 14), focus.toArray(), turn);
  }

  // Solar wings above and below on a mast.
  for (const s of [-1, 1]) {
    b.rod(m.aluminium, [0, s * 1.1, 0], [0, s * 2.4, 0], 0.06, 10);
    for (let k = 0; k < 2; k += 1) {
      const cy = s * (2.5 + 1.25 + k * 2.6);
      b.add(m.aluminium, new BoxGeometry(1.7, 2.5, 0.05), [0, cy, -0.2]);
      b.add(m.cells, new PlaneGeometry(1.66, 2.46), [0, cy, -0.17]);
      b.add(m.backs, new PlaneGeometry(1.66, 2.46), [0, cy, -0.23], [0, Math.PI, 0]);
    }
  }
  // Omni mast on the top deck.
  b.add(m.aluminium, new CylinderGeometry(0.03, 0.03, 0.9, 8), [0.5, 1.85, 0.4]);
  b.build(station);

  // A small steady beacon, slowly breathing rather than switching on and off.
  const beaconMaterial = own(new MeshBasicMaterial({ color: 0xffb454 }));
  const beacon = new Mesh(own(new SphereGeometry(0.08, 12, 8)), beaconMaterial);
  beacon.position.set(0.5, 2.32, 0.4);
  station.add(beacon);
  station.rotation.set(0.12, -0.5, 0.18);

  // Signal: thin, faint rings spreading forward from the station.
  const pulseGeometry = own(new RingGeometry(0.985, 1, 96));
  const pulses = Array.from({ length: PULSES }, () => {
    const material = own(
      new MeshBasicMaterial({
        color: 0xffc98a,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    const ring = new Mesh(pulseGeometry, material);
    ring.position.z = 2;
    group.add(ring);
    return ring;
  });

  return {
    group,
    update(time) {
      station.rotation.y = -0.5 + Math.sin(time * 0.05) * 0.15;
      const breathe = 0.5 + 0.5 * Math.sin(time * 1.4);
      beaconMaterial.color.setRGB(1, 0.7 * (0.4 + 0.6 * breathe), 0.33 * (0.4 + 0.6 * breathe));
      pulses.forEach((ring, i) => {
        const progress = (((time / PULSE_SECONDS + i / PULSES) % 1) + 1) % 1;
        ring.scale.setScalar(3 + progress * 26);
        ring.material.opacity = (1 - progress) * (1 - progress) * 0.18;
      });
    },
    dispose() {
      disposeTree(group);
      for (const resource of owned) resource.dispose();
    },
  };
}
