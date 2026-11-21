// M4 theRedArmy: Mars, from the Viking colour mosaic when it has arrived, with a thin pale haze.
import { Group, Mesh, SphereGeometry } from 'three';
import { shaderMaterial, disposeTree } from './util.js';
import { createAtmosphere } from './atmosphere.js';
import { EMPTY_MAP } from '../maps.js';
import marsFragment from '../../shaders/mars.frag.glsl?raw';

const RADIUS = 9;

export function createMars({ tier }) {
  const group = new Group();
  const segments = tier === 'low' ? [48, 32] : [128, 96];
  const material = shaderMaterial({
    fragment: marsFragment,
    uniforms: { uMaps: { value: 0 }, uMap: { value: EMPTY_MAP } },
  });
  const planet = new Mesh(new SphereGeometry(RADIUS, ...segments), material);
  // Tilted toward the camera a little, so Syrtis Major and the north cap face the frame.
  planet.rotation.set(0.25, 0, 0.42);
  group.add(planet);

  // Mars's air is thin: a faint, pale, slightly blue rim, not a glowing shell.
  const air = createAtmosphere({
    radius: RADIUS,
    thickness: RADIUS * 0.03,
    day: 0xb8a48c,
    sunset: 0x7d8fb0,
    strength: 0.35,
  });
  group.add(air.mesh);

  let fadeStart = null;
  return {
    group,
    maps: tier === 'low' ? [] : ['mars'],
    setMap(name, texture) {
      material.uniforms.uMap.value = texture;
      fadeStart = -1;
    },
    update(time) {
      if (fadeStart === -1) fadeStart = time;
      if (fadeStart !== null) {
        const k = Math.min(1, (time - fadeStart) / 0.9);
        material.uniforms.uMaps.value = k * k * (3 - 2 * k);
        if (k >= 1) fadeStart = null;
      }
      planet.rotation.y = 4.2 + time * 0.012;
      air.update();
    },
    dispose: () => disposeTree(group),
  };
}
