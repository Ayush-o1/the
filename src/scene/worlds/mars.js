// M4 theRedArmy: a rust-red planet with pale polar caps and a thin dusty rim.
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
import marsFragment from '../../shaders/mars.frag.glsl?raw';
import shellVertex from '../../shaders/shell.vert.glsl?raw';
import shellFragment from '../../shaders/shell.frag.glsl?raw';

const RADIUS = 9;

export function createMars({ tier }) {
  const group = new Group();
  const segments = tier === 'low' ? [48, 32] : [96, 64];
  const planet = new Mesh(
    new SphereGeometry(RADIUS, ...segments),
    shaderMaterial({ fragment: marsFragment, uniforms: { uSunDir: { value: SUN_DIRECTION } } }),
  );
  group.add(planet);

  const dust = new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    uniforms: { uColor: { value: new Color(0xd9824a) } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
  });
  group.add(new Mesh(new SphereGeometry(RADIUS * 1.06, 48, 32), dust));

  return {
    group,
    update(time) {
      planet.rotation.y = time * 0.02;
    },
    dispose: () => disposeTree(group),
  };
}
