// The probe, built from basic shapes: bus, gold foil, dish, two panels, a boom and two nozzles.
// The nose points along +z (the direction Object3D.lookAt aims). No model files.
import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  ShaderMaterial,
  AdditiveBlending,
} from 'three';
import plumeVertex from '../shaders/plume.vert.glsl?raw';
import plumeFragment from '../shaders/plume.frag.glsl?raw';

function part(geometry, material, position, rotation = [0, 0, 0]) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

export function createProbe() {
  const group = new Group();
  const owned = [];
  const own = (resource) => {
    owned.push(resource);
    return resource;
  };

  const foil = own(
    new MeshStandardMaterial({
      color: 0xd9a85a,
      metalness: 0.7,
      roughness: 0.38,
      emissive: 0x2a1c08,
    }),
  );
  const panel = own(
    new MeshStandardMaterial({
      color: 0x1b2230,
      metalness: 0.4,
      roughness: 0.5,
      emissive: 0x0a0f18,
    }),
  );
  const metal = own(new MeshStandardMaterial({ color: 0xc9c4b8, metalness: 0.7, roughness: 0.4 }));

  group.add(part(own(new BoxGeometry(1, 0.8, 1.1)), foil, [0, 0, 0]));
  group.add(
    part(
      own(new SphereGeometry(0.55, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2.3)),
      metal,
      [0, 0.55, 0.1],
      [-Math.PI / 5, 0, 0],
    ),
  );
  group.add(part(own(new BoxGeometry(2.1, 0.04, 0.9)), panel, [-1.6, 0, 0]));
  group.add(part(own(new BoxGeometry(2.1, 0.04, 0.9)), panel, [1.6, 0, 0]));
  group.add(
    part(own(new CylinderGeometry(0.03, 0.03, 1.2, 8)), metal, [0, 0, 1.4], [Math.PI / 2, 0, 0]),
  );
  group.add(part(own(new BoxGeometry(0.16, 0.16, 0.16)), metal, [0, 0, 2.05]));

  // Plumes sit behind the bus (-z) and are scaled by thrust. Additive blending makes them glow.
  const plumeMaterial = own(
    new ShaderMaterial({
      vertexShader: plumeVertex,
      fragmentShader: plumeFragment,
      uniforms: { uTime: { value: 0 }, uPower: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const plumeGeometry = own(new ConeGeometry(0.16, 1, 12, 1, true));
  // The cone is centred on its middle. Move it so the base sits at the nozzle, then turn +y into -z.
  plumeGeometry.translate(0, 0.5, 0);
  plumeGeometry.rotateX(-Math.PI / 2);
  const plumes = [-0.28, 0.28].map((x) => {
    const nozzle = part(
      own(new ConeGeometry(0.1, 0.2, 10)),
      metal,
      [x, -0.1, -0.62],
      [Math.PI / 2, 0, 0],
    );
    const plume = new Mesh(plumeGeometry, plumeMaterial);
    plume.position.set(x, -0.1, -0.72);
    group.add(nozzle, plume);
    return plume;
  });

  return {
    object: group,
    // thrust is 0 to 1. The plume is short when idle and long when scrolling fast.
    update(time, thrust) {
      plumeMaterial.uniforms.uTime.value = time;
      plumeMaterial.uniforms.uPower.value = 0.35 + thrust * 0.65;
      const length = 0.4 + thrust * 2.6;
      for (const plume of plumes) plume.scale.set(1, 1, length);
    },
    dispose() {
      for (const resource of owned) resource.dispose();
    },
  };
}
