// The probe, AK-01, built in code. A plausible small deep-space craft, not a copy of any mission:
// - main shapes: a foil-wrapped box bus, two long solar wings, a high-gain dish on a mast;
// - secondary parts: an instrument deck, an engine bell and adapter ring, a magnetometer boom,
//   the dish's feed on three struts;
// - small details: thruster clusters at the corners, two star trackers with baffles, a low-gain
//   antenna, a mirror-tile radiator and the AK-01 name plate.
// Hard edges are rounded (they catch light), and the materials differ part by part: crinkled gold
// and silver foil, white paint, anodised and bare metal, glassy cells on the array fronts and a
// pale substrate on their backs. The nose points along +z, the direction Object3D.lookAt aims.
// All parts that share a material are merged into one mesh, so the craft costs about ten draws.
import {
  Group,
  Mesh,
  CylinderGeometry,
  ConeGeometry,
  BoxGeometry,
  PlaneGeometry,
  LatheGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  Quaternion,
  Euler,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { markingMap } from './probe-textures.js';
import { createBuilder, dishGeometry, createHardwareMaterials } from './hardware.js';
import plumeVertex from '../shaders/plume.vert.glsl?raw';
import plumeFragment from '../shaders/plume.frag.glsl?raw';

export function createProbe({ anisotropy = 4 } = {}) {
  const group = new Group();
  const owned = [];
  const own = (resource) => {
    owned.push(resource);
    return resource;
  };

  const { material, gold, silver, black, paint, anodised, aluminium, cells, backs, radiator } =
    createHardwareMaterials(anisotropy, own);
  const plate = material({ map: own(markingMap(anisotropy)), metalness: 0, roughness: 0.5 });

  const b = createBuilder();

  // Bus and instrument deck.
  b.add(gold, new RoundedBoxGeometry(1.0, 0.9, 1.2, 3, 0.05));
  b.add(silver, new RoundedBoxGeometry(0.78, 0.18, 0.94, 2, 0.04), [0, 0.53, 0.02]);
  // The right side wears black blanket over the gold.
  b.add(black, new RoundedBoxGeometry(0.03, 0.82, 1.1, 1, 0.012), [0.512, 0, 0]);
  // Radiator on the left side, and the name plate above it.
  b.add(radiator, new RoundedBoxGeometry(0.03, 0.46, 0.86, 1, 0.01), [-0.515, -0.15, 0]);
  b.add(plate, new PlaneGeometry(0.4, 0.15), [-0.532, 0.24, 0.22], [0, -Math.PI / 2, 0]);

  // Rear: adapter ring and engine bell.
  b.add(
    anodised,
    new CylinderGeometry(0.34, 0.38, 0.1, 32, 1, true),
    [0, 0, -0.65],
    [Math.PI / 2, 0, 0],
  );
  b.add(
    anodised,
    new LatheGeometry(
      [
        new Vector2(0.07, 0),
        new Vector2(0.1, 0.05),
        new Vector2(0.15, 0.16),
        new Vector2(0.21, 0.3),
        new Vector2(0.22, 0.31),
      ],
      24,
    ),
    [0, 0, -0.62],
    [-Math.PI / 2, 0, 0],
  );

  // Thruster clusters at the four rear corners: a block and two nozzles pointing out.
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      const at = [x * 0.47, y * 0.4, -0.5];
      b.add(anodised, new RoundedBoxGeometry(0.09, 0.09, 0.09, 1, 0.015), at);
      b.add(
        aluminium,
        new ConeGeometry(0.028, 0.07, 10, 1, true),
        [at[0] + x * 0.07, at[1], at[2]],
        [0, 0, (x * -Math.PI) / 2],
      );
      b.add(
        aluminium,
        new ConeGeometry(0.028, 0.07, 10, 1, true),
        [at[0], at[1] + y * 0.07, at[2]],
        [y > 0 ? 0 : Math.PI, 0, 0],
      );
    }
  }

  // Star trackers: two short tubes with flared baffles, looking up and out from the deck.
  for (const [x, z, lean] of [
    [0.24, 0.28, -0.5],
    [-0.22, 0.34, 0.45],
  ]) {
    const tilt = new Euler(0.35, 0, lean);
    b.add(
      anodised,
      new CylinderGeometry(0.05, 0.05, 0.12, 14),
      [x, 0.68, z],
      tilt.toArray().slice(0, 3),
    );
    b.add(
      anodised,
      new CylinderGeometry(0.085, 0.05, 0.1, 14, 1, true),
      [x + lean * -0.09, 0.78, z + 0.035],
      tilt.toArray().slice(0, 3),
    );
  }
  // Low-gain antenna on the deck.
  b.add(aluminium, new CylinderGeometry(0.012, 0.012, 0.22, 6), [0.05, 0.72, -0.3]);
  b.add(paint, new ConeGeometry(0.05, 0.08, 12), [0.05, 0.86, -0.3]);

  // High-gain dish on a short mast, pointing back and up, toward home.
  const UP = new Vector3(0, 1, 0);
  const dishCenter = new Vector3(-0.05, 1.02, -0.32);
  const dishAxis = new Vector3(-0.55, 0.62, -0.55).normalize();
  const dishTurn = new Quaternion().setFromUnitVectors(UP, dishAxis);
  b.rod(
    anodised,
    [-0.05, 0.6, -0.15],
    dishCenter.clone().addScaledVector(dishAxis, -0.04).toArray(),
    0.04,
    12,
  );
  const radius = 0.72;
  const focal = 0.42;
  b.add(paint, dishGeometry(radius, focal, 0.025), dishCenter.toArray(), dishTurn);
  const rimHeight = (radius * radius) / (4 * focal);
  const rimCenter = dishCenter.clone().addScaledVector(dishAxis, rimHeight);
  const rimTurn = dishTurn
    .clone()
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2));
  b.add(aluminium, new TorusGeometry(radius, 0.014, 6, 64), rimCenter.toArray(), rimTurn);
  // Feed: three struts from the rim to the focus, a horn and a small sub-reflector.
  const focus = dishCenter.clone().addScaledVector(dishAxis, focal);
  const side = new Vector3(1, 0, 0).applyQuaternion(dishTurn);
  for (let k = 0; k < 3; k += 1) {
    const around = side.clone().applyAxisAngle(dishAxis, (k * Math.PI * 2) / 3);
    const foot = rimCenter.clone().addScaledVector(around, radius * 0.97);
    b.rod(aluminium, foot.toArray(), focus.toArray(), 0.009, 6);
  }
  b.add(
    anodised,
    new ConeGeometry(0.05, 0.12, 14),
    focus.clone().addScaledVector(dishAxis, -0.05).toArray(),
    dishTurn.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI)),
  );
  b.add(
    aluminium,
    new CylinderGeometry(0.07, 0.07, 0.012, 20),
    focus.clone().addScaledVector(dishAxis, 0.02).toArray(),
    dishTurn,
  );

  // Solar wings: a V-shaped yoke from the bus to two panels, hinged end to end.
  const panelLength = 1.05;
  const panelWidth = 0.78;
  const thickness = 0.032;
  const cant = 0.12;
  for (const s of [-1, 1]) {
    const root = 0.92;
    b.rod(aluminium, [s * 0.5, 0.0, 0.3], [s * root, 0, 0.05], 0.016);
    b.rod(aluminium, [s * 0.5, 0.0, -0.3], [s * root, 0, -0.05], 0.016);
    b.rod(aluminium, [s * 0.5, 0, 0], [s * root, 0, 0], 0.022, 10);
    for (let k = 0; k < 2; k += 1) {
      const inner = root + k * (panelLength + 0.06);
      const cx = s * (inner + panelLength / 2);
      const turn = new Euler(cant, 0, 0);
      // Frame (the panel's thickness), then the cell face on top and the substrate below.
      b.add(
        aluminium,
        new BoxGeometry(panelLength, thickness, panelWidth),
        [cx, 0, 0],
        turn.toArray().slice(0, 3),
      );
      const top = new PlaneGeometry(panelLength - 0.02, panelWidth - 0.02);
      b.add(
        cells,
        top,
        [cx, Math.cos(cant) * (thickness / 2 + 0.001), Math.sin(cant) * (thickness / 2 + 0.001)],
        [cant - Math.PI / 2, 0, 0],
      );
      const bottom = new PlaneGeometry(panelLength - 0.02, panelWidth - 0.02);
      b.add(
        backs,
        bottom,
        [cx, -Math.cos(cant) * (thickness / 2 + 0.001), -Math.sin(cant) * (thickness / 2 + 0.001)],
        [cant + Math.PI / 2, 0, 0],
      );
      // Hinge between the panels.
      if (k === 0) {
        const hinge = s * (inner + panelLength + 0.03);
        b.add(
          anodised,
          new CylinderGeometry(0.02, 0.02, panelWidth * 0.8, 8),
          [hinge, 0, 0],
          [Math.PI / 2 + cant, 0, 0],
        );
      }
    }
  }

  // Magnetometer boom: a long thin mast angled down and forward, with the sensor at its end.
  const boomStart = [0.3, -0.44, 0.45];
  const boomEnd = [1.05, -1.55, 1.75];
  b.rod(aluminium, boomStart, boomEnd, 0.012, 6);
  b.add(paint, new RoundedBoxGeometry(0.1, 0.1, 0.14, 1, 0.02), boomEnd);

  b.build(group);

  // Engine plume behind the bell, scaled by thrust. Faint: a real plume is nearly transparent.
  const plumeMaterial = own(
    new ShaderMaterial({
      vertexShader: plumeVertex,
      fragmentShader: plumeFragment,
      uniforms: { uTime: { value: 0 }, uPower: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    }),
  );
  const plumeGeometry = own(new ConeGeometry(0.2, 1, 18, 1, true));
  plumeGeometry.translate(0, 0.5, 0);
  plumeGeometry.rotateX(-Math.PI / 2);
  const plume = new Mesh(plumeGeometry, plumeMaterial);
  plume.position.set(0, 0, -0.93);
  plume.scale.set(1, 1, 0.01);
  group.add(plume);

  return {
    object: group,
    // thrust is 0 to 1. The plume only shows while the probe is moving fast.
    update(time, thrust) {
      plumeMaterial.uniforms.uTime.value = time;
      plumeMaterial.uniforms.uPower.value = thrust * 0.8;
      plume.visible = thrust > 0.02;
      plume.scale.set(1, 1, 0.3 + thrust * 2.2);
    },
    dispose() {
      group.traverse((node) => node.geometry?.dispose());
      for (const resource of owned) resource.dispose();
    },
  };
}
