// Earth at the start of the route, and the small blue dot that is home at the end of it.
// The planet is three layers: the ground, a cloud sphere that turns at its own rate, and the
// atmosphere shell. The ground and the clouds start procedural and cross-fade to the NASA maps
// when they arrive (scene/maps.js).
import { Group, Mesh, SphereGeometry, Vector3, Quaternion } from 'three';
import { shaderMaterial, SUN_DIRECTION, disposeTree } from './util.js';
import { createGlow } from './glow.js';
import { createAtmosphere } from './atmosphere.js';
import { EMPTY_MAP } from '../maps.js';
import fragment from '../../shaders/earth.frag.glsl?raw';
import cloudFragment from '../../shaders/clouds.frag.glsl?raw';

// Small enough and far enough that the opening frame shows the curve of a globe, not a flat
// horizon, and the maps are not magnified past their resolution.
export const EARTH_RADIUS = 40;
// The planet's own turn and the clouds' extra drift, in radians per second. Slow: at this
// distance the real rate would not be visible at all.
const SPIN = 0.0016;
const CLOUD_DRIFT = 0.0009;
// How long the switch from the procedural surface to the maps takes, in seconds.
const CROSS_FADE = 0.9;

export function createEarth({ tier }) {
  const group = new Group();
  const segments = tier === 'low' ? [64, 48] : [160, 120];
  const sunObj = new Vector3();
  const inverse = new Quaternion();

  const ground = shaderMaterial({
    fragment,
    uniforms: {
      uMaps: { value: 0 },
      uDay: { value: EMPTY_MAP },
      uNight: { value: EMPTY_MAP },
      uClouds: { value: EMPTY_MAP },
      uSunObj: { value: sunObj },
      uCloudShift: { value: 0 },
    },
    transparent: true,
  });
  const planet = new Mesh(new SphereGeometry(EARTH_RADIUS, ...segments), ground);
  group.add(planet);

  const cloudMaterial = shaderMaterial({
    fragment: cloudFragment,
    uniforms: { uMaps: { value: 0 }, uClouds: { value: EMPTY_MAP } },
    transparent: true,
    depthWrite: false,
  });
  const clouds = new Mesh(new SphereGeometry(EARTH_RADIUS * 1.006, ...segments), cloudMaterial);
  group.add(clouds);

  const air = createAtmosphere({
    radius: EARTH_RADIUS,
    thickness: EARTH_RADIUS * 0.022,
    day: 0x4f86ff,
    sunset: 0xff7a3a,
    airglow: 0x0a2a16,
    strength: 1.2,
    segments: 128,
  });
  group.add(air.mesh);

  // The planet's base orientation: which face of the Earth is toward the camera in the opening.
  // Turned so the Indian Ocean and South India face the opening frame, near the terminator.
  const tilt = new Quaternion();
  planet.rotation.set(2.1806, 0.2175, -2.5438);
  tilt.copy(planet.quaternion);

  const arrived = new Set();
  let fadeStart = null;

  return {
    group,
    maps: tier === 'low' ? [] : ['earthDay', 'earthNight', 'earthClouds'],
    setMap(name, texture) {
      if (name === 'earthDay') ground.uniforms.uDay.value = texture;
      if (name === 'earthNight') ground.uniforms.uNight.value = texture;
      if (name === 'earthClouds') {
        ground.uniforms.uClouds.value = texture;
        cloudMaterial.uniforms.uClouds.value = texture;
      }
      arrived.add(name);
      if (arrived.size === 3) fadeStart = -1;
    },
    // Sets the base orientation (for tuning the hero framing).
    setTilt(x, y, z) {
      planet.rotation.set(x, y, z);
      tilt.copy(planet.quaternion);
    },
    update(time) {
      if (fadeStart === -1) fadeStart = time;
      if (fadeStart !== null) {
        const k = Math.min(1, (time - fadeStart) / CROSS_FADE);
        const eased = k * k * (3 - 2 * k);
        ground.uniforms.uMaps.value = eased;
        cloudMaterial.uniforms.uMaps.value = eased;
        if (k >= 1) fadeStart = null;
      }
      planet.quaternion.copy(tilt);
      planet.rotateY(time * SPIN);
      clouds.quaternion.copy(planet.quaternion);
      clouds.rotateY(time * CLOUD_DRIFT);
      ground.uniforms.uCloudShift.value = -(time * CLOUD_DRIFT) / (Math.PI * 2);
      inverse.copy(planet.quaternion).invert();
      sunObj.copy(SUN_DIRECTION).applyQuaternion(inverse);
      air.update();
    },
    dispose: () => disposeTree(group),
  };
}

export function createHome() {
  const group = new Group();
  const glow = createGlow({ color: 0xa9c4ff, size: 34, intensity: 0.9 });
  group.add(glow.mesh);
  return {
    group,
    update(time, camera) {
      glow.face(camera);
    },
    dispose: () => disposeTree(group),
  };
}
