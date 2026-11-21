// An atmosphere shell around a planet (see shaders/atmosphere.frag.glsl). The shell is a little
// larger than the planet and drawn from the inside, additively, so only the limb shows.
import { Mesh, SphereGeometry, BackSide, AdditiveBlending, Color, Vector3 } from 'three';
import { shaderMaterial } from './util.js';
import vertex from '../../shaders/atmosphere.vert.glsl?raw';
import fragment from '../../shaders/atmosphere.frag.glsl?raw';

export function createAtmosphere({
  radius,
  thickness,
  day,
  sunset,
  airglow = 0x000000,
  strength = 1,
  segments = 96,
}) {
  const material = shaderMaterial({
    vertex,
    fragment,
    uniforms: {
      uCenter: { value: new Vector3() },
      uRadius: { value: radius },
      uThickness: { value: thickness },
      uDay: { value: new Color(day) },
      uSunset: { value: new Color(sunset) },
      uAirglow: { value: new Color(airglow) },
      uStrength: { value: strength },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
  });
  const mesh = new Mesh(new SphereGeometry(radius + thickness, segments, segments / 2), material);
  const scale = new Vector3();
  return {
    mesh,
    // Call each frame after the planet has moved: the shader needs the centre and size in world
    // space.
    update() {
      mesh.getWorldPosition(material.uniforms.uCenter.value);
      mesh.getWorldScale(scale);
      material.uniforms.uRadius.value = radius * scale.x;
      material.uniforms.uThickness.value = thickness * scale.x;
    },
  };
}
