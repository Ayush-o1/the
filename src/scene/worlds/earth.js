// Earth below the launch pad, and the small blue dot that is home at the end of the route.
import {
  Group,
  Mesh,
  SphereGeometry,
  ShaderMaterial,
  AdditiveBlending,
  BackSide,
  Color,
} from 'three';
import { shaderMaterial, SUN_DIRECTION, disposeTree } from './util.js';
import { createGlow } from './glow.js';
import fragment from '../../shaders/earth.frag.glsl?raw';
import shellVertex from '../../shaders/shell.vert.glsl?raw';
import shellFragment from '../../shaders/shell.frag.glsl?raw';

export function createEarth({ tier }) {
  const group = new Group();
  const segments = tier === 'low' ? [48, 32] : [96, 64];
  const material = shaderMaterial({ fragment, uniforms: { uSunDir: { value: SUN_DIRECTION } } });
  group.add(new Mesh(new SphereGeometry(90, ...segments), material));
  // A thin warm atmosphere, seen as a glowing rim along the top of the planet.
  const air = new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    uniforms: { uColor: { value: new Color(0xe0a860) } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
  });
  group.add(new Mesh(new SphereGeometry(90 * 1.025, 64, 48), air));
  return {
    group,
    update(time) {
      material.uniforms.uTime.value = time;
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
