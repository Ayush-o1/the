// M6 Europa: a cracked ice moon with Jupiter huge and banded behind it.
import { Group, Mesh, SphereGeometry, Color } from 'three';
import { shaderMaterial, SUN_DIRECTION, disposeTree } from './util.js';
import iceFragment from '../../shaders/ice.frag.glsl?raw';
import gasFragment from '../../shaders/gasgiant.frag.glsl?raw';

const MOON_RADIUS = 7;
const JUPITER_RADIUS = 60;

export function createEuropa({ tier }) {
  const group = new Group();
  const segments = tier === 'low' ? [48, 32] : [96, 64];

  const moon = new Mesh(
    new SphereGeometry(MOON_RADIUS, ...segments),
    shaderMaterial({ fragment: iceFragment, uniforms: { uSunDir: { value: SUN_DIRECTION } } }),
  );
  group.add(moon);

  const jupiterMaterial = shaderMaterial({
    fragment: gasFragment,
    uniforms: {
      uSunDir: { value: SUN_DIRECTION },
      uColA: { value: new Color(0x7a5a38) },
      uColB: { value: new Color(0xc9a878) },
      uColC: { value: new Color(0x5a3a28) },
      uSeed: { value: 9.0 },
    },
  });
  const jupiter = new Mesh(new SphereGeometry(JUPITER_RADIUS, 96, 64), jupiterMaterial);
  // Behind and to the side, so the moon sits in front of the big planet's edge.
  jupiter.position.set(30, 22, -110);
  group.add(jupiter);

  return {
    group,
    update(time) {
      jupiterMaterial.uniforms.uTime.value = time;
      moon.rotation.y = time * 0.015;
      jupiter.rotation.y = time * 0.004;
    },
    dispose: () => disposeTree(group),
  };
}
