// The probe, built from basic shapes: a faceted bus in gold foil, a high-gain dish that points back
// toward home, two long solar arrays on booms, an antenna and an engine bell. The nose points along
// +z, the direction Object3D.lookAt aims. No model files.
import {
  Group,
  Mesh,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  BoxGeometry,
  PlaneGeometry,
  LatheGeometry,
  Vector2,
  MeshPhongMaterial,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import { shaderMaterial, SUN_DIRECTION } from './worlds/util.js';
import panelFragment from '../shaders/panel.frag.glsl?raw';
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
    new MeshPhongMaterial({
      color: 0xb8893f,
      specular: 0xffe6b0,
      shininess: 55,
      flatShading: true,
    }),
  );
  const white = own(
    new MeshPhongMaterial({ color: 0xd9d6cc, specular: 0x888888, shininess: 30, side: DoubleSide }),
  );
  const dark = own(new MeshPhongMaterial({ color: 0x2a2d33, specular: 0x555555, shininess: 20 }));
  const panel = own(
    shaderMaterial({
      fragment: panelFragment,
      uniforms: { uSunDir: { value: SUN_DIRECTION }, uCells: { value: new Vector2(9, 3.4) } },
      side: DoubleSide,
    }),
  );

  // Bus: an eight-sided prism lying along the flight direction.
  group.add(
    part(own(new CylinderGeometry(0.55, 0.55, 1.15, 8)), foil, [0, 0, 0], [Math.PI / 2, 0, 0]),
  );
  // Dish: a shallow bowl, open toward the back and up, toward home. The cap's pole is its back, so
  // it is turned until the pole points forward and down.
  group.add(
    part(
      own(new SphereGeometry(0.85, 32, 8, 0, Math.PI * 2, 0, Math.PI / 4)),
      white,
      [0, 0.95, -0.12],
      [2.04, 0, 0],
    ),
  );
  group.add(part(own(new CylinderGeometry(0.03, 0.03, 0.5, 6)), dark, [0, 0.72, -0.1]));

  // Solar arrays on booms, one each side. They are long and thin, which is the silhouette.
  for (const side of [-1, 1]) {
    group.add(
      part(
        own(new CylinderGeometry(0.025, 0.025, 0.9, 6)),
        dark,
        [side * 0.95, 0, 0],
        [0, 0, Math.PI / 2],
      ),
    );
    group.add(
      part(own(new PlaneGeometry(2.6, 0.95)), panel, [side * 2.75, 0, 0], [-Math.PI / 2, 0, 0]),
    );
  }

  // A long antenna boom out the front.
  group.add(
    part(own(new CylinderGeometry(0.02, 0.02, 1.5, 6)), dark, [0, 0, 1.3], [Math.PI / 2, 0, 0]),
  );
  group.add(part(own(new BoxGeometry(0.1, 0.1, 0.1)), white, [0, 0, 2.08]));

  // Engine bell at the back, turned from a profile.
  const bell = own(
    new LatheGeometry(
      [
        new Vector2(0.06, 0),
        new Vector2(0.12, 0.08),
        new Vector2(0.24, 0.3),
        new Vector2(0.3, 0.42),
      ].map((point) => point),
      16,
    ),
  );
  group.add(part(bell, dark, [0, 0, -0.58], [-Math.PI / 2, 0, 0]));

  // The plume sits behind the bell (-z) and is scaled by thrust. Additive blending makes it glow.
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
  const plumeGeometry = own(new ConeGeometry(0.22, 1, 14, 1, true));
  // The cone is centred on its middle. Move it so the base sits at the nozzle, then turn +y into -z.
  plumeGeometry.translate(0, 0.5, 0);
  plumeGeometry.rotateX(-Math.PI / 2);
  const plume = new Mesh(plumeGeometry, plumeMaterial);
  plume.position.set(0, 0, -1.0);
  group.add(plume);

  return {
    object: group,
    // thrust is 0 to 1. The plume is short when idle and long when scrolling fast.
    update(time, thrust) {
      plumeMaterial.uniforms.uTime.value = time;
      plumeMaterial.uniforms.uPower.value = 0.35 + thrust * 0.65;
      plume.scale.set(1, 1, 0.5 + thrust * 3);
    },
    dispose() {
      for (const resource of owned) resource.dispose();
    },
  };
}
